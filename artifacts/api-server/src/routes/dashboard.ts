import { Router, type IRouter } from "express";
import { eq, desc, avg, count, sql } from "drizzle-orm";
import { db, productsTable, feedbackTable } from "@workspace/db";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.userId = auth.userId;
  next();
};

// GET /dashboard
router.get("/dashboard", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;

  const products = await db.select().from(productsTable).where(eq(productsTable.founderClerkId, userId));
  const productIds = products.map((p) => p.id);

  let totalFeedback = 0;
  let avgRating: number | null = null;
  let recentFeedback: any[] = [];
  let feedbackOverTime: { date: string; count: number }[] = [];

  if (productIds.length > 0) {
    const idsSQL = sql`ARRAY[${sql.join(productIds.map(id => sql`${id}`), sql`, `)}]::int[]`;

    const [statsResult] = await db
      .select({ totalFeedback: count(), avgRating: avg(feedbackTable.rating) })
      .from(feedbackTable)
      .where(sql`${feedbackTable.productId} = ANY(${idsSQL})`);

    totalFeedback = statsResult?.totalFeedback ?? 0;
    avgRating = statsResult?.avgRating ? parseFloat(statsResult.avgRating as unknown as string) : null;

    recentFeedback = await db
      .select({
        id: feedbackTable.id,
        productId: feedbackTable.productId,
        productName: productsTable.name,
        liked: feedbackTable.liked,
        confused: feedbackTable.confused,
        missing: feedbackTable.missing,
        wouldPay: feedbackTable.wouldPay,
        rating: feedbackTable.rating,
        createdAt: feedbackTable.createdAt,
      })
      .from(feedbackTable)
      .innerJoin(productsTable, eq(feedbackTable.productId, productsTable.id))
      .where(sql`${feedbackTable.productId} = ANY(${idsSQL})`)
      .orderBy(desc(feedbackTable.createdAt))
      .limit(10);

    // Feedback over time (last 30 days by day)
    const rawTimeSeries = await db
      .select({
        date: sql<string>`DATE(${feedbackTable.createdAt})::text`,
        count: count(),
      })
      .from(feedbackTable)
      .where(sql`${feedbackTable.productId} = ANY(${idsSQL}) AND ${feedbackTable.createdAt} > NOW() - INTERVAL '30 days'`)
      .groupBy(sql`DATE(${feedbackTable.createdAt})`)
      .orderBy(sql`DATE(${feedbackTable.createdAt})`);

    feedbackOverTime = rawTimeSeries;
  }

  const topProducts = products
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      category: p.category,
      logoUrl: p.logoUrl,
      city: p.city,
      country: p.country,
      feedbackCount: p.feedbackCount,
      avgRating: p.avgRating,
      wouldPayRatio: null,
      score: p.score,
      statusTag: p.statusTag,
      createdAt: p.createdAt.toISOString(),
    }));

  res.json({ totalProducts: products.length, totalFeedback, avgRating, recentFeedback, topProducts, feedbackOverTime });
});

// GET /dashboard/products
router.get("/dashboard/products", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.founderClerkId, userId))
    .orderBy(desc(productsTable.createdAt));

  const enriched = await Promise.all(
    products.map(async (p) => {
      const [stats] = await db
        .select({ wouldPayCount: count() })
        .from(feedbackTable)
        .where(sql`${feedbackTable.productId} = ${p.id} AND ${feedbackTable.wouldPay} = true`);

      const wouldPayRatio = p.feedbackCount > 0 ? (stats?.wouldPayCount ?? 0) / p.feedbackCount : null;

      return {
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        category: p.category,
        logoUrl: p.logoUrl,
        city: p.city,
        country: p.country,
        feedbackCount: p.feedbackCount,
        avgRating: p.avgRating,
        wouldPayRatio,
        score: p.score,
        statusTag: p.statusTag,
        createdAt: p.createdAt.toISOString(),
      };
    })
  );

  res.json(enriched);
});

export default router;
