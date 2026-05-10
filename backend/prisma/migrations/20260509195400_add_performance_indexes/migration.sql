-- CreateIndex
CREATE INDEX "Application_jobId_aiScore_idx" ON "Application"("jobId", "aiScore" DESC);

-- CreateIndex
CREATE INDEX "Application_candidateId_createdAt_idx" ON "Application"("candidateId", "createdAt");

-- CreateIndex
CREATE INDEX "Job_status_createdAt_idx" ON "Job"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Job_location_idx" ON "Job"("location");
