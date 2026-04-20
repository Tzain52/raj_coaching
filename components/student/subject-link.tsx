"use client";

import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { trackSubjectClick } from "@/lib/ga";

interface SubjectLinkProps {
  subjectId: string;
  subjectName: string;
  className: string;
  chapterCount: number;
  gradient: string;
}

export default function SubjectLink({ subjectId, subjectName, className, chapterCount, gradient }: SubjectLinkProps) {
  return (
    <Link href={`/student/subjects/${subjectId}`} onClick={() => trackSubjectClick(subjectName, className)}>
      <div className="group relative rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 transition-all duration-200 overflow-hidden cursor-pointer">
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradient} opacity-80`} />
        <div className="pl-5 pr-4 py-4 flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg shrink-0`}>
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{subjectName}</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {chapterCount} chapter{chapterCount !== 1 ? "s" : ""}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
        </div>
      </div>
    </Link>
  );
}
