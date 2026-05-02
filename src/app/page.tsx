'use client';

// src/app/page.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { ParallaxPortfolio, ParallaxScene } from '@/components/ui/parallax-portfolio';
import styles from './page.module.css';

// ── TYPING EFFECT HOOK ──────────────────────────────────
function useTyping(phrases: string[], startDelay = 1800) {
  const [text, setText] = useState('');
  const state = useRef({ idx: 0, char: 0, deleting: false });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function loop() {
      const { idx, char, deleting } = state.current;
      const phrase = phrases[idx];

      if (!deleting) {
        setText(phrase.slice(0, char + 1));
        state.current.char++;
        if (state.current.char === phrase.length) {
          state.current.deleting = true;
          timer = setTimeout(loop, 1800);
          return;
        }
        timer = setTimeout(loop, 65);
      } else {
        setText(phrase.slice(0, char - 1));
        state.current.char--;
        if (state.current.char === 0) {
          state.current.deleting = false;
          state.current.idx = (idx + 1) % phrases.length;
          timer = setTimeout(loop, 400);
          return;
        }
        timer = setTimeout(loop, 35);
      }
    }

    timer = setTimeout(loop, startDelay);
    return () => clearTimeout(timer);
  }, [phrases, startDelay]);

  return text;
}

// ── SMOOTH SCROLL ───────────────────────────────────────
function smoothScrollTo(targetY: number, duration: number) {
  const startY    = window.scrollY;
  const delta     = targetY - startY;
  const startTime = performance.now();
  function step() {
    const t    = Math.min((performance.now() - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 4);
    window.scrollTo(0, startY + delta * ease);
    if (t < 1) setTimeout(step, 16);
  }
  setTimeout(step, 16);
}

const TYPING_PHRASES = [
  'a Software Engineer',
  'passionate about social impact',
  'a hackathon builder',
  'a AI Engineer',
];

const TECH_STACK = ['Next.js', 'Typescript', 'JavaScript', 'FastAPI', 'Flask', 'Python','Docker'];

const PIN_DISTANCE = 250; // vh per scene

// ── SCENE CONTENT COMPONENTS ───────────────────────────

function HeroContent() {
  const typedText = useTyping(TYPING_PHRASES);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className={styles.heroAvatarWrap}>
        <Image
          src="/images/user_intro.jpg"
          alt="Kevan Soon"
          width={160}
          height={160}
          className={styles.heroAvatar}
          priority
        />
      </div>
      <h1 className={`${styles.sceneTitle} ${styles.heroTitle}`}>
        Hi, I&apos;m <em>Kevan</em>
      </h1>
      <p className={styles.heroSub}>
        I am {typedText}<span className={styles.typingCursor}>|</span>
      </p>
      <div className={styles.techStack}>
        {TECH_STACK.map(t => (
          <span key={t} className={styles.techTag}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function AboutContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '860px', width: '100%' }}>
      <h2 className={`${styles.sceneTitle} ${styles.sectionTitle}`}>
        About <em>Me</em>
      </h2>
      <div className={styles.divider} />
      <div className={styles.aboutGrid}>
        <div className={styles.aboutCol}>
          <p className={styles.aboutLabel}>Education</p>
          <div className={styles.aboutEntry}>
            <span className={styles.aboutYear}>2024 – 2028</span>
            <strong>BSc Software Engineering</strong>
            <span>Singapore Management University</span>
            <span className={styles.aboutNote}>2nd Major in Product Development</span>
          </div>
          <div className={styles.aboutEntry}>
            <span className={styles.aboutYear}>2019 – 2022</span>
            <strong>Diploma in Business Information Systems</strong>
            <span>Republic Polytechnic · Graduated with Merit</span>
          </div>
        </div>
        <div className={styles.aboutCol}>
          <p className={styles.aboutLabel}>Experience</p>
          <div className={styles.aboutEntry}>
            <span className={styles.aboutYear}>May 2026 – Present</span>
            <strong>AI Engineer Intern</strong>
            <span>HTX</span>
            <span className={styles.aboutNote}>Q Team</span>
          </div>
          <div className={styles.aboutEntry}>
            <span className={styles.aboutYear}>Oct 2025 – Present</span>
            <strong>Software Engineer (Citizen Developer)</strong>
            <span>People&apos;s Association</span>
            <span className={styles.aboutNote}>Building Churp, a web allotment garden booking system</span>
          </div>
          <div className={styles.aboutEntry}>
            <span className={styles.aboutYear}>Mar – Jul 2021</span>
            <strong>Application Developer Intern</strong>
            <span>XIOHOO</span>
            <span className={styles.aboutNote}>Django Q&amp;A interface &amp; Dialogflow Telegram bot</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const PROJECTS = [
  { num: '01', name: 'Churp',             category: 'Web · Community',  image: '/images/churp.svg', stack: ['Current in Development'] },
  { num: '02', name: 'SimiSlang',  category: 'RAG and LLM as a Judge',  image: '/images/simislang.png', stack: ['Next.js', 'Springboot', 'FastAPI','DeepEval','LangGraph','MySQL','Supabase Vector Store']       },
  { num: '03', name: 'VoltPulse SG',         category: 'RAG and GenAI',   image: '/images/Voltpulse.png', stack: ['Next.js', 'FastAPI', 'LangGraph', 'OpenAI', 'Supabase Vector Store']     },
  { num: '04', name: 'Fairwork Contract', category: 'LLM and OCR', image: '/images/fairwork-contract.png', stack: ['Next.js', 'FastAPI', 'Gemini','PaddleOCR']   },
  { num: '05', name: 'GreenMerlion',      category: 'Computer Vision and LLM',   image: '/images/greenmerlion.ai.png', stack: ['Flask', 'YOLOv5','PostgresSQL','Llama 2','ngrok']         },
  { num: '06', name: 'AgeWellLah.AI',     category: 'LLM and InterSystems',  image: '/images/agewelllah.png', stack: ['Flask','IRIS Vector Store and Search','OpenAI','Web Speech API']         },
];

function ProjectsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '900px', width: '100%' }}>
      <h2 className={`${styles.sceneTitle} ${styles.sectionTitle}`}><em>Projects</em></h2>
      <div className={styles.divider} />
      <div className={styles.workGrid}>
        {PROJECTS.map(p => (
          <div key={p.num} className={styles.workItem}>
            <div className={styles.workImage}>
              {p.image ? (
                <Image src={p.image} alt={p.name} fill style={{ objectFit: 'cover' }} />
              ) : (
                <span className={styles.workImagePlaceholder}>{p.num}</span>
              )}
            </div>
            <div className={styles.workBody}>
              <div className={styles.workName}>{p.name}</div>
              <div className={styles.workCategory}>{p.category}</div>
              <div className={styles.workStackRow}>
                {p.stack.map(t => (
                  <span key={t} className={styles.workStackTag}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const HACKATHONS = [
  { award: '⭐ Top 8',  name: 'SMU Hack For Cities 2026',       org: 'SMU · IBM · IMDA · AI Singapore'            },
  { award: '🏆 Awarded Sparks Community Fund',  name: 'Community Hackathon 2025',       org: 'OGP & People\'s Association' },
  
  { award: '⭐ Top 10',  name: 'SMU Hack For Cities 2025',       org: 'SMU · IBM · IMDA AI Singapore'            },
  { award: '🏆 Top 3 Winners',   name: 'AISG Student Hackathon 2021',    org: 'AI Singapore'                },
  { award: '⭐ Top 20',  name: 'Google for Startups 2022',       org: 'Google Singapore'            },
];

function HackathonsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '780px', width: '100%' }}>
      <h2 className={`${styles.sceneTitle} ${styles.sectionTitle}`}><em>Hackathons</em></h2>
      <div className={styles.divider} />
      <div className={styles.hackGrid}>
        {HACKATHONS.map(h => (
          <div key={h.name} className={styles.hackItem}>
            <div className={styles.hackAward}>{h.award}</div>
            <div className={styles.hackName}>{h.name}</div>
            <div className={styles.hackOrg}>{h.org}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PAGE ────────────────────────────────────────────────
export default function HomePage() {
  const [activeDot, setActiveDot] = useState(0);
  const pinDist = useCallback(() =>
    typeof window !== 'undefined' ? (window.innerHeight * PIN_DISTANCE) / 100 : 800,
  []);

  const scenes: ParallaxScene[] = [
    { image: '/images/blue_sky.png',    alt: 'Blue sky',        content: <HeroContent /> },
    { image: '/images/mount_fuji.png',  alt: 'Mount Fuji',      content: <AboutContent /> },
    { image: '/images/red_gate.png',    alt: 'Torii gate',      content: <ProjectsContent /> },
    { image: '/images/Sakura.png',      alt: 'Cherry blossom',  content: <HackathonsContent /> },
  ];

  // Track active dot from scroll
  useEffect(() => {
    function onScroll() {
      const PD = pinDist();
      const idx = Math.min(
        scenes.length - 1,
        Math.floor(window.scrollY / PD)
      );
      setActiveDot(idx);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pinDist, scenes.length]);

  function goTo(idx: number) {
    smoothScrollTo(idx === 0 ? 0 : (idx + 0.5) * pinDist(), 1400);
  }

  return (
    <main className={styles.main}>
      {/* NAV */}
      <nav className={styles.nav}>
        <a className={styles.navLogo} href="#">KS</a>
        <ul className={styles.navLinks}>
          <li><a onClick={() => goTo(1)}>About</a></li>
          <li><a onClick={() => goTo(2)}>Projects</a></li>
          <li><a onClick={() => goTo(3)}>Hackathons</a></li>
        </ul>
      </nav>

      {/* DOTS */}
      <div className={styles.dots}>
        {scenes.map((_, i) => (
          <div
            key={i}
            className={`${styles.dot} ${activeDot === i ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      {/* PARALLAX */}
      <ParallaxPortfolio
        scenes={scenes}
        pinDistance={PIN_DISTANCE}
        parallaxDepth={30}
        easeAmount={0.10}
      />

      {/* FOOTER */}
      <footer className={styles.footer}>
        <p>© 2026 Kevan Soon</p>
        <p>Singapore</p>
      </footer>
    </main>
  );
}
