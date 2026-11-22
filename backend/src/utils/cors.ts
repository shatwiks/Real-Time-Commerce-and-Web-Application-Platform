/**
 * CORS Configuration & Allowed Origin Evaluator
 * Supports Vercel production/preview deployments, local development, and custom CORS_ORIGIN
 */

export const DEFAULT_ALLOWED_ORIGINS: string[] = [
  'https://food-full-stack-kappa.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

export const isOriginAllowed = (origin: string | undefined): boolean => {
  // Allow requests with no origin (curl, Postman, mobile apps, server-to-server)
  if (!origin) {
    return true;
  }

  const isProd = process.env.NODE_ENV === 'production';
  const envOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter((o) => o && (!isProd || o !== '*'));

  const allowedList = [...DEFAULT_ALLOWED_ORIGINS, ...envOrigins];
  const normalizedOrigin = origin.replace(/\/+$/, '');

  // Explicit allowlist match (never allow wildcard '*' in production with credentials)
  if (allowedList.includes(normalizedOrigin) || (!isProd && allowedList.includes('*'))) {
    return true;
  }

  // Localhost only in development/test
  if (!isProd && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
    return true;
  }

  // Only allow this project's own Vercel preview deployments
  if (/^https:\/\/food-full-stack-kappa(?:-[a-zA-Z0-9-]+)?\.vercel\.app$/.test(normalizedOrigin)) {
    return true;
  }

  return false;
};
