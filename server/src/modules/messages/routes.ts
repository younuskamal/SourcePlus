import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';

export default async function messagesRoutes(app: FastifyInstance) {

    // Get all conversations (Admin only)
    app.get('/conversations', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const conversations = await app.prisma.conversation.findMany({
            include: {
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        doctorName: true
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        });

        return reply.send(conversations);
    });

    // Get conversation by ID with all messages
    app.get('/conversations/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const conversation = await app.prisma.conversation.findUnique({
            where: { id },
            include: {
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        doctorName: true,
                        phone: true,
                        address: true
                    }
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });

        if (!conversation) {
            return reply.code(404).send({ message: 'Conversation not found' });
        }

        // Mark all messages as read
        await app.prisma.clinicMessage.updateMany({
            where: {
                conversationId: id,
                isRead: false,
                sender: {
                    role: { not: Role.admin }
                }
            },
            data: { isRead: true }
        });

        // Reset unread count
        await app.prisma.conversation.update({
            where: { id },
            data: { unreadCount: 0 }
        });

        return reply.send(conversation);
    });

    // Send message (Admin only)
    app.post('/conversations/:id/messages', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = z.object({
            message: z.string().min(1)
        }).parse(request.body);

        const conversation = await app.prisma.conversation.findUnique({
            where: { id }
        });

        if (!conversation) {
            return reply.code(404).send({ message: 'Conversation not found' });
        }

        const message = await app.prisma.clinicMessage.create({
            data: {
                conversationId: id,
                senderId: request.user!.id,
                message: body.message,
                isRead: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        // Update conversation lastMessageAt
        await app.prisma.conversation.update({
            where: { id },
            data: { lastMessageAt: new Date() }
        });

        return reply.send(message);
    });

    // Create new conversation (or get existing one for clinic)
    app.post('/conversations', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const body = z.object({
            clinicId: z.string(),
            subject: z.string().optional(),
            initialMessage: z.string().optional()
        }).parse(request.body);

        // Check if conversation already exists
        let conversation = await app.prisma.conversation.findFirst({
            where: {
                clinicId: body.clinicId,
                status: 'active'
            },
            include: {
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        doctorName: true
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (conversation) {
            return reply.send(conversation);
        }

        // Create new conversation
        conversation = await app.prisma.conversation.create({
            data: {
                clinicId: body.clinicId,
                subject: body.subject,
                messages: body.initialMessage ? {
                    create: {
                        senderId: request.user!.id,
                        message: body.initialMessage,
                        isRead: false
                    }
                } : undefined
            },
            include: {
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        doctorName: true
                    }
                },
                messages: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });

        return reply.code(201).send(conversation);
    });

    // Archive conversation
    app.patch('/conversations/:id/archive', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const conversation = await app.prisma.conversation.update({
            where: { id },
            data: { status: 'archived' }
        });

        return reply.send(conversation);
    });

    // Unarchive conversation
    app.patch('/conversations/:id/unarchive', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const conversation = await app.prisma.conversation.update({
            where: { id },
            data: { status: 'active' }
        });

        return reply.send(conversation);
    });

    // Delete conversation
    app.delete('/conversations/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { id } = request.params as { id: string };

        await app.prisma.conversation.delete({
            where: { id }
        });

        return reply.code(204).send();
    });

    // Get unread count
    app.get('/conversations/unread/count', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const totalUnread = await app.prisma.conversation.aggregate({
            where: { status: 'active' },
            _sum: { unreadCount: true }
        });

        return reply.send({ unreadCount: totalUnread._sum.unreadCount || 0 });
    });
}
