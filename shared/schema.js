import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const blogs = pgTable("blogs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  date: text("date").notNull(),
  readTime: text("read_time").notNull(),
  author: text("author").notNull(),
  image: text("image").notNull(),
  content: text("content").notNull(),
});

export const writeups = pgTable("writeups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  date: text("date").notNull(),
  readTime: text("read_time").notNull(),
  category: text("category").notNull(),
  author: text("author").notNull(),
  severity: text("severity").notNull(),
  sourceUrl: text("source_url").notNull(),
  image: text("image").notNull(),
  content: text("content").notNull(),
});

export const insertBlogSchema = createInsertSchema(blogs).omit({ id: true });
export const insertWriteupSchema = createInsertSchema(writeups).omit({ id: true });

export const aboutMe = pgTable("about_me", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
});

export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  author: text("author").notNull(),
  cover: text("cover").notNull(),
  desc: text("desc").notNull(),
  link: text("link").notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAboutMeSchema = createInsertSchema(aboutMe).omit({ id: true });
export const insertBookSchema = createInsertSchema(books).omit({ id: true });
export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true });

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
