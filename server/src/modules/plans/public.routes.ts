import { FastifyInstance } from 'fastify';

export default async function publicPlanRoutes(app: FastifyInstance) {
    app.get('/', async (request, reply) => {
        const plans = await app.prisma.plan.findMany({
            where: { isActive: true },
            include: { prices: true }
        });

        const formattedPlans = plans.map(plan => {
            // Find primary price or fallback to first price or defaults
            const primaryPrice = plan.prices.find(p => p.isPrimary) || plan.prices[0];

            return {
                id: plan.id,
                name: plan.name,
                // Map primary price to legacy fields for backward compatibility
                price_monthly: primaryPrice?.monthlyPrice || 0,
                price_yearly: primaryPrice?.yearlyPrice || 0,
                currency: primaryPrice?.currency || 'IQD',

                // Include full prices array for new clients
                prices: plan.prices.map(p => ({
                    currency: p.currency,
                    monthlyPrice: p.monthlyPrice,
                    periodPrice: p.periodPrice,
                    yearlyPrice: p.yearlyPrice,
                    discount: p.discount,
                    isPrimary: p.isPrimary
                })),

                features: plan.features,
                limits: plan.limits || {},
                is_active: plan.isActive
            };
        });

        return { plans: formattedPlans };
    });
}
