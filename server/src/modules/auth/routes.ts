import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { RegistrationStatus, Role } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';
import { invalidateClinicSessions, invalidateUserSessions } from '../../utils/session.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'developer', 'viewer']).default('viewer')
});

const authRateLimit = { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } };

const buildTokens = (app: FastifyInstance, user: { id: string; role: Role; clinicId?: string | null }) => {
  const payload = { userId: user.id, clinicId: user.clinicId ?? null, role: user.role };
  const accessToken = app.jwt.sign(payload, { expiresIn: '15m' });
  const refreshToken = app.jwt.sign(payload, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export default async function authRoutes(app: FastifyInstance) {
  // --- SYSTEM ADMIN LOGIN ---
  app.post('/admin-login', authRateLimit, async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);
    const user = await app.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return reply.code(401).send({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    if (user.role === Role.clinic_admin) {
      return reply.code(403).send({ message: 'غير مصرح لك بالدخول إلى لوحة الإدارة' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    if (user.status !== RegistrationStatus.APPROVED) {
      await invalidateUserSessions(app.prisma, user.id);
      return reply.code(403).send({ message: 'الحساب معلق أو بانتظار الموافقة' });
    }

    const { accessToken, refreshToken } = buildTokens(app, user);

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

    await logAudit(app, {
      userId: user.id,
      action: 'LOGIN',
      details: `Admin/Dev ${email} logged in`,
      ip: request.ip
    });

    return reply.send({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId
      }
    });
  });

  // --- CLINIC APP LOGIN ---
  app.post('/login', authRateLimit, async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);
    const user = await app.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return reply.code(401).send({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    if (user.role !== Role.clinic_admin) {
      return reply.code(403).send({ message: 'غير مصرح. هذا الرابط مخصص للعيادات فقط.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    if (!user.clinicId) {
      await invalidateUserSessions(app.prisma, user.id);
      return reply.code(403).send({ message: 'لم يتم ربط الحساب بعيادة' });
    }

    if (user.status !== RegistrationStatus.APPROVED) {
      await invalidateUserSessions(app.prisma, user.id);
      return reply.code(403).send({ message: 'الحساب بانتظار تفعيل الإدارة' });
    }

    const clinic = await app.prisma.clinic.findUnique({ where: { id: user.clinicId } });
    if (!clinic) {
      await invalidateUserSessions(app.prisma, user.id);
      return reply.code(404).send({ message: 'العيادة غير موجودة' });
    }

    if (clinic.status !== RegistrationStatus.APPROVED) {
      await invalidateClinicSessions(app.prisma, clinic.id);
      const message =
        clinic.status === RegistrationStatus.PENDING
          ? 'العيادة بانتظار موافقة الإدارة'
          : clinic.status === RegistrationStatus.SUSPENDED
            ? 'تم تعليق العيادة مؤقتاً'
            : 'تم رفض العيادة';
      return reply.code(403).send({ message });
    }

    const { accessToken, refreshToken } = buildTokens(app, user);

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

    await logAudit(app, {
      userId: user.id,
      action: 'LOGIN',
      details: `Clinic Admin ${email} logged in`,
      ip: request.ip
    });

    return reply.send({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId
      }
    });
  });

  // Register new user (admin only can create users)
  app.post('/register', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const { name, email, password, role } = registerSchema.parse(request.body);

    const existingUser = await app.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.code(409).send({ message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await app.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role
      }
    });

    await logAudit(app, {
      userId: request.user?.userId,
      action: 'USER_CREATE',
      details: `Created new user ${email} with role ${role}`,
      ip: request.ip
    });

    return reply.code(201).send({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  });

  app.post('/refresh', authRateLimit, async (request, reply) => {
    const auth = request.body as { refreshToken?: string };
    if (!auth?.refreshToken) return reply.code(400).send({ message: 'Missing refresh token' });

    try {
      const payload = app.jwt.verify(auth.refreshToken) as { userId: string; clinicId?: string | null; role: Role };
      const session = await app.prisma.session.findUnique({ where: { refreshToken: auth.refreshToken } });
      if (!session) return reply.code(401).send({ message: 'Invalid refresh token' });

      if (session.expiresAt < new Date()) {
        await app.prisma.session.delete({ where: { refreshToken: auth.refreshToken } }).catch(() => {});
        return reply.code(401).send({ message: 'Invalid refresh token' });
      }

      const user = await app.prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        await app.prisma.session.delete({ where: { refreshToken: auth.refreshToken } }).catch(() => {});
        return reply.code(401).send({ message: 'Invalid refresh token' });
      }

      if ((user as any).status !== RegistrationStatus.APPROVED) {
        await invalidateUserSessions(app.prisma, user.id);
        return reply.code(403).send({ message: 'الحساب غير مفعّل' });
      }

      if (user.role === Role.clinic_admin) {
        if (!user.clinicId) {
          await invalidateUserSessions(app.prisma, user.id);
          return reply.code(403).send({ message: 'لم يتم ربط الحساب بعيادة' });
        }

        const clinic = await app.prisma.clinic.findUnique({ where: { id: user.clinicId } });
        if (!clinic || clinic.status !== RegistrationStatus.APPROVED) {
          await invalidateClinicSessions(app.prisma, user.clinicId);
          return reply.code(403).send({ message: 'العيادة غير مفعّلة' });
        }
      }

      const accessToken = app.jwt.sign(
        { userId: user.id, clinicId: user.clinicId ?? null, role: user.role },
        { expiresIn: '15m' }
      );
      return reply.send({ accessToken });
    } catch {
      return reply.code(401).send({ message: 'Invalid refresh token' });
    }
  });

  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = request.user!;
    const user = await app.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return reply.code(404).send({ message: 'User not found' });
    return reply.send({ id: user.id, name: user.name, email: user.email, role: user.role, clinicId: user.clinicId });
  });
}
