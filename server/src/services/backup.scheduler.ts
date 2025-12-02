import { FastifyInstance } from 'fastify';
import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface BackupConfig {
    enabled: boolean;
    schedule: string; // cron expression
    retentionDays: number;
    backupPath: string;
}

export class BackupScheduler {
    private app: FastifyInstance;
    private task: cron.ScheduledTask | null = null;
    private config: BackupConfig;

    constructor(app: FastifyInstance) {
        this.app = app;
        this.config = {
            enabled: process.env.AUTO_BACKUP_ENABLED === 'true',
            schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Default: 2 AM daily
            retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
            backupPath: process.env.BACKUP_PATH || './backups'
        };
    }

    async start() {
        if (!this.config.enabled) {
            this.app.log.info('Automatic backups are disabled');
            return;
        }

        this.app.log.info(`Starting backup scheduler with schedule: ${this.config.schedule}`);

        this.task = cron.schedule(this.config.schedule, async () => {
            try {
                await this.performBackup();
                await this.cleanOldBackups();
            } catch (error) {
                this.app.log.error({ err: error }, 'Scheduled backup failed');
                // TODO: Send notification about backup failure
            }
        });

        this.app.log.info('Backup scheduler started successfully');
    }

    async stop() {
        if (this.task) {
            this.task.stop();
            this.app.log.info('Backup scheduler stopped');
        }
    }

    private async performBackup(): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql`;
        const filepath = path.join(this.config.backupPath, filename);

        this.app.log.info(`Starting backup: ${filename}`);

        // Ensure backup directory exists
        await fs.mkdir(this.config.backupPath, { recursive: true });

        // Get database URL from environment
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL not configured');
        }

        // Parse database URL
        const dbUrl = new URL(databaseUrl);
        const dbName = dbUrl.pathname.slice(1);
        const dbUser = dbUrl.username;
        const dbPassword = dbUrl.password;
        const dbHost = dbUrl.hostname;
        const dbPort = dbUrl.port || '5432';

        // Create backup using pg_dump
        const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f "${filepath}"`;

        try {
            await execAsync(command);

            // Get file size
            const stats = await fs.stat(filepath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            this.app.log.info(`Backup completed successfully: ${filename} (${sizeMB} MB)`);

            // Log to audit
            await this.app.prisma.auditLog.create({
                data: {
                    action: 'BACKUP_CREATE',
                    details: `Automatic backup created: ${filename} (${sizeMB} MB)`,
                    ipAddress: 'system'
                }
            });

            return filename;
        } catch (error) {
            this.app.log.error({ err: error }, 'Backup creation failed');
            throw error;
        }
    }

    private async cleanOldBackups() {
        try {
            const files = await fs.readdir(this.config.backupPath);
            const now = Date.now();
            const maxAge = this.config.retentionDays * 24 * 60 * 60 * 1000;

            let deletedCount = 0;

            for (const file of files) {
                if (!file.startsWith('backup-') || !file.endsWith('.sql')) {
                    continue;
                }

                const filepath = path.join(this.config.backupPath, file);
                const stats = await fs.stat(filepath);
                const age = now - stats.mtimeMs;

                if (age > maxAge) {
                    await fs.unlink(filepath);
                    deletedCount++;
                    this.app.log.info(`Deleted old backup: ${file}`);
                }
            }

            if (deletedCount > 0) {
                await this.app.prisma.auditLog.create({
                    data: {
                        action: 'BACKUP_CLEANUP',
                        details: `Deleted ${deletedCount} old backup(s)`,
                        ipAddress: 'system'
                    }
                });
            }
        } catch (error) {
            this.app.log.error({ err: error }, 'Backup cleanup failed');
        }
    }

    async updateConfig(config: Partial<BackupConfig>) {
        this.config = { ...this.config, ...config };

        // Restart scheduler with new config
        await this.stop();
        await this.start();
    }

    getConfig(): BackupConfig {
        return { ...this.config };
    }
}
