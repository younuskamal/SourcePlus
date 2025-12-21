import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role, SupportMessageStatus } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

const createMessageSchema = z.object({
    clinicId: z.string().uuid(),
    clinicName: z.string(),
    accountCode: z.string().optional(),
    message: z.string().min(10).max(5000)
});

const updateStatusSchema = z.object({
    status: z.enum(['NEW', 'READ', 'CLOSED'])
});

export default async function supportMessagesRoutes(app: FastifyInstance) {
    // Public Route: Create Support Message (من Smart Clinic)
    app.post('/api/support/messages', async (request, reply) => {
        const data = createMessageSchema.parse(request.body);

        const message = await app.prisma.supportMessage.create({
            data: {
                clinicId: data.clinicId,
                clinicName: data.clinicName,
                accountCode: data.accountCode,
                message: data.message,
                source: 'SMART_CLINIC',
                status: SupportMessageStatus.NEW
            }
        });

        await logAudit(app, {
            action: 'SUPPORT_MESSAGE_CREATED',
            details: `Support message from ${data.clinicName} (${data.clinicId})`,
            ip: request.ip
        });

        return reply.code(201).send(message);
    });

    // Admin Route: Get All Messages
    app.get('/support/messages', {
        preHandler: [app.authenticate, app.authorize([Role.admin])]
    }, async (request, reply) => {
        const { status, clinicId, search } = request.query as {
            status?: SupportMessageStatus;
            clinicId?: string;
            search?: string;
        };

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (clinicId) {
            where.clinicId = clinicId;
        }

        if (search) {
            where.OR = [
                { clinicName: { contains: search, mode: 'insensitive' } },
                { accountCode: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } }
            ];
        }

        const messages = await app.prisma.supportMessage.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        // Count unread messages
        const unreadCount = await app.prisma.supportMessage.count({
            where: { status: SupportMessageStatus.NEW }
        });

        return reply.send({
            messages,
            unreadCount
        });
    });

    // Admin Route: Get Single Message
    app.get('/support/messages/:id', {
        preHandler: [app.authenticate, app.authorize([Role.admin])]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const message = await app.prisma.supportMessage.findUnique({
            where: { id }
        });

        if (!message) {
            return reply.code(404).send({ message: 'Support message not found' });
        }

        // Auto-mark as read if NEW
        if (message.status === SupportMessageStatus.NEW) {
            await app.prisma.supportMessage.update({
                where: { id },
                data: {
                    status: SupportMessageStatus.READ,
                    readAt: new Date()
                }
            });

            await logAudit(app, {
                userId: request.user?.userId,
                action: 'SUPPORT_MESSAGE_READ',
                details: `Read support message from ${message.clinicName}`,
                ip: request.ip
            });

            message.status = SupportMessageStatus.READ;
            message.readAt = new Date();
        }

        return reply.send(message);
    });

    // Admin Route: Update Message Status
    app.patch('/support/messages/:id', {
        preHandler: [app.authenticate, app.authorize([Role.admin])]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { status } = updateStatusSchema.parse(request.body);

        const message = await app.prisma.supportMessage.findUnique({
            where: { id }
        });

        if (!message) {
            return reply.code(404).send({ message: 'Support message not found' });
        }

        const updateData: any = { status };

        if (status === SupportMessageStatus.READ && !message.readAt) {
            updateData.readAt = new Date();
        }

        if (status === SupportMessageStatus.CLOSED && !message.closedAt) {
            updateData.closedAt = new Date();
        }

        const updated = await app.prisma.supportMessage.update({
            where: { id },
            data: updateData
        });

        await logAudit(app, {
            userId: request.user?.userId,
            action: 'SUPPORT_MESSAGE_STATUS_UPDATED',
            details: `Changed support message status to ${status} for ${message.clinicName}`,
            ip: request.ip
        });

        return reply.send(updated);
    });

    // Admin Route: Delete Message
    app.delete('/support/messages/:id', {
        preHandler: [app.authenticate, app.authorize([Role.admin])]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const message = await app.prisma.supportMessage.findUnique({
            where: { id }
        });

        if (!message) {
            return reply.code(404).send({ message: 'Support message not found' });
        }

        await app.prisma.supportMessage.delete({
            where: { id }
        });

        await logAudit(app, {
            userId: request.user?.userId,
            action: 'SUPPORT_MESSAGE_DELETED',
            details: `Deleted support message from ${message.clinicName}`,
            ip: request.ip
        });

        return reply.send({ success: true });
    });
}
