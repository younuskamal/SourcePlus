import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ProductType, RegistrationStatus, Role, LicenseStatus } from '@prisma/client';
import { generateSerial } from '../../utils/serial.js';
import { logAudit } from '../../utils/audit.js';

const registerSchema = z.object({
    name: z.string().min(2),
    doctorName: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
    hwid: z.string().min(5),
    systemVersion: z.string().optional(),
});

export default async function clinicRoutes(app: FastifyInstance) {
    // Public Route: Register Clinic
    // Mounted specifically at /api/clinics usually, or /clinics depending on routes.ts
    app.post('/register', async (request, reply) => {
        const data = registerSchema.parse(request.body);

        const existing = await app.prisma.clinic.findUnique({ where: { email: data.email } });
        if (existing) {
            return reply.code(409).send({ message: 'Clinic already registered with this email' });
        }

        const existingHwid = await app.prisma.clinic.findUnique({ where: { hwid: data.hwid } });
        if (existingHwid) {
            return reply.code(409).send({ message: 'Clinic already registered with this Hardware ID' });
        }

        const clinic = await app.prisma.clinic.create({
            data: {
                ...data,
                status: RegistrationStatus.PENDING
            }
        });

        return reply.code(201).send(clinic);
    });

    // Admin Routes
    app.get('/requests', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { status } = request.query as { status?: RegistrationStatus };
        const where = status ? { status } : {};

        const clinics = await app.prisma.clinic.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { license: true }
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
}
