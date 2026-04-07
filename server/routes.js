import { storage } from "./storage.js";
import multer from "multer";
import path from "path";
import fs from "fs";

import { adminLimiter } from "./middleware/rate-limit.js";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage_multer });

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(httpServer, app) {
  // Public routes
  app.get("/api/blogs", async (req, res) => {
    const blogs = await storage.getBlogs();
    res.json(blogs);
  });

  app.get("/api/writeups", async (req, res) => {
    const writeups = await storage.getWriteups();
    res.json(writeups);
  });

  app.get("/api/blogs/:id", async (req, res) => {
    const blog = await storage.getBlog(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  });

  app.get("/api/writeups/:id", async (req, res) => {
    const writeup = await storage.getWriteup(req.params.id);
    if (!writeup) return res.status(404).json({ message: "Writeup not found" });
    res.json(writeup);
  });

  app.get("/api/books", async (req, res) => {
    const books = await storage.getBooks();
    res.json(books);
  });

  app.get("/api/books/:id", async (req, res) => {
    const book = await storage.getBook(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  });

  // Protected Admin routes
  app.post("/api/blogs", adminLimiter, isAuthenticated, async (req, res) => {
    const blog = await storage.createBlog(req.body);
    res.status(201).json(blog);
  });

  app.patch("/api/blogs/:id", adminLimiter, isAuthenticated, async (req, res) => {
    const updated = await storage.updateBlog(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Blog not found" });
    res.json(updated);
  });

  app.delete("/api/blogs/:id", adminLimiter, isAuthenticated, async (req, res) => {
    const success = await storage.deleteBlog(req.params.id);
    if (!success) return res.status(404).json({ message: "Blog not found" });
    res.sendStatus(204);
  });

  app.post("/api/writeups", adminLimiter, isAuthenticated, async (req, res) => {
    const writeup = await storage.createWriteup(req.body);
    res.status(201).json(writeup);
  });

  app.patch("/api/writeups/:id", adminLimiter, isAuthenticated, async (req, res) => {
    const updated = await storage.updateWriteup(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Writeup not found" });
    res.json(updated);
  });

  app.delete("/api/writeups/:id", adminLimiter, isAuthenticated, async (req, res) => {
    const success = await storage.deleteWriteup(req.params.id);
    if (!success) return res.status(404).json({ message: "Writeup not found" });
    res.sendStatus(204);
  });

  app.post("/api/books", adminLimiter, isAuthenticated, async (req, res) => {
    const book = await storage.createBook(req.body);
    res.status(201).json(book);
  });

  app.patch("/api/books/:id", adminLimiter, isAuthenticated, async (req, res) => {
    const updated = await storage.updateBook(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Book not found" });
    res.json(updated);
  });

  app.delete("/api/books/:id", adminLimiter, isAuthenticated, async (req, res) => {
    const success = await storage.deleteBook(req.params.id);
    if (!success) return res.status(404).json({ message: "Book not found" });
    res.sendStatus(204);
  });

  // About Me routes
  app.get("/api/about", async (req, res) => {
    const about = await storage.getAboutMe();
    res.json(about);
  });

  app.patch("/api/about", adminLimiter, isAuthenticated, async (req, res) => {
    const { content } = req.body;
    if (typeof content !== "string") {
      return res.status(400).json({ message: "Content must be a string" });
    }
    const updated = await storage.updateAboutMe(content);
    res.json(updated);
  });

  // Contact Message routes
  app.get("/api/messages", adminLimiter, isAuthenticated, async (req, res) => {
    const messages = await storage.getContactMessages();
    res.json(messages);
  });

  app.post("/api/contact", async (req, res) => {
    const msg = await storage.createContactMessage(req.body);
    res.status(201).json(msg);
  });

  app.delete("/api/messages/:id", adminLimiter, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteContactMessage(id);
    if (!success) return res.status(404).json({ message: "Message not found" });
    res.sendStatus(204);
  });

  // Image upload route
  app.post("/api/upload", adminLimiter, isAuthenticated, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

  return httpServer;
}
