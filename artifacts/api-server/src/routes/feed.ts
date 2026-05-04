import { Router, type IRouter } from "express";
import { db, feedEventsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router: IRouter = Router();

// GET /feed
router.get("/feed", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? "30"), 50);
  const offset = parseInt((req.query.offset as string) ?? "0");

  const events = await db
    .select()
    .from(feedEventsTable)
    .orderBy(desc(feedEventsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(events);
});

export default router;
