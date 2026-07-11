'use client';

// Layered "Mount Iwate, sea of clouds" scenery. Pure CSS + SVG, no photo assets.
// Two fixed planes: `scene` sits behind all content; `foreground` sits in front
// (pointer-events: none) so cloud wisps drift over sections as you move between
// them — that is the parallax "overlap" transition. Layer motion is written
// directly to the DOM from Lenis (no per-frame React state), and disabled under
// prefers-reduced-motion.
import { useEffect, useRef } from 'react';
import { useLenis } from 'lenis/react';
import styles from './scenery-backdrop.module.css';

export function SceneryBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduce.current = mq.matches;
    const onChange = () => {
      reduce.current = mq.matches;
      if (mq.matches && rootRef.current) {
        rootRef.current
          .querySelectorAll<HTMLElement>('[data-speed]')
          .forEach((el) => (el.style.transform = ''));
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useLenis((lenis: { scroll: number }) => {
    if (reduce.current || !rootRef.current) return;
    const scroll = lenis.scroll;
    const layers = rootRef.current.querySelectorAll<HTMLElement>('[data-speed]');
    layers.forEach((el) => {
      const sp = parseFloat(el.dataset.speed || '0');
      el.style.transform = `translate3d(0, ${(scroll * sp).toFixed(2)}px, 0)`;
    });
  });

  return (
    <div ref={rootRef} className={styles.root}>
      {/* ── Behind content ── */}
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.sky} />
        <div className={styles.sun} data-speed="0.06" />

        <div className={styles.cloudFar} data-speed="-0.10">
          <div className={styles.cloudFarInner} />
        </div>

        <div className={styles.mtnFar} data-speed="0.09">
          <svg viewBox="0 0 1440 620" preserveAspectRatio="xMidYMax slice" className={styles.mtnSvg}>
            <path
              fill="var(--mtn-far)"
              d="M0,620 L0,430 L150,372 L300,408 L470,316 L640,372 L820,300 L1010,372 L1180,330 L1320,384 L1440,348 L1440,620 Z"
            />
          </svg>
        </div>

        <div className={styles.mtnMid} data-speed="0.15">
          <svg viewBox="0 0 1440 640" preserveAspectRatio="xMidYMax slice" className={styles.mtnSvg}>
            {/* Mount Iwate: broad volcanic cone with a soft secondary shoulder */}
            <path
              fill="var(--mtn-mid)"
              d="M0,640 L0,556 C220,548 380,524 500,470 L648,318 C690,250 726,222 750,222 C770,222 792,244 828,308 L884,372 L944,338 L1002,392 C1124,470 1286,520 1440,544 L1440,640 Z"
            />
          </svg>
        </div>

        <div className={styles.cloudSea} data-speed="-0.16">
          <div className={styles.cloudSeaInner} />
        </div>
      </div>

      {/* ── In front of content (transition wisps) ── */}
      <div className={styles.foreground} aria-hidden="true">
        <div className={styles.wispTop} data-speed="0.22">
          <div className={styles.wispTopInner} />
        </div>
        <div className={styles.wispBottom} data-speed="-0.18">
          <div className={styles.wispBottomInner} />
        </div>
      </div>
    </div>
  );
}
