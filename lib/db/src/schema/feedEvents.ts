import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";

export const feedEventsTable = pgTable("feed_events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "product_listed" | "feedback_received" | "milestone"
  productId: integer("product_id").references(() => productsTable.id, { onDelete: "cascade" }),
  productName: text("product_name"),
  userId: text("user_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFeedEventSchema = createInsertSchema(feedEventsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertFeedEvent = z.infer<typeof insertFeedEventSchema>;
export type FeedEvent = typeof feedEventsTable.$inferSelect;
