# Change Report

## 2026-11-22 07:10 IST — Pre-LinkedIn Production Security Hardening

### Objective
Harden public repository, API middleware, authentication, CORS, error handling, and CI workflow permissions prior to public LinkedIn sharing.

### Files Modified & Created
- `backend/src/controllers/authController.ts` — Removed `'ADMIN'` from public `registerSchema` (closed privilege escalation) and added fail-closed production check for `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/`PREAUTH_SECRET`.
- `backend/src/middleware/auth.ts` — Enforced fail-closed production JWT secret validation.
- `backend/src/utils/cors.ts` — Removed blanket `*.vercel.app` and `*.onrender.com` regexes, restricted localhost regex to non-production, and scoped Vercel previews strictly to `food-full-stack-kappa*.vercel.app`.
- `backend/src/app.ts` — Disabled `x-powered-by`, added HTTP security headers + prod HSTS, capped JSON body at `100kb`, and added per-IP rate limiting on `/api/auth`.
- `backend/src/middleware/errorHandler.ts` — Sanitized `status >= 500` error responses in production.
- `.github/workflows/ci.yml` — Added least-privilege `permissions: contents: read`.
- `SECURITY.md` — Added responsible vulnerability disclosure policy.

### Verification Results
- `node --check --experimental-strip-types` across all 5 modified `.ts` files (PASS), CORS regex unit assertions (PASS), `yaml.safe_load(.github/workflows/ci.yml)` (PASS).
