import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

const supportMessageSchema = z.object({
    name: z.string().min(2),
    serial: z.string().optional(),
    message: z.string().min(10)
});

export default async function supportRoutes(app: FastifyInstance) {
    // Get all support messages (Admin/Developer only)
    app.get('/messages', { preHandler: [app.authorize([Role.admin, Role.developer])] }, async () => {
        return app.prisma.supportMessage.findMany({
            orderBy: { createdAt: 'desc' }
        });
    });

    // Submit a support message (Public endpoint)
    app.post('/messages', async (request, reply) => {
        const data = supportMessageSchema.parse(request.body);

        const message = await app.prisma.supportMessage.create({
            data: {
                name: data.name,
                serial: data.serial || null,
                message: data.message,
                status: 'pending'
            }
        });

        await logAudit(app, {
            userId: request.user?.id,
            action: 'SUPPORT_MESSAGE_SUBMITTED',
            details: `Support message from ${data.name}`,
            ip: request.ip
        });

        return reply.code(201).send(message);
    });

    // Update message status
    app.patch('/messages/:id', { preHandler: [app.authorize([Role.admin, Role.developer])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { status } = z.object({ status: z.enum(['pending', 'resolved', 'closed']) }).parse(request.body);

        const message = await app.prisma.supportMessage.update({
            where: { id },
            data: { status }
        });

        await logAudit(app, {
            userId: request.user?.id,
            action: 'SUPPORT_MESSAGE_UPDATED',
            details: `Updated support message ${id} to ${status}`,
            ip: request.ip
        });

        return reply.send(message);
    });

    // Delete a support message
    app.delete('/messages/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };

        await app.prisma.supportMessage.delete({
            where: { id }
        });

        await logAudit(app, {
            userId: request.user?.id,
            action: 'SUPPORT_MESSAGE_DELETED',
            details: `Deleted support message ${id}`,
            ip: request.ip
        });

        return reply.code(204).send();
    });
}
