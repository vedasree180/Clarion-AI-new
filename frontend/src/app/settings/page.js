"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  Monitor, 
  Bell, 
  ShieldCheck, 
  Mail, 
  MapPin, 
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Palette,
  CreditCard,
  Zap,
  Trash2,
  ExternalLink,
  MessageSquare,
  Smartphone,
  Save
} from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("Security");
  
  // Local state for profile inputs
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");

  useEffect(() => {
    if (user) {
      setEditUsername(user.username || "");
      setEditEmail(user.email || "");
    }
  }, [user]);

  const tabs = ["Security", "Display", "Account Management", "Notifications"];

  const getInitials = (name) => {
    if (!name) return "CL";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleChangePassword = async (currentPwd, newPwd) => {
    if (!user?.token) { toast.error("Not authenticated"); return; }
    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Password updated!"); }
      else { toast.error(data.detail || "Failed to update password"); }
    } catch { toast.error("Network error"); }
  };

  const handleSaveProfile = async () => {
    const success = await updateProfile({ username: editUsername, email: editEmail });
    if (success) {
      toast.success("Profile successfully synchronized.");
    } else {
      toast.error("Failed to update profile.");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Security":
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <Lock size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Security Credentials</h3>
                  <p className="text-xs text-slate-500 font-medium">Manage your passwords and authentication layers.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••••••"
                    className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/20 transition-all"
                  />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                  <input 
                    id="new-pwd" type="password"
                    placeholder="Enter new password"
                    className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/20 transition-all"
                  />
               </div>
            </div>

            <div className="flex items-center justify-between p-8 bg-[#261b17] rounded-[2rem] border border-white/5 shadow-inner">
               <div>
                  <h4 className="text-md font-black text-white mb-1">Two-Factor Authentication</h4>
                  <p className="text-xs text-slate-500 font-medium">Secure your account with a secondary verification method.</p>
               </div>
               <div className="w-14 h-8 bg-primary rounded-full relative p-1 cursor-pointer shadow-lg shadow-primary/20">
                  <div className="w-6 h-6 bg-white rounded-full absolute right-1"></div>
               </div>
            </div>

            <div className="pt-6">
               <button onClick={() => {
                const cur = document.getElementById("current-pwd")?.value;
                const nw = document.getElementById("new-pwd")?.value;
                if (cur && nw) handleChangePassword(cur, nw);
                else toast.error("Fill both password fields");
              }} className="px-10 py-4 bg-primary text-white font-black text-[12px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl shadow-primary/20">Update Password</button>
            </div>
          </div>
        );
      case "Display":
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <Palette size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Display & Interface</h3>
                  <p className="text-xs text-slate-500 font-medium">Customize your visual cognitive environment.</p>
               </div>
            </div>

            <div className="space-y-12">
               <div className="flex items-center justify-between border-b border-white/5 pb-12">
                  <div>
                     <h4 className="text-md font-black text-white mb-1">Dark Mode</h4>
                     <p className="text-xs text-slate-500 font-medium">Reduce eye strain with a deep-void high contrast interface.</p>
                  </div>
                  <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                     <button className="p-3 text-slate-600 hover:text-slate-400 transition-colors"><Monitor size={20} /></button>
                     <button className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20"><Zap size={20} fill="currentColor" /></button>
                  </div>
               </div>

               <div className="space-y-6">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Color Accent</label>
                  <div className="flex gap-6">
                     <div className="w-10 h-10 rounded-full bg-[#ff7a21] ring-4 ring-primary/30 cursor-pointer"></div>
                     <div className="w-10 h-10 rounded-full bg-blue-500 cursor-pointer hover:scale-125 transition-all"></div>
                     <div className="w-10 h-10 rounded-full bg-emerald-500 cursor-pointer hover:scale-125 transition-all"></div>
                     <div className="w-10 h-10 rounded-full bg-purple-500 cursor-pointer hover:scale-125 transition-all"></div>
                  </div>
               </div>
            </div>
          </div>
        );
      case "Account Management":
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <User size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Account Identity</h3>
                  <p className="text-xs text-slate-500 font-medium">Update your core profile information and metadata.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                  <input 
                    type="text" 
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/20 transition-all"
                  />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Enter email"
                    className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/20 transition-all"
                  />
               </div>
            </div>

            <div className="pt-6">
               <button 
                 onClick={handleSaveProfile}
                 className="px-10 py-4 bg-[#ff7a21] text-white font-black text-[13px] uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(255,122,33,0.3)] flex items-center gap-3"
               >
                  <Save size={18} /> Save Changes
               </button>
            </div>

            <div className="p-8 bg-red-500/5 rounded-[2rem] border border-red-500/10 mt-12 flex items-center justify-between">
               <div>
                  <h4 className="text-md font-black text-white mb-1">Delete Account</h4>
                  <p className="text-xs text-slate-500 font-medium">Permanently purge your cognitive profile and session history.</p>
               </div>
               <button className="px-6 py-3 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20">
                  <Trash2 size={16} className="inline mr-2" /> Deactivate
               </button>
            </div>
          </div>
        );
      case "Notifications":
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <Bell size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Notification Channels</h3>
                  <p className="text-xs text-slate-500 font-medium">Choose how Clarion reaches out to you.</p>
               </div>
            </div>

            <div className="space-y-4">
               {[
                 { title: "Email Intelligence Reports", desc: "Weekly digest of your cognitive trends.", icon: Mail, active: true },
                 { title: "Push Session Reminders", desc: "Optimized focus alerts based on your habits.", icon: Smartphone, active: true },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[1.8rem]">
                    <div className="flex items-center gap-5">
                       <div className={`p-3 rounded-xl ${item.active ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-600'}`}>
                          <item.icon size={20} />
                       </div>
                       <div>
                          <h4 className="text-[14px] font-black text-white leading-tight">{item.title}</h4>
                          <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                       </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full relative p-1 cursor-pointer transition-colors ${item.active ? 'bg-primary' : 'bg-white/10'}`}>
                       <div className={`w-5 h-5 bg-white rounded-full absolute shadow-sm transition-all ${item.active ? 'right-1' : 'left-1'}`}></div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20 px-4">
      {/* Header */}
      <div className="mb-12">
        <h2 className="text-4xl font-black text-white tracking-tight">Account Settings</h2>
        <p className="text-slate-500 font-medium mt-1">Manage your profile, security preferences, and display settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-8">
           <div className="glass-card p-10 flex flex-col items-center bg-[#140e0c]">
              <div className="relative mb-8 group">
                 <div className="w-32 h-32 rounded-[2.5rem] bg-[#261b17] border-2 border-primary/20 p-1 flex items-center justify-center overflow-hidden">
                    <div className="text-4xl font-black text-primary tracking-tighter">
                       {getInitials(user?.username)}
                    </div>
                 </div>
                 <button className="absolute bottom-1 right-1 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center border-4 border-[#1a1412] hover:scale-110 transition-all shadow-xl shadow-primary/20">
                    <Camera size={18} />
                 </button>
              </div>
              <div className="text-center mb-10">
                 <h3 className="text-2xl font-black text-white tracking-tight">{user?.username || (user?.email ? user.email.split('@')[0] : "Scholar")}</h3>
                 <p className="text-sm font-black text-primary uppercase tracking-widest mt-1">Cognitive Researcher</p>
              </div>

              <div className="w-full space-y-5 border-t border-white/5 pt-10">
                 <div className="flex items-center gap-4 text-slate-400 group">
                    <div className="p-2 bg-white/5 rounded-lg text-slate-500 group-hover:text-primary transition-colors">
                       <Mail size={16} />
                    </div>
                    <span className="text-[13px] font-medium truncate max-w-full">{user?.email || "No email linked"}</span>
                 </div>
                 <div className="flex items-center gap-4 text-slate-400 group">
                    <div className="p-2 bg-white/5 rounded-lg text-slate-500 group-hover:text-primary transition-colors">
                       <Calendar size={16} />
                    </div>
                    <span className="text-[13px] font-medium">Joined April 2026</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-10">
           <div className="flex bg-[#1a1412] p-1.5 rounded-2xl border border-white/5 shadow-inner">
              {tabs.map(tab => (
                 <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab ? "bg-white/10 text-primary border border-primary/20 shadow-xl shadow-primary/5" : "text-slate-500 hover:text-slate-300"
                  }`}
                 >
                    {tab}
                 </button>
              ))}
           </div>

           <div className="glass-card p-10 bg-[#140e0c]">
              {renderTabContent()}
           </div>
        </div>
      </div>
    </div>
  );
}
