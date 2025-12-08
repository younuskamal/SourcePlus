import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RegistrationStatus, LicenseStatus } from '@prisma/client';

export default async function subscriptionRoutes(app: FastifyInstance) {
    app.get('/status', async (request, reply) => {
        const querySchema = z.object({
            hwid: z.string().optional()
        });

        // Fastify creates lowercase headers
        const headerSchema = z.object({
            'hwid': z.string().optional(),
            'x-hwid': z.string().optional()
        }).passthrough();

        const query = querySchema.parse(request.query || {});
        const headers = headerSchema.parse(request.headers || {});

        const hwid = query.hwid || headers['x-hwid'] || headers['hwid'];

        if (!hwid) {
            return reply.code(400).send({ message: 'Hardware ID (hwid) is required' });
        }

        const clinic = await app.prisma.clinic.findUnique({
            where: { hwid },
            include: { license: { include: { plan: true } } }
        });

        if (!clinic) {
            return reply.code(404).send({ message: 'Clinic not found' });
        }

        if (clinic.status === RegistrationStatus.PENDING) {
            return reply.send({
                status: 'pending', // Lowercase as requested by user
                license: null,
                remainingDays: 0,
                forceLogout: false
            });
        }

        if (clinic.status === RegistrationStatus.APPROVED && clinic.license) {
            const now = new Date();
            const expireDate = new Date(clinic.license.expireDate || 0);
            const diffTime = Math.max(0, expireDate.getTime() - now.getTime());
            const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isExpired = remainingDays <= 0;

            // Check license status enum as well
            const isActive = clinic.license.status === LicenseStatus.active && !isExpired && !clinic.license.isPaused;

            return reply.send({
                status: isActive ? 'active' : 'expired',
                license: {
                    serial: clinic.license.serial,
                    expireDate: clinic.license.expireDate
                },
                remainingDays,
                forceLogout: !isActive
            });
        }

        if (clinic.status === RegistrationStatus.SUSPENDED) {
            return reply.send({
                status: 'suspended',
                license: null,
                remainingDays: 0,
                forceLogout: true
            });
        }

        // Default fallback
        return reply.send({
            status: 'unknown',
            license: null,
            remainingDays: 0,
            forceLogout: true
        });
    });
}
