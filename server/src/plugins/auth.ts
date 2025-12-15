import fp from 'fastify-plugin';
import { RegistrationStatus, Role } from '@prisma/client';
import { invalidateClinicSessions, invalidateUserSessions } from '../utils/session.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; clinicId?: string | null; role: Role };
    user: {
      userId: string;
      clinicId?: string | null;
      role: Role;
      status?: RegistrationStatus;
      clinicStatus?: RegistrationStatus | null;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
    authorize: (roles?: Role[]) => any;
  }
}

export default fp(async (app) => {
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      const payload = await request.jwtVerify();
      const user = await app.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true, clinicId: true, status: true }
      });

      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }

      if (user.status !== RegistrationStatus.APPROVED) {
        await invalidateUserSessions(app.prisma, user.id);
        return reply.code(403).send({ message: 'الحساب غير مفعّل' });
      }

      let clinicStatus: RegistrationStatus | null = null;
      if (user.clinicId) {
        const clinic = await app.prisma.clinic.findUnique({
          where: { id: user.clinicId },
          select: { status: true }
        });

        clinicStatus = clinic?.status ?? null;

        if (clinicStatus !== RegistrationStatus.APPROVED) {
          await invalidateClinicSessions(app.prisma, user.clinicId);
          return reply.code(403).send({ message: 'العيادة غير مفعّلة' });
        }
      }

      request.user = {
        ...payload,
        status: user.status,
        clinicStatus
      };
    } catch (err) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }
  });

  app.decorate('authorize', (roles: Role[] = []) => {
    return async (request: any, reply: any) => {
      await app.authenticate(request, reply);
      if (reply.sent) return; // If authenticate sent a reply, stop
      if (roles.length === 0) return;
      if (!request.user || !roles.includes(request.user.role)) {
        return reply.code(403).send({ message: 'Forbidden' });
      }
    };
  });
});
