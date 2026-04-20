import { Request, Response, NextFunction } from "express";
import { decode } from "next-auth/jwt";

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    classId: string | null;
  };
}

async function extractUser(req: AuthedRequest, res: Response): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = await decode({ token, secret: process.env.NEXTAUTH_SECRET! });
    if (!decoded) {
      res.status(401).json({ error: "Invalid token" });
      return false;
    }
    req.user = {
      id: decoded.id as string,
      email: decoded.email as string,
      role: decoded.role as string,
      classId: (decoded.classId as string | null) ?? null,
    };
    return true;
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return false;
  }
}

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const ok = await extractUser(req, res);
  if (!ok) return;
  if (req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export async function requireStudent(req: AuthedRequest, res: Response, next: NextFunction) {
  const ok = await extractUser(req, res);
  if (!ok) return;
  if (req.user!.role !== "STUDENT") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const ok = await extractUser(req, res);
  if (!ok) return;
  next();
}
