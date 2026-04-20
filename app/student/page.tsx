import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, Rocket } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/student/bottom-nav";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/auth/signin");
  }

  if (!session.user.classId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-950 p-4"
        style={{ backgroundImage: "radial-gradient(rgba(0,212,255,0.08) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      >
        <div className="rounded-2xl bg-slate-900 border border-cyan-500/30 p-8 text-center max-w-sm w-full space-y-4">
          <Rocket className="h-12 w-12 text-cyan-400 mx-auto" />
          <div>
            <h2 className="text-xl font-black text-white">No Class Assigned</h2>
            <p className="text-slate-400 text-sm mt-2">Contact your admin to get assigned to a class.</p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <Button variant="outline" className="w-full border-slate-700 text-slate-300" type="submit">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const classData = await prisma.class.findUnique({
    where: { id: session.user.classId },
    include: {
      subjects: {
        include: { _count: { select: { chapters: true } } },
        orderBy: { name: "asc" },
      },
    },
  });

  const subjectColors = [
    { border: "border-cyan-500/40", glow: "shadow-[0_0_20px_rgba(0,212,255,0.1)]", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
    { border: "border-purple-500/40", glow: "shadow-[0_0_20px_rgba(157,0,255,0.1)]", badge: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
    { border: "border-yellow-500/40", glow: "shadow-[0_0_20px_rgba(255,215,0,0.1)]", badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
    { border: "border-pink-500/40", glow: "shadow-[0_0_20px_rgba(236,72,153,0.1)]", badge: "bg-pink-500/10 text-pink-400 border-pink-500/30" },
  ];

  return (
    <div
      className="min-h-screen bg-slate-950 pb-24"
      style={{ backgroundImage: "radial-gradient(rgba(0,212,255,0.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-cyan-400" />
            <span className="font-black text-white text-sm tracking-wide">RCCC</span>
          </div>
          <form action="/api/auth/signout" method="POST">
            <Button variant="ghost" size="sm" type="submit" className="text-slate-400 hover:text-white h-8 px-3 text-xs">
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
            </Button>
          </form>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-6 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Mission Control</p>
          <h1 className="text-2xl font-black text-white leading-tight">
            Hey, {session.user.name?.split(" ")[0] || "Explorer"}! 👋
          </h1>
          <p className="text-slate-400 text-sm">
            Class <span className="text-cyan-400 font-bold">{classData?.name}</span> · Your learning mission awaits 🚀
          </p>
        </div>

        {/* Subjects */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Your Subjects</h2>
          {!classData || classData.subjects.length === 0 ? (
            <div className="rounded-2xl bg-slate-900 border border-slate-700 p-8 text-center">
              <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No subjects yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classData.subjects.map((subject: any, idx: number) => {
                const color = subjectColors[idx % subjectColors.length];
                return (
                  <Link key={subject.id} href={`/student/subjects/${subject.id}`}>
                    <div className={`rounded-2xl bg-slate-900 border ${color.border} ${color.glow} p-4 flex items-center justify-between group active:scale-[0.98] transition-transform`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl border ${color.badge} flex items-center justify-center`}>
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-base">{subject.name}</p>
                          <p className="text-xs text-slate-500">{subject._count?.chapters || 0} chapters</p>
                        </div>
                      </div>
                      <span className="text-slate-500 group-hover:text-cyan-400 transition-colors text-lg">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-700 pb-2">© {new Date().getFullYear()} Raj Coaching Center</p>
      </main>

      <BottomNav />
    </div>
  );
}
