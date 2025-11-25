import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { logAudit } from '../../utils/audit.js';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
async function ensureBackupDir() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
}

export default async function backupRoutes(app: FastifyInstance) {
    await ensureBackupDir();

    // List Backups
    app.get('/', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        try {
            const files = await fs.readdir(BACKUP_DIR);
            const backups = await Promise.all(
                files
                    .filter(f => f.endsWith('.json'))
                    .map(async (file) => {
                        const stats = await fs.stat(path.join(BACKUP_DIR, file));
                        return {
                            filename: file,
                            size: stats.size,
                            createdAt: stats.birthtime,
                        };
                    })
            );
            // Sort newest first
            return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to list backups' });
        }
    });

    // Create Backup
    app.post('/', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup-${timestamp}.json`;
            const filepath = path.join(BACKUP_DIR, filename);

            // Fetch all data
            const [
                users,
                plans,
                currencies,
                licenses,
                transactions,
                supportTickets,
                notifications,
                auditLogs,
                systemSettings,
                remoteConfigs
            ] = await app.prisma.$transaction([
                app.prisma.user.findMany(),
                app.prisma.subscriptionPlan.findMany({ include: { prices: true } }),
                app.prisma.currency.findMany(),
                app.prisma.license.findMany(),
                app.prisma.transaction.findMany(),
                app.prisma.supportTicket.findMany({ include: { messages: true } }),
                app.prisma.notification.findMany(),
                app.prisma.auditLog.findMany(),
                app.prisma.systemSetting.findMany(),
                app.prisma.remoteConfig.findMany()
            ]);

            const backupData = {
                version: '1.0',
                timestamp: new Date(),
                data: {
                    users,
                    plans,
                    currencies,
                    licenses,
                    transactions,
                    supportTickets,
                    notifications,
                    auditLogs,
                    systemSettings,
                    remoteConfigs
                }
            };

            await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));

            await logAudit(app, { userId: request.user?.id, action: 'CREATE_BACKUP', details: `Created backup: ${filename}`, ip: request.ip });

            return { message: 'Backup created successfully', filename };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to create backup' });
        }
    });

    // Restore Backup
    app.post('/restore/:filename', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { filename } = request.params as { filename: string };
        const filepath = path.join(BACKUP_DIR, filename);

        try {
            const fileContent = await fs.readFile(filepath, 'utf-8');
            const backup = JSON.parse(fileContent);
            const { data } = backup;

            // Validate structure roughly
            if (!data || !data.users) {
                throw new Error('Invalid backup format');
            }

            // Execute Restore Transaction
            // We delete everything first to ensure a clean state, then re-create.
            // Order matters for Foreign Keys!
            await app.prisma.$transaction(async (tx) => {
                // 1. Delete All (Reverse dependency order)
                await tx.auditLog.deleteMany();
                await tx.notification.deleteMany();
                await tx.transaction.deleteMany(); // Depends on License, Plan, User
                await tx.license.deleteMany();     // Depends on Plan, User
                // Support tickets have messages, need to delete messages first if cascade isn't set, 
                // but schema usually handles cascade or we delete ticket which cascades.
                // Assuming cascade or simple delete:
                await tx.supportMessage.deleteMany();
                await tx.supportTicket.deleteMany();

                await tx.planPrice.deleteMany();
                await tx.subscriptionPlan.deleteMany();

                await tx.currency.deleteMany();
                await tx.user.deleteMany();

                await tx.systemSetting.deleteMany();
                await tx.remoteConfig.deleteMany();

                // 2. Create All (Dependency order)
                // Users
                if (data.users?.length) await tx.user.createMany({ data: data.users });

                // Currencies
                if (data.currencies?.length) await tx.currency.createMany({ data: data.currencies });

                // Settings
                if (data.systemSettings?.length) await tx.systemSetting.createMany({ data: data.systemSettings });
                if (data.remoteConfigs?.length) await tx.remoteConfig.createMany({ data: data.remoteConfigs });

                // Plans & Prices (Need to handle relation manually if createMany doesn't support nested)
                // createMany does NOT support nested relations. We must loop.
                for (const plan of data.plans || []) {
                    const { prices, ...planData } = plan;
                    await tx.subscriptionPlan.create({
                        data: {
                            ...planData,
                            prices: {
                                create: prices
                            }
                        }
                    });
                }

                // Licenses
                if (data.licenses?.length) await tx.license.createMany({ data: data.licenses });

                // Transactions
                if (data.transactions?.length) await tx.transaction.createMany({ data: data.transactions });

                // Notifications
                if (data.notifications?.length) await tx.notification.createMany({ data: data.notifications });

                // Audit Logs
                if (data.auditLogs?.length) await tx.auditLog.createMany({ data: data.auditLogs });

                // Support Tickets (Loop for nested messages)
                for (const ticket of data.supportTickets || []) {
                    const { messages, ...ticketData } = ticket;
                    await tx.supportTicket.create({
                        data: {
                            ...ticketData,
                            messages: {
                                create: messages
                            }
                        }
                    });
                }
            });

            await logAudit(app, { userId: request.user?.id, action: 'RESTORE_BACKUP', details: `Restored backup: ${filename}`, ip: request.ip });
            return { message: 'System restored successfully' };

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to restore backup: ' + (error as Error).message });
        }
    });

    // Delete Backup
    app.delete('/:filename', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { filename } = request.params as { filename: string };
        const filepath = path.join(BACKUP_DIR, filename);

        try {
            await fs.unlink(filepath);
            await logAudit(app, { userId: request.user?.id, action: 'DELETE_BACKUP', details: `Deleted backup: ${filename}`, ip: request.ip });
            return { message: 'Backup deleted successfully' };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to delete backup' });
        }
    });

    // Download Backup
    app.get('/download/:filename', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        const { filename } = request.params as { filename: string };
        const filepath = path.join(BACKUP_DIR, filename);
        return reply.download(filename, filepath); // Requires fastify-static or manual stream
    });

    // Upload Backup
    app.post('/upload', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.code(400).send({ message: 'No file uploaded' });
            }

            const filename = data.filename;
            if (!filename.endsWith('.json')) {
                return reply.code(400).send({ message: 'Invalid file type. Only .json allowed' });
            }

            const filepath = path.join(BACKUP_DIR, filename);
            await fs.writeFile(filepath, await data.toBuffer());

            await logAudit(app, { userId: request.user?.id, action: 'UPLOAD_BACKUP', details: `Uploaded backup: ${filename}`, ip: request.ip });
            return { message: 'Backup uploaded successfully', filename };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ message: 'Failed to upload backup' });
        }
    });
}
