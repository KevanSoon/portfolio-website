import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ------------------------------------------------------------------
// Hero-only page. The lightning portrait is a single hardware-decoded
// <video> whose currentTime is driven by scroll — no frame sequences,
// no ImageBitmap churn. Memory stays in the tens of MB and the GPU only
// ever holds one video texture, which is what the previous frame engine
// could not guarantee (it faulted the GPU process with D3D11 texture
// churn on some machines).
// ------------------------------------------------------------------

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const video = document.getElementById('hero-video')

let duration = 0
let targetT = 0 // currentTime demanded by scroll
let curT = 0 // eased currentTime actually applied
let lenis = null

function primeVideo() {
  // a muted play→pause forces the browser to buffer so seeks are instant
  return new Promise(resolve => {
    const ready = () => (video.readyState >= 3 ? resolve() : null)
    if (Number.isFinite(video.duration) && video.duration > 0) duration = video.duration
    video.addEventListener('loadedmetadata', () => {
      duration = video.duration || duration
    })
    video.addEventListener('canplaythrough', resolve, { once: true })
    video.addEventListener('loadeddata', ready, { once: true })
    video.muted = true
    const p = video.play()
    if (p && p.then) {
      p.then(() => {
        video.pause()
        video.currentTime = 0
        ready()
      }).catch(() => ready())
    }
    // safety: never hang the loader on a stubborn buffer
    setTimeout(resolve, 4000)
  })
}

function initScroll() {
  lenis = new Lenis({ smoothWheel: !reduceMotion })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)

  // video scrub finishes a little before the About panel starts covering,
  // so the lightning fully ignites and settles before it's hidden
  ScrollTrigger.create({
    trigger: '.hero-spacer',
    start: 'top top',
    end: '52% top',
    onUpdate: self => {
      if (duration) targetT = self.progress * duration
    },
  })

  // ease currentTime toward the scroll target; skip while a seek is pending
  gsap.ticker.add(() => {
    if (!duration) return
    curT += (targetT - curT) * (reduceMotion ? 1 : 0.12)
    if (Math.abs(targetT - curT) < 0.004) curT = targetT
    if (!video.seeking) {
      try {
        video.currentTime = curT
      } catch (e) {
        /* seek not ready yet */
      }
    }
  })

  // fade the scroll hint out as soon as the user starts
  gsap.to('.scroll-hint', {
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero-spacer', start: 'top top', end: '6% top', scrub: true },
  })

  // word handoff, scroll-linked:
  //   "designer" rises in → holds → rises up and out, while "<coder>" rises in
  if (!reduceMotion) {
    gsap.set(['.hero-text--left', '.hero-text--right'], { opacity: 0, y: 60 })
    gsap
      .timeline({ scrollTrigger: { trigger: '.hero-spacer', start: 'top top', end: '45% top', scrub: true } })
      // designer in (0 → 1)
      .to('.hero-text--left', { opacity: 1, y: 0, ease: 'none', duration: 1 }, 0)
      // designer holds (1 → 2)
      // designer out, up (2 → 3.2)  +  coder in (2 → 3.2)
      .to('.hero-text--left', { opacity: 0, y: -70, ease: 'none', duration: 1.2 }, 2)
      .fromTo(
        '.hero-text--right',
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, ease: 'none', duration: 1.2 },
        2
      )
    // coder holds from 3.2 → end
  }

  // reveal the About content as the panel slides up
  gsap.from('.about-inner > *', {
    opacity: 0,
    y: 40,
    ease: 'none',
    stagger: 0.06,
    scrollTrigger: { trigger: '.about', start: 'top 78%', end: 'top 32%', scrub: true },
  })

  // build the grouped skills grid
  initSkills()

  // build + drive the rotating "Selected Work" gallery
  initShowcase()

  if (import.meta.env.DEV) {
    window.__hero = {
      lenis,
      ScrollTrigger,
      tick: () => gsap.ticker.tick(),
      state: () => ({ duration, targetT, curT, videoTime: video.currentTime, readyState: video.readyState }),
    }
  }
}

// ------------------------------------------------------------------
// Selected Work — vanilla port of the CircularGallery component.
// Cards sit on a 3D ring (rotateY + translateZ); the ring's rotation is
// driven by scroll through the section and gently auto-rotates when idle,
// with each card's opacity following its angle from the front — the same
// math as the original React component, without React/Tailwind/shadcn.
// ------------------------------------------------------------------

const PROJECTS = [
  {
    name: 'Churp',
    cat: 'Web · Community',
    desc: "Community garden allotment booking for the People's Association.",
    stack: ['Next.js', 'FastAPI', 'Supabase'],
    // branded "light" card — real logo + hero illustration pulled from churpsg.com
    light: true,
    bg: '#e9f1e6',
    ink: '#14382b',
    accent: '#3f7d5f',
    logo: '/media/churp-logo.svg',
    img: '/media/churp-hero.svg',
    grad: 'linear-gradient(150deg, #2f9e6f, #12603f)',
  },
  {
    name: 'SimiSlang',
    cat: 'RAG · LLM-as-Judge',
    desc: 'Singlish-slang lessons — flashcards & quizzes, AI- and moderator-verified — with LLM-as-a-judge evaluation.',
    stack: ['Next.js', 'Spring Boot', 'LangGraph', 'DeepEval'],
    // branded "light" card — Merlion wordmark (from the live site) + playful slang pills
    light: true,
    bg: '#eeedfb',
    ink: '#3a3e59',
    accent: '#7b7ef0',
    img: '/media/simislang-logo.png',
    slang: ['Rizz', 'Kilat', 'Sus', 'Hantu'],
    hideName: true,
    grad: 'linear-gradient(150deg, #5b53d6, #2e2880)',
  },
  {
    name: 'VoltPulse SG',
    cat: 'OCR · GenAI · Energy',
    desc: 'Reads Singapore power bills with OCR to diagnose energy waste and unlock Climate Voucher savings.',
    stack: ['Next.js', 'FastAPI', 'LangGraph', 'OpenAI Vision', 'Supabase'],
    // dark "icon" card — app icon badge (dropped into media/)
    icon: '/media/voltpulse.png',
    grad: 'linear-gradient(155deg, #13564a, #0a2e3d)',
  },
  {
    name: 'Fairwork Contract',
    cat: 'LLM · OCR · Translation',
    desc: "Turns scanned contracts & payslips into plain-language rights sheets in a worker's native language.",
    stack: ['Next.js', 'Gemini', 'PaddleOCR'],
    // branded "light" card — FairWork wordmark + the languages it translates
    light: true,
    bg: '#eef2fa',
    ink: '#1e3557',
    accent: '#0076d6',
    img: '/media/fairwork-logo.png',
    slang: ['English', '中文', 'Malay', 'Tamil', 'Hindi'],
    hideName: true,
    grad: 'linear-gradient(150deg, #1a9aa8, #0d5560)',
  },
  {
    name: 'Waaah-Comics',
    cat: 'Gesture · Generative AI',
    desc: 'Gesture-controlled drawing and AI-powered comic generation.',
    // feature tags for now — swap for the real stack when you have it
    stack: ['Gesture Control', 'AI Image Gen', 'Comic Studio'],
    // local screenshot (project isn't hosted) rather than a fetched URL
    photo: '/media/wahcomics.png',
    grad: 'linear-gradient(150deg, #a855f7, #ec4899, #f59e0b)',
  },
]

function initShowcase() {
  const gallery = document.getElementById('gallery')
  if (!gallery) return

  const RADIUS = 480
  const anglePer = 360 / PROJECTS.length

  const cards = PROJECTS.map((p, i) => {
    const el = document.createElement('article')
    el.style.transform = `rotateY(${i * anglePer}deg) translateZ(${RADIUS}px)`
    const chips = p.stack.map(s => `<span>${s}</span>`).join('')
    if (p.light) {
      // branded card over a light background — logo / illustration / slang pills
      el.className = 'g-card g-card--light'
      el.style.background = p.bg
      if (p.ink) el.style.setProperty('--card-ink', p.ink)
      if (p.accent) el.style.setProperty('--card-accent', p.accent)
      let html = ''
      if (p.logo) html += `<img class="g-logo" src="${p.logo}" alt="${p.name} logo" />`
      if (p.img) html += `<img class="g-illus" src="${p.img}" alt="${p.name}" />`
      if (p.slang) html += `<div class="g-slang">${p.slang.map(s => `<span>${s}</span>`).join('')}</div>`
      html += `<div class="g-body"><div class="g-cat">${p.cat}</div>`
      if (!p.hideName) html += `<h3 class="g-name">${p.name}</h3>`
      html += `<p class="g-desc">${p.desc}</p><div class="g-stack">${chips}</div></div>`
      el.innerHTML = html
    } else if (p.photo) {
      // dark "photo" card: local screenshot thumbnail on top, info below
      el.className = 'g-card g-card--photo'
      el.innerHTML =
        `<div class="g-photo-wrap"><img class="g-photo" src="${p.photo}" alt="${p.name}" /></div>` +
        `<div class="g-body">` +
        `<div class="g-cat">${p.cat}</div>` +
        `<h3 class="g-name">${p.name}</h3>` +
        `<p class="g-desc">${p.desc}</p>` +
        `<div class="g-stack">${chips}</div>` +
        `</div>`
    } else if (p.icon) {
      // dark "icon" card: app-icon badge on a themed gradient + info
      el.className = 'g-card g-card--icon'
      el.style.background = p.grad
      el.innerHTML =
        `<div class="g-icon-head">` +
        `<img class="g-icon" src="${p.icon}" alt="${p.name} icon" />` +
        `<div class="g-cat">${p.cat}</div>` +
        `</div>` +
        `<div class="g-body">` +
        `<h3 class="g-name">${p.name}</h3>` +
        `<p class="g-desc">${p.desc}</p>` +
        `<div class="g-stack">${chips}</div>` +
        `</div>`
    } else {
      el.className = 'g-card'
      el.style.background = p.grad
      el.innerHTML =
        `<div class="g-cat">${p.cat}</div>` +
        `<div class="g-body">` +
        `<h3 class="g-name">${p.name}</h3>` +
        `<p class="g-desc">${p.desc}</p>` +
        `<div class="g-stack">${chips}</div>` +
        `</div>`
    }
    gallery.appendChild(el)
    return { el, angle: i * anglePer }
  })

  let scale = 1
  const setScale = () => {
    scale = Math.max(0.55, Math.min(window.innerWidth / 1250, 1))
  }
  setScale()
  window.addEventListener('resize', setScale)
  gallery.style.transform = `scale3d(${scale}, ${scale}, ${scale}) rotateY(0deg)`

  let scrollRot = 0
  let autoRot = 0
  let isScrolling = false
  let inView = false
  let idleTimer = null

  // scroll through the section rotates the ring one full turn
  ScrollTrigger.create({
    trigger: '.showcase',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: self => {
      scrollRot = self.progress * 360
      isScrolling = true
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        isScrolling = false
      }, 160)
    },
  })

  // only run the render loop while the section is on screen
  ScrollTrigger.create({
    trigger: '.showcase',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: self => {
      inView = self.isActive
    },
  })

  gsap.ticker.add(() => {
    if (!inView) return
    if (!isScrolling && !reduceMotion) autoRot += 0.04
    const rot = scrollRot + autoRot
    gallery.style.transform = `scale3d(${scale}, ${scale}, ${scale}) rotateY(${rot}deg)`
    for (const c of cards) {
      const rel = (((c.angle + rot) % 360) + 360) % 360
      const norm = rel > 180 ? 360 - rel : rel
      c.el.style.opacity = String(Math.max(0.25, 1 - norm / 180))
    }
  })
}

// ------------------------------------------------------------------
// Skillset — grouped tech stack. `i` = colored brand icon in
// public/media/icons/<i>.svg; `m` = monogram badge for tools with no
// official logo (swap in a real icon later if one is provided).
// ------------------------------------------------------------------

const SKILLS = [
  {
    group: 'Languages',
    items: [{ n: 'Python', i: 'python' }, { n: 'TypeScript', i: 'typescript' }, { n: 'JavaScript', i: 'javascript' }],
  },
  {
    group: 'Frontend',
    items: [{ n: 'Next.js', i: 'nextjs' }, { n: 'React', i: 'react' }, { n: 'Tailwind CSS', i: 'tailwindcss' }],
  },
  {
    group: 'Backend',
    items: [{ n: 'FastAPI', i: 'fastapi' }, { n: 'Flask', i: 'flask' }, { n: 'Spring Boot', i: 'spring' }],
  },
  {
    group: 'AI / ML',
    items: [
      { n: 'LangChain', i: 'langchain' },
      { n: 'LangGraph', m: 'LG' },
      { n: 'OpenAI', i: 'openai' },
      { n: 'Gemini', i: 'gemini' },
      { n: 'Ollama', i: 'ollama' },
      { n: 'YOLOv5', i: 'yolov5' },
      { n: 'DeepEval', m: 'DE' },
    ],
  },
  {
    group: 'Data',
    items: [
      { n: 'Supabase', i: 'supabase' },
      { n: 'PostgreSQL', i: 'postgresql' },
      { n: 'MySQL', i: 'mysql' },
      { n: 'InterSystems IRIS', m: 'IS' },
    ],
  },
  {
    group: 'Tools',
    items: [{ n: 'Docker', i: 'docker' }, { n: 'Git', i: 'git' }, { n: 'Vercel', i: 'vercel' }, { n: 'ngrok', i: 'ngrok' }],
  },
]

function initSkills() {
  const grid = document.getElementById('skills-grid')
  if (!grid) return
  for (const g of SKILLS) {
    const row = document.createElement('div')
    row.className = 'skill-group'
    const chips = g.items
      .map(it => {
        const visual = it.i
          ? `<img class="skill-ico" src="/media/icons/${it.i}.svg" alt="" />`
          : `<span class="skill-mono">${it.m || it.n.slice(0, 2).toUpperCase()}</span>`
        return `<span class="skill-chip">${visual}${it.n}</span>`
      })
      .join('')
    row.innerHTML = `<div class="skill-group-label">${g.group}</div><div class="skill-chips">${chips}</div>`
    grid.appendChild(row)
  }

  // reveal the groups as the section scrolls into view
  gsap.from('.skill-group', {
    opacity: 0,
    y: 40,
    ease: 'none',
    stagger: 0.08,
    scrollTrigger: { trigger: '.skills', start: 'top 78%', end: 'top 38%', scrub: true },
  })
}

async function boot() {
  history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)

  const count = document.querySelector('#preloader .count')
  const bar = document.querySelector('#preloader .bar span')
  // there is only one asset to wait for; animate a short determinate-ish fill
  let pct = 0
  const fill = setInterval(() => {
    pct = Math.min(pct + Math.random() * 18, 92)
    count.textContent = `${Math.round(pct)}%`
    bar.style.transform = `scaleX(${pct / 100})`
  }, 120)

  await primeVideo()
  clearInterval(fill)
  count.textContent = '100%'
  bar.style.transform = 'scaleX(1)'

  initScroll()

  // web fonts swap in after first paint and reflow the page taller; re-measure
  // so Lenis's scroll limit stays correct and lower sections stay reachable
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (lenis) lenis.resize()
      ScrollTrigger.refresh()
    })
  }

  const preloader = document.getElementById('preloader')
  const intro = gsap.timeline()
  intro.to(preloader, {
    opacity: 0,
    duration: 0.6,
    ease: 'power2.out',
    onComplete: () => {
      preloader.remove()
      document.body.classList.remove('loading')
      // the page was measured while body.loading disabled scrolling; now that
      // the full height (incl. the showcase) is scrollable, re-measure
      lenis.resize()
      ScrollTrigger.refresh()
    },
  })
  if (!reduceMotion) {
    // the split headline is revealed on scroll (see initScroll); on load we
    // only bring in the face and chrome so there is a reason to scroll
    intro.from(
      ['.hero-face', 'header', '.scroll-hint'],
      { opacity: 0, y: 20, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
      '-=0.3'
    )
  }
}

boot()
