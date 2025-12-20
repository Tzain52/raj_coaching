"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, ExternalLink, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface Resource {
  id: string;
  title: string;
  type: string;
  description: string | null;
  link: string;
  createdAt: string;
}

interface Chapter {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  };
}

export default function ResourcesPage() {
  const params = useParams();
  const classId = params.classId as string;
  const subjectId = params.subjectId as string;
  const chapterId = params.chapterId as string;
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "NOTES",
    description: "",
    link: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [chapterId]);

  const fetchData = async () => {
    try {
      const [chaptersRes, resourcesRes] = await Promise.all([
        fetch(`/api/admin/chapters?subjectId=${subjectId}`),
        fetch(`/api/admin/resources?chapterId=${chapterId}`),
      ]);

      if (chaptersRes.ok) {
        const chapters = await chaptersRes.json();
        const currentChapter = chapters.find((c: any) => c.id === chapterId);
        if (currentChapter) {
          const subjectsRes = await fetch(`/api/admin/subjects?classId=${classId}`);
          if (subjectsRes.ok) {
            const subjects = await subjectsRes.json();
            const subjectInfo = subjects.find((s: any) => s.id === subjectId);
            if (subjectInfo) {
              const classRes = await fetch(`/api/admin/classes`);
              if (classRes.ok) {
                const classes = await classRes.json();
                const classInfo = classes.find((c: any) => c.id === classId);
                setChapterData({
                  ...currentChapter,
                  subject: { ...subjectInfo, class: classInfo },
                });
              }
            }
          }
        }
      }

      if (resourcesRes.ok) {
        const data = await resourcesRes.json();
        setResources(data);
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
      const url = editingResource ? `/api/admin/resources/${editingResource.id}` : "/api/admin/resources";
      const method = editingResource ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          chapterId: chapterId,
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: `Resource ${editingResource ? "updated" : "created"} successfully` });
        setIsDialogOpen(false);
        setFormData({ title: "", type: "NOTES", description: "", link: "" });
        setEditingResource(null);
        fetchData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to save resource", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save resource", variant: "destructive" });
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

  const openEditDialog = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      type: resource.type,
      description: resource.description || "",
      link: resource.link,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingResource(null);
    setFormData({ title: "", type: "NOTES", description: "", link: "" });
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
            <Link href={`/admin/classes/${classId}/subjects/${subjectId}/chapters`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chapters
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Resources - {chapterData?.name}
              </h1>
              <p className="text-sm text-gray-600">
                {chapterData?.subject.class.name} → {chapterData?.subject.name} → {chapterData?.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Resources</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingResource ? "Edit Resource" : "Add New Resource"}</DialogTitle>
                <DialogDescription>
                  {editingResource ? "Update resource information" : "Upload study materials, homework, or test papers"}
                </DialogDescription>
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
                <Button type="submit" className="w-full">
                  {editingResource ? "Update Resource" : "Add Resource"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {resources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No resources found. Add your first resource to get started.</p>
              <Button onClick={openCreateDialog}>
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {resource.type}
                        </span>
                      </div>
                      {resource.description && (
                        <CardDescription className="mt-2">{resource.description}</CardDescription>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Added {new Date(resource.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <a href={resource.link} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Link
                      </Button>
                    </a>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(resource)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
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
