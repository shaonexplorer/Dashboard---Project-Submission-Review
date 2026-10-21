-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- The legacy catalog entry. Existing submissions are backfilled onto it, so
-- it has to exist before the foreign key is added.
INSERT INTO "Project" ("id", "name", "description", "isActive", "createdAt", "updatedAt")
VALUES ('legacy-01', 'Legacy Submission', 'Project carried over from a previous cohort.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable
-- "projectId" is added nullable first so the backfill below can fill it in.
ALTER TABLE "Submission" ADD COLUMN "projectId" TEXT,
ADD COLUMN "attempt" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "resubmittedAt" TIMESTAMP(3);

-- Backfill every existing submission onto the legacy catalog entry and reset
-- its project name to the catalog name. "attempt" already defaults to 1, so
-- existing rows are at their first attempt without a separate backfill.
UPDATE "Submission" SET "projectId" = 'legacy-01', "projectName" = 'Legacy Submission' WHERE "projectId" IS NULL;

-- Every submission now points at a catalog entry.
ALTER TABLE "Submission" ALTER COLUMN "projectId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex
-- The one-submission-per-student rule is replaced by one-per-project.
DROP INDEX "Submission_studentId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_studentId_projectId_key" ON "Submission"("studentId", "projectId");

-- CreateIndex
CREATE INDEX "Submission_projectId_idx" ON "Submission"("projectId");
