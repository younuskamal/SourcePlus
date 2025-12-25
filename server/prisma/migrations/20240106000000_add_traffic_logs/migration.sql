-- CreateTable
CREATE TABLE "TrafficLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "serial" TEXT,
    "hardwareId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "payload" JSONB,
    "response" JSONB,
    "durationMs" DOUBLE PRECISION,
    CONSTRAINT "TrafficLog_pkey" PRIMARY KEY ("id")
);

-- Indexes to speed up filtering
CREATE INDEX "TrafficLog_timestamp_idx" ON "TrafficLog"("timestamp" DESC);
CREATE INDEX "TrafficLog_method_idx" ON "TrafficLog"("method");
CREATE INDEX "TrafficLog_status_idx" ON "TrafficLog"("status");
CREATE INDEX "TrafficLog_serial_idx" ON "TrafficLog"("serial");
CREATE INDEX "TrafficLog_hardware_idx" ON "TrafficLog"("hardwareId");
