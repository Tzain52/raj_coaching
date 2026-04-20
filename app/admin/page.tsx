import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, FileText, Mail, LogOut } from "lucide-react";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/auth/signin");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Raj Coaching Center</h1>
              <p className="text-xs text-gray-500">Admin — {session.user.name}</p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: "/admin/content", icon: BookOpen, color: "blue", title: "Content", desc: "Classes, subjects & resources" },
            { href: "/admin/students", icon: Users, color: "purple", title: "Students", desc: "Manage enrollments" },
            { href: "/admin/fees", icon: FileText, color: "green", title: "Fee Requests", desc: "Approve payments" },
            { href: "/admin/emails", icon: Mail, color: "orange", title: "Emails", desc: "Access control" },
          ].map(({ href, icon: Icon, color, title, desc }) => (
            <Link key={href} href={href}>
              <div className="rounded-2xl bg-white border border-gray-200 p-5 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col gap-3 active:scale-[0.98]">
                <div className={`p-3 rounded-xl w-fit bg-${color}-100`}>
                  <Icon className={`h-5 w-5 text-${color}-600`} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
