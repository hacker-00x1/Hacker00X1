import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage.js";

import { loginLimiter } from "./middleware/rate-limit.js";

export function setupAuth(app) {
  const SessionStore = MemoryStore(session);
  const sessionSettings = {
    secret: "supersecretkey", // In production, use an environment variable
    resave: true, // Force resave to ensure session is updated
    saveUninitialized: true, // Force save uninitialized to ensure session exists
    proxy: true,
    cookie: { 
      secure: false, // Set to true if using HTTPS
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new SessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[AUTH] Attempt: username="${username}"`);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`[AUTH] Failed: User "${username}" not found in storage.`);
          return done(null, false, { message: "Invalid username or password" });
        }
        if (user.password !== password) {
          console.log(`[AUTH] Failed: Password mismatch for user "${username}".`);
          return done(null, false, { message: "Invalid username or password" });
        }
        console.log(`[AUTH] Success: User "${username}" authenticated.`);
        return done(null, user);
      } catch (err) {
        console.error(`[AUTH] Error: ${err}`);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err);
    }
  });

  // Login route
  app.post("/api/login", loginLimiter, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Login failed" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Check auth status
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}
