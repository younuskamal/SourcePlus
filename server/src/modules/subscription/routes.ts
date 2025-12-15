import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RegistrationStatus, LicenseStatus } from '@prisma/client';
import { invalidateClinicSessions } from '../../utils/session.js';

export default async function subscriptionRoutes(app: FastifyInstance) {
    app.get('/status', async (request, reply) => {
        const querySchema = z.object({
            clinicId: z.string().optional()
        });

        const query = querySchema.parse(request.query || {});
        let clinicId = query.clinicId;

        if (request.headers.authorization) {
            try {
                await app.authenticate(request, reply);
            } catch {
                if (reply.sent) return;
            }

            if (reply.sent) return;
        }

        if (!clinicId && request.user?.clinicId) {
            clinicId = request.user.clinicId;
        }

        if (!clinicId) {
            return reply.code(400).send({ message: 'Clinic ID or valid Auth Token is required' });
        }

        const clinic = await app.prisma.clinic.findUnique({
            where: { id: clinicId },
            include: {
                license: {
                    include: { plan: true }
                }
            }
        });

        if (!clinic) {
            return reply.code(404).send({ message: 'Clinic not found' });
        }

        const baseResponse = {
            id: clinic.id,
            name: clinic.name,
            clinicId: clinic.id,
            clinicName: clinic.name,
            status: clinic.status,
            remainingDays: 0
        };

        if (clinic.status !== RegistrationStatus.APPROVED) {
            await invalidateClinicSessions(app.prisma, clinic.id);
            return reply.send({
                ...baseResponse,
                license: null,
                forceLogout: true
            });
        }

        if (!clinic.license) {
            await invalidateClinicSessions(app.prisma, clinic.id);

            return reply.send({
                ...baseResponse,
                license: null,
                forceLogout: true
            });
        }

        const now = new Date();
        const expireDate = new Date(clinic.license.expireDate || 0);
        const diffTime = Math.max(0, expireDate.getTime() - now.getTime());
        const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = remainingDays <= 0;

        const isLicenseActive =
            clinic.license.status === LicenseStatus.active &&
            !clinic.license.isPaused &&
            !isExpired;

        const forceLogout = !isLicenseActive;
        if (forceLogout) {
            await invalidateClinicSessions(app.prisma, clinic.id);
        }

        return reply.send({
            ...baseResponse,
            status: clinic.status,
            license: {
                id: clinic.license.id,
                serial: clinic.license.serial,
                status: clinic.license.status,
                expireDate: clinic.license.expireDate,
                deviceLimit: clinic.license.deviceLimit,
                activationCount: clinic.license.activationCount,
                plan: clinic.license.plan ? {
                    id: clinic.license.plan.id,
                    name: clinic.license.plan.name,
                    durationMonths: clinic.license.plan.durationMonths
                } : null
            },
            remainingDays,
            forceLogout
        });
    });
}
