'use client';

import React from 'react';
import Navbar from '@/components/navbar';
import Hero from '@/components/hero';
import Experience from '@/components/experience';
import Projects from '@/components/projects';
import Hackathons from '@/components/hackathons';
import BackgroundBlobs from '@/components/background';
import { ThemeProvider } from '@/context/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="relative min-h-screen overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
          <BackgroundBlobs />
          <Navbar />
          <main className="relative z-10 selection:bg-brand-500/30 selection:text-brand-900 dark:selection:text-white">
            <Hero />
            <Experience />
            <Projects />
            <Hackathons />
            
            <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-200 dark:border-slate-800/50 mt-12 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm">
                <p>© {new Date().getFullYear()} Kevan Soon</p>
            </footer>
          </main>
      </div>
    </ThemeProvider>
  );
};

export default App;