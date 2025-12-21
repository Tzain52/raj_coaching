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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Raj Coaching Center</h1>
              <p className="text-sm text-gray-600">Admin Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
              </div>
              <form action="/api/auth/signout" method="POST">
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link href="/admin/classes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
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

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Content Management Workflow</CardTitle>
              <CardDescription>Hierarchical structure for organizing your coaching center</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Create Classes</p>
                    <p className="text-sm text-muted-foreground">
                      Start by creating classes (9th, 10th, 11th, 12th)
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Add Subjects to Classes</p>
                    <p className="text-sm text-muted-foreground">
                      Click on a class to add subjects (Math, Science, English, etc.)
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Create Chapters in Subjects</p>
                    <p className="text-sm text-muted-foreground">
                      Click on a subject to add chapters and organize topics
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Upload Resources to Chapters</p>
                    <p className="text-sm text-muted-foreground">
                      Add notes, homework, and test papers with Google Drive links
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                    5
                  </div>
                  <div>
                    <p className="font-medium">Manage Students</p>
                    <p className="text-sm text-muted-foreground">
                      Authorize student emails and assign them to classes
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
