-- Add worker profile extras to User
ALTER TABLE "User" ADD COLUMN "certificates" TEXT;
ALTER TABLE "User" ADD COLUMN "portfolio" TEXT;
ALTER TABLE "User" ADD COLUMN "cvFile" TEXT;
ALTER TABLE "User" ADD COLUMN "cvFilename" TEXT;

-- Create Contract table
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER,
    "jobId" INTEGER,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "salary" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "workerId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "employerName" TEXT NOT NULL,
    "daysSinceRequest" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER,
    "review" TEXT,
    "commissionPaidWorker" BOOLEAN NOT NULL DEFAULT false,
    "commissionPaidEmployer" BOOLEAN NOT NULL DEFAULT false,
    "logo" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- Create unique index on applicationId
CREATE UNIQUE INDEX "Contract_applicationId_key" ON "Contract"("applicationId");

-- Create SavedJob table
CREATE TABLE "SavedJob" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on userId + jobId
CREATE UNIQUE INDEX "SavedJob_userId_jobId_key" ON "SavedJob"("userId", "jobId");

-- Create Bid table
CREATE TABLE "Bid" (
    "id" SERIAL NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" INTEGER,
    "leadTitle" TEXT,
    "proposedPrice" INTEGER NOT NULL,
    "proposedStaff" INTEGER NOT NULL,
    "coverLetter" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on companyId + jobId
CREATE UNIQUE INDEX "Bid_companyId_jobId_key" ON "Bid"("companyId", "jobId");

-- Add foreign keys for Contract
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign keys for SavedJob
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign keys for Bid
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;