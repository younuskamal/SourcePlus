import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { ProductType, RegistrationStatus, Role, LicenseStatus } from '@prisma/client';
import { generateSerial } from '../../utils/serial.js';
import { logAudit } from '../../utils/audit.js';

const registerSchema = z.object({
    name: z.string().min(2),
    doctorName: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
    address: z.string().optional(),
    hwid: z.string().min(5),
    systemVersion: z.string().optional(),
});

export default async function clinicRoutes(app: FastifyInstance) {
    // Public Route: Register Clinic
    // Mounted specifically at /api/clinics usually, or /clinics depending on routes.ts
    app.post('/register', async (request, reply) => {
        const { password, ...data } = registerSchema.parse(request.body);

        const existing = await app.prisma.clinic.findUnique({ where: { email: data.email } });
        if (existing) {
            return reply.code(409).send({ message: 'Clinic already registered with this email' });
        }

        const existingHwid = await app.prisma.clinic.findUnique({ where: { hwid: data.hwid } });
        if (existingHwid) {
            return reply.code(409).send({ message: 'Clinic already registered with this Hardware ID' });
        }

        // Check if email is already taken by a user
        const existingUser = await app.prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            return reply.code(409).send({ message: 'An account with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await app.prisma.$transaction(async (prisma) => {
            const clinic = await prisma.clinic.create({
                data: {
                    ...data,
                    status: RegistrationStatus.PENDING,
                    users: {
                        create: {
                            name: data.doctorName || data.name,
                            email: data.email,
                            passwordHash,
                            role: 'clinic_admin' as Role, // Cast to avoid build error if types aren't regenerated yet
                            status: RegistrationStatus.PENDING
                        }
                    }
                },
                include: { users: true }
            });
            return clinic;
        });

        return reply.code(201).send(result);
    });

    // Admin Routes
    app.get('/requests', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { status } = request.query as { status?: RegistrationStatus };
        const where = status ? { status } : {};

        const clinics = await app.prisma.clinic.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { license: true, users: true }
        });
        return reply.send(clinics);
    });

    app.post('/:id/approve', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const clinic = await app.prisma.clinic.findUnique({ where: { id } });
        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });

        if (clinic.status === RegistrationStatus.APPROVED) {
            return reply.code(400).send({ message: 'Clinic already approved' });
        }

        // Find a default active plan to assign
        const plan = await app.prisma.plan.findFirst({ where: { isActive: true } });
        if (!plan) return reply.code(500).send({ message: 'No active plans found to assign license.' });

        const serial = generateSerial(plan);
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + plan.durationMonths);

        // Create License and Update Clinic in transaction
        // We update the clinic to connect to the new license
        const newLicense = await app.prisma.license.create({
            data: {
                serial,
                planId: plan.id,
                customerName: clinic.name,
                deviceLimit: plan.deviceLimit,
                productType: ProductType.CLINIC,
                status: LicenseStatus.active,
                expireDate: expireDate,
                clinic: {
                    connect: { id: clinic.id }
                }
            }
        });

        // Manually ensure status is APPROVED on clinic side if the connect doesn't set other fields
        const updatedClinic = await app.prisma.clinic.update({
            where: { id: clinic.id },
            data: { status: RegistrationStatus.APPROVED }
        });

        // Approve linked users
        await app.prisma.user.updateMany({
            where: { clinicId: clinic.id },
            data: { status: RegistrationStatus.APPROVED }
        });

        await logAudit(app, { userId: request.user?.id, action: 'APPROVE_CLINIC', details: `Approved clinic ${clinic.name}`, ip: request.ip });

        return reply.send(updatedClinic);
    });

    app.post('/:id/toggle-status', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const clinic = await app.prisma.clinic.findUnique({ where: { id } });
        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });

        const newStatus = clinic.status === RegistrationStatus.SUSPENDED ? RegistrationStatus.APPROVED : RegistrationStatus.SUSPENDED;

        await app.prisma.clinic.update({
            where: { id },
            data: { status: newStatus }
        });

        // Sync user status
        await app.prisma.user.updateMany({
            where: { clinicId: id },
            data: { status: newStatus }
        });

        if (clinic.licenseId) {
            const licenseStatus = newStatus === RegistrationStatus.SUSPENDED ? LicenseStatus.paused : LicenseStatus.active;
            await app.prisma.license.update({
                where: { id: clinic.licenseId },
                data: { status: licenseStatus, isPaused: newStatus === RegistrationStatus.SUSPENDED }
            });
        }

        await logAudit(app, { userId: request.user?.id, action: 'TOGGLE_CLINIC_STATUS', details: `Toggled clinic ${clinic.name} to ${newStatus}`, ip: request.ip });
        return reply.send({ status: newStatus });
    });

    app.delete('/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const clinic = await app.prisma.clinic.findUnique({ where: { id }, include: { license: true } });
        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });

        // If license exists, delete it first (cascade should handle it depending on schema, but explicit is safer)
        if (clinic.licenseId) {
            await app.prisma.license.delete({ where: { id: clinic.licenseId } });
        }

        // Cascade delete should handle users if configured, but let's be safe or rely on Prisma schema
        // Schema: users User[] on Clinic. User has clinicId. No onDelete: Cascade defined in my schema edit! 
        // I should have added onDelete: Cascade to User.clinic relation.
        // For now, I'll manually delete users or let it error if constraints exist.
        // Given I missed 'onDelete: Cascade', I should delete users manually here.
        await app.prisma.user.deleteMany({ where: { clinicId: id } });

        await app.prisma.clinic.delete({ where: { id } });

        await logAudit(app, { userId: request.user?.id, action: 'DELETE_CLINIC', details: `Deleted clinic ${clinic.name}`, ip: request.ip });
        return reply.send({ message: 'Clinic deleted successfully' });
    });
}
