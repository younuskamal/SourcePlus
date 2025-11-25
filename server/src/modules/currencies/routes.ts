import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

const currencySchema = z.object({
  code: z.string().min(3).max(3),
  rate: z.number().positive(),
  symbol: z.string().min(1).max(5)
});

export default async function currencyRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    return app.prisma.currency.findMany();
  });

  app.post('/', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const data = currencySchema.parse(request.body);
    const currency = await app.prisma.currency.create({ data });
    await logAudit(app, { userId: request.user?.id, action: 'ADD_CURRENCY', details: `Added ${currency.code}`, ip: request.ip });
    return reply.code(201).send(currency);
  });

  app.post('/sync', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    try {
      const currencies = await app.prisma.currency.findMany();
      
      let ratesMap: Record<string, number> = {};
      let synced = false;

      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json() as { rates?: Record<string, number> };
          if (data?.rates) {
            ratesMap = data.rates;
            synced = true;
          }
        }
      } catch (apiError) {
        request.log.warn('External API fetch failed, using simulated rates');
      }

      if (!synced) {
        ratesMap = {
          'EUR': 0.92,
          'GBP': 0.79,
          'JPY': 149.50,
          'AUD': 1.53,
          'CAD': 1.36,
          'CHF': 0.89,
          'CNY': 7.24,
          'INR': 83.12,
          'MXN': 17.05,
          'SGD': 1.34,
          'HKD': 7.81,
          'NOK': 10.45,
          'SEK': 10.83,
          'NZD': 1.69,
          'IQD': 1310.00,
          'SAR': 3.75,
          'AED': 3.67,
          'TRY': 32.50,
          'EGP': 30.90,
          'KWD': 0.31,
          'QAR': 3.64,
          'BHD': 0.376,
          'OMR': 0.385
        };
      }

      const updated = await Promise.all(
        currencies.map((c) => {
          if (c.code === 'USD') return Promise.resolve(null);

          const newRate = ratesMap[c.code];
          if (newRate && newRate > 0) {
            return app.prisma.currency.update({
              where: { code: c.code },
              data: { rate: newRate, lastUpdated: new Date() }
            });
          }
          return Promise.resolve(null);
        })
      );

      await logAudit(app, { 
        userId: request.user?.id, 
        action: 'SYNC_RATES', 
        details: `Synced ${updated.filter(Boolean).length} currency rates (${synced ? 'from API' : 'simulated'})`, 
        ip: request.ip 
      });
      
      return reply.send({ 
        updated: updated.filter(Boolean).length,
        source: synced ? 'exchangerate-api.com' : 'simulated'
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ message: 'Failed to sync rates' });
    }
  });

  app.patch('/:code', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const code = (request.params as { code: string }).code;
    const currency = await app.prisma.currency.update({ where: { code }, data: currencySchema.partial().parse(request.body) });
    await logAudit(app, { userId: request.user?.id, action: 'UPDATE_CURRENCY', details: `Updated ${currency.code}`, ip: request.ip });
    return reply.send(currency);
  });

  app.delete('/:code', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const code = (request.params as { code: string }).code;
    const currency = await app.prisma.currency.delete({ where: { code } });
    await logAudit(app, { userId: request.user?.id, action: 'DELETE_CURRENCY', details: `Deleted ${currency.code}`, ip: request.ip });
    return reply.code(204).send();
  });
}
