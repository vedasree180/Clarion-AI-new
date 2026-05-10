"use client";

import { useMemo } from "react";

export default function ActivityHeatmap({ heatmap = {}, title = "Activity" }) {
  const weeks = useMemo(() => {
    const today = new Date();
    const days = [];
    
    // Build 52 weeks x 7 days = 364 days back from today
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push({ key, count: heatmap[key] || 0, date: d });
    }

    // Group into weeks
    const result = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [heatmap]);

  const months = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const m = week[0]?.date?.getMonth();
      if (m !== lastMonth) {
        labels.push({ wi, label: week[0]?.date?.toLocaleString("default", { month: "short" }) });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  const totalActivity = Object.values(heatmap).reduce((a, b) => a + b, 0);

  const getColor = (count) => {
    if (count === 0) return "bg-white/[0.04] border-white/[0.02]";
    if (count === 1) return "bg-primary/20 border-primary/10";
    if (count === 2) return "bg-primary/40 border-primary/20";
    if (count === 3) return "bg-primary/70 border-primary/30";
    return "bg-primary border-primary/50 shadow-[0_0_10px_rgba(255,122,33,0.3)]";
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{title}</h3>
        <span className="text-[11px] font-bold text-slate-500">{totalActivity} analyses in the last year</span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="relative inline-block">
          {/* Month labels */}
          <div className="flex ml-8 mb-1 gap-[3px]">
            {weeks.map((_, wi) => {
              const monthLabel = months.find(m => m.wi === wi);
              return (
                <div key={wi} className="w-[11px] text-[9px] font-bold text-slate-600 flex-shrink-0">
                  {monthLabel?.label || ""}
                </div>
              );
            })}
          </div>

          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1">
              {dayLabels.map((d, i) => (
                <div key={d} className="h-[11px] text-[9px] font-bold text-slate-600 leading-none flex items-center">
                  {i % 2 === 1 ? d.slice(0, 1) : ""}
                </div>
              ))}
            </div>

            {/* Grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={day.key}
                    title={`${day.key}: ${day.count} analysis${day.count !== 1 ? "es" : ""}`}
                    className={`w-[11px] h-[11px] rounded-[2px] border ${getColor(day.count)} transition-all duration-300 hover:scale-[1.8] hover:z-20 cursor-default hover:shadow-xl`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-slate-600">Less</span>
        {[0, 1, 2, 3, 4].map(v => (
          <div key={v} className={`w-3 h-3 rounded-sm ${getColor(v)}`} />
        ))}
        <span className="text-[10px] text-slate-600">More</span>
      </div>
    </div>
  );
}
