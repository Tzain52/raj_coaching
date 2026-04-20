"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, ExternalLink, Rocket, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { LoadingScreen } from "@/components/ui/loading-screen";
import BottomNav from "@/components/student/bottom-nav";
import { trackChapterOpen, trackResourceOpen } from "@/lib/ga";

interface Resource {
  id: string;
  title: string;
  type: string;
  description: string | null;
  link: string;
}

interface Chapter {
  id: string;
  name: string;
  resources: Resource[];
}

interface Subject {
  id: string;
  name: string;
  chapters: Chapter[];
  resources: Resource[];
  class: { name: string };
}

const typeBadge: Record<string, string> = {
  NOTES: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
  HOMEWORK: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  TEST_PAPER: "bg-red-500/10 text-red-400 border border-red-500/30",
  REFERENCE_MATERIAL: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
  OTHER: "bg-slate-500/10 text-slate-400 border border-slate-500/30",
};

export default function SubjectPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    apiFetch(`/student/subjects/${subjectId}`)
      .then((r) => r.json())
      .then((data) => {
        setSubject(data);
        // open first chapter by default
        if (data?.chapters?.[0]) setOpenChapters(new Set([data.chapters[0].id]));
      })
      .catch(() => toast({ title: "Error", description: "Failed to load subject", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [subjectId]);

  const toggle = (chapter: Chapter) => {
    const isOpening = !openChapters.has(chapter.id);
    setOpenChapters((prev) => {
      const next = new Set(prev);
      next.has(chapter.id) ? next.delete(chapter.id) : next.add(chapter.id);
      return next;
    });
    if (isOpening && subject) {
      trackChapterOpen(chapter.name, subject.name, subject.class.name);
    }
  };

  if (loading) return <LoadingScreen label="Loading resources" description="Pulling your study materials..." />;

  if (!subject) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-slate-400">Subject not found.</p>
          <Link href="/student" className="text-cyan-400 underline text-sm">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-950 pb-24"
      style={{ backgroundImage: "radial-gradient(rgba(0,212,255,0.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
    >
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/student">
            <button className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div className="min-w-0">
            <h1 className="font-black text-white text-base truncate">{subject.name}</h1>
            <p className="text-xs text-slate-500">Class {subject.class.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Subject-level resources */}
        {subject.resources && subject.resources.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">📋 Subject Resources</p>
            <div className="space-y-2">
              {subject.resources.map((r) => (
                <ResourceRow key={r.id} resource={r} />
              ))}
            </div>
          </div>
        )}

        {/* Chapters */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">📖 Chapters</p>
          {subject.chapters.length === 0 ? (
            <div className="rounded-2xl bg-slate-900 border border-slate-700 p-8 text-center">
              <p className="text-slate-500 text-sm">No chapters yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subject.chapters.map((chapter, idx) => (
                <div key={chapter.id} className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden">
                  <button
                    onClick={() => toggle(chapter)}
                    className="w-full flex items-center justify-between p-4 text-left active:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-black">{idx + 1}</span>
                      <div>
                        <p className="font-bold text-white text-sm">{chapter.name}</p>
                        <p className="text-xs text-slate-500">{chapter.resources.length} files</p>
                      </div>
                    </div>
                    {openChapters.has(chapter.id) ? (
                      <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {openChapters.has(chapter.id) && (
                    <div className="border-t border-slate-700 px-4 pb-4 pt-3 space-y-2">
                      {chapter.resources.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-3">No files uploaded yet</p>
                      ) : (
                        chapter.resources.map((r) => (
                        <ResourceRow key={r.id} resource={r} chapterName={chapter.name} subjectName={subject.name} />
                      ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function ResourceRow({ resource, chapterName = "", subjectName = "" }: { resource: Resource; chapterName?: string; subjectName?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-center gap-2 min-w-0">
        <FileText className="h-4 w-4 text-slate-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{resource.title}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${typeBadge[resource.type] ?? typeBadge.OTHER}`}>
            {resource.type.replace("_", " ")}
          </span>
        </div>
      </div>
      <a
        href={resource.link}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
        onClick={() => trackResourceOpen(resource.title, resource.type, chapterName, subjectName)}
      >
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 active:scale-95 transition-all">
          <Rocket className="h-3 w-3" />
          Open
        </button>
      </a>
    </div>
  );
}
