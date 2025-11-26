import { FastifyInstance } from 'fastify';
import { LicenseStatus } from '@prisma/client';

export class LicensingService {
  constructor(private app: FastifyInstance) {}

  async validateLicense(serial: string) {
    const license = await this.app.prisma.license.findUnique({
      where: { serial },
      include: { plan: true }
    });

    if (!license) {
      return {
        valid: false,
        status: null,
        plan: null,
        expireDate: null
      };
    }

    const isExpired = license.expireDate && new Date(license.expireDate) < new Date();
    const isValid = license.status === LicenseStatus.active && !isExpired && !license.isPaused;

    return {
      valid: isValid,
      status: license.status,
      plan: license.plan ? {
        name: license.plan.name,
        features: license.plan.features
      } : null,
      expireDate: license.expireDate
    };
  }

  async activateLicense(serial: string, hardwareId: string, deviceName: string, appVersion: string) {
    const license = await this.app.prisma.license.findUnique({
      where: { serial }
    });

    if (!license) {
      throw new Error('License not found');
    }

    if (license.status === LicenseStatus.revoked) {
      throw new Error('License is revoked');
    }

    if (license.expireDate && new Date(license.expireDate) < new Date()) {
      throw new Error('License is expired');
    }

    const deviceData = {
      hardwareId,
      deviceName,
      appVersion
    };

    const existingDevice = await this.app.prisma.device.findFirst({
      where: {
        licenseId: license.id,
        hardwareId
      }
    });

    if (existingDevice) {
      await this.app.prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          ...deviceData,
          lastCheckIn: new Date()
        }
      });
    } else {
      if (license.deviceLimit > 0) {
        const activeDevices = await this.app.prisma.device.count({
          where: {
            licenseId: license.id,
            isActive: true
          }
        });

        if (activeDevices >= license.deviceLimit) {
          throw new Error('Device limit exceeded');
        }
      }

      await this.app.prisma.device.create({
        data: {
          licenseId: license.id,
          ...deviceData
        }
      });
    }

    const updated = await this.app.prisma.license.update({
      where: { id: license.id },
      data: {
        hardwareId,
        activationCount: { increment: 1 },
        activationDate: new Date(),
        status: LicenseStatus.active,
        lastCheckIn: new Date()
      }
    });

    return {
      success: true,
      activationDate: updated.activationDate,
      message: 'Device activated successfully.'
    };
  }

  async getSubscriptionStatus(serial: string) {
    const license = await this.app.prisma.license.findUnique({
      where: { serial }
    });

    if (!license) {
      throw new Error('License not found');
    }

    const isExpired = license.expireDate && new Date(license.expireDate) < new Date();
    const status = license.isPaused ? LicenseStatus.paused : 
                   isExpired ? LicenseStatus.expired : 
                   license.status;

    const remainingDays = license.expireDate
      ? Math.ceil((new Date(license.expireDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      status,
      remainingDays: Math.max(0, remainingDays),
      forceLogout: license.isPaused || status === LicenseStatus.revoked
    };
  }

  async checkUpdate(currentVersion: string) {
    const latest = await this.app.prisma.appVersion.findFirst({
      where: { isActive: true },
      orderBy: { releaseDate: 'desc' }
    });

    if (!latest) {
      return {
        hasUpdate: false,
        version: null,
        downloadUrl: null,
        releaseNotes: null,
        forceUpdate: false
      };
    }

    const hasUpdate = !currentVersion || currentVersion !== latest.version;

    return {
      hasUpdate,
      version: latest.version,
      downloadUrl: latest.downloadUrl,
      releaseNotes: latest.releaseNotes,
      forceUpdate: latest.forceUpdate && hasUpdate
    };
  }

  async getConfig() {
    const config = await this.app.prisma.config.findFirst();

    if (!config) {
      return {
        maintenance_mode: false,
        support_phone: '+9647700000000',
        features: {}
      };
    }

    return {
      maintenance_mode: config.maintenance_mode,
      support_phone: config.support_phone,
      features: config.features
    };
  }

  async createSupportTicket(
    serial: string,
    hardwareId: string,
    appVersion: string,
    description: string,
    deviceName?: string,
    systemVersion?: string,
    phoneNumber?: string
  ) {
    const ticket = await this.app.prisma.supportTicket.create({
      data: {
        serial,
        hardwareId,
        appVersion,
        description,
        deviceName: deviceName || 'Unknown',
        systemVersion: systemVersion || 'Unknown',
        phoneNumber: phoneNumber || 'Not provided',
        status: 'open'
      }
    });

    const ticketId = `T-${ticket.id.substring(0, 5).toUpperCase()}`;

    return {
      ticketId,
      status: ticket.status
    };
  }
}
