"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

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
  class: {
    name: string;
  };
}

export default function SubjectPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubject();
  }, [subjectId]);

  const fetchSubject = async () => {
    try {
      const res = await fetch(`/api/student/subjects/${subjectId}`);
      if (res.ok) {
        const data = await res.json();
        setSubject(data);
      } else {
        toast({ title: "Error", description: "Failed to fetch subject", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch subject", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!subject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Subject Not Found</CardTitle>
            <CardDescription>The requested subject could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/student/subjects">
              <Button className="w-full">Back to Subjects</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/student/subjects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Subjects
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
              <p className="text-sm text-gray-600">Class {subject.class.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {subject.resources && subject.resources.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📚 Subject Resources (Multi-Chapter)</h2>
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Test Papers, Solutions & Reference Materials</CardTitle>
                <CardDescription>Resources covering multiple chapters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subject.resources.map((resource) => (
                    <div key={resource.id} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-purple-200">
                      <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{resource.title}</h4>
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 mt-1">
                              {resource.type}
                            </span>
                            {resource.description && (
                              <p className="text-sm text-gray-600 mt-2">{resource.description}</p>
                            )}
                          </div>
                          <a href={resource.link} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 mb-4">📖 Chapters & Resources</h2>
        {subject.chapters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No chapters available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {subject.chapters.map((chapter) => (
              <Card key={chapter.id}>
                <CardHeader>
                  <CardTitle>{chapter.name}</CardTitle>
                  <CardDescription>{chapter.resources.length} resources available</CardDescription>
                </CardHeader>
                <CardContent>
                  {chapter.resources.length === 0 ? (
                    <p className="text-sm text-gray-500">No resources uploaded yet</p>
                  ) : (
                    <div className="space-y-3">
                      {chapter.resources.map((resource) => (
                        <div key={resource.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{resource.title}</h4>
                                <span className="text-xs text-gray-500 uppercase">{resource.type}</span>
                                {resource.description && (
                                  <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                                )}
                              </div>
                              <a href={resource.link} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open
                                </Button>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
