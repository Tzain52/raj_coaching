"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  classId: string | null;
  class: { id: string; name: string } | null;
  createdAt: string;
}

interface Class {
  id: string;
  name: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkClassId, setBulkClassId] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/admin/classes"),
      ]);
      
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (classesRes.ok) setClasses(await classesRes.json());
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = async (studentId: string, classId: string | null) => {
    try {
      const res = await fetch(`/api/admin/students/${studentId}/assign-class`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: classId || null }),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Class assigned successfully" });
        fetchData();
      } else {
        toast({ title: "Error", description: "Failed to assign class", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to assign class", variant: "destructive" });
    }
  };

  const handleBulkAssign = async () => {
    if (selectedStudents.size === 0) {
      toast({ title: "Error", description: "Please select at least one student", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/admin/students/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudents),
          classId: bulkClassId === "none" ? null : bulkClassId || null,
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: `Assigned ${selectedStudents.size} students successfully` });
        setSelectedStudents(new Set());
        setIsBulkDialogOpen(false);
        setBulkClassId("");
        fetchData();
      } else {
        toast({ title: "Error", description: "Failed to bulk assign", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to bulk assign", variant: "destructive" });
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === students.filter(s => s.role === "STUDENT").length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.filter(s => s.role === "STUDENT").map(s => s.id)));
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Students Overview</h1>
              <p className="text-sm text-gray-600">View all registered students</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedStudents.size > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedStudents.size} student{selectedStudents.size !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserCog className="h-4 w-4 mr-2" />
                    Bulk Assign Class
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Assign Class</DialogTitle>
                    <DialogDescription>
                      Assign {selectedStudents.size} student{selectedStudents.size !== 1 ? "s" : ""} to a class
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulkClass">Select Class</Label>
                      <Select value={bulkClassId} onValueChange={setBulkClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No class (unassign)</SelectItem>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleBulkAssign} className="flex-1">
                        Assign Class
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedStudents(new Set())} className="flex-1">
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={() => setSelectedStudents(new Set())}>
                Clear
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <Checkbox
                        checked={selectedStudents.size === students.filter(s => s.role === "STUDENT").length && students.filter(s => s.role === "STUDENT").length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No students have signed in yet
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className={selectedStudents.has(student.id) ? "bg-blue-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.role === "STUDENT" && (
                            <Checkbox
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.name || "Not set"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            student.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {student.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.role === "STUDENT" ? (
                            <Select
                              value={student.classId || "none"}
                              onValueChange={(value) => handleClassChange(student.id, value === "none" ? null : value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Assign class" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No class</SelectItem>
                                {classes.map((cls) => (
                                  <SelectItem key={cls.id} value={cls.id}>
                                    {cls.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
