import { Router, Response } from "express";
import { requireAdmin, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const classId = req.query.classId as string | undefined;
    const subjects = await prisma.subject.findMany({
      where: classId ? { classId } : undefined,
      include: { class: true, _count: { select: { chapters: true } } },
      orderBy: { name: "asc" },
    });
    res.json(subjects);
  } catch {
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

router.post("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { name, classId } = req.body;
    const subject = await prisma.subject.create({
      data: { name, classId },
      include: { class: true },
    });
    res.json(subject);
  } catch {
    res.status(500).json({ error: "Failed to create subject" });
  }
});

router.patch("/:id", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { name } = req.body;
    const updated = await prisma.subject.update({
      where: { id: req.params.id },
      data: { name },
      include: { class: true },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update subject" });
  }
});

router.delete("/:id", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete subject" });
  }
});

export default router;
