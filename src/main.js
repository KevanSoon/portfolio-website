import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ------------------------------------------------------------------
// Frame sequence — 48fps motion-interpolated, drawn with fractional
// blending between adjacent frames and a sliding window of pre-decoded
// ImageBitmaps so scrubbing never hits a synchronous decode.
// ------------------------------------------------------------------

const FRAME_COUNT = 477 // must match the number of files in public/frames/d
const srcFor = i => `/frames/d/frame_${String(i + 1).padStart(4, '0')}.webp`

// chapter id → slice of the sequence it scrubs (fractions of the video)
const BEATS = [
  { id: 'hero', f: [0.0, 0.06] },
  { id: 'about', f: [0.06, 0.3] },
  { id: 'skills', f: [0.3, 0.52] },
  { id: 'projects', f: [0.52, 0.78] },
  { id: 'honours', f: [0.78, 1.0] },
]

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const smallScreen = window.matchMedia('(max-width: 820px)').matches
const canvas = document.getElementById('scene')
const ctx = canvas.getContext('2d')
const images = new Array(FRAME_COUNT) // encoded frames, always resident
const bitmaps = new Map() // frame index → pre-decoded ImageBitmap
const pending = new Set()
const DECODE_AHEAD = 28
const DECODE_BEHIND = 10
const EVICT_BEYOND = 60

let target = 0 // frame demanded by scroll position (float)
let current = 0 // frame actually rendered (eased toward target, float)
let lastKey = -1

function ensureWindow(center) {
  const c = Math.floor(center)
  const lo = Math.max(0, c - DECODE_BEHIND)
  const hi = Math.min(FRAME_COUNT - 1, c + DECODE_AHEAD)
  for (let i = lo; i <= hi; i++) {
    if (bitmaps.has(i) || pending.has(i)) continue
    const img = images[i]
    if (!img || !img.complete || !img.naturalWidth) continue
    pending.add(i)
    const p = smallScreen
      ? createImageBitmap(img, { resizeWidth: 640, resizeHeight: 360, resizeQuality: 'high' })
      : createImageBitmap(img)
    p.then(bm => {
      bitmaps.set(i, bm)
      pending.delete(i)
    }).catch(() => pending.delete(i))
  }
  for (const [i, bm] of bitmaps) {
    if (i < c - EVICT_BEYOND || i > c + EVICT_BEYOND) {
      bm.close()
      bitmaps.delete(i)
    }
  }
}

function frameSource(i) {
  const bm = bitmaps.get(i)
  if (bm) return bm
  const img = images[i]
  return img && img.complete && img.naturalWidth ? img : null
}

function drawCover(img, alpha) {
  const iw = img.width || img.naturalWidth
  const ih = img.height || img.naturalHeight
  const cw = canvas.width
  const ch = canvas.height
  const s = Math.max(cw / iw, ch / ih)
  ctx.globalAlpha = alpha
  ctx.drawImage(img, (cw - iw * s) / 2, (ch - ih * s) / 2, iw * s, ih * s)
}

function draw(f, force = false) {
  f = Math.max(0, Math.min(FRAME_COUNT - 1, f))
  const a = Math.floor(f)
  const b = Math.min(a + 1, FRAME_COUNT - 1)
  const frac = f - a
  const key = a + Math.round(frac * 32) / 32 // quantize to skip imperceptible redraws
  if (key === lastKey && !force) return
  const srcA = frameSource(a)
  if (!srcA) return
  drawCover(srcA, 1)
  if (b !== a && frac > 0.01) {
    const srcB = frameSource(b)
    if (srcB) drawCover(srcB, frac)
  }
  ctx.globalAlpha = 1
  lastKey = key
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(window.innerWidth * dpr)
  canvas.height = Math.round(window.innerHeight * dpr)
  draw(current, true)
}

function preload(onProgress) {
  return new Promise(resolve => {
    let loaded = 0
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image()
      const done = () => {
        loaded += 1
        onProgress(loaded / FRAME_COUNT)
        if (i === 0) draw(0, true)
        if (loaded === FRAME_COUNT) resolve()
      }
      img.onload = done
      img.onerror = done
      img.src = srcFor(i)
      images[i] = img
    }
  })
}

// ------------------------------------------------------------------
// Scroll engine
// ------------------------------------------------------------------

let lenis

function initScroll() {
  lenis = new Lenis({ smoothWheel: !reduceMotion })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)

  // scrub: each chapter drives its slice of the frame sequence
  for (const { id, f } of BEATS) {
    ScrollTrigger.create({
      trigger: `#${id}`,
      start: 'top top',
      end: 'bottom top',
      onUpdate: self => {
        target = (f[0] + (f[1] - f[0]) * self.progress) * (FRAME_COUNT - 1)
      },
    })
  }

  // render loop — eased toward the scroll target, blended sub-frame
  gsap.ticker.add(() => {
    current += (target - current) * (reduceMotion ? 1 : 0.14)
    if (Math.abs(target - current) < 0.001) current = target
    ensureWindow(current)
    draw(current)
  })

  // top progress hairline
  const progressEl = document.getElementById('progress')
  ScrollTrigger.create({
    start: 0,
    end: () => ScrollTrigger.maxScroll(window),
    onUpdate: self => {
      progressEl.style.transform = `scaleX(${self.progress})`
    },
  })

  // chapter copy: fade in, hold, fade out (hero only fades out)
  document.querySelectorAll('.chapter').forEach(sec => {
    const copy = sec.querySelector('.copy')
    if (!copy) return
    if (sec.id === 'hero') {
      gsap.to(copy, {
        opacity: 0,
        y: -60,
        ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: '45% top', scrub: true },
      })
      return
    }
    gsap
      .timeline({
        scrollTrigger: { trigger: sec, start: 'top 70%', end: 'bottom 25%', scrub: true },
      })
      .fromTo(copy, { opacity: 0, y: 70 }, { opacity: 1, y: 0, ease: 'none', duration: 0.35 })
      .to(copy, { opacity: 1, duration: 0.3 })
      .to(copy, { opacity: 0, y: -70, ease: 'none', duration: 0.35 })
  })

  // chapter dots
  const nav = document.getElementById('chapter-nav')
  document.querySelectorAll('[data-title]').forEach(sec => {
    const b = document.createElement('button')
    b.type = 'button'
    b.setAttribute('aria-label', sec.dataset.title)
    b.innerHTML = `<span>${sec.dataset.title}</span>`
    b.addEventListener('click', () => lenis.scrollTo(sec, { duration: 1.8 }))
    nav.appendChild(b)
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: self => b.classList.toggle('active', self.isActive),
    })
  })

  // ambient paper/koto audio (extracted from the source video), off by default
  const audio = new Audio('/audio/fold.mp3')
  audio.loop = true
  audio.preload = 'auto'
  const soundBtn = document.getElementById('sound')
  soundBtn.addEventListener('click', () => {
    const on = soundBtn.classList.toggle('on')
    soundBtn.setAttribute('aria-pressed', String(on))
    if (on) {
      audio.volume = 0
      audio.play().catch(() => {})
      gsap.to(audio, { volume: 0.35, duration: 1.2 })
    } else {
      gsap.to(audio, { volume: 0, duration: 0.7, onComplete: () => audio.pause() })
    }
  })

  document.getElementById('replay').addEventListener('click', () => lenis.scrollTo(0, { duration: 2.6 }))
}

// ------------------------------------------------------------------
// Boot
// ------------------------------------------------------------------

function splitLetters(el) {
  const text = el.textContent
  el.setAttribute('aria-label', text)
  el.textContent = ''
  const spans = []
  for (const ch of text) {
    const s = document.createElement('span')
    s.className = 'ltr'
    s.setAttribute('aria-hidden', 'true')
    s.textContent = ch === ' ' ? ' ' : ch
    el.appendChild(s)
    spans.push(s)
  }
  return spans
}

async function boot() {
  history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)
  resize()
  window.addEventListener('resize', resize)

  const count = document.querySelector('#preloader .count')
  const bar = document.querySelector('#preloader .bar span')
  await preload(p => {
    count.textContent = `${Math.round(p * 100)}%`
    bar.style.transform = `scaleX(${p})`
  })

  resize() // re-measure in case the viewport was zero-sized during initial load
  ensureWindow(0)
  initScroll()

  if (import.meta.env.DEV) {
    window.__crane = {
      ScrollTrigger,
      tick: () => gsap.ticker.tick(),
      state: () => ({ target, current, lastKey, decoded: bitmaps.size }),
    }
  }

  const preloader = document.getElementById('preloader')
  const letters = splitLetters(document.querySelector('#hero h1'))
  const intro = gsap.timeline()
  intro.to(preloader, {
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
    onComplete: () => {
      preloader.remove()
      document.body.classList.remove('loading')
    },
  })
  if (!reduceMotion) {
    intro
      .from(letters, { opacity: 0, y: 26, stagger: 0.05, duration: 0.8, ease: 'power3.out' }, '-=0.25')
      .from(
        ['.hero-sub', '.scroll-hint', 'header', '#chapter-nav', '#sound'],
        { opacity: 0, duration: 0.9 },
        '-=0.4'
      )
  }
}

boot()
