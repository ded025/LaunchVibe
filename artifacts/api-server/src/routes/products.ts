import { Router, type IRouter } from "express";
import { eq, desc, avg, count, sql } from "drizzle-orm";
import { db, productsTable, feedbackTable, feedEventsTable, userPointsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getOrCreateUserPoints, FEEDBACK_THRESHOLD } from "./gamification";

const router: IRouter = Router();

// Compute product score: (AvgRating*0.4) + (FeedbackCount*0.3) + (Recency*0.2) + (WouldPayRatio*0.1)
function computeScore(
  avgRating: number | null,
  feedbackCount: number,
  createdAt: Date,
  wouldPayRatio: number | null
): number {
  const ratingScore = (avgRating ?? 0) * 0.4;
  const feedbackScore = Math.min(feedbackCount / 10, 5) * 0.3;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 5 - ageDays / 7) * 0.2;
  const payScore = (wouldPayRatio ?? 0) * 5 * 0.1;
  return parseFloat((ratingScore + feedbackScore + recencyScore + payScore).toFixed(4));
}

function computeStatusTag(feedbackCount: number, score: number, createdAt: Date): string {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 7) return "launching";
  if (feedbackCount >= 5 || score > 3) return "trending";
  if (feedbackCount < 2) return "needs_feedback";
  return "active";
}

async function refreshProductStats(productId: number) {
  const [stats] = await db
    .select({ count: count(), avgRating: avg(feedbackTable.rating) })
    .from(feedbackTable)
    .where(eq(feedbackTable.productId, productId));

  const wouldPayResult = await db
    .select({ count: count() })
    .from(feedbackTable)
    .where(sql`${feedbackTable.productId} = ${productId} AND ${feedbackTable.wouldPay} = true`);

  const totalFeedback = stats?.count ?? 0;
  const avgRatingNum = stats?.avgRating ? parseFloat(stats.avgRating as unknown as string) : null;
  const wouldPayCount = wouldPayResult[0]?.count ?? 0;
  const wouldPayRatio = totalFeedback > 0 ? wouldPayCount / totalFeedback : null;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  const score = computeScore(avgRatingNum, totalFeedback, product?.createdAt ?? new Date(), wouldPayRatio);
  const statusTag = computeStatusTag(totalFeedback, score, product?.createdAt ?? new Date());

  await db
    .update(productsTable)
    .set({
      feedbackCount: totalFeedback,
      avgRating: avgRatingNum,
      score,
      statusTag,
      updatedAt: new Date(),
    })
    .where(eq(productsTable.id, productId));
}

// GET /products
router.get("/products", async (req, res): Promise<void> => {
  const params = req.query as { category?: string; sort?: string; limit?: string; offset?: string };

  let results = await db.select().from(productsTable);

  if (params.category) {
    results = results.filter((p) => p.category === params.category);
  }

  if (params.sort === "trending" || params.sort === "score") {
    results = results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  } else if (params.sort === "top_rated") {
    results = results.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  } else {
    results = results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const limit = parseInt(params.limit ?? "50");
  const offset = parseInt(params.offset ?? "0");
  res.json(results.slice(offset, offset + limit));
});

// GET /products/map
router.get("/products/map", async (_req, res): Promise<void> => {
  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      tagline: productsTable.tagline,
      city: productsTable.city,
      country: productsTable.country,
      latitude: productsTable.latitude,
      longitude: productsTable.longitude,
    })
    .from(productsTable)
    .where(sql`${productsTable.latitude} IS NOT NULL AND ${productsTable.longitude} IS NOT NULL`);

  res.json(products);
});

// GET /products/trending
router.get("/products/trending", async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(desc(productsTable.score), desc(productsTable.feedbackCount))
    .limit(10);
  res.json(products);
});

// POST /products
router.post("/products", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Feedback economy: must have given >= FEEDBACK_THRESHOLD feedbacks
  const [feedbackCountResult] = await db
    .select({ count: count() })
    .from(feedbackTable)
    .where(eq(feedbackTable.reviewerClerkId, userId));

  const userFeedbackCount = feedbackCountResult?.count ?? 0;

  // Skip gate for first product (seed data scenario) or check threshold
  const [existingProduct] = await db.select().from(productsTable).where(eq(productsTable.founderClerkId, userId)).limit(1);
  if (!existingProduct && userFeedbackCount < FEEDBACK_THRESHOLD) {
    res.status(403).json({
      error: "feedback_required",
      message: `Give ${FEEDBACK_THRESHOLD} feedbacks before listing a product`,
      given: userFeedbackCount,
      required: FEEDBACK_THRESHOLD,
    });
    return;
  }

  const { name, tagline, description, websiteUrl, logoUrl, category, city, country, latitude, longitude } = req.body;
  if (!name || !tagline || !description || !category) {
    res.status(400).json({ error: "name, tagline, description, and category are required" }); return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({ founderClerkId: userId, name, tagline, description, websiteUrl, logoUrl, category, city, country, latitude, longitude })
    .returning();

  // Award points for listing
  const pts = await getOrCreateUserPoints(userId);
  await db.update(userPointsTable).set({ points: pts.points + 20 }).where(eq(userPointsTable.userId, userId));

  // Create feed event
  await db.insert(feedEventsTable).values({
    type: "product_listed",
    productId: product.id,
    productName: product.name,
    userId,
    metadata: { category: product.category, city: city ?? null },
  });

  res.status(201).json(product);
});

// GET /products/:id
router.get("/products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product ID" }); return; }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(product);
});

// PATCH /products/:id
router.patch("/products/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product ID" }); return; }
  const [product] = await db.update(productsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(productsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(product);
});

// DELETE /products/:id
router.delete("/products/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product ID" }); return; }
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.sendStatus(204);
});

// GET /products/:id/feedback
router.get("/products/:id/feedback", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product ID" }); return; }
  const feedbacks = await db.select().from(feedbackTable).where(eq(feedbackTable.productId, id)).orderBy(desc(feedbackTable.createdAt));
  res.json(feedbacks);
});

// POST /products/:id/feedback
router.post("/products/:id/feedback", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product ID" }); return; }

  const { liked, confused, missing, wouldPay, rating } = req.body;
  if (!liked || !confused || !missing || rating == null) {
    res.status(400).json({ error: "liked, confused, missing, and rating are required" }); return;
  }

  const [feedback] = await db
    .insert(feedbackTable)
    .values({ productId: id, reviewerClerkId: auth?.userId ?? null, liked, confused, missing, wouldPay: !!wouldPay, rating })
    .returning();

  await refreshProductStats(id);

  // Award points and feed event if authenticated
  if (auth?.userId) {
    const pts = await getOrCreateUserPoints(auth.userId);
    await db.update(userPointsTable).set({ points: pts.points + 5 }).where(eq(userPointsTable.userId, auth.userId));

    // Award founder +2
    const [productRow] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (productRow?.founderClerkId) {
      const founderPts = await getOrCreateUserPoints(productRow.founderClerkId);
      await db.update(userPointsTable).set({ points: founderPts.points + 2 }).where(eq(userPointsTable.userId, productRow.founderClerkId));

      // Feed event
      await db.insert(feedEventsTable).values({
        type: "feedback_received",
        productId: id,
        productName: productRow.name,
        userId: auth.userId,
        metadata: { rating, wouldPay },
      });

      // Milestone check
      const updatedProduct = await db.select().from(productsTable).where(eq(productsTable.id, id));
      const fc = updatedProduct[0]?.feedbackCount ?? 0;
      if (fc === 10 || fc === 25 || fc === 50 || fc === 100) {
        await db.insert(feedEventsTable).values({
          type: "milestone",
          productId: id,
          productName: productRow.name,
          userId: productRow.founderClerkId,
          metadata: { milestone: fc, text: `${productRow.name} reached ${fc} feedbacks!` },
        });
      }
    }
  }

  res.status(201).json(feedback);
});

// GET /products/:id/stats
router.get("/products/:id/stats", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product ID" }); return; }

  const [stats] = await db
    .select({ totalFeedback: count(), avgRating: avg(feedbackTable.rating) })
    .from(feedbackTable)
    .where(eq(feedbackTable.productId, id));

  const [wouldPayResult] = await db
    .select({ count: count() })
    .from(feedbackTable)
    .where(sql`${feedbackTable.productId} = ${id} AND ${feedbackTable.wouldPay} = true`);

  const ratingDist = await db
    .select({ rating: feedbackTable.rating, count: count() })
    .from(feedbackTable)
    .where(eq(feedbackTable.productId, id))
    .groupBy(feedbackTable.rating)
    .orderBy(feedbackTable.rating);

  const totalFeedback = stats?.totalFeedback ?? 0;
  const wouldPayCount = wouldPayResult?.count ?? 0;

  res.json({
    productId: id,
    totalFeedback,
    avgRating: stats?.avgRating ? parseFloat(stats.avgRating as unknown as string) : null,
    wouldPayCount,
    wouldPayRatio: totalFeedback > 0 ? wouldPayCount / totalFeedback : null,
    ratingDistribution: ratingDist,
  });
});

// POST /products/:id/summarize
router.post("/products/:id/summarize", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product ID" }); return; }

  const feedbacks = await db
    .select()
    .from(feedbackTable)
    .where(eq(feedbackTable.productId, id))
    .orderBy(desc(feedbackTable.createdAt))
    .limit(50);

  if (feedbacks.length === 0) { res.status(400).json({ error: "No feedback to summarize" }); return; }

  const feedbackText = feedbacks.map((f, i) =>
    `Feedback ${i + 1} (Rating: ${f.rating}/5, Would Pay: ${f.wouldPay}):\n- Liked: ${f.liked}\n- Confused: ${f.confused}\n- Missing: ${f.missing}`
  ).join("\n\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    max_completion_tokens: 1024,
    messages: [
      { role: "system", content: "You are a product analyst. Return JSON with: strengths (array), weaknesses (array), suggestions (array), overallSentiment ('very positive'|'positive'|'mixed'|'negative'|'very negative'). Return only valid JSON." },
      { role: "user", content: `Analyze this product feedback:\n\n${feedbackText}` },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(content); } catch { parsed = {}; }

  res.json({
    productId: id,
    strengths: (parsed.strengths as string[]) ?? [],
    weaknesses: (parsed.weaknesses as string[]) ?? [],
    suggestions: (parsed.suggestions as string[]) ?? [],
    overallSentiment: (parsed.overallSentiment as string) ?? "mixed",
    generatedAt: new Date().toISOString(),
  });
});

export default router;
