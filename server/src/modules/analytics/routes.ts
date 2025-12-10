import { FastifyInstance } from 'fastify';
import { Role } from '@prisma/client';

export default async function analyticsRoutes(app: FastifyInstance) {
  // Helper to get exchange rate
  const getRate = async (code: string) => {
    if (code === 'USD') return 1;
    const currency = await app.prisma.currency.findUnique({ where: { code } });
    // Default fallback rates if DB is empty: IQD ~ 1500, etc.
    if (!currency) {
      if (code === 'IQD') return 1500;
      return 1;
    }
    return currency.rate; // Rate is "IQD per 1 USD" e.g. 1500
  };

  const normalizeToUSD = async (amount: number, currencyCode: string) => {
    if (currencyCode === 'USD') return amount;
    const rate = await getRate(currencyCode);
    return amount / (rate || 1);
  };

  app.get('/stats', { preHandler: [app.authenticate] }, async () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const [licenses, transactions, openTickets] = await Promise.all([
      app.prisma.license.findMany(),
      app.prisma.transaction.findMany({ where: { status: 'completed' } }),
      app.prisma.supportTicket.count({ where: { status: 'open' } })
    ]);

    const activeCount = licenses.filter((l) => l.status === 'active').length;
    const expiredCount = licenses.filter((l) => l.status === 'expired').length;

    // Expiring soon: Active AND expireDate is within next 30 days
    const expiringSoonCount = licenses.filter(l =>
      l.status === 'active' &&
      l.expireDate &&
      new Date(l.expireDate) > now &&
      new Date(l.expireDate) <= thirtyDaysFromNow
    ).length;

    const customers = new Set(licenses.map((l) => l.customerName)).size;

    // Calculate detailed revenue
    let totalRevenueUSD = 0;

    // We need to fetch rates once to avoid N+1 queries ideally, but for now cache them map
    const currencies = await app.prisma.currency.findMany();
    const rates: Record<string, number> = { 'USD': 1, 'IQD': 1500 };
    currencies.forEach(c => rates[c.code] = c.rate);

    for (const t of transactions) {
      const rate = rates[t.currency] || 1;
      totalRevenueUSD += (t.currency === 'USD' ? t.amount : t.amount / rate);
    }

    return {
      activeLicenses: activeCount,
      expiredLicenses: expiredCount,
      totalRevenueUSD: Math.round(totalRevenueUSD),
      totalCustomers: customers,
      expiringSoonCount,
      openTickets
    };
  });

  app.get('/server-health', async () => {
    // In a real app, use 'os' module. For now, we simulate realistic fluctuation.
    const uptime = process.uptime();
    return {
      cpuUsage: Math.floor(10 + Math.random() * 25), // 10-35%
      ramUsage: Math.floor(40 + Math.random() * 10), // 40-50%
      diskUsage: 45, // Static for now
      uptimeSeconds: Math.floor(uptime),
      networkIn: Number((2 + Math.random() * 5).toFixed(1)),
      networkOut: Number((5 + Math.random() * 10).toFixed(1)),
      activeConnections: 12 + Math.floor(Math.random() * 10),
      lastUpdated: new Date().toISOString()
    };
  });

  app.get('/transactions', { preHandler: [app.authenticate] }, async () => {
    return app.prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      take: 50
    });
  });

  app.get('/financial-stats', { preHandler: [app.authenticate] }, async () => {
    const transactions = await app.prisma.transaction.findMany({ where: { status: 'completed' } });

    const currencies = await app.prisma.currency.findMany();
    const rates: Record<string, number> = { 'USD': 1, 'IQD': 1500 };
    currencies.forEach(c => rates[c.code] = c.rate);

    let totalRevenue = 0;
    let dailyRevenue = 0;
    let monthlyRevenue = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    for (const t of transactions) {
      const rate = rates[t.currency] || 1;
      const amountUSD = (t.currency === 'USD' ? t.amount : t.amount / rate);
      const tDate = new Date(t.date);

      totalRevenue += amountUSD;
      if (tDate >= today) dailyRevenue += amountUSD;
      if (tDate >= monthStart) monthlyRevenue += amountUSD;
    }

    return {
      totalRevenue: Math.round(totalRevenue),
      dailyRevenue: Math.round(dailyRevenue),
      monthlyRevenue: Math.round(monthlyRevenue)
    };
  });

  app.get('/revenue-history', { preHandler: [app.authenticate] }, async () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Prepare buckets for last 12 months
    const buckets: { name: string, year: number, monthIndex: number, revenue: number }[] = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      buckets.push({
        name: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        revenue: 0
      });
    }

    const startPeriod = new Date(buckets[0].year, buckets[0].monthIndex, 1);

    const transactions = await app.prisma.transaction.findMany({
      where: {
        status: 'completed',
        date: { gte: startPeriod }
      }
    });

    const currencies = await app.prisma.currency.findMany();
    const rates: Record<string, number> = { 'USD': 1, 'IQD': 1500 };
    currencies.forEach(c => rates[c.code] = c.rate);

    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      const bucket = buckets.find(b => b.year === tDate.getFullYear() && b.monthIndex === tDate.getMonth());
      if (bucket) {
        const rate = rates[t.currency] || 1;
        const amountUSD = (t.currency === 'USD' ? t.amount : t.amount / rate);
        bucket.revenue += amountUSD;
      }
    });

    return buckets.map(b => ({ name: b.name, revenue: Math.round(b.revenue) }));
  });
}
