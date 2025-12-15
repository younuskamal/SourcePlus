import { PrismaClient } from '@prisma/client';

export const invalidateClinicSessions = async (prisma: PrismaClient, clinicId: string) => {
  await prisma.session.deleteMany({
    where: {
      user: {
        clinicId
      }
    }
  });
};

export const invalidateUserSessions = async (prisma: PrismaClient, userId: string) => {
  await prisma.session.deleteMany({
    where: { userId }
  });
};
