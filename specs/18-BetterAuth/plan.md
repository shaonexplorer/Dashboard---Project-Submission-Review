# BetterAuth Integration Implementation Plan

## Overview
This plan outlines the step-by-step implementation of BetterAuth to replace the current custom JWT authentication system. The migration will be done in phases to minimize risk and allow rollback.

## Phase 1: Foundation & Database Migration (Week 1)

### 1.1 Install Dependencies

**Server:**
```bash
cd server
npm install better-auth @better-auth/prisma
npm install --save-dev @types/better-auth
```

**Client:**
```bash
cd client
npm install better-auth
```

### 1.2 Update Prisma Schema

**File:** `server/prisma/schema.prisma`

**Changes:**
- Add BetterAuth models (Account, Session, Verification)
- Update User model to match BetterAuth expectations
- Keep existing `UserRole` enum and app relations
- Run migration: `npm run prisma:migrate --name betterauth_migration`

### 1.3 Create BetterAuth Server Instance

**File:** `server/src/lib/auth.ts` (new)
```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../config/prisma";
import { emailAndPassword } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: [process.env.CLIENT_URL!],
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Can enable later
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1 hour
    },
  },
  
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "STUDENT",
        input: false, // Don't allow client to set role
      },
    },
  },
  
  // Callbacks for custom logic
  hooks: {
    after: [
      {
        matcher: (ctx) => ctx.path === "/sign-up/email",
        handler: async (ctx) => {
          // Role is already set to STUDENT by default
          // Could add custom logic here (e.g., send welcome email)
        },
      },
    ],
  },
});

export type Auth = typeof auth;
```

### 1.4 Create Express Auth Routes

**File:** `server/src/modules/auth/auth.routes.ts` (replace)
```typescript
import express from "express";
import { toExpressHandler } from "better-auth/express";
import { auth } from "../../lib/auth";

const router = express.Router();

// Mount BetterAuth handler for all auth routes
router.use("/", toExpressHandler(auth.handler));

export default router;
```

### 1.5 Update Express App

**File:** `server/src/app.ts`
- Import new auth routes
- Mount at `/api/auth` (or `/auth` depending on preference)
- Remove old auth middleware imports

### 1.6 Create BetterAuth Client Instance

**File:** `client/src/lib/auth/client.ts` (new)
```typescript
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:5000",
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: true,
        },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
export type Session = typeof authClient.$Infer.Session;
```

### 1.7 Create Session Provider

**File:** `client/src/providers/auth-provider.tsx` (new)
```typescript
"use client";

import { SessionProvider } from "better-auth/react";
import { authClient } from "@/lib/auth/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider client={authClient}>
      {children}
    </SessionProvider>
  );
}
```

### 1.8 Update Root Layout

**File:** `client/src/app/layout.tsx`
- Wrap app with `AuthProvider`
- Remove old `QueryProvider` if not needed (TanStack Query still used for data)

### 1.9 Create Next.js Auth API Route

**File:** `client/src/app/api/auth/[...all]/route.ts` (new)
```typescript
import { toNextJsHandler } from "better-auth/next-js";
import { authClient } from "@/lib/auth/client";

export const { GET, POST } = toNextJsHandler(authClient.handler);
```

### 1.10 Update Auth Forms

**Files to modify:**
- `client/src/components/auth/login-form.tsx`
- `client/src/components/auth/signup-form.tsx`

**Changes:**
- Replace `useLogin`/`useSignup` hooks with `authClient.signIn`/`signUp`
- Remove local token management (`saveToken`, `getToken`, etc.)
- Use `authClient.useSession` for session state

### 1.11 Update Protected Route Middleware

**File:** `client/src/middleware.ts` (new or update existing)
```typescript
import { authClient } from "@/lib/auth/client";
import { createMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

export const middleware = createMiddleware({
  auth: authClient,
  trustedOrigins: [process.env.NEXT_PUBLIC_BETTER_AUTH_URL!],
});

export default middleware;

export const config = {
  matcher: [
    "/student/:path*",
    "/mentor/:path*",
    "/api/protected/:path*",
  ],
};
```

### 1.12 Update Server-Side Session Access

**File:** `server/src/middleware/auth.middleware.ts` (replace)
```typescript
import type { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth";
import { ApiError } from "../utils/api-error";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    
    if (!session) {
      return next(new ApiError(401, "Missing authentication token"));
    }
    
    req.user = {
      id: session.user.id,
      role: session.user.role as "STUDENT" | "MENTOR",
    };
    next();
  } catch {
    return next(new ApiError(401, "Invalid or expired session"));
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden: insufficient role"));
    }
    next();
  };
};
```

### 1.13 Update Environment Variables

**Server `.env`:**
```env
BETTER_AUTH_SECRET="openssl rand -base64 32"
BETTER_AUTH_URL="http://localhost:5000"
CLIENT_URL="http://localhost:3000"
```

**Client `.env.local`:**
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:5000"
```

### 1.14 Database Migration & Seeding

1. Run migration: `npm run prisma:migrate --name betterauth_migration`
2. Update seed script to use BetterAuth admin API or create users directly
3. Verify mentor account creation works

### 1.15 Testing Checklist (Phase 1)
- [ ] Student signup works
- [ ] Student login works
- [ ] Mentor login works (seeded account)
- [ ] Session persists across refresh
- [ ] Logout works
- [ ] Protected routes redirect correctly
- [ ] Role-based redirects work
- [ ] No hydration mismatches
- [ ] Cookies work cross-domain (dev)

---

## Phase 2: OAuth Providers (Week 2)

### 2.1 Add OAuth Plugins

**File:** `server/src/lib/auth.ts`
```typescript
import { github, google } from "better-auth/plugins";

export const auth = betterAuth({
  // ... existing config
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

### 2.2 Update Client Config

**File:** `client/src/lib/auth/client.ts`
```typescript
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:5000",
  plugins: [
    inferAdditionalFields({ /* ... */ }),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession, social } = authClient;
```

### 2.3 Update SSO Buttons Component

**File:** `client/src/components/auth/sso-buttons.tsx`
- Replace with `authClient.signIn.social()` calls
- Handle OAuth callbacks automatically

### 2.4 Add OAuth Environment Variables

**Server `.env`:**
```env
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## Phase 3: Advanced Features (Week 3+)

### 3.1 Email Verification
- Enable `requireEmailVerification: true`
- Configure email provider (Resend, SendGrid, etc.)
- Add verification email template

### 3.2 Multi-Factor Authentication (MFA)
- Add `twoFactor` plugin
- Configure TOTP for mentor accounts

### 3.3 Passkeys/WebAuthn
- Add `passkey` plugin
- Implement passkey registration/authentication

### 3.4 Admin/Dashboard Features
- Session management UI
- User impersonation (for support)
- Audit logs

---

## Rollback Plan

If issues arise during Phase 1:

1. **Revert Prisma Schema:** `git checkout server/prisma/schema.prisma`
2. **Revert Auth Routes:** `git checkout server/src/modules/auth/`
3. **Revert Client Auth:** `git checkout client/src/lib/auth/ client/src/components/auth/`
4. **Revert Middleware:** `git checkout server/src/middleware/auth.middleware.ts`
5. **Drop Migration:** `npm run prisma:migrate reset` (if needed)

---

## File Structure After Migration

```
server/
├── src/
│   ├── lib/
│   │   └── auth.ts              # BetterAuth server instance
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.routes.ts   # BetterAuth Express handler
│   │       └── auth.middleware.ts # Session verification
│   └── config/
│       └── env.ts               # Add BETTER_AUTH_* validation

client/
├── src/
│   ├── lib/
│   │   └── auth/
│   │       └── client.ts        # BetterAuth React client
│   ├── providers/
│   │   └── auth-provider.tsx    # SessionProvider wrapper
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...all]/
│   │   │           └── route.ts # BetterAuth Next.js handler
│   │   └── middleware.ts        # Route protection
│   └── components/
│       └── auth/
│           ├── login-form.tsx   # Updated to use authClient
│           └── signup-form.tsx  # Updated to use authClient
```

---

## Dependencies Summary

| Package | Location | Version |
|---------|----------|---------|
| `better-auth` | server, client | ^1.x |
| `@better-auth/prisma` | server | ^1.x |
| `better-auth/react` | client | (included) |
| `better-auth/express` | server | (included) |
| `better-auth/next-js` | client | (included) |

---

## Key Implementation Notes

1. **Cookie Domain:** In development, cookies work cross-origin (localhost:3000 ↔ localhost:5000) with `sameSite: "lax"`. In production, configure `sameSite: "none"` with `secure: true` for cross-domain.

2. **Session Token:** BetterAuth stores session token in cookie named `better-auth.session_token` (configurable). The old `token` cookie will be replaced.

3. **User Role:** Stored as additional field on user. Default is `STUDENT`. Mentor role assigned manually or via admin panel.

4. **API Compatibility:** Non-auth endpoints (`/api/submissions/*`, `/api/projects/*`) remain unchanged. Only auth endpoints change.

5. **Type Safety:** Use `inferAdditionalFields` on client for full TypeScript support with custom fields.