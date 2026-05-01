import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Generate one with: openssl rand -hex 32");
}

const SECRET: string = JWT_SECRET;

export interface AuthedRequest extends Request {
  userId?: number;
}

export function signToken(userId: number): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const payload = jwt.verify(token, SECRET) as { userId: number };
    if (typeof payload?.userId !== "number") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing_token", code: "UNAUTHENTICATED" });
  }
  const token = header.slice("Bearer ".length).trim();
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "invalid_token", code: "UNAUTHENTICATED" });
  }
  req.userId = decoded.userId;
  next();
}
