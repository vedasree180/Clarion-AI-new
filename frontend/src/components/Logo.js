"use client";

import Link from "next/link";

export default function Logo({ size = "md", variant = "dark" }) {
  const sizes = {
    sm: { container: "gap-2", icon: "w-8 h-8", text: "text-xl", sub: "text-[8px]" },
    md: { container: "gap-3", icon: "w-10 h-10", text: "text-3xl", sub: "text-[10px]" },
    lg: { container: "gap-4", icon: "w-16 h-16", text: "text-5xl", sub: "text-[14px]" },
  };

  const s = sizes[size] || sizes.md;

  return (
    <Link href="/" className={`flex items-center ${s.container} group transition-all active:scale-95`}>
      <div className={`${s.icon} flex items-center justify-center transition-all group-hover:scale-110`}>
        <img src="/logo.png" alt="Clarion Logo" className="w-full h-full object-contain" />
      </div>
      <div className="flex flex-col">
        <h1 className={`font-black tracking-tighter leading-none text-white ${s.text}`}>
          CLARION
        </h1>
        <p className={`font-black uppercase tracking-[0.4em] text-primary ${s.sub}`}>
          AI Analytics Engine
        </p>
      </div>
    </Link>
  );
}
