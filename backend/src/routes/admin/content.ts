import { Router, Response } from "express";
import { requireAdmin, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/tree", requireAdmin, async (_req: AuthedRequest, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        subjects: {
          orderBy: { name: "asc" },
          include: {
            chapters: {
              orderBy: { name: "asc" },
              include: {
                resources: {
                  orderBy: { createdAt: "desc" },
                  select: { id: true, title: true, type: true, description: true, link: true, createdAt: true },
                },
              },
            },
          },
        },
      },
    });
    res.json(classes);
  } catch {
    res.status(500).json({ error: "Failed to fetch content tree" });
  }
});

export default router;
