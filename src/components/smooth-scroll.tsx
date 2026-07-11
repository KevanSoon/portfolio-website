'use client';

// Root smooth-scroll provider. One Lenis instance for the whole page; all
// parallax/scroll consumers read from it via the `useLenis` hook so there is
// never a competing scroll loop or per-frame React state.
import { ReactLenis } from 'lenis/react';
import type { ReactNode } from 'react';

export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
