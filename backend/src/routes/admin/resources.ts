import { Router, Response } from "express";
import { requireAdmin, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const chapterId = req.query.chapterId as string | undefined;
    const subjectId = req.query.subjectId as string | undefined;
    const where: Record<string, string> = {};
    if (chapterId) where.chapterId = chapterId;
    if (subjectId) where.subjectId = subjectId;

    const resources = await prisma.resource.findMany({
      where,
      include: {
        chapter: { include: { subject: { include: { class: true } } } },
        subject: { include: { class: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(resources);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { title, type, description, link, chapterId, subjectId } = req.body;
    if (!title || !type || !link) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    if (!chapterId && !subjectId) {
      res.status(400).json({ error: "Either chapterId or subjectId is required" });
      return;
    }
    const resource = await prisma.resource.create({
      data: { title, type, description, link, chapterId: chapterId || null, subjectId: subjectId || null },
    });
    res.json(resource);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { title, type, description, link } = req.body;
    const updated = await prisma.resource.update({
      where: { id: req.params.id },
      data: { title, type, description, link },
      include: {
        chapter: { include: { subject: { include: { class: true } } } },
        subject: { include: { class: true } },
      },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update resource" });
  }
});

router.delete("/:id", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    await prisma.resource.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

export default router;
