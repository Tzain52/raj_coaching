import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Resource {
  id: string;
  title: string;
  type: string;
  description: string | null;
  link: string;
  chapter: {
    name: string;
    subject: {
      name: string;
    };
  };
  createdAt: Date;
}

async function getHomeworkResources(studentId: string, classId: string) {
  const resources = await prisma.resource.findMany({
    where: {
      chapter: {
        subject: {
          classId,
        },
      },
      chapterId: {
        not: null,
      },
    },
    include: {
      chapter: {
        select: {
          name: true,
          subject: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    type: resource.type,
    description: resource.description,
    link: resource.link,
    chapter: resource.chapter!,
    createdAt: resource.createdAt,
  }));
}

export default async function HomeworkPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
            <CardDescription>Please sign in as a student to view homework and tests.</CardDescription>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Class Assigned</CardTitle>
            <CardDescription>Please contact the administrator to assign you to a class.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/auth/signout" method="POST">
              <Button variant="outline" type="submit" className="w-full">
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resources = await getHomeworkResources(session.user.id, session.user.classId);

  const filterBuckets: Record<string, Resource[]> = resources.reduce(
    (acc, resource) => {
      acc.ALL.push(resource);
      acc[resource.type] = acc[resource.type] || [];
      acc[resource.type].push(resource);
      return acc;
    },
    { ALL: [], HOMEWORK: [], TEST_PAPER: [], NOTES: [], REFERENCE_MATERIAL: [] } as Record<string, Resource[]>
  );

  const filterTabs = [
    { key: "ALL", label: "All" },
    { key: "HOMEWORK", label: "Homework" },
    { key: "TEST_PAPER", label: "Test Papers" },
    { key: "NOTES", label: "Notes" },
    { key: "REFERENCE_MATERIAL", label: "Reference" },
  ];

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
              <h1 className="text-2xl font-bold text-gray-900">Homework & Tests</h1>
              <p className="text-sm text-gray-600">All assignments and test papers</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterTabs.map((tab) => (
            <Link
              key={tab.key}
              href={`#${tab.key}`}
              className="flex-shrink-0"
            >
              <Button variant="outline" size="sm">
                {tab.label} ({filterBuckets[tab.key]?.length ?? 0})
              </Button>
            </Link>
          ))}
        </div>

        {filterTabs.map((tab) => (
          <section key={tab.key} id={tab.key} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{tab.label}</h2>
              <span className="text-sm text-gray-500">{filterBuckets[tab.key]?.length ?? 0} items</span>
            </div>
            {filterBuckets[tab.key]?.length ? (
              <div className="space-y-4">
                {filterBuckets[tab.key].map((resource) => (
                  <Card key={resource.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {resource.type}
                            </span>
                          </div>
                          <CardDescription>
                            {resource.chapter.subject.name} → {resource.chapter.name}
                          </CardDescription>
                          {resource.description && (
                            <p className="text-sm text-gray-600 mt-2">{resource.description}</p>
                          )}
                        </div>
                        <a href={resource.link} target="_blank" rel="noopener noreferrer">
                          <Button>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open
                          </Button>
                        </a>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-gray-500">No resources found.</CardContent>
              </Card>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
