"use client";

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Search, 
  Filter, 
  PlayCircle, 
  Clock, 
  Star, 
  Zap, 
  Shield, 
  Globe, 
  Cpu, 
  Database, 
  Layout,
  Layers,
  Code2
} from "lucide-react";

export default function CoursesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const courses = [
    { id: 1, title: "Neural Networks Architecture", duration: "12h", rating: 4.8, level: "Advanced", icon: Cpu, category: "AI" },
    { id: 2, title: "Probability & Statistics", duration: "8h", rating: 4.9, level: "Intermediate", icon: Zap, category: "Math" },
    { id: 3, title: "Advanced Linear Algebra", duration: "15h", rating: 4.7, level: "Advanced", icon: Layers, category: "Math" },
    { id: 4, title: "Distributed Systems Strategy", duration: "14h", rating: 4.9, level: "Advanced", icon: Globe, category: "Architecture" },
    { id: 5, title: "Full Stack Web Architecture", duration: "20h", rating: 4.8, level: "Intermediate", icon: Layout, category: "Web" },
    { id: 6, title: "Cybersecurity Intelligence", duration: "18h", rating: 4.7, level: "Advanced", icon: Shield, category: "Security" },
    { id: 7, title: "Cloud Infrastructure & DevOps", duration: "16h", rating: 4.6, level: "Intermediate", icon: Cpu, category: "Cloud" },
    { id: 8, title: "Algorithm Masterclass", duration: "25h", rating: 4.9, level: "Advanced", icon: Code2, category: "Computer Science" },
    { id: 9, title: "Data Structures in Practice", duration: "12h", rating: 4.8, level: "Beginner", icon: Database, category: "Computer Science" },
    { id: 10, title: "Quantum Computing Basics", duration: "10h", rating: 4.5, level: "Advanced", icon: Zap, category: "Physics" }
  ];

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartCourse = (topic) => {
    router.push(`/analyze?topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20 max-w-7xl mx-auto px-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-white tracking-tight">Concept Library</h1>
        <p className="text-slate-400 font-medium">Explore curated domains and bridge your cognitive gaps with AI-driven learning paths.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by topic, technology, or category..." 
            className="w-full bg-[#08080a] border border-white/5 rounded-[1.8rem] py-6 pl-16 pr-6 text-white focus:outline-none focus:border-primary/30 transition-all placeholder:text-slate-700 shadow-inner"
          />
        </div>
        <div className="flex gap-4">
           <button className="px-8 py-4 rounded-2xl bg-[#08080a] border border-white/5 text-slate-400 flex items-center gap-3 font-black text-[11px] uppercase tracking-widest hover:text-white transition-all">
             <Filter size={18} /> Filters
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {filteredCourses.map(course => {
          const Icon = course.icon || BookOpen;
          return (
            <div key={course.id} className="glass-card rounded-[2.5rem] p-10 group hover:border-primary/20 transition-all relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.08] pointer-events-none group-hover:scale-125 transition-transform text-primary">
                  <Icon size={120} />
               </div>
               <div className="flex justify-between items-start mb-10 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#261b17] flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                     <Icon size={32} />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-md">
                     <Star size={12} className="text-primary fill-primary" />
                     <span className="text-[10px] font-black text-white">{course.rating}</span>
                  </div>
               </div>
               
               <h3 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-primary transition-colors relative z-10">{course.title}</h3>
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-8">{course.category}</p>
               
               <div className="flex gap-8 mb-10 relative z-10">
                  <div className="flex items-center gap-2 text-slate-500">
                     <Clock size={14} className="text-primary" />
                     <span className="text-[10px] font-black uppercase tracking-widest">{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                     <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                     <span className="text-[10px] font-black uppercase tracking-widest">{course.level}</span>
                  </div>
               </div>

               <button 
                 onClick={() => handleStartCourse(course.title)}
                 className="w-full py-5 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-3 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-[0_10px_30px_rgba(255,122,33,0.3)] transition-all relative z-10"
               >
                  <PlayCircle size={20} /> Start Learning Path
               </button>
            </div>
          );
        })}

        {filteredCourses.length === 0 && (
           <div className="col-span-2 text-center py-32 glass-card">
              <Search size={48} className="text-slate-800 mx-auto mb-6" />
              <p className="text-xl font-black text-white tracking-tight">No learning paths found</p>
              <p className="text-slate-500 font-medium mt-2">Try adjusting your search keywords.</p>
           </div>
        )}
      </div>
    </div>
  );
}
