'use client';

import React from 'react';
import { ExternalLink, Github, Folder } from 'lucide-react';

const Projects: React.FC = () => {
  const projects = [
     {
      title: "Churp",
      description: "A web allotment garden booking system with Sparks Community Innovation Taskforce @ Tengah.",
      tech: ["Currently in Development"],
      image: "/logo-full.svg",
      github: "",
      demo: ""
    },
    {
      title: "Smart Attendance System",
      description: "A coursework project that uses computer vision for facial recognition to mark student attendance.",
      tech: ["Springboot", "Supabase", "FastAPI", "Deepface","Hugging Face"],
      image: "/smart_attendance.jpg",
      github: "https://github.com/KevanSoon/CS102",
      demo: ""
    },
    {
      title: "Pawsitive",
      description: "A coursework project aimed at helping the cat community in reporting lost or injured cats.",
      tech: ["Vue", "OneMap", "OpenStreetMap", "Firebase"],
      image: "/pawsitive.jpeg",
      github: "https://github.com/ashmewz/is216-project",
      demo: "https://pawsitive-sg.vercel.app/"
    },
    {
      title: "Fairwork Contract",
      description: "A web application build for foreign workers in Singapore to help translate english payslips to their native language for a better understanding.",
      tech: ["Next.js", "Gemini", "FastAPI", "Hugging Face","PaddleOCR"],
      image: "/fairwork-contract.png",
      github: "",
      demo: "https://fair-work-contract.vercel.app/"
    },
    {
      title: "♻️GreenMerlion",
      description: "A recycling web application that includes a computer vision for waste classification, chatbot, and gamification system.",
      tech: ["Flask", "PostgresSQL", "Yolov5","ngrok","Google Colab","OpenCV","Llama 2"],
      image: "/greenmerlion.ai.png",
      github: "https://github.com/guanghaokwa/AI-HFC-Recycle-Management-System",
      demo: ""
    },
    {
      title: "AgeWellLah.AI",
      description: "A speech to text chatbot that extract health information of a patient from a vector store using vector search to help plan meals for them.",
      tech: ["OpenAI API", "Flask", "InterSystems IRIS Vector Store and Search","Web Speech API"],
      image: "/agewelllah.png",
      github: "https://github.com/ZulfaqarHafez/AgeWellLah.AI",
      demo: ""
    }
  ];

  return (
    <section id="projects" className="py-20 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4"><span className="text-brand-500 dark:text-brand-400">Projects</span></h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
                <div key={index} className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/50 hover:border-brand-500/50 transition-all hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-y-1 shadow-sm">
                    {/* Image or Gradient Placeholder */}
                    <div className={`h-48 w-full relative overflow-hidden ${project.image.startsWith('/') || project.image.startsWith('http') ? 'bg-slate-100 dark:bg-slate-700' : project.image}`}>
                        {project.image.startsWith('/') || project.image.startsWith('http') ? (
                            <img 
                                src={project.image} 
                                alt={project.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-900/20 group-hover:bg-transparent transition-colors"></div>
                                <Folder className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400/20 dark:text-white/10 w-24 h-24 transform group-hover:scale-110 transition-transform duration-500" />
                            </>
                        )}
                    </div>

                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{project.title}</h3>
                            <div className="flex gap-3">
                                {project.github && (
                                    <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="View Code">
                                        <Github size={18} />
                                    </a>
                                )}
                                {project.demo && (
                                    <a href={project.demo} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Live Demo">
                                        <ExternalLink size={18} />
                                    </a>
                                )}
                            </div>
                        </div>
                        
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">
                            {project.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-auto">
                            {project.tech.map((t) => (
                                <span key={t} className="text-xs font-medium text-brand-700 dark:text-brand-200 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 rounded-md">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;