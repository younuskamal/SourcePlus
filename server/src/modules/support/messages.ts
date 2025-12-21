import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role, SupportMessageStatus, MessagePriority } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

// Validation Schemas
const createMessageSchema = z.object({
    clinicId: z.string().uuid(),
    clinicName: z.string(),
    accountCode: z.string().optional(),
    subject: z.string().min(3).max(200),
    message: z.string().min(10).max(5000),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional()
});

const updateStatusSchema = z.object({
    status: z.enum(['NEW', 'READ', 'CLOSED'])
});

const addReplySchema = z.object({
    content: z.string().min(1).max(5000)
});

const assignMessageSchema = z.object({
    assignedTo: z.string().uuid().nullable()
});

const updatePrioritySchema = z.object({
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
});

export default async function supportMessagesRoutes(app: FastifyInstance) {

    // ========================================
    // PUBLIC ROUTES (for Smart Clinic)
    // ========================================

    /**
     * POST /api/support/messages
     * Create a new support message/conversation
     */
    app.post('/api/support/messages', async (request, reply) => {
        const data = createMessageSchema.parse(request.body);

        const message = await app.prisma.supportMessage.create({
            data: {
                clinicId: data.clinicId,
                clinicName: data.clinicName,
                accountCode: data.accountCode,
                subject: data.subject,
                message: data.message,
                source: 'SMART_CLINIC',
                status: SupportMessageStatus.NEW,
                priority: (data.priority as MessagePriority) || MessagePriority.NORMAL
            }
        });

        await logAudit(app, {
            action: 'SUPPORT_MESSAGE_CREATED',
            details: `New support message: "${data.subject}" from ${data.clinicName}`,
            ip: request.ip
        });

        return reply.code(201).send(message);
    });

    /**
     * POST /api/support/messages/:id/replies
     * Add a reply from clinic (public)
     */
    app.post('/api/support/messages/:id/replies', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { content } = addReplySchema.parse(request.body);

        const message = await app.prisma.supportMessage.findUnique({
            where: { id }
        });

        if (!message) {
            return reply.code(404).send({ message: 'Support message not found' });
        }

        const replyRecord = await app.prisma.supportReply.create({
            data: {
                messageId: id,
                content,
                senderName: message.clinicName,
                isFromAdmin: false
            }
        });

        // Re-open message if it was closed
        if (message.status === SupportMessageStatus.CLOSED) {
            await app.prisma.supportMessage.update({
                where: { id },
                data: {
                    status: SupportMessageStatus.NEW,
                    closedAt: null
                }
            });
        }

        await logAudit(app, {
            action: 'SUPPORT_REPLY_ADDED',
            details: `Clinic replied to: "${message.subject}"`,
            ip: request.ip
        });

        return reply.code(201).send(replyRecord);
    });

    /**
     * GET /api/support/messages/:id/conversation
     * Get full conversation (public - for clinic to view their messages)
     */
    app.get('/api/support/messages/:id/conversation', async (request, reply) => {
        const { id } = request.params as { id: string };

        const message = await app.prisma.supportMessage.findUnique({
            where: { id },
            include: {
                replies: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!message) {
            return reply.code(404).send({ message: 'Support message not found' });
        }

        return reply.send(message);
    });

    // ========================================
    // ADMIN ROUTES
    // ========================================

    /**
     * GET /support/messages
     * Get all support messages with filters (Admin)
     */
    app.get('/support/messages', {
        preHandler: [app.authenticate, app.authorize([Role.admin])]
    }, async (request, reply) => {
        const { status, clinicId, search, priority, assignedTo } = request.query as {
            status?: SupportMessageStatus;
            clinicId?: string;
            search?: string;
            priority?: MessagePriority;
            assignedTo?: string;
        };

        const where: any = {};

        if (status) where.status = status;
        if (clinicId) where.clinicId = clinicId;
        if (priority) where.priority = priority;
        if (assignedTo) where.assignedTo = assignedTo;

        if (search) {
            where.OR = [
                { clinicName: { contains: search, mode: 'insensitive' } },
                { accountCode: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [messages, unreadCount] = await Promise.all([
            app.prisma.supportMessage.findMany({
                where,
                include: {
                    assignedUser: {
                        select: { id: true, name: true, email: true }
                    },
                    replies: {
                        orderBy: { createdAt: 'desc' },
                        take: 1 // Latest reply only
                    },
                    _count: {
                        select: { replies: true }
                    }
                },
                orderBy: [
                    { priority: 'desc' }, // URGENT first
                    { createdAt: 'desc' }
                ],
                take: 100
            }),
            app.prisma.supportMessage.count({
                where: { status: SupportMessageStatus.NEW }
            })
        ]);

        return reply.send({
            messages,
            unreadCount
        });
    });

    /**
     * GET /support/messages/:id
     * Get single message with full conversation (Admin)
     */
    app.get('/support/messages/:id', {
        preHandler: [app.authenticate, app.authorize([Role.admin])]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const message = await app.prisma.supportMessage.findUnique({
            where: { id },
            include: {
                assignedUser: {
                    select: { id: true, name: true, email: true }
                },
                replies: {
                    orderBy: { createdAt: 'asc' }
                },
                _count: {
                    select: { replies: true }
                }
            }
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
                details: `Read message: "${message.subject}" from ${message.clinicName}`,
                ip: request.ip
            });

            message.status = SupportMessageStatus.READ;
            message.readAt = new Date();
        }

        return reply.send(message);
    });

    /**
     * POST /support/messages/:id/replies
     * Add admin reply to conversation
     */
    app.post('/support/messages/:id/replies', {
        preHandler: [app.authenticate, app.authorize([Role.admin])]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { content } = addReplySchema.parse(request.body);

        const message = await app.prisma.supportMessage.findUnique({
            where: { id }
        });

        if (!message) {
            return reply.code(404).send({ message: 'Support message not found' });
        }

        // Get sender name from database
        const sender = request.user?.userId
            ? await app.prisma.user.findUnique({
                where: { id: request.user.userId },
                select: { name: true }
            })
            : null;

        const replyRecord = await app.prisma.supportReply.create({
            data: {
                messageId: id,
                senderId: request.user?.userId,
                senderName: sender?.name || 'Support Team',
                content,
                isFromAdmin: true
            }
        });

        // Mark as read if NEW
        if (message.status === SupportMessageStatus.NEW) {
            await app.prisma.supportMessage.update({
                where: { id },
                data: {
                    status: SupportMessageStatus.READ,
                    readAt: new Date()
                }
            });
        }

        await logAudit(app, {
            userId: request.user?.userId,
            action: 'SUPPORT_REPLY_SENT',
            details: `Admin replied to: "${message.subject}"`,
            ip: request.ip
        });

        return reply.code(201).send(replyRecord);
    });

    /**
     * PATCH /support/messages/:id/status
     * Update message status
     */
    app.patch('/support/messages/:id/status', {
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

        const updateData: any = { status: status as SupportMessageStatus };

        if (status === 'READ' && !message.readAt) {
            updateData.readAt = new Date();
        }

        if (status === 'CLOSED' && !message.closedAt) {
            updateData.closedAt = new Date();
        }

        const updated = await app.prisma.supportMessage.update({
            where: { id },
            data: updateData
        });

        await logAudit(app, {
            userId: request.user?.userId,
            action: 'SUPPORT_MESSAGE_STATUS_UPDATED',
            details: `Changed status to ${status} for: "${message.subject}"`,
            ip: request.ip
        });

        return reply.send(updated);
    });

    /**
     * PATCH /support/messages/:id/assign
     * Assign message to admin
     */
    app.patch('/support/messages/:id/assign', {
        preHandler: [app.authenticate, app.authorize([Role.admin])]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { assignedTo } = assignMessageSchema.parse(request.body);

        const message = await app.prisma.supportMessage.findUnique({
            where: { id }
        });

        if (!message) {
            return reply.code(404).send({ message: 'Support message not found' });
        }

        const updated = await app.prisma.supportMessage.update({
            where: { id },
            data: { assignedTo },
            include: {
                assignedUser: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        await logAudit(app, {
            userId: request.user?.userId,
            action: 'SUPPORT_MESSAGE_ASSIGNED',
            details: `Assigned message "${message.subject}" to ${updated.assignedUser?.name || 'unassigned'}`,
            ip: request.ip
        });

        return reply.send(updated);
    });

    /**
     * PATCH /support/messages/:id/priority
     * Update message priority
     */
    app.patch('/support/messages/:id/priority', {
        preHandler: [app.authenticate, app.authorize([Role.admin])]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { priority } = updatePrioritySchema.parse(request.body);

        const message = await app.prisma.supportMessage.findUnique({
            where: { id }
        });

        if (!message) {
            return reply.code(404).send({ message: 'Support message not found' });
        }

        const updated = await app.prisma.supportMessage.update({
            where: { id },
            data: { priority: priority as MessagePriority }
        });

        await logAudit(app, {
            userId: request.user?.userId,
            action: 'SUPPORT_MESSAGE_PRIORITY_UPDATED',
            details: `Changed priority to ${priority} for: "${message.subject}"`,
            ip: request.ip
        });

        return reply.send(updated);
    });

    /**
     * DELETE /support/messages/:id
     * Delete message and all replies
     */
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
            details: `Deleted message: "${message.subject}" from ${message.clinicName}`,
            ip: request.ip
        });

        return reply.send({ success: true });
    });
}
