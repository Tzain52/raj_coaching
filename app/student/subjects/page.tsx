import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function SubjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
            <CardDescription>Sign in as a student to view your subjects.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/signin">
              <Button className="w-full">Go to Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session.user.classId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Class Assigned</CardTitle>
            <CardDescription>Please contact the administrator to assign you to a class.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/auth/signout" method="POST">
              <Button variant="outline" className="w-full" type="submit">
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const classData = await prisma.class.findUnique({
    where: { id: session.user.classId },
    include: {
      subjects: {
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { chapters: true },
          },
        },
      },
    },
  });

  if (!classData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Class Found</CardTitle>
            <CardDescription>Please contact the administrator for assistance.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/student">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>
              <p className="text-sm text-gray-600">Class {classData.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {classData.subjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No subjects available yet. Your teacher will add them soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classData.subjects.map((subject) => (
              <Link key={subject.id} href={`/student/subjects/${subject.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle>{subject.name}</CardTitle>
                        <CardDescription>
                          {subject._count?.chapters || 0} chapters
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="w-full">
                      View Chapters →
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
