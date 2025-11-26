import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    serial?: string;
    hardwareId?: string;
  }
  interface FastifyInstance {
    verifyClient: any;
  }
}

export default fp(async (app) => {
  app.decorate('verifyClient', async (request: any, reply: any) => {
    const serial = request.headers['x-license-serial'] || request.body?.serial || request.query?.serial;
    const hardwareId = request.headers['x-hardware-id'] || request.body?.hardwareId || request.query?.hardwareId;

    if (!serial) {
      return reply.code(400).send({ error: 'License serial is required' });
    }

    request.serial = serial;
    request.hardwareId = hardwareId;
  });
});
