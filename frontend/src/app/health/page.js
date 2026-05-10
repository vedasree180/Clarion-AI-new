"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield, Activity, Zap, AlertTriangle, CheckCircle2,
  BarChart3, Brain, RefreshCw, TrendingUp, TrendingDown,
  Database, Cpu, Clock, Star
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function MetricCard({ icon: Icon, label, value, sub, color = "primary", status }) {
  const colorMap = {
    green: "text-green-400 bg-green-400/10 border-green-400/20",
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    red: "text-red-400 bg-red-400/10 border-red-400/20",
    primary: "text-primary bg-primary/10 border-primary/20",
    gray: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  };
  return (
    <div className="glass-card p-6 bg-[#140e0c] flex flex-col gap-3">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border w-fit text-[10px] font-black uppercase tracking-widest ${colorMap[color] || colorMap.primary}`}>
        <Icon size={14} /> {label}
      </div>
      <p className="text-4xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function RetentionRow({ topic, retention_score, label, color, message, days_since_peak }) {
  const barColor = color === "green" ? "bg-green-400" : color === "blue" ? "bg-blue-400" : color === "yellow" ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex flex-col gap-2 p-4 bg-white/[0.02] rounded-xl border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-white">{topic}</span>
        <span className={`text-[11px] font-black px-3 py-1 rounded-lg ${barColor}/20 border ${barColor}/30 text-${color === "green" ? "green" : color === "blue" ? "blue" : color === "yellow" ? "yellow" : "red"}-400`}>
          {label}
        </span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2">
        <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${retention_score}%` }} />
      </div>
      <p className="text-xs text-slate-500">{message}</p>
    </div>
  );
}

export default function HealthPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [retention, setRetention] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      const [healthRes, retentionRes] = await Promise.all([
        fetch(`${API_URL}/api/system/health`, { headers }),
        user?.token
          ? fetch(`${API_URL}/api/retention`, { headers })
          : Promise.resolve(null)
      ]);

      const healthData = await healthRes.json();
      setHealth(healthData);

      if (retentionRes?.ok) {
        const retData = await retentionRes.json();
        setRetention(Array.isArray(retData) ? retData : []);
      }
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Health fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const healthColor = health?.health_color || "gray";
  const colorMap = { green: "text-green-400", blue: "text-blue-400", yellow: "text-yellow-400", red: "text-red-400", gray: "text-slate-400" };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-2">System Monitor</p>
          <h2 className="text-4xl font-black text-white tracking-tight">System Health Dashboard</h2>
          <p className="text-slate-400 mt-2 text-sm">Real-time reliability, drift detection, and retention analytics.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {lastRefresh && (
        <p className="text-[11px] text-slate-600 font-medium flex items-center gap-2">
          <Clock size={12} /> Last updated: {lastRefresh}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Overall Health Badge */}
          <div className="glass-card p-8 bg-[#140e0c] flex flex-col sm:flex-row items-center gap-6">
            <div className="text-6xl">{health?.health_icon || "❓"}</div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Overall System Health</p>
              <h3 className={`text-3xl font-black ${colorMap[healthColor]}`}>
                {health?.health_label || "Unknown"}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Based on {health?.total_analyses || 0} analyses · DB: <span className="text-white font-bold">{health?.db_status || "unknown"}</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-black text-white">{health?.health_score ? Math.round(health.health_score * 100) : 0}%</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Health Score</p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={BarChart3}
              label="Accuracy"
              value={`${health?.accuracy || 0}%`}
              sub="Average score across all analyses"
              color={health?.accuracy >= 75 ? "green" : health?.accuracy >= 50 ? "yellow" : "red"}
            />
            <MetricCard
              icon={Brain}
              label="Confidence Avg"
              value={health?.confidence_avg ? `${Math.round(health.confidence_avg * 100)}%` : "N/A"}
              sub="Mean calibrated confidence score"
              color={health?.confidence_avg >= 0.7 ? "green" : "yellow"}
            />
            <MetricCard
              icon={Cpu}
              label="Agent Consistency"
              value={health?.agent_consistency ? `${Math.round(health.agent_consistency * 100)}%` : "N/A"}
              sub="Score variance stability"
              color={health?.agent_consistency >= 0.8 ? "green" : health?.agent_consistency >= 0.5 ? "yellow" : "red"}
            />
            <MetricCard
              icon={Activity}
              label="Drift Status"
              value={health?.drift_status === "stable" ? "Stable" : health?.drift_status === "drift_detected" ? "Drift!" : "Slight Dip"}
              sub={health?.drift_details?.message || ""}
              color={health?.drift_status === "stable" ? "green" : health?.drift_status === "drift_detected" ? "red" : "yellow"}
            />
          </div>

          {/* Drift Details */}
          {health?.drift_details && (
            <div className={`glass-card p-6 bg-[#140e0c] border ${health.drift_details.drift_detected ? "border-red-500/20" : "border-green-500/20"}`}>
              <div className="flex items-center gap-3 mb-3">
                {health.drift_details.drift_detected
                  ? <AlertTriangle size={20} className="text-red-400" />
                  : <CheckCircle2 size={20} className="text-green-400" />
                }
                <h4 className="text-sm font-black text-white">Drift Detection Report</h4>
              </div>
              <p className="text-slate-300 text-sm">{health.drift_details.message}</p>
              {health.drift_details.earlier_avg && (
                <div className="mt-3 flex gap-6 text-xs text-slate-500">
                  <span>Earlier avg: <strong className="text-white">{health.drift_details.earlier_avg}%</strong></span>
                  <span>Recent avg: <strong className="text-white">{health.drift_details.recent_avg}%</strong></span>
                  <span>Delta: <strong className={health.drift_details.delta > 10 ? "text-red-400" : "text-yellow-400"}>-{health.drift_details.delta}%</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Cache Performance */}
          {health?.cache && (
            <div className="glass-card p-6 bg-[#140e0c]">
              <div className="flex items-center gap-3 mb-4">
                <Zap size={20} className="text-primary" />
                <h4 className="text-sm font-black text-white">Cache Performance</h4>
                <span className="ml-auto text-[10px] text-slate-500 font-black uppercase tracking-widest">⚡ Performance Layer</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(health.cache).map(([name, stats]) => (
                  <div key={name} className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{name.replace("_", " ")}</p>
                    <p className="text-xl font-black text-white">{stats.hit_rate_pct}%</p>
                    <p className="text-xs text-slate-500">hit rate · {stats.hits}H / {stats.misses}M</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retention Tracking */}
          <div className="glass-card p-8 bg-[#140e0c]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><TrendingUp size={20} /></div>
              <h4 className="text-xl font-black text-white">Long-Term Retention Tracking</h4>
              <span className="ml-auto text-[10px] font-black text-slate-500 uppercase tracking-widest">🧠 Memory Retention</span>
            </div>
            {retention.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm">No retention data yet. Return to topics after 24h+ to track long-term memory retention.</p>
                <Link href="/analyze" className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest">
                  Start Analyzing
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {retention.map((r, i) => (
                  <RetentionRow key={i} {...r} />
                ))}
              </div>
            )}
          </div>

          {/* Feedback Stats */}
          {health?.feedback && (
            <div className="glass-card p-6 bg-[#140e0c]">
              <div className="flex items-center gap-3 mb-4">
                <Star size={20} className="text-primary" />
                <h4 className="text-sm font-black text-white">User Feedback & RL Signals</h4>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-3xl font-black text-green-400">{health.feedback.positive || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">👍 Positive</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-red-400">{health.feedback.negative || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">👎 Negative</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-white">{health.feedback.total || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Total Signals</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-primary">
                    {health.feedback.total > 0 ? Math.round((health.feedback.positive / health.feedback.total) * 100) : 0}%
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Accuracy Rate</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
