"use client";

import { useState, useEffect } from "react";
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
  chapter: {
    name: string;
    subject: {
      name: string;
    };
  };
  createdAt: string;
}

export default function HomeworkPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const { toast } = useToast();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/student/resources");
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      } else {
        toast({ title: "Error", description: "Failed to fetch resources", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch resources", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter((resource) => {
    if (filter === "ALL") return true;
    return resource.type === filter;
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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
              <h1 className="text-2xl font-bold text-gray-900">Homework & Tests</h1>
              <p className="text-sm text-gray-600">All assignments and test papers</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={filter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("ALL")}
          >
            All
          </Button>
          <Button
            variant={filter === "HOMEWORK" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("HOMEWORK")}
          >
            Homework
          </Button>
          <Button
            variant={filter === "TEST_PAPER" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("TEST_PAPER")}
          >
            Test Papers
          </Button>
          <Button
            variant={filter === "NOTES" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("NOTES")}
          >
            Notes
          </Button>
          <Button
            variant={filter === "REFERENCE_MATERIAL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("REFERENCE_MATERIAL")}
          >
            Reference
          </Button>
        </div>

        {filteredResources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No resources found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResources.map((resource) => (
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
        )}
      </main>
    </div>
  );
}
