import { Router, type IRouter } from "express";
import { eq, desc, avg, count, sql } from "drizzle-orm";
import { db, productsTable, feedbackTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  ListProductsQueryParams,
  GetProductFeedbackParams,
  SubmitFeedbackBody,
  SubmitFeedbackParams,
  GetProductStatsParams,
  SummarizeProductFeedbackParams,
} from "@workspace/api-zod";
import { getAuth } from "@clerk/express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

// GET /products
router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let query = db.select().from(productsTable);
  const results = await query;

  let filtered = results;
  if (params.category) {
    filtered = filtered.filter((p) => p.category === params.category);
  }

  if (params.sort === "trending") {
    filtered = filtered.sort((a, b) => b.feedbackCount - a.feedbackCount);
  } else if (params.sort === "top_rated") {
    filtered = filtered.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  } else {
    filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  filtered = filtered.slice(offset, offset + limit);

  res.json(filtered);
});

// GET /products/trending
router.get("/products/trending", async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(desc(productsTable.feedbackCount), desc(productsTable.avgRating))
    .limit(10);
  res.json(products);
});

// POST /products
router.post("/products", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({ ...parsed.data, founderClerkId: userId })
    .returning();

  res.status(201).json(product);
});

// GET /products/:id
router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(product);
});

// PATCH /products/:id
router.patch("/products/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(product);
});

// DELETE /products/:id
router.delete("/products/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.sendStatus(204);
});

// GET /products/:id/feedback
router.get("/products/:id/feedback", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductFeedbackParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const feedbacks = await db
    .select()
    .from(feedbackTable)
    .where(eq(feedbackTable.productId, params.data.id))
    .orderBy(desc(feedbackTable.createdAt));

  res.json(feedbacks);
});

// POST /products/:id/feedback
router.post("/products/:id/feedback", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SubmitFeedbackParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [feedback] = await db
    .insert(feedbackTable)
    .values({
      ...parsed.data,
      productId: params.data.id,
      reviewerClerkId: auth?.userId ?? null,
    })
    .returning();

  // Update product stats
  const stats = await db
    .select({
      count: count(),
      avgRating: avg(feedbackTable.rating),
    })
    .from(feedbackTable)
    .where(eq(feedbackTable.productId, params.data.id));

  if (stats[0]) {
    await db
      .update(productsTable)
      .set({
        feedbackCount: stats[0].count,
        avgRating: stats[0].avgRating ? parseFloat(stats[0].avgRating as unknown as string) : null,
      })
      .where(eq(productsTable.id, params.data.id));
  }

  res.status(201).json(feedback);
});

// GET /products/:id/stats
router.get("/products/:id/stats", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductStatsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const [stats] = await db
    .select({
      totalFeedback: count(),
      avgRating: avg(feedbackTable.rating),
    })
    .from(feedbackTable)
    .where(eq(feedbackTable.productId, params.data.id));

  const wouldPayResult = await db
    .select({ count: count() })
    .from(feedbackTable)
    .where(
      sql`${feedbackTable.productId} = ${params.data.id} AND ${feedbackTable.wouldPay} = true`
    );

  const ratingDist = await db
    .select({
      rating: feedbackTable.rating,
      count: count(),
    })
    .from(feedbackTable)
    .where(eq(feedbackTable.productId, params.data.id))
    .groupBy(feedbackTable.rating)
    .orderBy(feedbackTable.rating);

  const totalFeedback = stats?.totalFeedback ?? 0;
  const wouldPayCount = wouldPayResult[0]?.count ?? 0;

  res.json({
    productId: params.data.id,
    totalFeedback,
    avgRating: stats?.avgRating ? parseFloat(stats.avgRating as unknown as string) : null,
    wouldPayCount,
    wouldPayRatio: totalFeedback > 0 ? wouldPayCount / totalFeedback : null,
    ratingDistribution: ratingDist,
  });
});

// POST /products/:id/summarize
router.post("/products/:id/summarize", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SummarizeProductFeedbackParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const feedbacks = await db
    .select()
    .from(feedbackTable)
    .where(eq(feedbackTable.productId, params.data.id))
    .orderBy(desc(feedbackTable.createdAt))
    .limit(50);

  if (feedbacks.length === 0) {
    res.status(400).json({ error: "No feedback to summarize" });
    return;
  }

  const feedbackText = feedbacks
    .map(
      (f, i) =>
        `Feedback ${i + 1} (Rating: ${f.rating}/5, Would Pay: ${f.wouldPay}):\n` +
        `- Liked: ${f.liked}\n` +
        `- Confused: ${f.confused}\n` +
        `- Missing: ${f.missing}`
    )
    .join("\n\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "system",
        content:
          "You are a product analyst. Analyze the user feedback provided and return a JSON object with exactly these fields: strengths (array of strings), weaknesses (array of strings), suggestions (array of strings), overallSentiment (one of: 'very positive', 'positive', 'mixed', 'negative', 'very negative'). Be specific and actionable. Return only valid JSON.",
      },
      {
        role: "user",
        content: `Analyze this product feedback:\n\n${feedbackText}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  let parsed: { strengths?: string[]; weaknesses?: string[]; suggestions?: string[]; overallSentiment?: string } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { strengths: [], weaknesses: [], suggestions: [], overallSentiment: "mixed" };
  }

  res.json({
    productId: params.data.id,
    strengths: parsed.strengths ?? [],
    weaknesses: parsed.weaknesses ?? [],
    suggestions: parsed.suggestions ?? [],
    overallSentiment: parsed.overallSentiment ?? "mixed",
    generatedAt: new Date().toISOString(),
  });
});

export default router;
