"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, UserCog, Users, Filter, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  classId: string | null;
  class: { id: string; name: string } | null;
  createdAt: string;
  installment1Paid: boolean;
  installment2Paid: boolean;
}

interface Class {
  id: string;
  name: string;
}

type InstallmentChoice = "paid" | "unpaid";

interface NewStudentForm {
  name: string;
  email: string;
  classId: string;
  installment1Paid: InstallmentChoice;
  installment2Paid: InstallmentChoice;
}

const NEW_STUDENT_DEFAULT: NewStudentForm = {
  name: "",
  email: "",
  classId: "none",
  installment1Paid: "unpaid",
  installment2Paid: "unpaid",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkClassId, setBulkClassId] = useState("");
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<NewStudentForm>({ ...NEW_STUDENT_DEFAULT });
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", displayOrder: "" });
  const [filters, setFilters] = useState({
    classId: "all",
    installment1: "all",
    installment2: "all",
  });
  const [stats, setStats] = useState({
    total: 0,
    installment1Paid: 0,
    installment2Paid: 0,
  });
  const { toast } = useToast();
  const [assigningClassId, setAssigningClassId] = useState<string | null>(null);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [createClassLoading, setCreateClassLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters.classId, filters.installment1, filters.installment2]);

  const fetchData = async () => {
    try {
      const query = new URLSearchParams();

      if (filters.classId !== "all") {
        query.set("classId", filters.classId);
      }

      if (filters.installment1 !== "all") {
        query.set("installment1", filters.installment1);
      }

      if (filters.installment2 !== "all") {
        query.set("installment2", filters.installment2);
      }

      const studentsUrl = `/api/admin/students${query.toString() ? `?${query.toString()}` : ""}`;

      const [studentsRes, classesRes] = await Promise.all([
        fetch(studentsUrl),
        fetch("/api/admin/classes"),
      ]);
      
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data);
        setStats({
          total: data.length,
          installment1Paid: data.filter((s: User) => s.installment1Paid).length,
          installment2Paid: data.filter((s: User) => s.installment2Paid).length,
        });
      }

      if (classesRes.ok) setClasses(await classesRes.json());
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = async (studentId: string, classId: string | null) => {
    if (assigningClassId) return;
    setAssigningClassId(studentId);
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
    } finally {
      setAssigningClassId(null);
    }
  };

  const handleBulkAssign = async () => {
    if (bulkAssignLoading) return;
    if (selectedStudents.size === 0) {
      toast({ title: "Error", description: "Please select at least one student", variant: "destructive" });
      return;
    }

    try {
      setBulkAssignLoading(true);
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
    } finally {
      setBulkAssignLoading(false);
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

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addStudentLoading) return;
    try {
      setAddStudentLoading(true);
      const payload = {
        name: newStudent.name.trim(),
        email: newStudent.email.trim(),
        classId: newStudent.classId === "none" ? null : newStudent.classId,
        installment1Paid: newStudent.installment1Paid === "paid",
        installment2Paid: newStudent.installment2Paid === "paid",
      };

      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Failed to add student");
      }

      toast({
        title: "Student added",
        description: "Student can now access the portal with Google sign-in.",
      });
      setIsAddStudentDialogOpen(false);
      setNewStudent({ ...NEW_STUDENT_DEFAULT });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add student",
        variant: "destructive",
      });
    } finally {
      setAddStudentLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createClassLoading) return;
    try {
      setCreateClassLoading(true);
      const payload = {
        name: newClass.name,
        displayOrder: newClass.displayOrder
          ? Number(newClass.displayOrder)
          : classes.length + 1,
      };

      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create class");
      }

      toast({ title: "Class created", description: `${payload.name} is ready for assignments.` });
      setIsClassDialogOpen(false);
      setNewClass({ name: "", displayOrder: "" });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create class",
        variant: "destructive",
      });
    } finally {
      setCreateClassLoading(false);
    }
  };

  const statusBadge = (paid: boolean, label: string) => (
    <span
      className={`px-2 py-0.5 text-xs rounded-full ${
        paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {label}: {paid ? "Yes" : "No"}
    </span>
  );

  if (loading) {
    return (
      <LoadingScreen
        label="Loading students"
        description="Fetching the latest enrollment data..."
      />
    );
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
        <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage enrollment</h2>
            <p className="text-sm text-gray-600">Invite students and organize classes in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Create Class</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Class</DialogTitle>
                  <DialogDescription>Classes created here are available immediately for assignments.</DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreateClass}>
                  <div>
                    <Label htmlFor="className">Class Name</Label>
                    <Input
                      id="className"
                      value={newClass.name}
                      onChange={(e) => setNewClass((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Class 10 - Science"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayOrder">Display Order (optional)</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      min="1"
                      value={newClass.displayOrder}
                      onChange={(e) => setNewClass((prev) => ({ ...prev, displayOrder: e.target.value }))}
                      placeholder={`${classes.length + 1}`}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createClassLoading}>
                    {createClassLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Class
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Student</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Student</DialogTitle>
                  <DialogDescription>Create a student profile with class and fee status.</DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleAddStudent}>
                  <div>
                    <Label htmlFor="studentName">Full Name</Label>
                    <Input
                      id="studentName"
                      placeholder="e.g. Riya Sharma"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentEmail">Email</Label>
                    <Input
                      id="studentEmail"
                      type="email"
                      placeholder="student@example.com"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentClass">Assign to Class</Label>
                    <Select
                      value={newStudent.classId}
                      onValueChange={(value) => setNewStudent((prev) => ({ ...prev, classId: value }))}
                    >
                      <SelectTrigger id="studentClass">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No class yet</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Installment 1 Status</Label>
                      <Select
                        value={newStudent.installment1Paid}
                        onValueChange={(value: InstallmentChoice) =>
                          setNewStudent((prev) => ({ ...prev, installment1Paid: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Installment 2 Status</Label>
                      <Select
                        value={newStudent.installment2Paid}
                        onValueChange={(value: InstallmentChoice) =>
                          setNewStudent((prev) => ({ ...prev, installment2Paid: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={addStudentLoading}>
                    {addStudentLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Student
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

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
                      <Button onClick={handleBulkAssign} className="flex-1" disabled={bulkAssignLoading}>
                        {bulkAssignLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Status</th>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.role === "STUDENT" ? (
                            <div className="flex flex-col gap-1">
                              {statusBadge(student.installment1Paid, "Installment 1")}
                              {statusBadge(student.installment2Paid, "Installment 2")}
                            </div>
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
