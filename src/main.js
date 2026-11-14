import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initSnakeHero } from './snake-hero.js'

gsap.registerPlugin(ScrollTrigger)

// ------------------------------------------------------------------
// Hero: a pinned WebGL snake stage (src/snake-hero.js). Lenis smooths
// the scroll and drives ScrollTrigger, which scrubs the snake timeline.
// ------------------------------------------------------------------

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis = null
let snake = null

function initScroll() {
  lenis = new Lenis({ smoothWheel: !reduceMotion })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)

  // pinned snake stage; its pin spacer must exist before the triggers below measure
  snake = initSnakeHero({ reduceMotion })

  // reveal the About columns as they scroll in after the stage
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

  // build the Achievements rows (rotating-gradient port)
  initAchievements()

  if (import.meta.env.DEV) {
    window.__hero = {
      lenis,
      ScrollTrigger,
      tick: () => gsap.ticker.tick(),
      snake: () => snake,
    }
  }
}

// ------------------------------------------------------------------
// Selected Work: vanilla port of the ProjectShowcase component.
// Screenshots sit in a tilted card stack; Previous/Next hops the chosen
// card to the front while its text blurs in word by word, the same
// choreography as the original, driven by GSAP instead of Framer Motion.
// Every text panel shares one grid cell, so the section is always as tall
// as the longest project and switching never shifts the page below it.
// ------------------------------------------------------------------

const PROJECTS = [
  {
    name: 'Churp',
    img: '/media/work/churp.webp',
    desc: "A fair ballot for Tengah residents to apply for community allotment garden plots, built with the People's Association. The Singpass API pre-fills each application, making it quick for residents to enter the ballot.",
    stack: ['Singpass API'],
  },
  {
    name: 'SimiSlang',
    img: '/media/work/simislang.webp',
    desc: 'Singlish slang lessons written by vetted admins and verified by moderators and AI. Its AI layer combines semantic and keyword search using Reciprocal Rank Fusion over Gemma embeddings in PGVector, orchestrated with LangGraph and evaluated with G-Eval.',
    stack: ['Next.js', 'Spring Boot', 'MySQL', 'PostgreSQL', 'PGVector', 'FastAPI', 'LangGraph', 'Gemma Embeddings', 'RRF', 'Semantic Search', 'Keyword Search', 'G-Eval'],
  },
  {
    name: 'Scrooge McDuck Bank',
    img: '/media/work/scrooge.webp',
    pos: 'center', // keeps the tagline at the bottom of the screenshot in frame
    desc: 'A banking CRM deployed across two availability zones in private subnets. Route 53 and WAF front load-balanced ECS services that auto-scale against Aurora and ElastiCache replicas, with Lambda and an outbox worker handling background processing. PrivateLink keeps Secrets Manager, KMS, Cognito, SNS and SQS traffic private, and each domain has its own database credentials.',
    stack: ['Route 53', 'WAF', 'ALB', 'ECS Auto Scaling', 'Aurora', 'ElastiCache', 'Lambda', 'SQS', 'SNS', 'Cognito', 'PrivateLink', 'Secrets Manager', 'KMS', 'Bedrock AgentCore', 'GuardDuty'],
  },
  {
    name: 'OptESim',
    img: '/media/work/optesim.webp',
    desc: 'A 3D port-operations workspace for replanning when disruptions suddenly hit. Mark a quay crane or AGV as degraded or unavailable and a LangGraph ReAct agent drafts a new operating plan, then moves it through validation checks, human approval and an audit trail, visualised live in Three.js.',
    stack: ['Next.js', 'FastAPI', 'Node.js', 'LangGraph (ReAct)', 'OpenAI', 'Three.js'],
  },
  {
    name: 'VoltPulse',
    img: '/media/work/voltpulse.webp',
    desc: 'Turns Singapore utility bills into a dashboard comparing your usage with neighbours and the national average, with an AI chat for personalised advice. Runs LangChain on FastAPI, with GPT-OSS 120B through Ollama Cloud.',
    stack: ['Next.js', 'FastAPI', 'LangChain', 'Ollama Cloud', 'GPT-OSS 120B'],
  },
]

function initShowcase() {
  const root = document.getElementById('project-showcase')
  if (!root) return

  const stack = root.querySelector('.ps-stack')
  const texts = root.querySelector('.ps-texts')
  const total = PROJECTS.length
  const HOP = 0.2 // seconds for each half of the card's rise and landing
  const tilt = () => gsap.utils.random(-10, 10, 1)

  const cards = PROJECTS.map(p => {
    const card = document.createElement('div')
    card.className = 'ps-card'
    card.innerHTML = `<img src="${p.img}" alt="${p.name} screenshot" loading="lazy" decoding="async" />`
    if (p.pos) card.firstChild.style.objectPosition = p.pos
    stack.appendChild(card)
    return card
  })

  const panels = PROJECTS.map(p => {
    const panel = document.createElement('div')
    panel.className = 'ps-panel'
    const words = p.desc.split(' ').map(w => `<span class="ps-word">${w}</span>`).join(' ')
    const chips = p.stack.map(s => `<span>${s}</span>`).join('')
    panel.innerHTML =
      `<h3 class="ps-name">${p.name}</h3>` +
      `<p class="ps-desc">${words}</p>` +
      `<div class="ps-chips">${chips}</div>`
    texts.appendChild(panel)
    return { panel, words: panel.querySelectorAll('.ps-word') }
  })

  const placeCards = (active, animate) => {
    cards.forEach((card, i) => {
      const on = i === active
      const zIndex = on ? 999 : total + 2 - i
      const pose = { opacity: on ? 1 : 0.7, scale: on ? 1 : 0.95, rotation: on ? 0 : tilt() }
      card.setAttribute('aria-hidden', String(!on))
      gsap.killTweensOf(card)
      if (!animate) {
        gsap.set(card, { ...pose, zIndex, y: 0 })
        return
      }
      gsap.to(card, { ...pose, duration: HOP * 2, ease: 'power1.inOut' })
      // restack at the top of the hop, so the card lands on the pile
      gsap.set(card, { zIndex, delay: HOP })
      if (on) {
        gsap.to(card, {
          keyframes: [
            { y: -80, duration: HOP, ease: 'power1.out' },
            { y: 0, duration: HOP, ease: 'power1.in' },
          ],
        })
      } else {
        gsap.to(card, { y: 0, duration: HOP * 2, ease: 'power1.inOut' })
      }
    })
  }

  let textTl = null
  const showText = (active, animate) => {
    if (textTl) textTl.kill()
    panels.forEach(({ panel }, i) => panel.classList.toggle('is-active', i === active))
    if (!animate) return
    const { panel, words } = panels[active]
    textTl = gsap
      .timeline()
      .fromTo(
        panel,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.2, ease: 'power1.inOut', clearProps: 'transform,opacity' }
      )
      .fromTo(
        words,
        { filter: 'blur(10px)', opacity: 0, y: 5 },
        {
          filter: 'blur(0px)',
          opacity: 1,
          y: 0,
          duration: 0.2,
          stagger: 0.02,
          ease: 'power1.inOut',
          clearProps: 'filter,transform,opacity',
        },
        0
      )
  }

  let active = 0
  const go = step => {
    active = (active + step + total) % total
    placeCards(active, !reduceMotion)
    showText(active, !reduceMotion)
  }

  placeCards(active, false)
  showText(active, false)

  root.querySelectorAll('.ps-btn').forEach(btn => {
    btn.addEventListener('click', () => go(Number(btn.dataset.step)))
  })
  root.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    go(e.key === 'ArrowLeft' ? -1 : 1)
  })

  // reveal the section as it scrolls into view
  gsap.from('.showcase-inner > *', {
    opacity: 0,
    y: 40,
    ease: 'none',
    stagger: 0.08,
    scrollTrigger: { trigger: '.showcase', start: 'top 78%', end: 'top 38%', scrub: true },
  })
}

// ------------------------------------------------------------------
// Skillset: grouped tech stack. `i` = colored brand icon in
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
    ],
  },
  {
    group: 'AWS',
    sections: [
      {
        label: 'Compute',
        items: [{ n: 'ECS', i: 'aws-ecs' }, { n: 'Lambda', i: 'aws-lambda' }],
      },
      {
        label: 'Networking',
        items: [
          { n: 'VPC', i: 'aws-vpc' },
          { n: 'ALB', i: 'aws-alb' },
          { n: 'Route 53', i: 'aws-route53' },
          { n: 'NAT Gateway', i: 'aws-nat-gateway' },
        ],
      },
      {
        label: 'Data',
        items: [{ n: 'RDS', i: 'aws-rds' }, { n: 'S3', i: 'aws-s3' }],
      },
      {
        label: 'Security',
        items: [
          { n: 'WAF', i: 'aws-waf' },
          { n: 'Cognito', i: 'aws-cognito' },
          { n: 'Secrets Manager', i: 'aws-secrets-manager' },
          { n: 'KMS', i: 'aws-kms' },
          { n: 'ACM', i: 'aws-acm' },
        ],
      },
      {
        label: 'Monitoring',
        items: [{ n: 'CloudWatch', i: 'aws-cloudwatch' }],
      },
    ],
  },
  {
    group: 'Tools',
    items: [
      { n: 'Docker', i: 'docker' },
      { n: 'Git', i: 'git' },
      { n: 'GitHub Actions (CI/CD)', i: 'githubactions' },
      { n: 'Vercel', i: 'vercel' },
      { n: 'ngrok', i: 'ngrok' },
    ],
  },
]

function skillChips(items) {
  const chips = items
    .map(it => {
      const visual = it.i
        ? `<img class="skill-ico" src="/media/icons/${it.i}.svg" alt="" loading="lazy" decoding="async" />`
        : `<span class="skill-mono">${it.m || it.n.slice(0, 2).toUpperCase()}</span>`
      return `<span class="skill-chip">${visual}${it.n}</span>`
    })
    .join('')
  return `<div class="skill-chips">${chips}</div>`
}

function initSkills() {
  const grid = document.getElementById('skills-grid')
  if (!grid) return
  for (const g of SKILLS) {
    const row = document.createElement('div')
    row.className = 'skill-group'
    const body = g.sections
      ? `<div class="skill-sections">${g.sections
          .map(s => `<div><div class="skill-section-label">${s.label}</div>${skillChips(s.items)}</div>`)
          .join('')}</div>`
      : skillChips(g.items)
    row.innerHTML = `<div class="skill-group-label">${g.group}</div>${body}`
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

// ------------------------------------------------------------------
// Achievements: vanilla port of the RotatingGradientRight component.
// Each row: a photo framed inside a rotating conic-gradient glow, with
// text beside it. Odd rows (2nd, 4th) flip sides. The glow only spins
// while the section is on screen (heavy blurred compositing otherwise).
// ------------------------------------------------------------------

const ACHIEVEMENTS = [
  {
    title: 'PSA Code Sprint 2.0 2026',
    result: '2nd Place',
    org: 'PSA',
    desc: 'Developed an agentic Vessel Exception Manager for PSA, taking 2nd place at the hackathon finals.',
    img: '/media/psa.jpg',
  },
  {
    title: 'SMU Hack for Cities 2026',
    result: 'Top 8 Finalist',
    org: 'SMU · IBM · IMDA · AI Singapore',
    desc: 'Pitched VoltPulse SG, an agentic AI home-energy advisor, through to the finals.',
    img: '/media/hfc_2026.jpg',
  },
  {
    title: 'Build for Good 2025',
    result: 'Sparks Community Fund',
    org: "Open Government Products · People's Association",
    desc: 'Recognised with the Sparks Community Fund for a community-impact build.',
    img: '/media/bfg_2025.jpg',
  },
  {
    title: 'SMU Hack for Cities 2025',
    result: 'Top 10',
    org: 'SMU · IBM · IMDA · AI Singapore',
    desc: 'Reached the top 10 at the 2025 edition of the civic-tech hackathon.',
    img: '/media/hfc_2025.jpg',
  },
  {
    title: 'AISG Student Hackathon',
    result: 'Top 3 Winners',
    org: 'AI Singapore',
    desc: 'Placed among the top 3 teams nationally at the AI Singapore student hackathon.',
    img: '/media/ai_singapore.png',
  },
]

// coalesce layout-changing events into a single Lenis/ScrollTrigger re-measure
let refreshTimer = null
function refreshScroll() {
  if (refreshTimer) return
  refreshTimer = setTimeout(() => {
    refreshTimer = null
    if (lenis) lenis.resize()
    ScrollTrigger.refresh()
  }, 200)
}

function initAchievements() {
  const list = document.getElementById('ach-list')
  if (!list) return

  ACHIEVEMENTS.forEach((a, i) => {
    const row = document.createElement('div')
    row.className = 'ach-row' + (i % 2 === 1 ? ' ach-row--rev' : '')
    row.innerHTML =
      `<div class="ach-visual"><div class="ach-media">` +
      `<div class="ach-glow"></div>` +
      `<div class="ach-frame"><img src="${a.img}" alt="${a.title}" /></div>` +
      `</div></div>` +
      `<div class="ach-text">` +
      `<div class="ach-result">${a.result}</div>` +
      `<h3 class="ach-title">${a.title}</h3>` +
      `<p class="ach-desc">${a.desc}</p>` +
      `<div class="ach-org">${a.org}</div>` +
      `</div>`
    list.appendChild(row)
  })

  // these photos are height:auto, so they grow the page as they load, which
  // would leave Lenis's scroll limit stale; re-measure once each lands
  list.querySelectorAll('.ach-frame img').forEach(im => {
    if (im.complete) refreshScroll()
    else im.addEventListener('load', refreshScroll, { once: true })
  })

  // reveal each row as it scrolls into view
  document.querySelectorAll('.ach-row').forEach(row => {
    gsap.from(row, {
      opacity: 0,
      y: 50,
      ease: 'none',
      scrollTrigger: { trigger: row, start: 'top 82%', end: 'top 48%', scrub: true },
    })
  })
}

async function boot() {
  history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)

  const count = document.querySelector('#preloader .count')
  const bar = document.querySelector('#preloader .bar span')
  // the snake is built in code; only the web fonts are worth waiting for
  let pct = 0
  const fill = setInterval(() => {
    pct = Math.min(pct + Math.random() * 18, 92)
    count.textContent = `${Math.round(pct)}%`
    bar.style.transform = `scaleX(${pct / 100})`
  }, 120)

  if (document.fonts && document.fonts.ready) {
    // safety: never hang the loader on a slow font
    await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))])
  }
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
    // the role text is revealed on scroll (see snake-hero.js); on load we
    // only bring in the snake and chrome so there is a reason to scroll
    intro.from(
      ['.intro', '#gl', 'header', '.seal', '.phase'],
      { opacity: 0, y: 20, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
      '-=0.3'
    )
  }
}

boot()
