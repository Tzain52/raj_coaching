import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/student/bottom-nav";
import SubjectLink from "@/components/student/subject-link";

const SUBJECT_COLORS = [
  "from-cyan-500 to-blue-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-yellow-500 to-amber-600",
  "from-indigo-500 to-violet-600",
];

export default async function SubjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/auth/signin");
  }

  if (!session.user.classId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
        <div className="text-center px-6 py-8 rounded-2xl border border-white/10 bg-white/5 max-w-sm w-full">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-white font-bold text-xl mb-2">No Class Assigned</h2>
          <p className="text-slate-400 text-sm mb-6">Your mission briefing is not ready yet. Contact your commander (admin).</p>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="w-full py-2.5 rounded-xl border border-white/20 text-white text-sm hover:bg-white/10 transition-colors">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  const classData = await prisma.class.findUnique({
    where: { id: session.user.classId },
    include: {
      subjects: {
        orderBy: { name: "asc" },
        include: { _count: { select: { chapters: true } } },
      },
    },
  });

  if (!classData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <p className="text-slate-400">Class not found. Contact your admin.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Dot-grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      {/* Header */}
      <header className="relative z-10 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/student"
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-cyan-500/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Study Hub</h1>
            <p className="text-slate-400 text-xs">Class {classData.name}</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {classData.subjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📡</div>
            <p className="text-slate-400 text-sm">No subjects available yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-4 font-medium">
              {classData.subjects.length} subject{classData.subjects.length !== 1 ? "s" : ""} · Mission briefings
            </p>
            <div className="grid grid-cols-1 gap-3">
              {classData.subjects.map((subject, i) => {
                const gradient = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                const chapterCount = subject._count?.chapters ?? 0;
                return (
                  <SubjectLink
                    key={subject.id}
                    subjectId={subject.id}
                    subjectName={subject.name}
                    className={classData.name}
                    chapterCount={chapterCount}
                    gradient={gradient}
                  />
                );
              })}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
