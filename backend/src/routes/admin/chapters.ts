import { Router, Response } from "express";
import { requireAdmin, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const subjectId = req.query.subjectId as string | undefined;
    const chapters = await prisma.chapter.findMany({
      where: subjectId ? { subjectId } : undefined,
      include: {
        subject: { include: { class: true } },
        _count: { select: { resources: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json(chapters);
  } catch {
    res.status(500).json({ error: "Failed to fetch chapters" });
  }
});

router.post("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { name, subjectId } = req.body;
    const chapter = await prisma.chapter.create({
      data: { name, subjectId },
      include: { subject: { include: { class: true } } },
    });
    res.json(chapter);
  } catch {
    res.status(500).json({ error: "Failed to create chapter" });
  }
});

router.patch("/:id", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { name } = req.body;
    const updated = await prisma.chapter.update({
      where: { id: req.params.id },
      data: { name },
      include: { subject: { include: { class: true } } },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update chapter" });
  }
});

router.delete("/:id", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    await prisma.chapter.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete chapter" });
  }
});

export default router;
