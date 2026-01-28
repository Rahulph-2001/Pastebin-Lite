import { prisma } from "../app.js";

export function healthRoute(app) {
  app.get("/api/healthz", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true });
    } catch {
      res.status(500).json({ ok: false });
    }
  });
}
