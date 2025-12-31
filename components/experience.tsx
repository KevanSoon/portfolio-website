'use client';

import React from 'react';
import { Briefcase, Calendar, GraduationCap, Building2 } from 'lucide-react';

const Experience: React.FC = () => {
  const workExperience = [
    {
      company: "People's Association",
      role: "Software Engineer (Citizen Developer)",
      period: "Oct 2025 - Present",
      description: "Volunteering as a Citizen Developer to build Churp, a web allotment garden booking system with Sparks Community Innovation Taskforce @ Tengah",
    },
    {
      company: "XIOHOO",
      role: "Application Developer Intern",
      period: "Mar 2021 - July 2021",
      description: "Prototyped a Django-based Q&A interface and Dialogflow-integrated Telegram bot during the internship phase to facilitate automated student interactions",
    },
   
  ];

  const education = [
    {
      school: "Singapore Management University",
      degree: "Bachelor of Science in Software Engineering",
      period: "2024 - 2028",
      description: "2nd Major in Product Development",
    },
    {
      school: "Republic Polytechnic",
      degree: "Diploma in Business Information Systems",
      period: "2019 - 2022",
      description: "Graduated with Merit",
    }
  ];

  return (
    <section id="about" className="py-20 relative bg-slate-50 dark:bg-slate-900/30 ">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">About <span className="text-brand-500 dark:text-brand-400">Me</span></h2>
            
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Column 1: Education */}
          <div>
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl text-brand-600 dark:text-brand-400">
                    <GraduationCap size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Education</h3>
             </div>

             <div className="space-y-8 border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-8 relative">
                {education.map((edu, index) => (
                    <div key={index} className="relative group">
                        {/* Dot */}
                        <div className="absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 border-white dark:border-slate-900 bg-slate-300 dark:bg-slate-700 group-hover:bg-brand-500 transition-colors"></div>
                        
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 mb-2 block">{edu.period}</span>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{edu.degree}</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-3 flex items-center gap-2">
                                <Building2 size={14} /> {edu.school}
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                {edu.description}
                            </p>
                        </div>
                    </div>
                ))}
             </div>
          </div>

          {/* Column 2: Work Experience */}
          <div>
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl text-brand-600 dark:text-brand-400">
                    <Briefcase size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Experience</h3>
             </div>

             <div className="space-y-8 border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-8 relative">
                {workExperience.map((job, index) => (
                    <div key={index} className="relative group">
                        {/* Dot */}
                        <div className="absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 border-white dark:border-slate-900 bg-slate-300 dark:bg-slate-700 group-hover:bg-brand-500 transition-colors"></div>
                        
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 mb-2 block">{job.period}</span>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{job.role}</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-3 flex items-center gap-2">
                                <Building2 size={14} /> {job.company}
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                {job.description}
                            </p>
                        </div>
                    </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Experience;