"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface Subject {
  id: string;
  name: string;
  _count?: {
    chapters: number;
  };
}

interface Class {
  id: string;
  name: string;
}

export default function SubjectsPage() {
  const params = useParams();
  const classId = params.classId as string;
  const [classData, setClassData] = useState<Class | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const router = useRouter();
  const { toast } = useToast();
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    try {
      const [classRes, subjectsRes] = await Promise.all([
        fetch(`/api/admin/classes`),
        fetch(`/api/admin/subjects?classId=${classId}`),
      ]);

      if (classRes.ok) {
        const classes = await classRes.json();
        const currentClass = classes.find((c: Class) => c.id === classId);
        setClassData(currentClass);
      }

      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setSubjects(data);
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
      const url = editingSubject ? `/api/admin/subjects/${editingSubject.id}` : "/api/admin/subjects";
      const method = editingSubject ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          classId: classId,
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: `Subject ${editingSubject ? "updated" : "created"} successfully` });
        setIsDialogOpen(false);
        setFormData({ name: "" });
        setEditingSubject(null);
        fetchData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to save subject", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save subject", variant: "destructive" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject? All chapters and resources will be deleted.")) return;

    try {
      setDeleteLoadingId(id);
      const res = await fetch(`/api/admin/subjects/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Success", description: "Subject deleted successfully" });
        fetchData();
      } else {
        toast({ title: "Error", description: "Failed to delete subject", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete subject", variant: "destructive" });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSubject(null);
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
            <Link href="/admin/classes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Classes
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subjects - {classData?.name}</h1>
              <p className="text-sm text-gray-600">Manage subjects for this class</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Subjects</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSubject ? "Edit Subject" : "Create New Subject"}</DialogTitle>
                <DialogDescription>
                  {editingSubject ? "Update subject information" : "Add a new subject to this class"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Mathematics, Science, English"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={formSubmitting}>
                  {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingSubject ? "Update Subject" : "Create Subject"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {subjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No subjects found. Create your first subject to get started.</p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Subject
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <Card key={subject.id}>
                <CardHeader>
                  <CardTitle>{subject.name}</CardTitle>
                  <CardDescription>{subject._count?.chapters || 0} chapters</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-3">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(subject)} className="flex-1">
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(subject.id)}
                      className="flex-1"
                      disabled={deleteLoadingId === subject.id}
                    >
                      {deleteLoadingId === subject.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </div>
                  <Link href={`/admin/classes/${classId}/subjects/${subject.id}/chapters`}>
                    <Button variant="ghost" size="sm" className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Manage Chapters →
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
