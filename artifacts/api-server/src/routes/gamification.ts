import { Router, type IRouter } from "express";
import { db, userPointsTable, feedbackTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

const FEEDBACK_THRESHOLD = 3;

async function getOrCreateUserPoints(userId: string) {
  const existing = await db
    .select()
    .from(userPointsTable)
    .where(eq(userPointsTable.userId, userId))
    .limit(1);

  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(userPointsTable)
    .values({ userId, points: 0, streak: 0, badges: [] })
    .returning();

  return created;
}

async function computeBadges(userId: string, points: number, feedbackCount: number, productCount: number): Promise<string[]> {
  const badges: string[] = [];
  if (productCount >= 1) badges.push("Early Builder");
  if (feedbackCount >= 10) badges.push("Top Reviewer");
  if (points >= 50) badges.push("Rising Product");
  return badges;
}

// GET /gamification/me
router.get("/gamification/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const record = await getOrCreateUserPoints(userId);
  res.json({
    userId,
    points: record.points,
    streak: record.streak,
    lastActiveDate: record.lastActiveDate,
    badges: record.badges,
  });
});

// GET /gamification/me/feedback-count
router.get("/gamification/me/feedback-count", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [result] = await db
    .select({ count: count() })
    .from(feedbackTable)
    .where(eq(feedbackTable.reviewerClerkId, userId));

  const cnt = result?.count ?? 0;
  res.json({ count: cnt, canListProduct: cnt >= FEEDBACK_THRESHOLD });
});

// POST /gamification/checkin
router.post("/gamification/checkin", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const today = new Date().toISOString().split("T")[0];
  const record = await getOrCreateUserPoints(userId);

  if (record.lastActiveDate === today) {
    res.json({
      userId,
      points: record.points,
      streak: record.streak,
      lastActiveDate: record.lastActiveDate,
      badges: record.badges,
    });
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newStreak = record.lastActiveDate === yesterdayStr ? record.streak + 1 : 1;
  const newPoints = record.points + 2;

  // Recompute badges
  const [feedbackResult] = await db
    .select({ count: count() })
    .from(feedbackTable)
    .where(eq(feedbackTable.reviewerClerkId, userId));

  const badges = await computeBadges(userId, newPoints, feedbackResult?.count ?? 0, 0);

  const [updated] = await db
    .update(userPointsTable)
    .set({ points: newPoints, streak: newStreak, lastActiveDate: today, badges })
    .where(eq(userPointsTable.userId, userId))
    .returning();

  res.json({
    userId,
    points: updated.points,
    streak: updated.streak,
    lastActiveDate: updated.lastActiveDate,
    badges: updated.badges,
  });
});

export { getOrCreateUserPoints, computeBadges, FEEDBACK_THRESHOLD };
export default router;
