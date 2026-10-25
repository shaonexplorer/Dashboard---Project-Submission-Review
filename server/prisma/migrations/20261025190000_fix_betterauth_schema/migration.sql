-- Fix BetterAuth Schema Migration
-- This migration updates the Account, Session, and Verification tables
-- to match the BetterAuth Prisma adapter v1.7.12 expected schema.

-- 1. Fix Account table
-- Drop old columns that are no longer used by the adapter
ALTER TABLE "account" DROP COLUMN IF EXISTS "type";
ALTER TABLE "account" DROP COLUMN IF EXISTS "provider";
ALTER TABLE "account" DROP COLUMN IF EXISTS "providerAccountId";
ALTER TABLE "account" DROP COLUMN IF EXISTS "refresh_token";
ALTER TABLE "account" DROP COLUMN IF EXISTS "access_token";
ALTER TABLE "account" DROP COLUMN IF EXISTS "expires_at";
ALTER TABLE "account" DROP COLUMN IF EXISTS "token_type";
ALTER TABLE "account" DROP COLUMN IF EXISTS "scope";
ALTER TABLE "account" DROP COLUMN IF EXISTS "id_token";
ALTER TABLE "account" DROP COLUMN IF EXISTS "session_state";

-- Add new columns if they don't exist (they should exist from previous migration)
-- The previous migration 20261025105704 already added these columns
-- But we need to ensure they are NOT NULL where required
ALTER TABLE "account" ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "account" ALTER COLUMN "providerId" SET NOT NULL;
ALTER TABLE "account" ALTER COLUMN "userId" SET NOT NULL;

-- Drop old unique constraint and add new one
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_provider_providerAccountId_key";
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "Account_provider_providerAccountId_key";

-- Add new unique constraint on providerId + accountId
CREATE UNIQUE INDEX IF NOT EXISTS "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- 2. Fix Session table
-- Drop old 'expires' column (renamed to expiresAt in new schema)
ALTER TABLE "session" DROP COLUMN IF EXISTS "expires";

-- Ensure token and sessionToken are properly set
ALTER TABLE "session" ALTER COLUMN "token" SET NOT NULL;
ALTER TABLE "session" ALTER COLUMN "sessionToken" SET NOT NULL;
ALTER TABLE "session" ALTER COLUMN "expiresAt" SET NOT NULL;

-- Drop old unique constraint and add new one
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_token_key";
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_sessionToken_key";
CREATE UNIQUE INDEX IF NOT EXISTS "session_token_key" ON "session"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "session_sessionToken_key" ON "session"("sessionToken");

-- 3. Fix Verification table
-- Drop old 'expires' column (renamed to expiresAt in new schema)
ALTER TABLE "verification" DROP COLUMN IF EXISTS "expires";

-- Ensure value and expiresAt are properly set
ALTER TABLE "verification" ALTER COLUMN "value" SET NOT NULL;
ALTER TABLE "verification" ALTER COLUMN "expiresAt" SET NOT NULL;