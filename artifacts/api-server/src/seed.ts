import { db, productsTable, feedbackTable } from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  const existingProducts = await db.select().from(productsTable);
  if (existingProducts.length > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const [p1] = await db.insert(productsTable).values({
    founderClerkId: "seed_founder_1",
    name: "FlowSync",
    tagline: "Automate your team's workflows in minutes",
    description: "FlowSync connects your tools and automates repetitive tasks so your team can focus on what matters.",
    websiteUrl: "https://flowsync.io",
    category: "Productivity",
    feedbackCount: 3,
    avgRating: 4.3,
  }).returning();

  const [p2] = await db.insert(productsTable).values({
    founderClerkId: "seed_founder_2",
    name: "Notion AI",
    tagline: "Write, plan, and get organized with AI",
    description: "The connected workspace where better, faster work happens. Now with built-in AI to help you work smarter.",
    websiteUrl: "https://notion.so",
    category: "Productivity",
    feedbackCount: 2,
    avgRating: 4.5,
  }).returning();

  const [p3] = await db.insert(productsTable).values({
    founderClerkId: "seed_founder_3",
    name: "Stripe Atlas",
    tagline: "Start and scale your company from anywhere",
    description: "The easiest way to start an internet business. Incorporate your company and get access to Stripe, AWS, and more.",
    websiteUrl: "https://stripe.com/atlas",
    category: "Finance",
    feedbackCount: 1,
    avgRating: 4.0,
  }).returning();

  await db.insert(feedbackTable).values([
    {
      productId: p1.id,
      liked: "The automation builder is incredibly intuitive. Saved us hours every week.",
      confused: "The pricing tiers are a bit confusing at first glance.",
      missing: "Would love a mobile app to monitor workflows on the go.",
      wouldPay: true,
      rating: 5,
    },
    {
      productId: p1.id,
      liked: "Connects with all the tools we use. Slack, Notion, GitHub — all seamlessly.",
      confused: "Documentation could be clearer for advanced use cases.",
      missing: "Conditional branching in workflows needs more options.",
      wouldPay: true,
      rating: 4,
    },
    {
      productId: p1.id,
      liked: "Clean UI that feels premium compared to Zapier.",
      confused: "Onboarding flow could be smoother.",
      missing: "Better error messages when automations fail.",
      wouldPay: true,
      rating: 4,
    },
    {
      productId: p2.id,
      liked: "AI suggestions in documents are surprisingly good and relevant.",
      confused: "Performance can lag with very large workspaces.",
      missing: "Offline mode would be a game changer.",
      wouldPay: true,
      rating: 5,
    },
    {
      productId: p2.id,
      liked: "The block system is genius. Everything just works together.",
      confused: "Sometimes hard to find settings buried in menus.",
      missing: "More granular permission controls for teams.",
      wouldPay: true,
      rating: 4,
    },
    {
      productId: p3.id,
      liked: "Made incorporating my startup incredibly simple from overseas.",
      confused: "The legal document explanations could be in plainer English.",
      missing: "Would love a dashboard showing company health metrics.",
      wouldPay: false,
      rating: 4,
    },
  ]);

  console.log("Seeding complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
