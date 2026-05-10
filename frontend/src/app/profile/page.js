"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  User, Mail, Edit3, Save, X, Trophy, Zap, Flame, 
  Target, BookOpen, Brain, Star, Camera, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const DOMAINS = ["CS", "Biology", "Mathematics", "Economics", "Physics", "Chemistry", "History", "General"];
const STYLES = ["conceptual", "visual", "practice-based", "reading"];

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef();

  useEffect(() => {
    if (!user?.token) return;
    fetch(`${API_URL}/api/profile`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(d => { setProfile(d); setForm(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ bio: form.bio, skill_level: form.skill_level, preferred_domain: form.preferred_domain, learning_style: form.learning_style, name: form.name }),
      });
      if (res.ok) {
        setProfile({ ...profile, ...form });
        setEditing(false);
        toast.success("Profile updated!");
      } else {
        toast.error("Update failed");
      }
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const p = profile || {};
  const xpPct = p.pct || 0;

  return (
    <div className="p-6 lg:p-12 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Profile</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Your learning identity</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 transition-all">
            <Edit3 size={16} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-400 hover:bg-white/10 transition-all">
              <X size={16} /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              <Save size={16} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar + Identity */}
        <div className="glass-card p-8 bg-[#140e0c] flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/30 to-orange-900/30 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
              {(form.avatar || p.avatar) ? (
                <img src={form.avatar || p.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-primary">{(p.username || "U")[0].toUpperCase()}</span>
              )}
            </div>
            {editing && (
              <button onClick={() => fileRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {editing ? (
            <input
              value={form.name || ""}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-center font-bold w-full focus:outline-none focus:border-primary/40"
              placeholder="Your name"
            />
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-black text-white">{p.name || p.username || "Student"}</h2>
              <p className="text-slate-500 text-sm">@{p.username || "student"}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Mail size={14} className="text-primary" />
            <span className="truncate">{p.email}</span>
          </div>

          {/* Level Badge */}
          <div className="w-full bg-black/30 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Level {p.level || 1}</span>
              <span className="text-[11px] font-black text-primary">{(p.xp || 0).toLocaleString()} XP</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(255,122,33,0.4)]"
                style={{ width: `${Math.min(100, xpPct)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-slate-600">{p.progress || 0} XP</span>
              <span className="text-[10px] text-slate-600">{p.needed || 100} XP to next</span>
            </div>
          </div>

          {/* Streak & Freezes */}
          <div className="w-full space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 bg-black/20 rounded-xl p-4 text-center border border-white/5">
                <div className="text-2xl font-black text-primary flex items-center justify-center gap-1">
                  <Flame size={20} /> {p.current_streak || 0}
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Streak</div>
              </div>
              <div className="flex-1 bg-black/20 rounded-xl p-4 text-center border border-white/5">
                <div className="text-2xl font-black text-white">{p.longest_streak || 0}</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Best</div>
              </div>
            </div>
            
            <div className="bg-black/20 rounded-xl p-4 flex items-center justify-between border border-white/5 group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Zap size={20} />
                </div>
                <div>
                  <div className="text-sm font-black text-white">{p.freezes_available || 0} Freezes</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protects your streak</div>
                </div>
              </div>
              <button 
                onClick={async () => {
                  if (p.xp < 50) { toast.error("Need 50 XP to buy a freeze"); return; }
                  try {
                    const res = await fetch(`${API_URL}/api/profile/buy-freeze`, { 
                      method: "POST", 
                      headers: { Authorization: `Bearer ${user.token}` } 
                    });
                    const d = await res.json();
                    if (res.ok) {
                      toast.success("Freeze purchased!");
                      // Refresh profile
                      const r = await fetch(`${API_URL}/api/profile`, { headers: { Authorization: `Bearer ${user.token}` } });
                      setProfile(await r.json());
                    } else toast.error(d.message || "Failed");
                  } catch { toast.error("Error"); }
                }}
                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-[10px] font-black text-primary uppercase tracking-widest transition-all"
              >
                Buy (50 XP)
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <div className="glass-card p-8 bg-[#140e0c]">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Learning Goal</h3>
            {editing ? (
              <textarea
                value={form.bio || ""}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm font-medium focus:outline-none focus:border-primary/40 resize-none"
                placeholder="What are you learning and why?"
              />
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed">{p.bio || "No learning goal set yet. Click Edit to add one!"}</p>
            )}
          </div>

          {/* Preferences */}
          <div className="glass-card p-8 bg-[#140e0c]">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Learning Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <PrefField
                label="Skill Level"
                icon={<Target size={14} />}
                value={form.skill_level || p.skill_level || "Beginner"}
                editing={editing}
                options={SKILL_LEVELS}
                onChange={v => setForm(f => ({ ...f, skill_level: v }))}
              />
              <PrefField
                label="Domain Focus"
                icon={<BookOpen size={14} />}
                value={form.preferred_domain || p.preferred_domain || "CS"}
                editing={editing}
                options={DOMAINS}
                onChange={v => setForm(f => ({ ...f, preferred_domain: v }))}
              />
              <PrefField
                label="Learning Style"
                icon={<Brain size={14} />}
                value={form.learning_style || p.learning_style || "conceptual"}
                editing={editing}
                options={STYLES}
                onChange={v => setForm(f => ({ ...f, learning_style: v }))}
              />
            </div>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Analyses", value: p.total_attempts || 0, icon: Zap },
              { label: "Best Topic", value: p.best_topic || "N/A", icon: Trophy, small: true },
              { label: "Badges", value: (p.badges || []).length, icon: Star },
              { label: "Level", value: p.level || 1, icon: Target },
            ].map(({ label, value, icon: Icon, small }) => (
              <div key={label} className="glass-card p-5 bg-[#140e0c] text-center">
                <Icon size={18} className="text-primary mx-auto mb-2" />
                <div className={`font-black text-white mb-1 ${small ? "text-sm truncate" : "text-2xl"}`}>{value}</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>

          {/* Recent Badges */}
          {(p.badges || []).length > 0 && (
            <div className="glass-card p-8 bg-[#140e0c]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Earned Badges</h3>
                <a href="/achievements" className="text-primary text-[11px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                  All <ChevronRight size={12} />
                </a>
              </div>
              <div className="flex flex-wrap gap-3">
                {(p.badges || []).slice(0, 6).map(b => (
                  <div key={b.id} className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-4 py-2 hover:border-primary/30 transition-all group" title={b.desc}>
                    <span className="text-xl">{b.emoji}</span>
                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PrefField({ label, icon, value, editing, options, onChange }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
        <span className="text-primary">{icon}</span> {label}
      </label>
      {editing ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-primary/40"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <div className="bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-white text-sm font-medium capitalize">
          {value}
        </div>
      )}
    </div>
  );
}
