"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface Subject {
  id: string;
  name: string;
  _count?: {
    chapters: number;
  };
}

interface ClassData {
  id: string;
  name: string;
  subjects: Subject[];
}

export default function SubjectsPage() {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchClassData();
  }, []);

  const fetchClassData = async () => {
    try {
      const res = await fetch("/api/student/classes");
      if (res.ok) {
        const data = await res.json();
        setClassData(data);
      } else {
        toast({ title: "Error", description: "Failed to fetch subjects", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch subjects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!classData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Class Assigned</CardTitle>
            <CardDescription>Please contact the administrator to assign you to a class.</CardDescription>
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
