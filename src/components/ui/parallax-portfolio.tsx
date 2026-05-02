'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import styles from './parallax-portfolio.module.css';

export interface ParallaxScene {
  image: string;
  alt?: string;
  content: React.ReactNode;
}

interface Props {
  scenes: ParallaxScene[];
  pinDistance?: number;  // vh units per scene, default 250
  parallaxDepth?: number; // % drift, default 30
  easeAmount?: number;   // lerp 0.01–1, default 0.10
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function mapRange(v: number, inLo: number, inHi: number, outLo: number, outHi: number) {
  return outLo + (outHi - outLo) * clamp((v - inLo) / (inHi - inLo), 0, 1);
}

export function ParallaxPortfolio({
  scenes,
  pinDistance = 250,
  parallaxDepth = 30,
  easeAmount = 0.10,
}: Props) {
  const bgRefs      = useRef<(HTMLDivElement | null)[]>([]);
  const sceneRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hintRef     = useRef<HTMLDivElement | null>(null);
  const scrollState = useRef({ current: 0, target: 0 });
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getPinDist = useCallback(() => {
    if (typeof window === 'undefined') return 800;
    return (window.innerHeight * pinDistance) / 100;
  }, [pinDistance]);

  const tick = useCallback(() => {
    const PIN_DIST = getPinDist();
    const state    = scrollState.current;
    state.target   = window.scrollY;
    state.current  = lerp(state.current, state.target, easeAmount);
    if (Math.abs(state.current - state.target) < 0.05) state.current = state.target;

    const s = state.current;

    scenes.forEach((_, i) => {
      const sceneEl   = sceneRefs.current[i];
      const bgEl      = bgRefs.current[i];
      const contentEl = contentRefs.current[i];
      if (!sceneEl || !bgEl || !contentEl) return;

      const progress = clamp((s - i * PIN_DIST) / PIN_DIST, 0, 1);

      // ── Scene crossfade opacity ──
      sceneEl.style.opacity = String(i === 0 ? 1 : mapRange(progress, 0, 0.30, 0, 1));
      sceneEl.style.zIndex  = String(i === 0 ? scenes.length : (progress > 0 ? scenes.length + 1 : scenes.length - i));

      // ── BG parallax: rises from below ──
      let bgY: number;
      if (i === 0) {
        bgY = mapRange(progress, 0.30, 1, 0, -(parallaxDepth * 0.5));
      } else {
        bgY = progress < 0.30
          ? mapRange(progress, 0, 0.30, parallaxDepth, 0)
          : mapRange(progress, 0.30, 1, 0, -(parallaxDepth * 0.5));
      }
      bgEl.style.transform = `translateY(${bgY}%)`;

      // ── Content fade ──
      let op: number, cy: number;
      if (i === 0) {
        op = mapRange(progress, 0.55, 0.90, 1, 0);
        cy = mapRange(progress, 0, 1, 0, -50);
      } else if (progress < 0.30) {
        op = 0; cy = 20;
      } else if (progress < 0.45) {
        op = mapRange(progress, 0.30, 0.45, 0, 1);
        cy = mapRange(progress, 0.30, 0.45, 20, 0);
      } else if (progress < 0.78) {
        op = 1; cy = 0;
      } else {
        op = mapRange(progress, 0.78, 0.95, 1, 0);
        cy = mapRange(progress, 0.78, 0.95, 0, -30);
      }
      contentEl.style.opacity   = String(op);
      contentEl.style.transform = `translateY(${cy}px)`;

      // ── Scroll hint ──
      if (i === 0 && hintRef.current) {
        hintRef.current.style.opacity = String(mapRange(progress, 0, 0.10, 1, 0));
      }
    });

    timerRef.current = setTimeout(tick, 16);
  }, [scenes, getPinDist, parallaxDepth, easeAmount]);

  useEffect(() => {
    const PIN_DIST = getPinDist();
    const track = document.getElementById('parallax-scroll-track');
    if (track) track.style.height = `${PIN_DIST * scenes.length}px`;

    timerRef.current = setTimeout(tick, 16);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [tick, scenes.length, getPinDist]);

  return (
    <>
      <div className={styles.stage}>
        {scenes.map((scene, i) => (
          <div
            key={i}
            ref={el => { sceneRefs.current[i] = el; }}
            className={styles.scene}
            style={{ opacity: i === 0 ? 1 : 0, zIndex: scenes.length - i }}
          >
            <div
              ref={el => { bgRefs.current[i] = el; }}
              className={styles.sceneBg}
              style={{ backgroundImage: `url(${scene.image})` }}
              role="img"
              aria-label={scene.alt ?? ''}
            />
            <div className={styles.sceneGrad} />
            <div
              ref={el => { contentRefs.current[i] = el; }}
              className={styles.sceneContent}
            >
              {scene.content}
            </div>
            {i === 0 && (
              <div ref={hintRef} className={styles.scrollHint}>
                <span>Scroll</span>
                <div className={styles.scrollLine} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div id="parallax-scroll-track" />
    </>
  );
}
