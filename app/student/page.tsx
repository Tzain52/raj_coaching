import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, LogOut, FileText, GraduationCap, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/auth/signin");
  }

  if (!session.user.classId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md shadow-xl">
          <CardHeader>
            <CardTitle>No Class Assigned</CardTitle>
            <CardDescription>
              Please contact the administrator to assign you to a class.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/auth/signout" method="POST">
              <Button variant="outline" className="w-full" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [classData] = await Promise.all([
    prisma.class.findUnique({
      where: { id: session.user.classId },
      include: {
        subjects: {
          include: {
            _count: {
              select: { chapters: true },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Raj Coaching Center</h1>
                <p className="text-sm text-gray-500">Student Portal</p>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600">
              <a href="#subjects-section" className="hover:text-blue-600 transition-colors">
                Notes
              </a>
              <Link href="/student/fees" className="hover:text-blue-600 transition-colors">
                Fees
              </Link>
              <form action="/api/auth/signout" method="POST">
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-10 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-10 shadow-xl">
          <p className="text-sm uppercase tracking-widest text-blue-100 mb-2">RCCC Portal</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome, {session.user.name?.split(" ")[0] || "Student"}!
          </h2>
          <p className="text-lg text-blue-100">
            You're currently enrolled in <span className="font-semibold">Class {classData?.name}</span>. Access all your learning resources and stay on top of your progress from this dashboard.
          </p>
        </section>

        <section id="subjects-section" className="mb-6 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-900">Your Subjects</h3>
        </section>

        {!classData || classData.subjects.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No subjects available yet</p>
              <p className="text-gray-400 text-sm">Your teacher will add subjects soon</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classData.subjects.map((subject: any) => (
              <Link key={subject.id} href={`/student/subjects/${subject.id}`}>
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-2 border-transparent hover:border-blue-200 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                            {subject.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {subject._count?.chapters || 0} chapters
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="w-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      View Chapters & Resources →
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

      </main>

      <footer className="mt-auto bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Raj Coaching Center</h3>
              </div>
              <p className="text-sm text-gray-400">
                Empowering students with quality education and comprehensive study materials for classes 9th to 12th.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span>raj.edu5253@gmail.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span>RCCC, Biaora</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/student" className="block text-sm hover:text-blue-400 transition-colors">
                  Home
                </Link>
                <Link href="/student/homework" className="block text-sm hover:text-blue-400 transition-colors">
                  Homework & Tests
                </Link>
                <div className="text-sm text-gray-500">
                  Office Hours: Mon-Sat, 9:00 AM - 6:00 PM
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Raj Coaching Center. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
