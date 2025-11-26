import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { TicketStatus, Role } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

const createTicketSchema = z.object({
  serial: z.string().min(4),
  hardwareId: z.string().min(4),
  deviceName: z.string().min(1),
  systemVersion: z.string().min(1),
  phoneNumber: z.string().min(4),
  appVersion: z.string().min(1),
  description: z.string().min(3)
});

export default async function ticketRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    return app.prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: { replies: true, attachments: true }
    });
  });

  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const data = createTicketSchema.parse(request.body);
    const ticket = await app.prisma.supportTicket.create({ data });
    await logAudit(app, { userId: request.user?.id, action: 'CREATE_TICKET', details: ticket.serial, ip: request.ip });
    return reply.code(201).send(ticket);
  });

  app.post('/:id/reply', { preHandler: [app.authorize([Role.admin, Role.developer])] }, async (request, reply) => {
    const { message } = z.object({ message: z.string().min(1) }).parse(request.body);
    const id = (request.params as { id: string }).id;
    const replyRow = await app.prisma.supportReply.create({
      data: { ticketId: id, userId: request.user?.id, message }
    });
    await app.prisma.supportTicket.update({ where: { id }, data: { status: TicketStatus.in_progress, adminReply: message, replyAt: new Date() } });
    await logAudit(app, { userId: request.user?.id, action: 'REPLY_TICKET', details: id, ip: request.ip });
    return reply.send(replyRow);
  });

  app.post('/:id/resolve', { preHandler: [app.authorize([Role.admin, Role.developer])]}, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const ticket = await app.prisma.supportTicket.update({ where: { id }, data: { status: TicketStatus.resolved } });
    await logAudit(app, { userId: request.user?.id, action: 'RESOLVE_TICKET', details: id, ip: request.ip });
    return reply.send(ticket);
  });

  app.delete('/:id', { preHandler: [app.authorize([Role.admin, Role.developer])]}, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    await app.prisma.supportTicket.delete({ where: { id } });
    await logAudit(app, { userId: request.user?.id, action: 'DELETE_TICKET', details: id, ip: request.ip });
    return reply.code(204).send();
  });

  // Attachment upload (local disk placeholder)
  app.post('/:id/attachments', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parts = request.parts();
    const id = (request.params as { id: string }).id;
    const attachments: any[] = [];
    for await (const part of parts) {
      if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        // In real deployment, upload to S3 and get URL
        const path = `/tmp/${Date.now()}-${part.filename}`;
        // eslint-disable-next-line no-restricted-syntax
        await import('node:fs/promises').then((fs) => fs.writeFile(path, buffer));
        const att = await app.prisma.attachment.create({
          data: { ticketId: id, path, mimeType: part.mimetype, size: buffer.length }
        });
        attachments.push(att);
      }
    }
    await logAudit(app, { userId: request.user?.id, action: 'UPLOAD_ATTACHMENT', details: `ticket ${id}`, ip: request.ip });
    return reply.send({ attachments });
  });
}
