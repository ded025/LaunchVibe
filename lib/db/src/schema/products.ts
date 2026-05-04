import { pgTable, text, serial, timestamp, integer, doublePrecision, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  founderClerkId: text("founder_clerk_id").notNull(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  category: text("category").notNull(),
  city: text("city"),
  country: text("country"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  feedbackCount: integer("feedback_count").notNull().default(0),
  avgRating: doublePrecision("avg_rating"),
  score: doublePrecision("score").default(0),
  statusTag: text("status_tag").default("launching"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  feedbackCount: true,
  avgRating: true,
  score: true,
  statusTag: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
