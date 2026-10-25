# BetterAuth Integration Requirements

## Project Context

**Current Stack:**
- **Frontend:** Next.js 15 (App Router) with React 19, TanStack Query v5, React Hook Form, Zod
- **Backend:** Express.js with TypeScript, Prisma ORM (PostgreSQL), JWT authentication
- **Auth Flow:** Cookie-based JWT (httpOnly, secure in production), stored in `token` cookie
- **Roles:** STUDENT, MENTOR (RBAC enforced on backend)

## Core Requirements

### 1. Authentication Methods
| Method | Required | Notes |
|--------|----------|-------|
| Email/Password | ✅ | Primary authentication for students |
| OAuth (GitHub, Google) | 🔄 Phase 2 | Social login for convenience |
| Magic Link / Passwordless | ❌ | Not in scope |
| MFA (TOTP) | 🔄 Phase 2 | Optional for mentor accounts |

### 2. Session Management
| Feature | Requirement |
|---------|-------------|
| Session Storage | Database-backed (PostgreSQL via Prisma) |
| Session Expiry | 7 days (configurable) |
| Session Refresh | Sliding window (extend on activity) |
| Concurrent Sessions | Multiple allowed per user |
| Session Revocation | Server-side (logout everywhere) |
| Cookie Settings | httpOnly, secure (prod), sameSite: lax/none, 7-day maxAge |

### 3. Database Schema Changes

#### Current User Model (to be migrated)
```prisma
model User {
  id           String   @id @default(uuid())
  fullName     String
  email        String   @unique
  passwordHash String
  role         UserRole @default(STUDENT)
  // ... relations
}
```

#### BetterAuth Required Models (Prisma Adapter)
```prisma
model User {
  id             String    @id @default(uuid())
  name           String?
  email          String?   @unique
  emailVerified  DateTime?
  image          String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  role           UserRole  @default(STUDENT)
  // BetterAuth relations
  accounts       Account[]
  sessions       Session[]
  verifications  Verification[]
  // App relations
  submissions    Submission[] @relation("StudentSubmission")
  reviewedSubmissions Submission[] @relation("SubmissionReviewer")
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id      String   @id @default(uuid())
  token   String   @unique
  identifier String
  expires DateTime
}
```

### 4. Backend API Endpoints (to replace current `/api/auth/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Email/password registration |
| `/api/auth/signin` | POST | Email/password login |
| `/api/auth/signout` | POST | Logout (revoke session) |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/[...all]` | ALL | BetterAuth handler (OAuth callbacks, etc.) |

### 5. Frontend Integration Requirements

#### Client-Side (Next.js App Router)
- BetterAuth React client hooks (`useSession`, `signIn`, `signUp`, `signOut`)
- Session provider wrapping app layout
- Protected route middleware (redirect unauthenticated users)
- Role-based redirects (student → `/student/dashboard`, mentor → `/mentor/dashboard`)

#### Server-Side (Next.js API Routes / Middleware)
- BetterAuth Next.js handler (`toNextJsHandler`) for `/api/auth/[...all]`
- Server-side session access via `auth.api.getSession()`
- Middleware for route protection

### 6. Backend Integration (Express.js)
- BetterAuth Express handler (`toExpressHandler`) for `/auth/*` routes
- Replace custom JWT middleware with BetterAuth session verification
- Maintain RBAC (`authorize` middleware) using BetterAuth session data

### 7. Migration Strategy
| Phase | Scope |
|-------|-------|
| Phase 1 | Core email/password auth, session management, database migration |
| Phase 2 | OAuth providers (GitHub, Google) |
| Phase 3 | MFA, passkeys, advanced features |

### 8. Security Requirements
- Password hashing: Argon2id (BetterAuth default) or bcrypt (configurable)
- CSRF protection: Built-in (BetterAuth handles)
- Rate limiting: Keep existing (auth: 5/min, global: 100/15min)
- Secure cookies: httpOnly, secure (prod), sameSite
- Token rotation: Automatic on session refresh
- Audit logging: Session creation/revocation events

### 9. Environment Variables

#### Server (`.env`)
```env
# BetterAuth
BETTER_AUTH_SECRET="generated-with-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:5000"  # Express backend URL
BETTER_AUTH_TRUSTED_ORIGINS="http://localhost:3000"  # Frontend URL

# Database (existing)
DATABASE_URL="postgresql://..."

# OAuth (Phase 2)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

#### Client (`.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:5000"
```

### 10. Breaking Changes & Migration Notes
1. **User Model:** `fullName` → `name`, add `emailVerified`, `image` fields
2. **Session:** JWT in cookie → Database session with cookie storing sessionToken
3. **API Response Format:** BetterAuth standard responses (may differ from current)
4. **Frontend:** Replace custom `useAuth` hooks with BetterAuth client hooks
5. **Middleware:** Replace custom `authenticate` middleware with BetterAuth session verification

### 11. Compatibility Requirements
- ✅ Maintain existing `UserRole` enum (STUDENT, MENTOR)
- ✅ Preserve existing submission/relation logic
- ✅ Keep existing rate limiting middleware
- ✅ Maintain existing API response format for non-auth endpoints
- ✅ Support gradual migration (can run both during transition)

## Success Criteria
- [ ] All existing auth flows work (signup, login, logout, session check)
- [ ] Role-based access control works (student vs mentor routes)
- [ ] Database migration succeeds without data loss
- [ ] Frontend hydration works without mismatch
- [ ] Cookies work cross-domain (dev: localhost:3000 ↔ localhost:5000)
- [ ] OAuth providers can be added without schema changes
- [ ] Session revocation works (logout everywhere)