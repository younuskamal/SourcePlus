import { LicenseStatus, Plan } from '@prisma/client';

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const segment = (len: number) => {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
};

export const generateSerial = (plan: Plan) => {
  const today = new Date();
  const prefix = plan.priceUSD === 0 ? 'TR' : 'SP';
  return `${prefix}-${today.getFullYear()}-${segment(4)}-${segment(4)}-${segment(4)}`;
};

export const getDefaultLicenseStatus = (): LicenseStatus => LicenseStatus.pending;
