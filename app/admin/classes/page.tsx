"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface Class {
  id: string;
  name: string;
  displayOrder: number;
  _count?: {
    subjects: number;
    users: number;
  };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ name: "", displayOrder: "" });
  const router = useRouter();
  const { toast } = useToast();
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await apiFetch("/admin/classes");
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch classes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSubmitting) return;
    try {
      setFormSubmitting(true);
      const url = editingClass ? `/admin/classes/${editingClass.id}` : "/admin/classes";
      const method = editingClass ? "PATCH" : "POST";
      
      const res = await apiFetch(url, {
        method,
        headers: { },
        body: JSON.stringify({
          name: formData.name,
          displayOrder: parseInt(formData.displayOrder),
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: `Class ${editingClass ? "updated" : "created"} successfully` });
        setIsDialogOpen(false);
        setFormData({ name: "", displayOrder: "" });
        setEditingClass(null);
        fetchClasses();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to save class", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save class", variant: "destructive" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      setDeleteLoadingId(id);
      const res = await apiFetch(`/admin/classes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Success", description: "Class deleted successfully" });
        fetchClasses();
      } else {
        toast({ title: "Error", description: "Failed to delete class", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete class", variant: "destructive" });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const openEditDialog = (cls: Class) => {
    setEditingClass(cls);
    setFormData({ name: cls.name, displayOrder: cls.displayOrder.toString() });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingClass(null);
    setFormData({ name: "", displayOrder: "" });
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
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Classes</h1>
              <p className="text-sm text-gray-600">Create and organize classes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Classes</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClass ? "Edit Class" : "Create New Class"}</DialogTitle>
                <DialogDescription>
                  {editingClass ? "Update class information" : "Add a new class to the system"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Class Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., 10th, 11th, 12th"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    placeholder="e.g., 10, 11, 12"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={formSubmitting}>
                  {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingClass ? "Update Class" : "Create Class"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No classes found. Create your first class to get started.</p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <CardTitle>{cls.name}</CardTitle>
                  <CardDescription>Display Order: {cls.displayOrder}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      Subjects: {cls._count?.subjects || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      Students: {cls._count?.users || 0}
                    </p>
                  </div>
                  <Link href={`/admin/classes/${cls.id}/subjects`}>
                    <Button size="sm" className="w-full mb-2">
                      Manage Subjects →
                    </Button>
                  </Link>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(cls)} className="flex-1">
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(cls.id)}
                      className="flex-1"
                      disabled={deleteLoadingId === cls.id}
                    >
                      {deleteLoadingId === cls.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
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
