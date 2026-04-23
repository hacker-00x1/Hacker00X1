import { rateLimit } from "express-rate-limit";

// Rate limiter for login attempts to prevent brute-force attacks
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login requests per windowMs
  message: { message: "Too many login attempts, please try again after 15 minutes" },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// General rate limiter for admin actions
export const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 admin requests per hour
  message: { message: "Too many administrative actions, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
