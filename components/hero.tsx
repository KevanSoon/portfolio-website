'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Github, Linkedin, ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const phrases = ["a Software Engineer.", "an Undergraduate in Software Engineering."];

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % phrases.length;
      const fullText = phrases[i];

      setText(isDeleting 
        ? fullText.substring(0, text.length - 1) 
        : fullText.substring(0, text.length + 1)
      );

      setTypingSpeed(isDeleting ? 30 : 150);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2000); // Pause at end of sentence
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, phrases, typingSpeed]);

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 pb-10 px-6 max-w-7xl mx-auto overflow-visible">
      
      <div className="flex flex-col-reverse md:flex-row items-center justify-center w-full gap-12 md:gap-20">
        
        {/* Left Column: Text & Typing Effect */}
        <div className="flex-1 text-center md:text-left z-10">
         
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-500">Kevan</span>
          </h1>
          
          <div className="min-h-[3.5rem] md:min-h-[4.5rem] text-2xl md:text-4xl font-semibold text-slate-600 dark:text-slate-300 mb-4">
           <span className="text-slate-900 dark:text-white border-r-4 border-brand-500 pr-1"> I am {text}</span>
          </div>

          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto md:mx-0 leading-relaxed">
           Passionate about using technology for social impact, I take part in hackathons to learn new tech stacks and build practical solutions to real-world problems.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8">
            <a href="#projects" className="px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-1 flex items-center gap-2">
              View Projects <ArrowRight size={18} />
            </a>
            <div className="flex gap-3">
              <SocialButton icon={<Github size={20} />} href='https://github.com/KevanSoon' />
              <SocialButton icon={<Linkedin size={20} />}  href="https://linkedin.com/in/kevansoon"/>
              <SocialButton icon={<Mail size={20} />}  href="mailto:kevansoon@gmail.com"/>
            </div>
          </div>
        </div>

        {/* Right Column: Image */}
        <div className="relative flex-1 flex justify-center items-center z-10">
          {/* Decorative rings */}
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/20 to-purple-500/20 rounded-full blur-3xl transform scale-110"></div>
          
          <div className="relative w-72 h-72 md:w-96 md:h-96">
            <div className="absolute inset-0 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-4 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl">
              {/* REPLACE THIS SRC WITH YOUR ACTUAL IMAGE URL */}
              <img 
                src="/user_intro.jpg" 
                alt="Profile" 
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
            </div>
          
          </div>
        </div>

      </div>
    </section>
  );
};

const SocialButton: React.FC<{
  icon: React.ReactNode;
  href: string;
}> = ({ icon, href }) => {
  const isMail = href.startsWith("mailto:");

  return (
    <a
      href={href}
      target={isMail ? undefined : "_blank"}
      rel={isMail ? undefined : "noopener noreferrer"}
      className="p-3.5 rounded-xl bg-white dark:bg-slate-800
                 border border-slate-200 dark:border-slate-700
                 text-slate-600 dark:text-slate-400
                 hover:text-brand-600 dark:hover:text-brand-400
                 hover:border-brand-200 dark:hover:border-brand-500/30
                 transition-all shadow-sm hover:shadow-md"
    >
      {icon}
    </a>
  );
};

export default Hero;