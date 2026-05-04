import { Router, type IRouter } from "express";
import { db, productsTable, feedbackTable, userPointsTable } from "@workspace/db";
import { desc, avg, count, sum, eq, sql } from "drizzle-orm";

const router: IRouter = Router();

// GET /leaderboard/builders
router.get("/leaderboard/builders", async (_req, res): Promise<void> => {
  const builders = await db
    .select({
      userId: productsTable.founderClerkId,
      productCount: count(productsTable.id),
      totalFeedback: sum(productsTable.feedbackCount),
      avgRating: avg(productsTable.avgRating),
      topProduct: sql<string>`(SELECT name FROM products p2 WHERE p2.founder_clerk_id = ${productsTable.founderClerkId} ORDER BY score DESC LIMIT 1)`,
    })
    .from(productsTable)
    .groupBy(productsTable.founderClerkId)
    .orderBy(desc(sql`SUM(${productsTable.feedbackCount})`))
    .limit(20);

  const withPoints = await Promise.all(
    builders.map(async (b) => {
      const pts = await db
        .select()
        .from(userPointsTable)
        .where(eq(userPointsTable.userId, b.userId))
        .limit(1);
      return {
        userId: b.userId,
        productCount: b.productCount,
        totalFeedback: Number(b.totalFeedback ?? 0),
        avgRating: b.avgRating ? parseFloat(b.avgRating as unknown as string) : null,
        totalPoints: pts[0]?.points ?? 0,
        badges: pts[0]?.badges ?? [],
        topProduct: b.topProduct ?? null,
      };
    })
  );

  res.json(withPoints.sort((a, b) => b.totalPoints - a.totalPoints));
});

// GET /leaderboard/reviewers
router.get("/leaderboard/reviewers", async (_req, res): Promise<void> => {
  const reviewers = await db
    .select({
      userId: feedbackTable.reviewerClerkId,
      feedbackCount: count(feedbackTable.id),
    })
    .from(feedbackTable)
    .where(sql`${feedbackTable.reviewerClerkId} IS NOT NULL`)
    .groupBy(feedbackTable.reviewerClerkId)
    .orderBy(desc(count(feedbackTable.id)))
    .limit(20);

  const withPoints = await Promise.all(
    reviewers.map(async (r) => {
      const userId = r.userId as string;
      const pts = await db
        .select()
        .from(userPointsTable)
        .where(eq(userPointsTable.userId, userId))
        .limit(1);
      return {
        userId,
        feedbackCount: r.feedbackCount,
        totalPoints: pts[0]?.points ?? 0,
        badges: pts[0]?.badges ?? [],
      };
    })
  );

  res.json(withPoints.sort((a, b) => b.totalPoints - a.totalPoints));
});

// GET /leaderboard/products
router.get("/leaderboard/products", async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(desc(productsTable.score))
    .limit(20);

  res.json(products);
});

export default router;
