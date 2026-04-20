"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, BookOpen, CreditCard } from "lucide-react";

const tabs = [
  { href: "/student", icon: Rocket, label: "Home" },
  { href: "/student/subjects", icon: BookOpen, label: "Study" },
  { href: "/student/fees", icon: CreditCard, label: "Fees" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/student" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                active
                  ? "text-cyan-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_rgba(0,212,255,0.8)]" : ""}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
