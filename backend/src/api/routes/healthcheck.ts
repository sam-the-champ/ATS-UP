import { Router, Request, Response } from "express";
import { db } from "../../config/db";

const router = Router();

router.get("/health", async (req: Request, res: Response) => {
  try {
    await db.$queryRaw`SELECT 1`;
    return res.status(200).send("OK");
  } catch (e) {
    return res.status(503).send("Service Unavailable");
  }
});

export default router;