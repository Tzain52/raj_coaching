"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, ExternalLink, Trash2 } from "lucide-react";
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
      class: {
        name: string;
      };
    };
  };
}

interface Class {
  id: string;
  name: string;
  subjects: Subject[];
}

interface Subject {
  id: string;
  name: string;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  name: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "NOTES",
    description: "",
    link: "",
    chapterId: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resourcesRes, classesRes] = await Promise.all([
        fetch("/api/admin/resources"),
        fetch("/api/admin/classes"),
      ]);

      if (resourcesRes.ok) setResources(await resourcesRes.json());
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        const classesWithDetails = await Promise.all(
          classesData.map(async (cls: any) => {
            const subjectsRes = await fetch(`/api/admin/subjects?classId=${cls.id}`);
            const subjects = subjectsRes.ok ? await subjectsRes.json() : [];
            
            const subjectsWithChapters = await Promise.all(
              subjects.map(async (subject: any) => {
                const chaptersRes = await fetch(`/api/admin/chapters?subjectId=${subject.id}`);
                const chapters = chaptersRes.ok ? await chaptersRes.json() : [];
                return { ...subject, chapters };
              })
            );
            
            return { ...cls, subjects: subjectsWithChapters };
          })
        );
        setClasses(classesWithDetails);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Resource added successfully" });
        setIsDialogOpen(false);
        setFormData({ title: "", type: "NOTES", description: "", link: "", chapterId: "" });
        fetchData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to add resource", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add resource", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const res = await fetch(`/api/admin/resources/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Success", description: "Resource deleted successfully" });
        fetchData();
      } else {
        toast({ title: "Error", description: "Failed to delete resource", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete resource", variant: "destructive" });
    }
  };

  const selectedClassData = classes.find((c) => c.id === selectedClass);
  const selectedSubjectData = selectedClassData?.subjects.find((s) => s.id === selectedSubject);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Resources</h1>
              <p className="text-sm text-gray-600">Upload study materials and assignments</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Resources</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
                <DialogDescription>Upload study materials, homework, or test papers</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Chapter 1 Notes"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOTES">Notes</SelectItem>
                      <SelectItem value="HOMEWORK">Homework</SelectItem>
                      <SelectItem value="TEST_PAPER">Test Paper</SelectItem>
                      <SelectItem value="REFERENCE_MATERIAL">Reference Material</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="link">Google Drive Link</Label>
                  <Input
                    id="link"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Additional details about this resource"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="class">Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedClass && (
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedClassData?.subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedSubject && (
                  <div>
                    <Label htmlFor="chapter">Chapter</Label>
                    <Select value={formData.chapterId} onValueChange={(value) => setFormData({ ...formData, chapterId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedSubjectData?.chapters.map((chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id}>
                            {chapter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={!formData.chapterId}>
                  Add Resource
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {resources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No resources found. Add your first resource to get started.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Resource
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => (
              <Card key={resource.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{resource.title}</CardTitle>
                      <CardDescription>
                        {resource.chapter.subject.class.name} → {resource.chapter.subject.name} → {resource.chapter.name}
                      </CardDescription>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {resource.type}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {resource.description && (
                    <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                  )}
                  <div className="flex gap-2">
                    <a href={resource.link} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Link
                      </Button>
                    </a>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(resource.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
