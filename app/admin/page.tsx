import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, FileText, Mail, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">Raj Coaching Center</h1>
              <p className="text-sm text-gray-600">Admin Dashboard</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              <div className="text-center sm:text-right">
                <p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
              </div>
              <form action="/api/auth/signout" method="POST" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" type="submit" className="w-full sm:w-auto">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <Link href="/admin/classes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border border-slate-200/70">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Manage Content</CardTitle>
                    <CardDescription>Classes → Subjects → Chapters → Resources</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Hierarchical management of all study materials and curriculum
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/students">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border border-slate-200/70">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Manage Students</CardTitle>
                    <CardDescription>View and manage student accounts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  See all registered students and their class assignments
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/fees">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border border-slate-200/70">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Fee Requests</CardTitle>
                    <CardDescription>Approve or reject installment submissions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Review pending fee confirmations and update installment status
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/emails">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border border-slate-200/70">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Mail className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Authorized Emails</CardTitle>
                    <CardDescription>Manage access control</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Add or remove authorized student and admin emails
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div>
          <Card className="border border-slate-200/80">
            <CardHeader className="space-y-2 text-center sm:text-left">
              <CardTitle className="text-xl">Content Management Workflow</CardTitle>
              <CardDescription>Follow these quick steps to keep the portal organized.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-5 text-sm">
                {[
                  {
                    title: "Create Classes",
                    body: "Set up grade levels (9th, 10th, 11th, 12th) with clear names.",
                  },
                  {
                    title: "Add Subjects",
                    body: "Attach subjects such as Math, Science, English to each class.",
                  },
                  {
                    title: "Create Chapters",
                    body: "Break subjects into chapters to keep notes and homework organized.",
                  },
                  {
                    title: "Upload Resources",
                    body: "Share notes, homework, and tests as Drive links per chapter.",
                  },
                  {
                    title: "Manage Students",
                    body: "Authorize student emails and assign them to the right class.",
                  },
                ].map((step, idx) => (
                  <li key={step.title} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{step.title}</p>
                      <p className="text-gray-600">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
