import fp from 'fastify-plugin';
import { Role } from '@prisma/client';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string; role: Role };
    user: { id: string; email: string; role: Role };
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
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: 'Unauthorized' });
    }
  });

  app.decorate('authorize', (roles: Role[] = []) => {
    return async (request: any, reply: any) => {
      await app.authenticate(request, reply);
      if (roles.length === 0) return;
      if (!request.user || !roles.includes(request.user.role)) {
        reply.code(403).send({ message: 'Forbidden' });
      }
    };
  });
});
