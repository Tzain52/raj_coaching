"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft, ChevronRight, ChevronDown, Plus, Pencil, Trash2,
  Loader2, Upload, FileText, X, ExternalLink, Zap, BookOpen,
  FolderOpen, Layers,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Resource {
  id: string; title: string; type: string;
  description: string | null; link: string; createdAt: string;
}
interface Chapter { id: string; name: string; resources: Resource[]; }
interface Subject { id: string; name: string; chapters: Chapter[]; }
interface TreeClass { id: string; name: string; displayOrder: number; subjects: Subject[]; }

type DlgMode =
  | { t: "add-class" }
  | { t: "edit-class"; cls: TreeClass }
  | { t: "add-subject"; classId: string; className: string }
  | { t: "edit-subject"; sub: Subject; classId: string }
  | { t: "add-chapter"; subjectId: string; subjectName: string }
  | { t: "edit-chapter"; ch: Chapter; subjectId: string }
  | { t: "add-resource"; chapterId: string; chapterName: string; subjectName: string; className: string }
  | { t: "edit-resource"; res: Resource; chapterId: string };

interface QAState {
  step: 0 | 1 | 2 | 3;
  classId: string; classNew: string; classMode: "pick" | "new";
  subjectId: string; subjectNew: string; subjectMode: "pick" | "new";
  chapterId: string; chapterNew: string; chapterMode: "pick" | "new";
  resTitle: string; resType: string; resDesc: string; resFile: File | null;
}
const QA_DEFAULT: QAState = {
  step: 0,
  classId: "", classNew: "", classMode: "pick",
  subjectId: "", subjectNew: "", subjectMode: "pick",
  chapterId: "", chapterNew: "", chapterMode: "pick",
  resTitle: "", resType: "NOTES", resDesc: "", resFile: null,
};

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  NOTES: "Notes", HOMEWORK: "Homework", TEST_PAPER: "Test Paper",
  REFERENCE_MATERIAL: "Reference", OTHER: "Other",
};
const TYPE_COLORS: Record<string, string> = {
  NOTES: "bg-blue-100 text-blue-700",
  HOMEWORK: "bg-yellow-100 text-yellow-700",
  TEST_PAPER: "bg-red-100 text-red-700",
  REFERENCE_MATERIAL: "bg-purple-100 text-purple-700",
  OTHER: "bg-gray-100 text-gray-700",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ContentPage() {
  const [tree, setTree] = useState<TreeClass[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Expand state
  const [expCls, setExpCls] = useState<Set<string>>(new Set());
  const [expSub, setExpSub] = useState<Set<string>>(new Set());
  const [expCh, setExpCh] = useState<Set<string>>(new Set());

  // Main dialog
  const [dlg, setDlg] = useState<DlgMode | null>(null);
  const [dlgForm, setDlgForm] = useState<Record<string, string>>({});
  const [dlgFile, setDlgFile] = useState<File | null>(null);
  const [dlgSubmitting, setDlgSubmitting] = useState(false);
  const [dlgUploading, setDlgUploading] = useState(false);

  // Quick Add wizard
  const [qaOpen, setQaOpen] = useState(false);
  const [qa, setQa] = useState<QAState>({ ...QA_DEFAULT });
  const [qaSubmitting, setQaSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qaFileRef = useRef<HTMLInputElement>(null);

  // ─── Derived quick-add lookups ────────────────────────────────────────────
  const selectedQaCls = tree.find((c) => c.id === qa.classId);
  const selectedQaSub = selectedQaCls?.subjects.find((s) => s.id === qa.subjectId);

  // ─── Data fetching ────────────────────────────────────────────────────────
  const fetchTree = useCallback(async () => {
    try {
      const res = await apiFetch("/admin/content/tree");
      if (!res.ok) throw new Error();
      const data: TreeClass[] = await res.json();
      setTree(data);
      return data;
    } catch {
      toast({ title: "Error loading content", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const tog = (set: Set<string>, id: string) => {
    const n = new Set(set);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  };

  const openDlg = (mode: DlgMode, defaults: Record<string, string> = {}) => {
    setDlg(mode); setDlgForm(defaults); setDlgFile(null);
  };

  const handleFile = (f: File, onSet: (f: File) => void, titleCb?: () => void) => {
    if (f.type !== "application/pdf") {
      toast({ title: "PDFs only", variant: "destructive" }); return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast({ title: "Max file size is 50 MB", variant: "destructive" }); return;
    }
    onSet(f);
    titleCb?.();
  };

  // ─── Main dialog submit ───────────────────────────────────────────────────
  const handleDlgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dlgSubmitting || !dlg) return;
    setDlgSubmitting(true);
    try {
      let ok = false;

      if (dlg.t === "add-class") {
        const r = await apiFetch("/admin/classes", {
          method: "POST", headers: { },
          body: JSON.stringify({ name: dlgForm.name, displayOrder: parseInt(dlgForm.displayOrder || "99") }),
        });
        ok = r.ok;
        if (!ok) toast({ title: (await r.json()).error || "Failed", variant: "destructive" });
      } else if (dlg.t === "edit-class") {
        const r = await apiFetch(`/admin/classes/${dlg.cls.id}`, {
          method: "PATCH", headers: { },
          body: JSON.stringify({ name: dlgForm.name, displayOrder: parseInt(dlgForm.displayOrder || "99") }),
        });
        ok = r.ok;
      } else if (dlg.t === "add-subject") {
        const r = await apiFetch("/admin/subjects", {
          method: "POST", headers: { },
          body: JSON.stringify({ name: dlgForm.name, classId: dlg.classId }),
        });
        ok = r.ok;
      } else if (dlg.t === "edit-subject") {
        const r = await apiFetch(`/admin/subjects/${dlg.sub.id}`, {
          method: "PATCH", headers: { },
          body: JSON.stringify({ name: dlgForm.name, classId: dlg.classId }),
        });
        ok = r.ok;
      } else if (dlg.t === "add-chapter") {
        const r = await apiFetch("/admin/chapters", {
          method: "POST", headers: { },
          body: JSON.stringify({ name: dlgForm.name, subjectId: dlg.subjectId }),
        });
        ok = r.ok;
      } else if (dlg.t === "edit-chapter") {
        const r = await apiFetch(`/admin/chapters/${dlg.ch.id}`, {
          method: "PATCH", headers: { },
          body: JSON.stringify({ name: dlgForm.name, subjectId: dlg.subjectId }),
        });
        ok = r.ok;
      } else if (dlg.t === "add-resource" || dlg.t === "edit-resource") {
        let link = dlgForm.link || "";
        if (dlgFile) {
          setDlgUploading(true);
          const fd = new FormData(); fd.append("file", dlgFile);
          const up = await apiFetch("/admin/upload", { method: "POST", body: fd });
          setDlgUploading(false);
          if (!up.ok) { toast({ title: "Upload failed", variant: "destructive" }); return; }
          link = (await up.json()).url;
        }
        if (!link) { toast({ title: "Please select a PDF", variant: "destructive" }); return; }
        const url = dlg.t === "edit-resource"
          ? `/admin/resources/${dlg.res.id}` : "/admin/resources";
        const r = await apiFetch(url, {
          method: dlg.t === "edit-resource" ? "PATCH" : "POST",
          headers: { },
          body: JSON.stringify({
            title: dlgForm.title, type: dlgForm.type || "NOTES",
            description: dlgForm.description || "", link,
            chapterId: dlg.t === "add-resource" ? dlg.chapterId : dlg.chapterId,
          }),
        });
        ok = r.ok;
      }

      if (ok) {
        toast({ title: "Saved ✓" });
        setDlg(null);
        await fetchTree();
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setDlgSubmitting(false); setDlgUploading(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (
    type: "classes" | "subjects" | "chapters" | "resources",
    id: string, name: string
  ) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const r = await apiFetch(`/admin/${type}/${id}`, { method: "DELETE" });
      if (r.ok) { toast({ title: "Deleted" }); await fetchTree(); }
      else toast({ title: "Delete failed", variant: "destructive" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally { setDeletingId(null); }
  };

  // ─── Quick Add wizard steps ───────────────────────────────────────────────
  const qaNext = async () => {
    if (qa.step === 0) {
      if (qa.classMode === "new") {
        if (!qa.classNew.trim()) { toast({ title: "Enter a class name", variant: "destructive" }); return; }
        const r = await apiFetch("/admin/classes", {
          method: "POST", headers: { },
          body: JSON.stringify({ name: qa.classNew.trim(), displayOrder: 99 }),
        });
        if (!r.ok) { toast({ title: "Failed to create class", variant: "destructive" }); return; }
        const cls = await r.json();
        await fetchTree();
        setQa((p) => ({ ...p, classId: cls.id, step: 1, subjectMode: "new", subjectNew: "" }));
      } else {
        if (!qa.classId) { toast({ title: "Select a class", variant: "destructive" }); return; }
        setQa((p) => ({ ...p, step: 1 }));
      }
    } else if (qa.step === 1) {
      if (qa.subjectMode === "new") {
        if (!qa.subjectNew.trim()) { toast({ title: "Enter a subject name", variant: "destructive" }); return; }
        const r = await apiFetch("/admin/subjects", {
          method: "POST", headers: { },
          body: JSON.stringify({ name: qa.subjectNew.trim(), classId: qa.classId }),
        });
        if (!r.ok) { toast({ title: "Failed to create subject", variant: "destructive" }); return; }
        const sub = await r.json();
        await fetchTree();
        setQa((p) => ({ ...p, subjectId: sub.id, step: 2, chapterMode: "new", chapterNew: "" }));
      } else {
        if (!qa.subjectId) { toast({ title: "Select a subject", variant: "destructive" }); return; }
        setQa((p) => ({ ...p, step: 2 }));
      }
    } else if (qa.step === 2) {
      if (qa.chapterMode === "new") {
        if (!qa.chapterNew.trim()) { toast({ title: "Enter a chapter name", variant: "destructive" }); return; }
        const r = await apiFetch("/admin/chapters", {
          method: "POST", headers: { },
          body: JSON.stringify({ name: qa.chapterNew.trim(), subjectId: qa.subjectId }),
        });
        if (!r.ok) { toast({ title: "Failed to create chapter", variant: "destructive" }); return; }
        const ch = await r.json();
        await fetchTree();
        setQa((p) => ({ ...p, chapterId: ch.id, step: 3 }));
      } else {
        if (!qa.chapterId) { toast({ title: "Select a chapter", variant: "destructive" }); return; }
        setQa((p) => ({ ...p, step: 3 }));
      }
    }
  };

  const qaSubmit = async () => {
    if (!qa.resFile) { toast({ title: "Select a PDF first", variant: "destructive" }); return; }
    setQaSubmitting(true);
    try {
      const fd = new FormData(); fd.append("file", qa.resFile);
      const up = await apiFetch("/admin/upload", { method: "POST", body: fd });
      if (!up.ok) { toast({ title: "Upload failed", variant: "destructive" }); return; }
      const { url } = await up.json();
      const r = await apiFetch("/admin/resources", {
        method: "POST", headers: { },
        body: JSON.stringify({
          title: qa.resTitle || qa.resFile.name.replace(/\.pdf$/i, ""),
          type: qa.resType, description: qa.resDesc, link: url, chapterId: qa.chapterId,
        }),
      });
      if (r.ok) {
        toast({ title: "Uploaded successfully ✓" });
        setQaOpen(false); setQa({ ...QA_DEFAULT });
        await fetchTree();
      } else {
        toast({ title: "Failed to save resource", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally { setQaSubmitting(false); }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading content…</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-28">

      {/* ── Sticky header ────────────────────────────────────────────────── */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="p-2 h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900">Content Manager</h1>
            <p className="text-xs text-gray-400 truncate">
              {tree.reduce((a, c) => a + c.subjects.reduce((b, s) => b + s.chapters.reduce((d, ch) => d + ch.resources.length, 0), 0), 0)} resources ·{" "}
              {tree.reduce((a, c) => a + c.subjects.reduce((b, s) => b + s.chapters.length, 0), 0)} chapters ·{" "}
              {tree.reduce((a, c) => a + c.subjects.length, 0)} subjects · {tree.length} classes
            </p>
          </div>
          <button
            onClick={() => { setQa({ ...QA_DEFAULT }); setQaOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Zap className="h-3.5 w-3.5" />
            Quick Upload
          </button>
        </div>
      </header>

      {/* ── Tree ─────────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-3 py-4 space-y-2">

        {/* Add class CTA */}
        <button
          onClick={() => openDlg({ t: "add-class" }, { name: "", displayOrder: String(tree.length + 1) })}
          className="w-full border-2 border-dashed border-blue-200 rounded-2xl py-3.5 text-sm text-blue-600 font-semibold hover:bg-blue-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add New Class
        </button>

        {tree.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            No content yet. Add a class to get started.
          </div>
        )}

        {tree.map((cls) => {
          const clsOpen = expCls.has(cls.id);
          const totalRes = cls.subjects.reduce((a, s) => a + s.chapters.reduce((b, ch) => b + ch.resources.length, 0), 0);

          return (
            <div key={cls.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

              {/* ── Class row ────────────────────────────────────────────── */}
              <div className="flex items-center gap-2 px-3 py-3.5 bg-slate-800">
                <button
                  onClick={() => setExpCls(tog(expCls, cls.id))}
                  className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                >
                  {clsOpen
                    ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                  <BookOpen className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="text-white font-bold text-sm truncate">{cls.name}</span>
                  <div className="flex gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded-full">
                      {cls.subjects.length}s · {totalRes}r
                    </span>
                  </div>
                </button>
                <div className="flex gap-1 shrink-0">
                  <ActionBtn
                    icon={<Plus className="h-3.5 w-3.5" />}
                    color="bg-blue-600 hover:bg-blue-500"
                    title="Add Subject"
                    onClick={() => {
                      openDlg({ t: "add-subject", classId: cls.id, className: cls.name }, { name: "" });
                      setExpCls(s => new Set(s).add(cls.id));
                    }}
                  />
                  <ActionBtn
                    icon={<Pencil className="h-3.5 w-3.5" />}
                    color="bg-slate-600 hover:bg-slate-500"
                    title="Edit Class"
                    onClick={() => openDlg({ t: "edit-class", cls }, { name: cls.name, displayOrder: String(cls.displayOrder) })}
                  />
                  <ActionBtn
                    icon={deletingId === cls.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    color="bg-red-600 hover:bg-red-500"
                    title="Delete Class"
                    onClick={() => handleDelete("classes", cls.id, cls.name)}
                    disabled={deletingId === cls.id}
                  />
                </div>
              </div>

              {/* ── Subjects ─────────────────────────────────────────────── */}
              {clsOpen && (
                <div>
                  {cls.subjects.length === 0 && (
                    <p className="text-xs text-gray-400 px-12 py-3 italic">
                      No subjects yet — tap + above to add one.
                    </p>
                  )}

                  {cls.subjects.map((sub, si) => {
                    const subOpen = expSub.has(sub.id);
                    const subRes = sub.chapters.reduce((a, ch) => a + ch.resources.length, 0);

                    return (
                      <div key={sub.id} className={si < cls.subjects.length - 1 ? "border-b border-gray-100" : ""}>

                        {/* Subject row */}
                        <div className="flex items-center gap-2 px-3 py-3 pl-10 bg-blue-50/50">
                          <button
                            onClick={() => setExpSub(tog(expSub, sub.id))}
                            className="flex items-center gap-2 flex-1 text-left min-w-0"
                          >
                            {subOpen
                              ? <ChevronDown className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                              : <ChevronRight className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                            <FolderOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span className="text-blue-900 font-semibold text-sm truncate">{sub.name}</span>
                            <span className="text-[10px] text-blue-400 shrink-0">
                              {sub.chapters.length}ch · {subRes}r
                            </span>
                          </button>
                          <div className="flex gap-1 shrink-0">
                            <ActionBtn
                              icon={<Plus className="h-3 w-3" />}
                              color="bg-blue-500 hover:bg-blue-400"
                              title="Add Chapter"
                              onClick={() => {
                                openDlg({ t: "add-chapter", subjectId: sub.id, subjectName: sub.name }, { name: "" });
                                setExpSub(s => new Set(s).add(sub.id));
                              }}
                            />
                            <ActionBtn
                              icon={<Pencil className="h-3 w-3" />}
                              color="bg-gray-300 hover:bg-gray-400 !text-gray-700"
                              title="Edit Subject"
                              onClick={() => openDlg({ t: "edit-subject", sub, classId: cls.id }, { name: sub.name })}
                            />
                            <ActionBtn
                              icon={deletingId === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              color="bg-red-100 hover:bg-red-200 !text-red-600"
                              title="Delete Subject"
                              onClick={() => handleDelete("subjects", sub.id, sub.name)}
                              disabled={deletingId === sub.id}
                            />
                          </div>
                        </div>

                        {/* ── Chapters ─────────────────────────────────────── */}
                        {subOpen && (
                          <div>
                            {sub.chapters.length === 0 && (
                              <p className="text-xs text-gray-400 pl-20 py-2 italic">
                                No chapters — tap + to add one.
                              </p>
                            )}

                            {sub.chapters.map((ch, ci) => {
                              const chOpen = expCh.has(ch.id);
                              return (
                                <div key={ch.id} className={ci < sub.chapters.length - 1 ? "border-b border-gray-50" : ""}>

                                  {/* Chapter row */}
                                  <div className="flex items-center gap-2 px-3 py-2.5 pl-16 bg-gray-50/80">
                                    <button
                                      onClick={() => setExpCh(tog(expCh, ch.id))}
                                      className="flex items-center gap-2 flex-1 text-left min-w-0"
                                    >
                                      {chOpen
                                        ? <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
                                        : <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />}
                                      <Layers className="h-3 w-3 text-gray-400 shrink-0" />
                                      <span className="text-gray-800 text-sm truncate">{ch.name}</span>
                                      <span className="text-[10px] text-gray-400 shrink-0">
                                        {ch.resources.length}r
                                      </span>
                                    </button>
                                    <div className="flex gap-1 shrink-0">
                                      <ActionBtn
                                        icon={<Upload className="h-3 w-3" />}
                                        color="bg-green-500 hover:bg-green-400"
                                        title="Upload Resource"
                                        onClick={() => {
                                          openDlg(
                                            { t: "add-resource", chapterId: ch.id, chapterName: ch.name, subjectName: sub.name, className: cls.name },
                                            { title: "", type: "NOTES", description: "", link: "" }
                                          );
                                          setExpCh(s => new Set(s).add(ch.id));
                                        }}
                                      />
                                      <ActionBtn
                                        icon={<Pencil className="h-3 w-3" />}
                                        color="bg-gray-200 hover:bg-gray-300 !text-gray-600"
                                        title="Edit Chapter"
                                        onClick={() => openDlg({ t: "edit-chapter", ch, subjectId: sub.id }, { name: ch.name })}
                                      />
                                      <ActionBtn
                                        icon={deletingId === ch.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                        color="bg-red-100 hover:bg-red-200 !text-red-600"
                                        title="Delete Chapter"
                                        onClick={() => handleDelete("chapters", ch.id, ch.name)}
                                        disabled={deletingId === ch.id}
                                      />
                                    </div>
                                  </div>

                                  {/* ── Resources ───────────────────────── */}
                                  {chOpen && (
                                    <div className="bg-white">
                                      {ch.resources.length === 0 && (
                                        <p className="text-xs text-gray-400 pl-24 py-2.5 italic">
                                          No resources — click ↑ to upload a PDF.
                                        </p>
                                      )}
                                      {ch.resources.map((res) => (
                                        <div
                                          key={res.id}
                                          className="flex items-center gap-2 px-3 py-2.5 pl-24 border-t border-gray-50 hover:bg-slate-50 transition-colors"
                                        >
                                          <FileText className="h-3.5 w-3.5 text-red-400 shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-800 font-medium truncate">{res.title}</p>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[res.type] ?? "bg-gray-100 text-gray-600"}`}>
                                              {TYPE_LABELS[res.type] ?? res.type}
                                            </span>
                                          </div>
                                          <div className="flex gap-1 shrink-0">
                                            <a href={res.link} target="_blank" rel="noopener noreferrer">
                                              <ActionBtn
                                                icon={<ExternalLink className="h-3 w-3" />}
                                                color="bg-gray-100 hover:bg-gray-200 !text-gray-600"
                                                title="Open PDF"
                                                onClick={() => {}}
                                              />
                                            </a>
                                            <ActionBtn
                                              icon={<Pencil className="h-3 w-3" />}
                                              color="bg-gray-100 hover:bg-gray-200 !text-gray-600"
                                              title="Edit Resource"
                                              onClick={() => openDlg(
                                                { t: "edit-resource", res, chapterId: ch.id },
                                                { title: res.title, type: res.type, description: res.description || "", link: res.link }
                                              )}
                                            />
                                            <ActionBtn
                                              icon={deletingId === res.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                              color="bg-red-100 hover:bg-red-200 !text-red-600"
                                              title="Delete Resource"
                                              onClick={() => handleDelete("resources", res.id, res.title)}
                                              disabled={deletingId === res.id}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* ── Floating Quick Upload FAB ─────────────────────────────────────── */}
      <button
        onClick={() => { setQa({ ...QA_DEFAULT }); setQaOpen(true); }}
        className="fixed bottom-6 right-4 z-30 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-105 active:scale-95 transition-all font-bold text-sm"
      >
        <Zap className="h-4 w-4" />
        Quick Upload
      </button>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Main dialog — add/edit classes, subjects, chapters, resources
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Dialog open={!!dlg} onOpenChange={(open) => { if (!open) { setDlg(null); setDlgFile(null); } }}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          {dlg && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">
                  {dlg.t === "add-class" && "Add Class"}
                  {dlg.t === "edit-class" && `Edit: ${dlg.cls.name}`}
                  {dlg.t === "add-subject" && `Add Subject`}
                  {dlg.t === "edit-subject" && `Edit Subject`}
                  {dlg.t === "add-chapter" && `Add Chapter`}
                  {dlg.t === "edit-chapter" && `Edit Chapter`}
                  {dlg.t === "add-resource" && `Upload Resource`}
                  {dlg.t === "edit-resource" && `Edit Resource`}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {dlg.t === "add-subject" && `Adding to ${dlg.className}`}
                  {dlg.t === "add-chapter" && `Adding to ${dlg.subjectName}`}
                  {dlg.t === "add-resource" && `${dlg.className} › ${dlg.subjectName} › ${dlg.chapterName}`}
                  {dlg.t === "edit-resource" && "Update resource details"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleDlgSubmit} className="space-y-4">

                {/* Class name + order */}
                {(dlg.t === "add-class" || dlg.t === "edit-class") && (
                  <>
                    <div>
                      <Label>Class Name</Label>
                      <Input autoFocus placeholder="e.g. Class 10"
                        value={dlgForm.name || ""}
                        onChange={(e) => setDlgForm((p) => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div>
                      <Label>Display Order</Label>
                      <Input type="number" placeholder="e.g. 10"
                        value={dlgForm.displayOrder || ""}
                        onChange={(e) => setDlgForm((p) => ({ ...p, displayOrder: e.target.value }))} />
                    </div>
                  </>
                )}

                {/* Subject / Chapter name */}
                {(dlg.t === "add-subject" || dlg.t === "edit-subject" ||
                  dlg.t === "add-chapter" || dlg.t === "edit-chapter") && (
                  <div>
                    <Label>{dlg.t.includes("subject") ? "Subject Name" : "Chapter Name"}</Label>
                    <Input autoFocus
                      placeholder={dlg.t.includes("subject") ? "e.g. Physics" : "e.g. Chapter 1: Motion"}
                      value={dlgForm.name || ""}
                      onChange={(e) => setDlgForm((p) => ({ ...p, name: e.target.value }))} required />
                  </div>
                )}

                {/* Resource fields */}
                {(dlg.t === "add-resource" || dlg.t === "edit-resource") && (
                  <>
                    <div>
                      <Label>Title</Label>
                      <Input placeholder="e.g. Chapter 1 Notes"
                        value={dlgForm.title || ""}
                        onChange={(e) => setDlgForm((p) => ({ ...p, title: e.target.value }))} required />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={dlgForm.type || "NOTES"} onValueChange={(v) => setDlgForm((p) => ({ ...p, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPE_LABELS).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {dlg.t === "add-resource" && (
                      <div>
                        <Label>PDF File</Label>
                        <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFile(f, setDlgFile, () => {
                              if (!dlgForm.title) setDlgForm((p) => ({ ...p, title: f.name.replace(/\.pdf$/i, "") }));
                            });
                          }} />
                        {dlgFile ? (
                          <div className="flex items-center gap-3 border rounded-xl p-3 bg-green-50 border-green-200">
                            <FileText className="h-5 w-5 text-green-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-green-800 truncate">{dlgFile.name}</p>
                              <p className="text-xs text-green-600">{(dlgFile.size / 1024 / 1024).toFixed(1)} MB</p>
                            </div>
                            <button type="button" onClick={() => setDlgFile(null)}>
                              <X className="h-4 w-4 text-green-500 hover:text-red-500" />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => fileRef.current?.click()}
                            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                            <Upload className="h-7 w-7 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600 font-medium">Tap to select PDF</p>
                            <p className="text-xs text-gray-400 mt-0.5">PDF only · Max 50 MB</p>
                          </button>
                        )}
                      </div>
                    )}

                    {dlg.t === "edit-resource" && (
                      <div>
                        <Label>Current File</Label>
                        <a href={dlgForm.link} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-blue-600 underline">
                          <ExternalLink className="h-3.5 w-3.5" /> Open current PDF
                        </a>
                      </div>
                    )}

                    <div>
                      <Label>Description <span className="text-gray-400">(optional)</span></Label>
                      <Textarea placeholder="Additional details" rows={2}
                        value={dlgForm.description || ""}
                        onChange={(e) => setDlgForm((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full h-11 text-sm font-semibold"
                  disabled={dlgSubmitting || (dlg.t === "add-resource" && !dlgFile)}>
                  {(dlgSubmitting || dlgUploading) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {dlgUploading ? "Uploading…" : dlgSubmitting ? "Saving…" : "Save"}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Quick Add Wizard
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Dialog open={qaOpen} onOpenChange={(open) => { if (!open) { setQaOpen(false); setQa({ ...QA_DEFAULT }); } }}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-blue-600" /> Quick Upload
            </DialogTitle>
            <DialogDescription className="text-xs">Upload a PDF to any chapter in 4 steps</DialogDescription>
          </DialogHeader>

          {/* Progress bar */}
          <div className="flex gap-1 mb-1">
            {(["Class", "Subject", "Chapter", "PDF"] as const).map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1.5 rounded-full w-full transition-all duration-300 ${i <= qa.step ? "bg-blue-600" : "bg-gray-200"}`} />
                <span className={`text-[10px] font-medium ${i === qa.step ? "text-blue-600" : "text-gray-400"}`}>{label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4 mt-1">

            {/* Step 0: Class */}
            {qa.step === 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Which class?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pick", "new"] as const).map((mode) => (
                    <button key={mode} onClick={() => setQa((p) => ({ ...p, classMode: mode }))}
                      className={`py-2 text-xs rounded-xl border font-semibold transition-all ${qa.classMode === mode ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      {mode === "pick" ? "Pick existing" : "Create new"}
                    </button>
                  ))}
                </div>
                {qa.classMode === "pick" ? (
                  <Select value={qa.classId} onValueChange={(v) => setQa((p) => ({ ...p, classId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select class…" /></SelectTrigger>
                    <SelectContent>{tree.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input autoFocus placeholder="Class name e.g. Class 10"
                    value={qa.classNew} onChange={(e) => setQa((p) => ({ ...p, classNew: e.target.value }))} />
                )}
              </div>
            )}

            {/* Step 1: Subject */}
            {qa.step === 1 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Subject in <span className="text-blue-600">{selectedQaCls?.name}</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pick", "new"] as const).map((mode) => (
                    <button key={mode} onClick={() => setQa((p) => ({ ...p, subjectMode: mode }))}
                      className={`py-2 text-xs rounded-xl border font-semibold transition-all ${qa.subjectMode === mode ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      {mode === "pick" ? "Pick existing" : "Create new"}
                    </button>
                  ))}
                </div>
                {qa.subjectMode === "pick" ? (
                  <Select value={qa.subjectId} onValueChange={(v) => setQa((p) => ({ ...p, subjectId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select subject…" /></SelectTrigger>
                    <SelectContent>
                      {selectedQaCls?.subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input autoFocus placeholder="e.g. Physics"
                    value={qa.subjectNew} onChange={(e) => setQa((p) => ({ ...p, subjectNew: e.target.value }))} />
                )}
              </div>
            )}

            {/* Step 2: Chapter */}
            {qa.step === 2 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Chapter in <span className="text-blue-600">{selectedQaSub?.name}</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pick", "new"] as const).map((mode) => (
                    <button key={mode} onClick={() => setQa((p) => ({ ...p, chapterMode: mode }))}
                      className={`py-2 text-xs rounded-xl border font-semibold transition-all ${qa.chapterMode === mode ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      {mode === "pick" ? "Pick existing" : "Create new"}
                    </button>
                  ))}
                </div>
                {qa.chapterMode === "pick" ? (
                  <Select value={qa.chapterId} onValueChange={(v) => setQa((p) => ({ ...p, chapterId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select chapter…" /></SelectTrigger>
                    <SelectContent>
                      {selectedQaSub?.chapters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input autoFocus placeholder="e.g. Chapter 3: Laws of Motion"
                    value={qa.chapterNew} onChange={(e) => setQa((p) => ({ ...p, chapterNew: e.target.value }))} />
                )}
              </div>
            )}

            {/* Step 3: PDF Upload */}
            {qa.step === 3 && (
              <div className="space-y-3">
                <input ref={qaFileRef} type="file" accept="application/pdf" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f, (file) => setQa((p) => ({
                      ...p, resFile: file,
                      resTitle: p.resTitle || file.name.replace(/\.pdf$/i, ""),
                    })));
                  }} />

                {qa.resFile ? (
                  <div className="flex items-center gap-3 border rounded-xl p-3 bg-green-50 border-green-200">
                    <FileText className="h-5 w-5 text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 truncate">{qa.resFile.name}</p>
                      <p className="text-xs text-green-600">{(qa.resFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button onClick={() => setQa((p) => ({ ...p, resFile: null }))}>
                      <X className="h-4 w-4 text-green-500 hover:text-red-500" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => qaFileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Upload className="h-7 w-7 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 font-medium">Tap to select PDF</p>
                    <p className="text-xs text-gray-400">PDF only · Max 50 MB</p>
                  </button>
                )}
                <div>
                  <Label>Title</Label>
                  <Input placeholder="Resource title"
                    value={qa.resTitle} onChange={(e) => setQa((p) => ({ ...p, resTitle: e.target.value }))} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={qa.resType} onValueChange={(v) => setQa((p) => ({ ...p, resType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-1">
              {qa.step > 0 && (
                <Button variant="outline" className="flex-1 h-11"
                  onClick={() => setQa((p) => ({ ...p, step: (p.step - 1) as 0 | 1 | 2 | 3 }))}>
                  ← Back
                </Button>
              )}
              {qa.step < 3 ? (
                <Button className="flex-1 h-11 font-semibold" onClick={qaNext} disabled={qaSubmitting}>
                  {qaSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Next →
                </Button>
              ) : (
                <Button
                  className="flex-1 h-11 bg-green-600 hover:bg-green-700 font-semibold"
                  onClick={qaSubmit}
                  disabled={qaSubmitting || !qa.resFile}
                >
                  {qaSubmitting
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading…</>
                    : <><Upload className="h-4 w-4 mr-2" />Upload & Save</>}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tiny reusable action button ──────────────────────────────────────────────
function ActionBtn({
  icon, color, title, onClick, disabled,
}: {
  icon: React.ReactNode; color: string; title: string;
  onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg text-white transition-all active:scale-95 disabled:opacity-50 ${color}`}
    >
      {icon}
    </button>
  );
}
