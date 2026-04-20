"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, ExternalLink, Trash2, Pencil, Loader2, Upload, FileText, X } from "lucide-react";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [chapterId]);

  const fetchData = async () => {
    try {
      const [chaptersRes, resourcesRes] = await Promise.all([
        apiFetch(`/admin/chapters?subjectId=${subjectId}`),
        apiFetch(`/admin/resources?chapterId=${chapterId}`),
      ]);

      if (chaptersRes.ok) {
        const chapters = await chaptersRes.json();
        const currentChapter = chapters.find((c: any) => c.id === chapterId);
        if (currentChapter) {
          const subjectsRes = await apiFetch(`/admin/subjects?classId=${classId}`);
          if (subjectsRes.ok) {
            const subjects = await subjectsRes.json();
            const subjectInfo = subjects.find((s: any) => s.id === subjectId);
            if (subjectInfo) {
              const classRes = await apiFetch(`/admin/classes`);
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
    } catch {
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Only PDF files are allowed", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 50 MB", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    if (!formData.title) {
      setFormData((prev) => ({ ...prev, title: file.name.replace(/\.pdf$/i, "") }));
    }
  };

  const handleUploadAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSubmitting) return;

    try {
      setFormSubmitting(true);

      let link = formData.link;

      // Upload new file if one is selected
      if (selectedFile && !editingResource) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", selectedFile);
        const uploadRes = await apiFetch("/admin/upload", { method: "POST", body: fd });
        setUploading(false);
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          toast({ title: "Upload failed", description: err.error || "Could not upload file", variant: "destructive" });
          return;
        }
        const { url } = await uploadRes.json();
        link = url;
      }

      if (!link) {
        toast({ title: "No file", description: "Please select a PDF to upload", variant: "destructive" });
        return;
      }

      const url = editingResource ? `/admin/resources/${editingResource.id}` : "/admin/resources";
      const method = editingResource ? "PATCH" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { },
        body: JSON.stringify({ ...formData, link, chapterId }),
      });

      if (res.ok) {
        toast({ title: "Success", description: `Resource ${editingResource ? "updated" : "created"} successfully` });
        setIsDialogOpen(false);
        setFormData({ title: "", type: "NOTES", description: "", link: "" });
        setSelectedFile(null);
        setEditingResource(null);
        fetchData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to save resource", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save resource", variant: "destructive" });
    } finally {
      setFormSubmitting(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      setDeleteLoadingId(id);
      const res = await apiFetch(`/admin/resources/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Success", description: "Resource deleted successfully" });
        fetchData();
      } else {
        toast({ title: "Error", description: "Failed to delete resource", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete resource", variant: "destructive" });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const openEditDialog = (resource: Resource) => {
    setEditingResource(resource);
    setSelectedFile(null);
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
    setSelectedFile(null);
    setFormData({ title: "", type: "NOTES", description: "", link: "" });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const typeLabels: Record<string, string> = {
    NOTES: "Notes",
    HOMEWORK: "Homework",
    TEST_PAPER: "Test Paper",
    REFERENCE_MATERIAL: "Reference",
    OTHER: "Other",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/admin/classes/${classId}/subjects/${subjectId}/chapters`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Resources — {chapterData?.name}</h1>
              <p className="text-xs text-gray-500">
                {chapterData?.subject.class.name} › {chapterData?.subject.name} › {chapterData?.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-semibold text-gray-800">All Resources ({resources.length})</h2>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setSelectedFile(null); setEditingResource(null); } }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingResource ? "Edit Resource" : "Add Resource"}</DialogTitle>
                <DialogDescription>
                  {editingResource ? "Update the resource details below." : "Upload a PDF and fill in the details."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUploadAndSubmit} className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g., Chapter 1 Notes"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOTES">Notes</SelectItem>
                      <SelectItem value="HOMEWORK">Homework</SelectItem>
                      <SelectItem value="TEST_PAPER">Test Paper</SelectItem>
                      <SelectItem value="REFERENCE_MATERIAL">Reference Material</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* PDF Upload area */}
                {!editingResource && (
                  <div>
                    <Label>PDF File</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                    />
                    {selectedFile ? (
                      <div className="flex items-center gap-3 border rounded-lg p-3 bg-green-50 border-green-200">
                        <FileText className="h-5 w-5 text-green-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-800 truncate">{selectedFile.name}</p>
                          <p className="text-xs text-green-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button type="button" onClick={() => setSelectedFile(null)} className="text-green-600 hover:text-red-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 font-medium">Click to select PDF</p>
                        <p className="text-xs text-gray-400 mt-1">PDF only · Max 50 MB</p>
                      </button>
                    )}
                  </div>
                )}

                {/* When editing, show current file link */}
                {editingResource && (
                  <div>
                    <Label>Current File</Label>
                    <a href={formData.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 underline break-all">
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      Open current file
                    </a>
                  </div>
                )}

                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="Additional details about this resource"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={formSubmitting || (!editingResource && !selectedFile)}
                >
                  {(formSubmitting || uploading) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {uploading ? "Uploading..." : editingResource ? "Update Resource" : "Upload & Save"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {resources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No resources yet. Upload your first PDF.</p>
              <Button onClick={openCreateDialog} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add First Resource
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="p-2 bg-red-50 rounded-lg shrink-0">
                        <FileText className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-gray-900 text-sm">{resource.title}</p>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                            {typeLabels[resource.type] || resource.type}
                          </span>
                        </div>
                        {resource.description && (
                          <p className="text-xs text-gray-500">{resource.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Added {new Date(resource.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <a href={resource.link} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-8 px-2">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                      <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => openEditDialog(resource)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleDelete(resource.id)}
                        disabled={deleteLoadingId === resource.id}
                      >
                        {deleteLoadingId === resource.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
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
