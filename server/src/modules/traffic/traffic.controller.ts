import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function getTrafficLogs(
    request: FastifyRequest<{
        Querystring: {
            page?: string;
            limit?: string;
            method?: string;
            status?: string;
            endpoint?: string;
            serial?: string;
            hardwareId?: string;
            search?: string;
            startDate?: string;
            endDate?: string;
        };
    }>,
    reply: FastifyReply
) {
    const page = parseInt(request.query.page || '1');
    const limit = parseInt(request.query.limit || '50');
    const skip = (page - 1) * limit;

    const { method, status, endpoint, serial, hardwareId, search, startDate, endDate } = request.query;

    const where: any = {};

    if (method) where.method = method;
    if (status) where.status = parseInt(status);
    if (endpoint) where.endpoint = { contains: endpoint, mode: 'insensitive' };
    if (serial) where.serial = { contains: serial, mode: 'insensitive' };
    if (hardwareId) where.hardwareId = { contains: hardwareId, mode: 'insensitive' };

    if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
    }

    if (search) {
        where.OR = [
            { endpoint: { contains: search, mode: 'insensitive' } },
            { serial: { contains: search, mode: 'insensitive' } },
            { hardwareId: { contains: search, mode: 'insensitive' } },
            { ipAddress: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [total, logs] = await Promise.all([
        request.server.prisma.trafficLog.count({ where }),
        request.server.prisma.trafficLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip,
            take: limit,
        }),
    ]);

    return {
        data: logs,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function getTrafficLogDetails(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const log = await request.server.prisma.trafficLog.findUnique({
        where: { id },
    });

    if (!log) {
        return reply.code(404).send({ error: 'Log not found' });
    }

    return log;
}

export async function clearTrafficLogs(
    request: FastifyRequest,
    reply: FastifyReply
) {
    // Delete all logs
    await request.server.prisma.trafficLog.deleteMany();

    // Create audit log
    await request.server.prisma.auditLog.create({
        data: {
            action: 'TRAFFIC_LOGS_CLEARED',
            details: 'Traffic logs cleared by admin',
            userId: request.user?.id,
            ipAddress: request.ip,
        },
    });

    return { success: true, message: 'Traffic logs cleared' };
}
