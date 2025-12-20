import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

const updateControlsSchema = z.object({
    storageLimitMB: z.number().int().positive().optional(),
    usersLimit: z.number().int().positive().optional(),
    features: z.object({
        patients: z.boolean().optional(),
        appointments: z.boolean().optional(),
        orthodontics: z.boolean().optional(),
        xray: z.boolean().optional(),
        ai: z.boolean().optional()
    }).optional(),
    locked: z.boolean().optional(),
    lockReason: z.string().optional().nullable()
});

export default async function clinicControlsRoutes(app: FastifyInstance) {
    // GET /api/clinics/:id/controls - Read clinic controls (for Smart Clinic)
    app.get('/:id/controls', async (request, reply) => {
        const { id } = request.params as { id: string };

        const clinic = await app.prisma.clinic.findUnique({
            where: { id },
            include: { control: true }
        });

        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });

        // If no control exists, create default one
        if (!clinic.control) {
            const control = await app.prisma.clinicControl.create({
                data: {
                    clinicId: id,
                    storageLimitMB: 1024,
                    usersLimit: 3,
                    features: {
                        patients: true,
                        appointments: true,
                        orthodontics: false,
                        xray: false,
                        ai: false
                    },
                    locked: false,
                    lockReason: null
                }
            });

            return reply.send({
                storageLimitMB: control.storageLimitMB,
                usersLimit: control.usersLimit,
                features: control.features as any,
                locked: control.locked,
                lockReason: control.lockReason
            });
        }

        return reply.send({
            storageLimitMB: clinic.control.storageLimitMB,
            usersLimit: clinic.control.usersLimit,
            features: clinic.control.features as any,
            locked: clinic.control.locked,
            lockReason: clinic.control.lockReason
        });
    });

    // PUT /api/clinics/:id/controls - Update clinic controls (for Admin Panel)
    app.put('/:id/controls', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = updateControlsSchema.parse(request.body);

        const clinic = await app.prisma.clinic.findUnique({
            where: { id },
            include: { control: true }
        });

        if (!clinic) return reply.code(404).send({ message: 'Clinic not found' });

        // Capture before state for audit
        const beforeState = clinic.control ? {
            storageLimitMB: clinic.control.storageLimitMB,
            usersLimit: clinic.control.usersLimit,
            features: clinic.control.features,
            locked: clinic.control.locked,
            lockReason: clinic.control.lockReason
        } : null;

        // Prepare update data
        const updateData: any = {};
        if (body.storageLimitMB !== undefined) updateData.storageLimitMB = body.storageLimitMB;
        if (body.usersLimit !== undefined) updateData.usersLimit = body.usersLimit;
        if (body.locked !== undefined) updateData.locked = body.locked;
        if (body.lockReason !== undefined) updateData.lockReason = body.lockReason;
        if (body.features) {
            // Merge with existing features
            const currentFeatures = clinic.control?.features as any || {
                patients: true,
                appointments: true,
                orthodontics: false,
                xray: false,
                ai: false
            };
            updateData.features = { ...currentFeatures, ...body.features };
        }

        let control;
        if (clinic.control) {
            control = await app.prisma.clinicControl.update({
                where: { id: clinic.control.id },
                data: updateData
            });
        } else {
            control = await app.prisma.clinicControl.create({
                data: {
                    clinicId: id,
                    storageLimitMB: body.storageLimitMB || 1024,
                    usersLimit: body.usersLimit || 3,
                    features: body.features || {
                        patients: true,
                        appointments: true,
                        orthodontics: false,
                        xray: false,
                        ai: false
                    },
                    locked: body.locked || false,
                    lockReason: body.lockReason || null
                }
            });
        }

        // Enhanced audit log with before/after
        const afterState = {
            storageLimitMB: control.storageLimitMB,
            usersLimit: control.usersLimit,
            features: control.features,
            locked: control.locked,
            lockReason: control.lockReason
        };

        const changes = [];
        if (body.storageLimitMB !== undefined && beforeState?.storageLimitMB !== body.storageLimitMB) {
            changes.push(`storage: ${beforeState?.storageLimitMB || 'N/A'}MB → ${body.storageLimitMB}MB`);
        }
        if (body.usersLimit !== undefined && beforeState?.usersLimit !== body.usersLimit) {
            changes.push(`users: ${beforeState?.usersLimit || 'N/A'} → ${body.usersLimit}`);
        }
        if (body.locked !== undefined && beforeState?.locked !== body.locked) {
            changes.push(`locked: ${beforeState?.locked} → ${body.locked}`);
        }
        if (body.lockReason !== undefined && beforeState?.lockReason !== body.lockReason) {
            changes.push(`lockReason: "${beforeState?.lockReason || 'none'}" → "${body.lockReason || 'none'}"`);
        }
        if (body.features) {
            const featuresChanged: string[] = [];
            Object.entries(body.features).forEach(([key, value]) => {
                const oldValue = (beforeState?.features as any)?.[key];
                if (oldValue !== value) {
                    featuresChanged.push(`${key}: ${oldValue} → ${value}`);
                }
            });
            if (featuresChanged.length > 0) {
                changes.push(`features: ${featuresChanged.join(', ')}`);
            }
        }

        await logAudit(app, {
            userId: request.user?.userId,
            action: 'UPDATE_CLINIC_CONTROLS',
            details: `Updated controls for clinic ${clinic.name}: ${changes.length > 0 ? changes.join('; ') : 'No changes'}. Before: ${JSON.stringify(beforeState)}. After: ${JSON.stringify(afterState)}`,
            ip: request.ip
        });

        return reply.send({
            storageLimitMB: control.storageLimitMB,
            usersLimit: control.usersLimit,
            features: control.features as any,
            locked: control.locked,
            lockReason: control.lockReason
        });
    });
}
