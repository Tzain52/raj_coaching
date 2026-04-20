"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface Chapter {
  id: string;
  name: string;
  _count?: {
    resources: number;
  };
}

interface Subject {
  id: string;
  name: string;
  class: {
    id: string;
    name: string;
  };
}

export default function ChaptersPage() {
  const params = useParams();
  const classId = params.classId as string;
  const subjectId = params.subjectId as string;
  const [subjectData, setSubjectData] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const { toast } = useToast();
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const fetchData = async () => {
    try {
      const [subjectsRes, chaptersRes] = await Promise.all([
        apiFetch(`/admin/subjects?classId=${classId}`),
        apiFetch(`/admin/chapters?subjectId=${subjectId}`),
      ]);

      if (subjectsRes.ok) {
        const subjects = await subjectsRes.json();
        const currentSubject = subjects.find((s: any) => s.id === subjectId);
        if (currentSubject) {
          const classRes = await apiFetch(`/admin/classes`);
          if (classRes.ok) {
            const classes = await classRes.json();
            const classInfo = classes.find((c: any) => c.id === classId);
            setSubjectData({ ...currentSubject, class: classInfo });
          }
        }
      }

      if (chaptersRes.ok) {
        const data = await chaptersRes.json();
        setChapters(data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSubmitting) return;
    try {
      setFormSubmitting(true);
      const url = editingChapter ? `/admin/chapters/${editingChapter.id}` : "/admin/chapters";
      const method = editingChapter ? "PATCH" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { },
        body: JSON.stringify({
          name: formData.name,
          subjectId: subjectId,
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: `Chapter ${editingChapter ? "updated" : "created"} successfully` });
        setIsDialogOpen(false);
        setFormData({ name: "" });
        setEditingChapter(null);
        fetchData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to save chapter", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save chapter", variant: "destructive" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this chapter? All resources will be deleted.")) return;

    try {
      setDeleteLoadingId(id);
      const res = await apiFetch(`/admin/chapters/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Success", description: "Chapter deleted successfully" });
        fetchData();
      } else {
        toast({ title: "Error", description: "Failed to delete chapter", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete chapter", variant: "destructive" });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const openEditDialog = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({ name: chapter.name });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingChapter(null);
    setFormData({ name: "" });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/admin/classes/${classId}/subjects`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Subjects
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Chapters - {subjectData?.name}
              </h1>
              <p className="text-sm text-gray-600">
                {subjectData?.class.name} → {subjectData?.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={`/admin/classes/${classId}/subjects/${subjectId}/resources`}>
            <Button variant="outline" className="mb-4">
              <FileText className="h-4 w-4 mr-2" />
              Manage Multi-Chapter Resources (Test Papers, Solutions)
            </Button>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Chapters</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Chapter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingChapter ? "Edit Chapter" : "Create New Chapter"}</DialogTitle>
                <DialogDescription>
                  {editingChapter ? "Update chapter information" : "Add a new chapter to this subject"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Chapter Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Chapter 1: Introduction"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={formSubmitting}>
                  {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingChapter ? "Update Chapter" : "Create Chapter"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {chapters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No chapters found. Create your first chapter to get started.</p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Chapter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chapters.map((chapter) => (
              <Card key={chapter.id}>
                <CardHeader>
                  <CardTitle>{chapter.name}</CardTitle>
                  <CardDescription>{chapter._count?.resources || 0} resources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-3">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(chapter)} className="flex-1">
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(chapter.id)}
                      className="flex-1"
                      disabled={deleteLoadingId === chapter.id}
                    >
                      {deleteLoadingId === chapter.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </div>
                  <Link href={`/admin/classes/${classId}/subjects/${subjectId}/chapters/${chapter.id}/resources`}>
                    <Button variant="ghost" size="sm" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Chapter Resources →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
