# BetterAuth Validation Rules & Schemas

## Overview
This document defines all validation rules for BetterAuth integration, covering both server-side (Zod + BetterAuth) and client-side (React Hook Form + Zod) validation.

---

## 1. Server-Side Validation (BetterAuth + Zod)

### 1.1 Email/Password Signup

**BetterAuth Configuration** (`server/src/lib/auth.ts`):
```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: false,
  minPasswordLength: 8,
  maxPasswordLength: 128,
  // BetterAuth uses built-in validation
}
```

**Additional Custom Validation** (if needed via hooks):
```typescript
hooks: {
  before: [
    {
      matcher: (ctx) => ctx.path === "/sign-up/email",
      handler: async (ctx) => {
        const { email, password, name } = ctx.body;
        
        // Custom email domain validation (optional)
        const allowedDomains = ["university.edu", "student.university.edu"];
        const domain = email.split("@")[1];
        if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
          throw new Error("Email domain not allowed");
        }
        
        // Custom password strength (BetterAuth handles min length)
        // Add custom rules here if needed
        
        // Sanitize name
        ctx.body.name = name.trim();
      },
    },
  ],
}
```

### 1.2 Email/Password Sign In

**BetterAuth handles validation automatically:**
- Email format validation
- Password presence
- Account existence check
- Rate limiting (configured separately)

### 1.3 Social Login (OAuth)

**Validation handled by OAuth providers:**
- GitHub: Email verified by GitHub
- Google: Email verified by Google
- BetterAuth creates/links accounts automatically

### 1.4 Session Validation

**Middleware** (`server/src/middleware/auth.middleware.ts`):
```typescript
// Session validation is handled by BetterAuth internally
// Custom middleware only extracts and verifies session
```

---

## 2. Client-Side Validation (Zod Schemas)

### 2.1 Login Schema

**File:** `client/src/lib/validations/auth.ts`
```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(254, "Email is too long")
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password is too long"),
  
  // Optional: remember me (handled by session duration)
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

### 2.2 Signup Schema

**File:** `client/src/lib/validations/auth.ts`
```typescript
export const signupSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
    .trim(),
  
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(254, "Email is too long")
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SignupInput = z.infer<typeof signupSchema>;
```

### 2.3 Password Strength Indicator (Client-Side Only)

**Utility:** `client/src/lib/utils/password-strength.ts`
```typescript
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  
  const score = Object.values(checks).filter(Boolean).length as 0 | 1 | 2 | 3 | 4;
  
  const labels = [
    "Very Weak",
    "Weak", 
    "Fair",
    "Strong",
    "Very Strong",
  ];
  
  const colors = [
    "text-red-500",
    "text-orange-500",
    "text-yellow-500",
    "text-lime-500",
    "text-green-500",
  ];
  
  return {
    score,
    label: labels[score],
    color: colors[score],
    checks,
  };
}
```

---

## 3. BetterAuth Plugin Validation

### 3.1 Email Verification Plugin (Future)

```typescript
import { emailVerification } from "better-auth/plugins";

emailVerification: {
  enabled: true,
  sendVerificationEmail: async ({ user, token, url }) => {
    // Integrate with email provider (Resend, SendGrid, etc.)
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: `<a href="${url}">Verify Email</a>`,
    });
  },
  expiresIn: 60 * 60 * 24, // 24 hours
}
```

### 3.2 Two-Factor Authentication (Future)

```typescript
import { twoFactor } from "better-auth/plugins";

twoFactor: {
  enabled: true,
  issuer: "Project Submission Dashboard",
  // TOTP validation handled automatically
}
```

### 3.3 Passkey/WebAuthn (Future)

```typescript
import { passkey } from "better-auth/plugins";

passkey: {
  enabled: true,
  rpName: "Project Submission Dashboard",
  rpID: "localhost", // production domain
}
```

---

## 4. API Response Validation

### 4.1 BetterAuth Standard Responses

**Success Response:**
```typescript
interface AuthSuccessResponse {
  success: true;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      image?: string;
      role: "STUDENT" | "MENTOR";
      createdAt: string;
      updatedAt: string;
    };
    session?: {
      id: string;
      expiresAt: string;
      token: string;
    };
  };
}
```

**Error Response:**
```typescript
interface AuthErrorResponse {
  success: false;
  message: string;
  code?: string; // BETTER_AUTH_ERROR_CODES
  statusCode: number;
}
```

### 4.2 Error Codes Mapping

| BetterAuth Code | HTTP Status | Client Message |
|-----------------|-------------|----------------|
| `USER_ALREADY_EXISTS` | 409 | "An account with this email already exists" |
| `INVALID_CREDENTIALS` | 401 | "Invalid email or password" |
| `SESSION_EXPIRED` | 401 | "Your session has expired. Please sign in again." |
| `SESSION_REVOKED` | 401 | "You have been logged out. Please sign in again." |
| `EMAIL_NOT_VERIFIED` | 403 | "Please verify your email before signing in" |
| `RATE_LIMIT_EXCEEDED` | 429 | "Too many attempts. Please try again later." |
| `INVALID_TOKEN` | 400 | "Invalid or expired token" |
| `OAUTH_ERROR` | 400 | "Authentication failed. Please try again." |

---

## 5. Frontend Form Integration

### 5.1 Login Form with React Hook Form

```typescript
// client/src/components/auth/login-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "better-auth/react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    
    try {
      const result = await signIn("email", {
        email: data.email,
        password: data.password,
        callbackURL: data.rememberMe ? "/student/dashboard" : undefined,
      });
      
      if (result.error) {
        setServerError(result.error.message || "Login failed");
      }
      // Success redirects handled by BetterAuth
    } catch (error) {
      setServerError("An unexpected error occurred");
    }
  }

  // ... render form with form.register()
}
```

### 5.2 Signup Form with React Hook Form

```typescript
// client/src/components/auth/signup-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "better-auth/react";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { calculatePasswordStrength } from "@/lib/utils/password-strength";

export function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // Real-time validation
  });

  // Update password strength on change
  const password = form.watch("password");
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  async function onSubmit(data: SignupInput) {
    setServerError(null);
    
    try {
      const result = await signUp("email", {
        name: data.fullName,
        email: data.email,
        password: data.password,
        callbackURL: "/student/dashboard",
      });
      
      if (result.error) {
        setServerError(result.error.message || "Signup failed");
      }
      // Success redirects handled by BetterAuth
    } catch (error) {
      setServerError("An unexpected error occurred");
    }
  }

  // ... render form with password strength indicator
}
```

---

## 6. Rate Limiting Validation

### 6.1 Server-Side (Keep Existing)

**File:** `server/src/middleware/authRateLimiter.middleware.ts`
```typescript
import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { success: false, message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || "unknown",
});
```

### 6.2 BetterAuth Built-in Rate Limiting

BetterAuth includes rate limiting for auth endpoints. Configure in auth instance:

```typescript
// server/src/lib/auth.ts
export const auth = betterAuth({
  // ...
  rateLimit: {
    window: 60, // 1 minute
    max: 10, // 10 requests per window
    // Custom storage can be added for distributed rate limiting
  },
});
```

---

## 7. Database Validation (Prisma)

### 7.1 User Model Constraints

```prisma
model User {
  id             String    @id @default(uuid())
  name           String?   @db.VarChar(100)
  email          String?   @unique @db.VarChar(254)
  emailVerified  DateTime?
  image          String?
  role           UserRole  @default(STUDENT)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  // Indexes for performance
  @@index([email])
  @@index([role])
}
```

### 7.2 Account Model Constraints

```prisma
model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String  // "oauth", "email", "credentials"
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@index([userId])
}
```

### 7.3 Session Model Constraints

```prisma
model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([expires])
}
```

---

## 8. Environment Variable Validation

### 8.1 Server (`server/src/config/env.ts`)

```typescript
import { z } from "zod";

const envSchema = z.object({
  // Existing
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().url(),
  SEED_MENTOR_PASSWORD: z.string().min(8),
  
  // BetterAuth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().url().optional(),
  
  // OAuth (Phase 2)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

### 8.2 Client (`client/src/lib/utils/env.ts`)

```typescript
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url(),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});
```

---

## 9. Middleware Validation

### 9.1 Next.js Middleware (Route Protection)

```typescript
// client/src/middleware.ts
import { authClient } from "@/lib/auth/client";
import { createMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { NextResponse } from "next/server";

export const middleware = createMiddleware({
  auth: authClient,
  trustedOrigins: [process.env.NEXT_PUBLIC_BETTER_AUTH_URL!],
});

export default async function middleware(request: NextRequest) {
  const session = await authClient.api.getSession({
    headers: request.headers,
  });
  
  // Protect student routes
  if (request.nextUrl.pathname.startsWith("/student")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth?tab=login&redirectTo=" + request.nextUrl.pathname, request.url));
    }
    if (session.user.role !== "STUDENT") {
      return NextResponse.redirect(new URL("/mentor/dashboard", request.url));
    }
  }
  
  // Protect mentor routes
  if (request.nextUrl.pathname.startsWith("/mentor")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth?tab=login&redirectTo=" + request.nextUrl.pathname, request.url));
    }
    if (session.user.role !== "MENTOR") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/mentor/:path*",
  ],
};
```

---

## 10. Testing Validation Rules

### 10.1 Unit Tests (Vitest)

```typescript
// client/src/lib/validations/auth.test.ts
import { describe, it, expect } from "vitest";
import { loginSchema, signupSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });
  
  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain("email");
  });
});

describe("signupSchema", () => {
  it("accepts valid signup data", () => {
    const result = signupSchema.safeParse({
      fullName: "John Doe",
      email: "john@example.com",
      password: "SecurePass123!",
      confirmPassword: "SecurePass123!",
    });
    expect(result.success).toBe(true);
  });
  
  it("rejects weak password", () => {
    const result = signupSchema.safeParse({
      fullName: "John Doe",
      email: "john@example.com",
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });
  
  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      fullName: "John Doe",
      email: "john@example.com",
      password: "SecurePass123!",
      confirmPassword: "DifferentPass123!",
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain("confirmPassword");
  });
});
```

---

## 11. Validation Checklist

### Pre-Deployment
- [ ] All Zod schemas parse without errors
- [ ] BetterAuth configuration validates on startup
- [ ] Prisma schema migrations apply cleanly
- [ ] Environment variables validated in CI/CD
- [ ] Rate limiting configured on both layers
- [ ] Error messages user-friendly and non-revealing
- [ ] Password strength requirements documented
- [ ] OAuth callback URLs configured in providers

### Post-Deployment
- [ ] Signup flow works end-to-end
- [ ] Login flow works end-to-end
- [ ] Session persists across browser restart
- [ ] Logout revokes session server-side
- [ ] Protected routes redirect correctly
- [ ] Role-based access works
- [ ] No console errors in browser
- [ ] No hydration mismatches

---

## 12. Migration Validation

### Data Integrity Checks

```sql
-- Run after migration to verify data integrity
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email,
  COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as users_with_name,
  COUNT(CASE WHEN role IS NOT NULL THEN 1 END) as users_with_role
FROM "User";

-- Verify unique constraints
SELECT email, COUNT(*) 
FROM "User" 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Verify BetterAuth tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('Account', 'Session', 'Verification');
```

---

## 13. Security Validation Rules

| Rule | Implementation |
|------|----------------|
| Password min length | 8 characters (BetterAuth + Zod) |
| Password complexity | Upper + lower + number + special (Zod) |
| Email format | RFC 5322 compliant (Zod + BetterAuth) |
| Email uniqueness | DB unique constraint + BetterAuth check |
| Session expiry | 7 days (configurable) |
| Session rotation | Every 24 hours activity |
| CSRF protection | Built-in (BetterAuth) |
| Rate limiting | 5/min auth, 100/15min global |
| Secure cookies | httpOnly, secure, sameSite |
| Token storage | Database sessions, not JWT in cookie |
| Audit logging | Session create/revoke events |