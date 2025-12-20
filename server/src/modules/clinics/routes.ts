import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { ProductType, RegistrationStatus, Role, LicenseStatus } from '@prisma/client';
import { generateSerial } from '../../utils/serial.js';
import { logAudit } from '../../utils/audit.js';
import { invalidateClinicSessions } from '../../utils/session.js';
import clinicControlsRoutes from './controls.js';

const registerSchema = z.object({
    name: z.string().min(2),
    doctorName: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
    address: z.string().optional(),
    systemVersion: z.string().optional(),
});

const approvalSchema = z.object({
    planId: z.string().uuid().optional(),
    durationMonths: z.number().int().positive().optional()
});

const assignLicenseSchema = z.object({
    planId: z.string(),
    durationMonths: z.number().int().positive().optional(),
    activateClinic: z.boolean().optional()
});

const rejectSchema = z.object({
    reason: z.string().optional()
});

const safeUserSelect = { id: true, name: true, email: true, role: true, status: true, clinicId: true, createdAt: true };

const addMonths = (months: number) => {
    const expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + months);
    return expireDate;
};

const sanitizeClinic = (clinic: any) => ({
    id: clinic.id,
    name: clinic.name,
    email: clinic.email,
    doctorName: clinic.doctorName,
    phone: clinic.phone,
    address: clinic.address,
    systemVersion: clinic.systemVersion,
    createdAt: clinic.createdAt,
    updatedAt: clinic.updatedAt,
    status: clinic.status,
    licenseId: clinic.licenseId,
    license: clinic.license ? {
        id: clinic.license.id,
        serial: clinic.license.serial,
        status: clinic.license.status,
        expireDate: clinic.license.expireDate,
        deviceLimit: clinic.license.deviceLimit,
        plan: clinic.license.plan ? {
            id: clinic.license.plan.id,
            name: clinic.license.plan.name,
            durationMonths: clinic.license.plan.durationMonths
        } : null
    } : null,
    users: clinic.users?.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        clinicId: u.clinicId
    })),
    control: clinic.control ? {
        storageLimitMB: clinic.control.storageLimitMB,
        usersLimit: clinic.control.usersLimit,
        features: clinic.control.features,
        locked: clinic.control.locked
    } : null
});

export default async function clinicRoutes(app: FastifyInstance) {
    // Register controls routes
    await clinicControlsRoutes(app);

    // Public Route: Register Clinic
    app.post('/register', async (request, reply) => {
        const { password, ...data } = registerSchema.parse(request.body);

        const existing = await app.prisma.clinic.findUnique({ where: { email: data.email } });
        if (existing) {
            return reply.code(409).send({ message: 'Clinic already registered with this email' });
        }

        const existingUser = await app.prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            return reply.code(409).send({ message: 'An account with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const clinic = await app.prisma.$transaction(async (prisma) => {
            const newClinic = await prisma.clinic.create({
                data: {
                    ...data,
                    status: RegistrationStatus.PENDING,
                    users: {
                        create: {
                            name: data.doctorName || data.name,
                            email: data.email,
                            passwordHash,
                            role: Role.clinic_admin,
                            status: RegistrationStatus.PENDING
                        }
                    }
                },
                include: {
                    users: { select: safeUserSelect }
                }
            });

            // Create default ClinicControl
            await prisma.clinicControl.create({
                data: {
                    clinicId: newClinic.id,
                    storageLimitMB: 1024,
                    usersLimit: 3,
                    features: {
                        patients: true,
                        appointments: true,
                        orthodontics: false,
                        xray: false,
                        ai: false
                    },
                    locked: false
                }
            });

            return newClinic;
        });

        return reply.code(201).send(sanitizeClinic(clinic));
    });

    // Admin Routes
    app.get('/requests', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { status } = request.query as { status?: RegistrationStatus };
        const where = status ? { status } : {};

        const clinics = await app.prisma.clinic.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                license: { include: { plan: true } },
                users: { select: safeUserSelect },
                control: true
            }
        });
        return reply.send(clinics.map(sanitizeClinic));
    });

    app.post('/:id/approve', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = approvalSchema.parse(request.body || {});

        const clinic = await app.prisma.clinic.findUnique({
            where: { id },
            include: { license: { include: { plan: true } } }
        });
        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });
        const status = clinic.status as RegistrationStatus;
        if (status === RegistrationStatus.REJECTED) return reply.code(400).send({ message: 'Rejected clinic cannot be approved' });
        if (status === RegistrationStatus.APPROVED) return reply.code(400).send({ message: 'Clinic already approved' });

        const plan = body.planId
            ? await app.prisma.plan.findFirst({ where: { id: body.planId, isActive: true } })
            : await app.prisma.plan.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });

        if (!plan) return reply.code(500).send({ message: 'No active plans found to assign license.' });
        if (status === RegistrationStatus.SUSPENDED) return reply.code(400).send({ message: 'Suspended clinic must be reactivated instead of approved' });

        const expireDate = addMonths(body.durationMonths || plan.durationMonths);
        const serial = clinic.license?.serial || generateSerial(plan);

        const updatedClinic = await app.prisma.$transaction(async (prisma) => {
            const license = clinic.licenseId
                ? await prisma.license.update({
                    where: { id: clinic.licenseId },
                    data: {
                        planId: plan.id,
                        deviceLimit: plan.deviceLimit,
                        expireDate,
                        status: LicenseStatus.active,
                        isPaused: false,
                        productType: ProductType.CLINIC
                    }
                })
                : await prisma.license.create({
                    data: {
                        serial,
                        planId: plan.id,
                        customerName: clinic.name,
                        deviceLimit: plan.deviceLimit,
                        productType: ProductType.CLINIC,
                        status: LicenseStatus.active,
                        expireDate,
                        clinic: { connect: { id: clinic.id } }
                    }
                });

            await prisma.user.updateMany({
                where: { clinicId: clinic.id },
                data: { status: RegistrationStatus.APPROVED }
            });

            return prisma.clinic.update({
                where: { id: clinic.id },
                data: { status: RegistrationStatus.APPROVED, licenseId: license.id },
                include: {
                    license: { include: { plan: true } },
                    users: { select: safeUserSelect },
                    control: true
                }
            });
        });

        await invalidateClinicSessions(app.prisma, id);
        await logAudit(app, { userId: request.user?.userId, action: 'APPROVE_CLINIC', details: `Approved clinic ${clinic.name}`, ip: request.ip });

        return reply.send(sanitizeClinic(updatedClinic));
    });

    app.post('/:id/suspend', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const clinic = await app.prisma.clinic.findUnique({
            where: { id },
            include: { license: true }
        });
        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });
        const status = clinic.status as RegistrationStatus;
        if (status === RegistrationStatus.REJECTED) return reply.code(400).send({ message: 'Rejected clinic cannot be suspended' });
        if (status === RegistrationStatus.PENDING) return reply.code(400).send({ message: 'Pending clinic cannot be suspended' });

        const updated = await app.prisma.$transaction(async (prisma) => {
            if (clinic.licenseId) {
                await prisma.license.update({
                    where: { id: clinic.licenseId },
                    data: { status: LicenseStatus.paused, isPaused: true }
                });
            }

            await prisma.user.updateMany({ where: { clinicId: id }, data: { status: RegistrationStatus.SUSPENDED } });

            return prisma.clinic.update({
                where: { id },
                data: { status: RegistrationStatus.SUSPENDED },
                include: {
                    license: { include: { plan: true } },
                    users: { select: safeUserSelect },
                    control: true
                }
            });
        });

        await invalidateClinicSessions(app.prisma, id);
        await logAudit(app, { userId: request.user?.userId, action: 'SUSPEND_CLINIC', details: `Suspended clinic ${clinic.name}`, ip: request.ip });

        return reply.send(sanitizeClinic(updated));
    });

    app.post('/:id/reactivate', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = approvalSchema.parse(request.body || {});

        const clinic = await app.prisma.clinic.findUnique({
            where: { id },
            include: { license: { include: { plan: true } } }
        });
        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });
        const status = clinic.status as RegistrationStatus;
        if (status === RegistrationStatus.REJECTED) return reply.code(400).send({ message: 'Rejected clinic cannot be reactivated' });
        if (status !== RegistrationStatus.SUSPENDED) return reply.code(400).send({ message: 'Clinic is not suspended' });

        const plan = body.planId
            ? await app.prisma.plan.findFirst({ where: { id: body.planId, isActive: true } })
            : clinic.license?.plan || await app.prisma.plan.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });

        if (!plan) return reply.code(500).send({ message: 'No active plans found to re-activate license.' });

        const months = body.durationMonths || plan.durationMonths;
        const expireDate = clinic.license?.expireDate && clinic.license.expireDate > new Date()
            ? clinic.license.expireDate
            : addMonths(months);

        const updated = await app.prisma.$transaction(async (prisma) => {
            const license = clinic.licenseId
                ? await prisma.license.update({
                    where: { id: clinic.licenseId },
                    data: {
                        planId: plan.id,
                        deviceLimit: plan.deviceLimit,
                        status: LicenseStatus.active,
                        isPaused: false,
                        expireDate
                    }
                })
                : await prisma.license.create({
                    data: {
                        serial: generateSerial(plan),
                        planId: plan.id,
                        customerName: clinic.name,
                        deviceLimit: plan.deviceLimit,
                        productType: ProductType.CLINIC,
                        status: LicenseStatus.active,
                        expireDate,
                        clinic: { connect: { id: clinic.id } }
                    }
                });

            await prisma.user.updateMany({ where: { clinicId: id }, data: { status: RegistrationStatus.APPROVED } });

            return prisma.clinic.update({
                where: { id },
                data: { status: RegistrationStatus.APPROVED, licenseId: license.id },
                include: {
                    license: { include: { plan: true } },
                    users: { select: safeUserSelect },
                    control: true
                }
            });
        });

        await invalidateClinicSessions(app.prisma, id);
        await logAudit(app, { userId: request.user?.userId, action: 'REACTIVATE_CLINIC', details: `Reactivated clinic ${clinic.name}`, ip: request.ip });

        return reply.send(sanitizeClinic(updated));
    });

    // Backwards compatibility: toggle between suspended/approved
    app.post('/:id/toggle-status', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const clinic = await app.prisma.clinic.findUnique({
            where: { id },
            include: { license: { include: { plan: true } }, users: { select: safeUserSelect }, control: true }
        });
        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });
        const status = clinic.status as RegistrationStatus;
        if (status === RegistrationStatus.REJECTED) return reply.code(400).send({ message: 'Rejected clinic cannot change status' });
        if (status === RegistrationStatus.PENDING) return reply.code(400).send({ message: 'Pending clinic must be approved before toggling' });

        if (status === RegistrationStatus.SUSPENDED) {
            const updated = await app.prisma.$transaction(async (prisma) => {
                if (clinic.licenseId) {
                    await prisma.license.update({
                        where: { id: clinic.licenseId },
                        data: { status: LicenseStatus.active, isPaused: false }
                    });
                }
                await prisma.user.updateMany({ where: { clinicId: id }, data: { status: RegistrationStatus.APPROVED } });
                return prisma.clinic.update({
                    where: { id },
                    data: { status: RegistrationStatus.APPROVED },
                    include: { license: { include: { plan: true } }, users: { select: safeUserSelect }, control: true }
                });
            });
            await invalidateClinicSessions(app.prisma, id);
            await logAudit(app, { userId: request.user?.userId, action: 'REACTIVATE_CLINIC', details: `Reactivated clinic ${clinic.name}`, ip: request.ip });
            return reply.send(sanitizeClinic(updated));
        }

        const updated = await app.prisma.$transaction(async (prisma) => {
            if (clinic.licenseId) {
                await prisma.license.update({
                    where: { id: clinic.licenseId },
                    data: { status: LicenseStatus.paused, isPaused: true }
                });
            }
            await prisma.user.updateMany({ where: { clinicId: id }, data: { status: RegistrationStatus.SUSPENDED } });
            return prisma.clinic.update({
                where: { id },
                data: { status: RegistrationStatus.SUSPENDED },
                include: { license: { include: { plan: true } }, users: { select: safeUserSelect }, control: true }
            });
        });
        await invalidateClinicSessions(app.prisma, id);
        await logAudit(app, { userId: request.user?.userId, action: 'SUSPEND_CLINIC', details: `Suspended clinic ${clinic.name}`, ip: request.ip });
        return reply.send(sanitizeClinic(updated));
    });

    app.post('/:id/reject', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = rejectSchema.parse(request.body);

        const clinic = await app.prisma.clinic.findUnique({
            where: { id },
            include: { license: true }
        });
        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });
        const status = clinic.status as RegistrationStatus;
        if (status === RegistrationStatus.REJECTED) {
            return reply.code(400).send({ message: 'Clinic already rejected' });
        }

        const updated = await app.prisma.$transaction(async (prisma) => {
            if (clinic.licenseId) {
                await prisma.license.update({
                    where: { id: clinic.licenseId },
                    data: { status: LicenseStatus.revoked, isPaused: true }
                });
            }

            await prisma.user.updateMany({
                where: { clinicId: id },
                data: { status: RegistrationStatus.REJECTED }
            });

            return prisma.clinic.update({
                where: { id },
                data: { status: RegistrationStatus.REJECTED },
                include: {
                    license: { include: { plan: true } },
                    users: { select: safeUserSelect },
                    control: true
                }
            });
        });

        await invalidateClinicSessions(app.prisma, id);
        await logAudit(app, {
            userId: request.user?.userId,
            action: 'REJECT_CLINIC',
            details: `Rejected clinic ${clinic.name}${body.reason ? `: ${body.reason}` : ''}`,
            ip: request.ip
        });

        return reply.send(sanitizeClinic(updated));
    });

    app.post('/:id/license', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = assignLicenseSchema.parse(request.body);

        const clinic = await app.prisma.clinic.findUnique({
            where: { id },
            include: { license: { include: { plan: true } } }
        });
        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });

        const plan = await app.prisma.plan.findFirst({ where: { id: body.planId, isActive: true } });
        if (!plan) return reply.code(404).send({ message: 'Plan not found or inactive' });

        const months = body.durationMonths || plan.durationMonths;
        const expireDate = addMonths(months);
        const serial = clinic.license?.serial || generateSerial(plan);

        const updatedClinic = await app.prisma.$transaction(async (prisma) => {
            const license = clinic.licenseId
                ? await prisma.license.update({
                    where: { id: clinic.licenseId },
                    data: {
                        planId: plan.id,
                        deviceLimit: plan.deviceLimit,
                        expireDate,
                        status: LicenseStatus.active,
                        isPaused: false,
                        productType: ProductType.CLINIC
                    }
                })
                : await prisma.license.create({
                    data: {
                        serial,
                        planId: plan.id,
                        customerName: clinic.name,
                        deviceLimit: plan.deviceLimit,
                        productType: ProductType.CLINIC,
                        status: LicenseStatus.active,
                        expireDate,
                        clinic: { connect: { id } }
                    }
                });

            if (body.activateClinic) {
                await prisma.user.updateMany({ where: { clinicId: id }, data: { status: RegistrationStatus.APPROVED } });
            }

            return prisma.clinic.update({
                where: { id },
                data: {
                    licenseId: license.id,
                    status: body.activateClinic ? RegistrationStatus.APPROVED : clinic.status
                },
                include: {
                    license: { include: { plan: true } },
                    users: { select: safeUserSelect },
                    control: true
                }
            });
        });

        if (body.activateClinic) {
            await invalidateClinicSessions(app.prisma, id);
        }

        await logAudit(app, {
            userId: request.user?.userId,
            action: 'ASSIGN_CLINIC_LICENSE',
            details: `Assigned plan ${plan.name} to clinic ${clinic.name}`,
            ip: request.ip
        });

        return reply.send(sanitizeClinic(updatedClinic));
    });

    app.post('/:id/force-logout', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const clinic = await app.prisma.clinic.findUnique({ where: { id } });
        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });

        await invalidateClinicSessions(app.prisma, id);
        await logAudit(app, { userId: request.user?.userId, action: 'FORCE_LOGOUT_CLINIC', details: `Forced logout for clinic ${clinic.name}`, ip: request.ip });
        return reply.send({ success: true });
    });

    app.delete('/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const clinic = await app.prisma.clinic.findUnique({
            where: { id },
            include: { users: true }
        });
        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });

        const userIds = clinic.users.map(u => u.id);

        await app.prisma.$transaction(async (tx) => {
            if (userIds.length) {
                await tx.messageReply.deleteMany({ where: { userId: { in: userIds } } });
                await tx.session.deleteMany({ where: { userId: { in: userIds } } });
                await tx.clinicMessage.deleteMany({ where: { senderId: { in: userIds } } });
            }

            await tx.conversation.deleteMany({ where: { clinicId: id } });
            await tx.user.deleteMany({ where: { clinicId: id } });

            // ClinicControl will be auto-deleted due to onDelete: Cascade

            // detach license reference if present
            if (clinic.licenseId) {
                await tx.clinic.update({ where: { id }, data: { licenseId: null } });
            }

            await tx.clinic.delete({ where: { id } });
        });

        await logAudit(app, { userId: request.user?.userId, action: 'DELETE_CLINIC', details: `Deleted clinic ${clinic.name}`, ip: request.ip });

        return reply.send({ success: true });
    });
}
