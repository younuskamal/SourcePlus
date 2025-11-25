import { FastifyInstance } from 'fastify';
import { Role } from '@prisma/client';

export default async function analyticsRoutes(app: FastifyInstance) {
  app.get('/stats', { preHandler: [app.authenticate] }, async () => {
    const licenses = await app.prisma.license.findMany();
    const activeCount = licenses.filter((l) => l.status === 'active').length;
    const expiredCount = licenses.filter((l) => l.status === 'expired').length;
    const customers = new Set(licenses.map((l) => l.customerName)).size;
    const revenue = await app.prisma.transaction.aggregate({ _sum: { amount: true } });
    return {
      activeLicenses: activeCount,
      expiredLicenses: expiredCount,
      totalRevenueUSD: revenue._sum.amount ?? 0,
      totalCustomers: customers,
      expiringSoonCount: 0,
      openTickets: await app.prisma.supportTicket.count({ where: { status: 'open' } })
    };
  });

  app.get('/server-health', async () => {
    // Placeholder random metrics
    return {
      cpuUsage: Math.floor(10 + Math.random() * 15),
      ramUsage: Math.floor(35 + Math.random() * 5),
      diskUsage: 42,
      uptimeSeconds: Math.floor(process.uptime()),
      networkIn: Number((Math.random() * 2).toFixed(1)),
      networkOut: Number((Math.random() * 5).toFixed(1)),
      activeConnections: 12 + Math.floor(Math.random() * 5),
      lastUpdated: new Date().toISOString()
    };
  });

  app.get('/transactions', { preHandler: [app.authenticate] }, async () => {
    return app.prisma.transaction.findMany({ orderBy: { date: 'desc' } });
  });

  app.get('/financial-stats', { preHandler: [app.authenticate] }, async () => {
    const transactions = await app.prisma.transaction.findMany({ where: { status: 'completed' } });
    const totalRevenue = transactions.reduce((s, t) => s + t.amount, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyRevenue = transactions.filter((t) => t.date >= today).reduce((s, t) => s + t.amount, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthlyRevenue = transactions.filter((t) => t.date >= monthStart).reduce((s, t) => s + t.amount, 0);
    return { totalRevenue, dailyRevenue, monthlyRevenue };
  });

  app.get('/revenue-history', { preHandler: [app.authenticate] }, async () => {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const months: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months[monthNames[d.getMonth()]] = 0;
    }
    const transactions = await app.prisma.transaction.findMany({ where: { status: 'completed' } });
    transactions.forEach((t) => {
      const key = monthNames[new Date(t.date).getMonth()];
      if (months[key] !== undefined) months[key] += t.amount;
    });
    return Object.keys(months).map((name) => ({ name, revenue: months[name] }));
  });
}
