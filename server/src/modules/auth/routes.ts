import { FastifyInstance } from 'fastify';
import argon2 from 'argon2';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export default async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);
    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user) return reply.code(401).send({ message: 'Invalid credentials' });

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) return reply.code(401).send({ message: 'Invalid credentials' });

    const accessToken = app.jwt.sign({ id: user.id, role: user.role, email: user.email }, { expiresIn: '15m' });
    const refreshToken = app.jwt.sign({ id: user.id, role: user.role, email: user.email }, { expiresIn: '7d' });

    await app.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      }
    });

    await app.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: request.ip }
    });

    await logAudit(app, { userId: user.id, action: 'LOGIN', details: `User ${email} logged in`, ip: request.ip });

    return reply.send({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  });

  app.post('/refresh', async (request, reply) => {
    const auth = request.body as { refreshToken?: string };
    if (!auth?.refreshToken) return reply.code(400).send({ message: 'Missing refresh token' });

    try {
      const payload = app.jwt.verify(auth.refreshToken) as any;
      const session = await app.prisma.session.findUnique({ where: { refreshToken: auth.refreshToken } });
      if (!session || session.expiresAt < new Date()) throw new Error('Expired');

      const accessToken = app.jwt.sign({ id: payload.id, role: payload.role, email: payload.email }, { expiresIn: '15m' });
      return reply.send({ accessToken });
    } catch {
      return reply.code(401).send({ message: 'Invalid refresh token' });
    }
  });

  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user!;
    const user = await app.prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return reply.code(404).send({ message: 'User not found' });
    return reply.send({ id: user.id, name: user.name, email: user.email, role: user.role });
  });
}
