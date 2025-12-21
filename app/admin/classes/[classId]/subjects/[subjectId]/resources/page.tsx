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
import { ArrowLeft, Plus, ExternalLink, Trash2, Pencil, FileText, Loader2 } from "lucide-react";
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

interface Subject {
  id: string;
  name: string;
  class: {
    id: string;
    name: string;
  };
}

export default function SubjectResourcesPage() {
  const params = useParams();
  const classId = params.classId as string;
  const subjectId = params.subjectId as string;
  const [subjectData, setSubjectData] = useState<Subject | null>(null);
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
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const fetchData = async () => {
    try {
      const [subjectsRes, resourcesRes] = await Promise.all([
        fetch(`/api/admin/subjects?classId=${classId}`),
        fetch(`/api/admin/resources?subjectId=${subjectId}`),
      ]);

      if (subjectsRes.ok) {
        const subjects = await subjectsRes.json();
        const currentSubject = subjects.find((s: any) => s.id === subjectId);
        if (currentSubject) {
          const classRes = await fetch(`/api/admin/classes`);
          if (classRes.ok) {
            const classes = await classRes.json();
            const classInfo = classes.find((c: any) => c.id === classId);
            setSubjectData({ ...currentSubject, class: classInfo });
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
    if (formSubmitting) return;
    try {
      setFormSubmitting(true);
      const url = editingResource ? `/api/admin/resources/${editingResource.id}` : "/api/admin/resources";
      const method = editingResource ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          subjectId: subjectId,
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
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      setDeleteLoadingId(id);
      const res = await fetch(`/api/admin/resources/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Success", description: "Resource deleted successfully" });
        fetchData();
      } else {
        toast({ title: "Error", description: "Failed to delete resource", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete resource", variant: "destructive" });
    } finally {
      setDeleteLoadingId(null);
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
            <Link href={`/admin/classes/${classId}/subjects`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Subjects
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Subject Resources - {subjectData?.name}
              </h1>
              <p className="text-sm text-gray-600">
                {subjectData?.class.name} → {subjectData?.name} → Multi-Chapter Resources
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Multi-Chapter Resources</h3>
              <p className="text-sm text-blue-800 mt-1">
                Add resources that span multiple chapters, like comprehensive test papers, solution sets, or reference materials for the entire subject.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Subject-Level Resources</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingResource ? "Edit Resource" : "Add Multi-Chapter Resource"}</DialogTitle>
                <DialogDescription>
                  {editingResource ? "Update resource information" : "Add test papers, solutions, or materials that cover multiple chapters"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Mid-Term Test Paper, Complete Solutions"
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
                      <SelectItem value="TEST_PAPER">Test Paper</SelectItem>
                      <SelectItem value="NOTES">Comprehensive Notes</SelectItem>
                      <SelectItem value="REFERENCE_MATERIAL">Reference Material</SelectItem>
                      <SelectItem value="HOMEWORK">Assignment Set</SelectItem>
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
                    placeholder="Covers chapters 1-5, includes solutions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={formSubmitting}>
                  {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingResource ? "Update Resource" : "Add Resource"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {resources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No subject-level resources yet. Add test papers or multi-chapter materials here.</p>
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
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
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
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(resource.id)}
                      disabled={deleteLoadingId === resource.id}
                    >
                      {deleteLoadingId === resource.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
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
