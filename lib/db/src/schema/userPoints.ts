import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userPointsTable = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  points: integer("points").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  badges: text("badges").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserPointsSchema = createInsertSchema(userPointsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserPoints = z.infer<typeof insertUserPointsSchema>;
export type UserPoints = typeof userPointsTable.$inferSelect;
