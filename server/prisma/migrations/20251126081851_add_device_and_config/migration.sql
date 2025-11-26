-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "hardwareId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "appVersion" TEXT NOT NULL,
    "systemVersion" TEXT,
    "activationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "support_phone" TEXT NOT NULL DEFAULT '+9647700000000',
    "features" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_licenseId_hardwareId_key" ON "Device"("licenseId", "hardwareId");

-- CreateIndex
CREATE INDEX "Device_hardwareId_idx" ON "Device"("hardwareId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;
