'use client';

import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Trophy, Award, Medal, Star, ExternalLink } from 'lucide-react';

// This is the "Developer Skills" animation URL from the previous request
const LOTTIE_ANIMATION_URL = "https://assets3.lottiefiles.com/packages/lf20_3ntisyac.json";

const Hackathons: React.FC = () => {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    const fetchAnimation = async () => {
      try {
        const response = await fetch(LOTTIE_ANIMATION_URL);
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        console.error("Error loading Lottie animation:", error);
      }
    };

    fetchAnimation();
  }, []);

  const hackathons = [
    {
      name: "Open Government Products and People's Association",
      project: "Community Hackathon 2025",
      award: "Sparks Community Innovation Fund",
      description: "Awarded funding to continue piloting Churp",
      icon: <Trophy className="text-yellow-600 dark:text-yellow-400" size={24} />,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-700/50"
    },
    {
      name: "AI Singapore",
      project: "AISG Student Hackathon 2021",
      award: "Top 3 Winners",
      description: "Built an automated Room Funiture Budget Calculator using TagUI RPA and PeekingDuck libaries",
      icon: <Trophy className="text-yellow-600 dark:text-yellow-400" size={24} />,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-700/50"
    },
    {
      name: "SMU Smart City Society, IBM, IMDA",
      project: "SMU Hack For Cities 2025",
      award: "Top 10 Finalist",
      description: "Build and presented GreenMerlion to judges from SMU and IBM",
      icon: <Medal className="text-blue-600 dark:text-blue-400" size={24} />,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-700/50"
    },
    {
      name: "Google Singapore",
      project: "Google for Startups Cloud Hackathon Singapore 2022",
      award: "Top 20 Ideation",
      description: "Pitch a slide deck proposal on CareFall Vision, which uses computer vision and pose estimation to detect seniors who fell down at home, alerting their caregiver for assistance.",
      icon: <Medal className="text-blue-600 dark:text-blue-400" size={24} />,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-700/50"
    }
  ];

  return (
    <section id="hackathons" className="py-20 relative overflow-hidden transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Title & Animation */}
            <div className="order-1 lg:order-1 relative">
                <div className="mb-8">
                    {/* Added py-2 and leading-tight to prevent font clipping */}
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight py-2">
                        
                        <span className="text-brand-500 dark:text-brand-400">Hackathons</span>
                    </h2>
              
                </div>

                <div className="relative w-full max-w-md mx-auto lg:mx-0">
                    <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full -z-10"></div>
                    {animationData && (
                        <Lottie 
                            animationData={animationData}
                            loop={true} 
                            autoplay={true}
                            className="w-full h-auto drop-shadow-xl"
                        />
                    )}
                </div>
            </div>

            {/* Right Column: Awards List */}
            <div className="order-2 lg:order-2 space-y-6">
                {hackathons.map((hack, index) => (
                    <div key={index} className={`relative p-6 rounded-2xl border ${hack.border} bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg transition-all group overflow-hidden`}>
                        {/* Hover Gradient */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${hack.bg}`}></div>
                        
                        <div className="relative z-10 flex gap-4 sm:gap-6">
                            <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${hack.bg} ${hack.color}`}>
                                {hack.icon}
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{hack.project}</h3>
                                    <span className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${hack.bg} ${hack.color} mt-2 sm:mt-0 w-fit`}>
                                        {hack.award}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{hack.name}</p>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                    {hack.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

             
            </div>
        </div>
      </div>
    </section>
  );
};

export default Hackathons;