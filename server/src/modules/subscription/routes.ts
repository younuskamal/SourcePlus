import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RegistrationStatus, LicenseStatus } from '@prisma/client';

export default async function subscriptionRoutes(app: FastifyInstance) {
    app.get('/status', async (request, reply) => {
        const querySchema = z.object({
            clinicId: z.string().optional()
        });

        const query = querySchema.parse(request.query || {});
        let clinicId = query.clinicId;

        // If no clinicId provided, try to get from authenticated user (Token)
        if (!clinicId && request.headers.authorization) {
            try {
                // Verify token manually since this route might be public for some cases
                const token = request.headers.authorization.replace('Bearer ', '');
                const payload = app.jwt.verify(token) as any;
                const user = await app.prisma.user.findUnique({ where: { id: payload.id } });
                if (user && user.clinicId) {
                    clinicId = user.clinicId;
                }
            } catch (e) {
                // Ignore token error, proceed to check if clinicId was somehow found or error out
            }
        }

        if (!clinicId) {
            return reply.code(400).send({ message: 'Clinic ID or valid Auth Token is required' });
        }

        const clinic = await app.prisma.clinic.findUnique({
            where: { id: clinicId },
            include: { license: { include: { plan: true } } }
        });

        if (!clinic) {
            return reply.code(404).send({ message: 'Clinic not found' });
        }

        if (clinic.status === RegistrationStatus.PENDING) {
            return reply.send({
                status: 'pending',
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
