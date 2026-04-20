import { Router, Response } from "express";
import multer from "multer";
import { Storage } from "@google-cloud/storage";
import { requireAdmin, AuthedRequest } from "../../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const BUCKET_NAME = "raj-coaching-resources";

router.post("/", requireAdmin, upload.single("file"), async (req: AuthedRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ error: "No file provided" }); return; }
    if (file.mimetype !== "application/pdf") { res.status(400).json({ error: "Only PDF files are allowed" }); return; }

    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `uploads/${timestamp}_${safeName}`;

    const storage = new Storage();
    await storage.bucket(BUCKET_NAME).file(fileName).save(file.buffer, {
      metadata: { contentType: "application/pdf" },
      resumable: false,
    });

    res.json({ url: `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}` });
  } catch {
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
