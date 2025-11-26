import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const busRoutes = pgTable("bus_routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeNumber: text("route_number").notNull(),
  routeName: text("route_name").notNull(),
  color: text("color").notNull().default("#2563eb"),
});

export const busStops = pgTable("bus_stops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  routeId: varchar("route_id").references(() => busRoutes.id),
});

export const buses = pgTable("buses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: varchar("route_id").references(() => busRoutes.id).notNull(),
  driverName: text("driver_name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  lastUpdate: timestamp("last_update").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBusRouteSchema = createInsertSchema(busRoutes).omit({
  id: true,
});

export const insertBusStopSchema = createInsertSchema(busStops).omit({
  id: true,
});

export const insertBusSchema = createInsertSchema(buses).omit({
  id: true,
  lastUpdate: true,
});

export const updateBusLocationSchema = z.object({
  id: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  isActive: z.boolean().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type BusRoute = typeof busRoutes.$inferSelect;
export type InsertBusRoute = z.infer<typeof insertBusRouteSchema>;
export type BusStop = typeof busStops.$inferSelect;
export type InsertBusStop = z.infer<typeof insertBusStopSchema>;
export type Bus = typeof buses.$inferSelect;
export type InsertBus = z.infer<typeof insertBusSchema>;
export type UpdateBusLocation = z.infer<typeof updateBusLocationSchema>;
