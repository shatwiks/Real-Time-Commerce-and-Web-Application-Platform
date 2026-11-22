import express from 'express';
import cors from 'cors';
import { isOriginAllowed } from './utils/cors.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { restaurantRouter } from './routes/restaurants.js';
import { menuRouter } from './routes/menu.js';
import { orderRouter } from './routes/orders.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
if (isProd) {
  app.set('trust proxy', 1);
}

// Defense-in-depth HTTP security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Rejected request from origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// Sliding-window per-IP rate limiter for auth endpoints (bypassed in automated tests)
if (process.env.NODE_ENV !== 'test') {
  const authBuckets = new Map<string, { count: number; start: number }>();
  const WINDOW_MS = 60 * 1000;
  app.use('/api/auth', (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    if (authBuckets.size > 10000) {
      for (const [k, v] of authBuckets.entries()) {
        if (now - v.start >= WINDOW_MS) authBuckets.delete(k);
      }
    }
    const entry = authBuckets.get(ip);
    if (!entry || now - entry.start >= WINDOW_MS) {
      authBuckets.set(ip, { count: 1, start: now });
      return next();
    }
    entry.count += 1;
    if (entry.count > 25) {
      return res.status(429).json({ status: 'error', message: 'Too many authentication requests. Please retry shortly.' });
    }
    return next();
  });
}

app.use(express.json({ limit: '100kb' }));
app.use('/', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api', menuRouter);
app.use('/api/orders', orderRouter);
app.use(errorHandler);