import { FastifyInstance } from 'fastify';

export default async function publicPlanRoutes(app: FastifyInstance) {
    app.get('/', async (request, reply) => {
        const plans = await app.prisma.plan.findMany({
            where: { isActive: true }
        });

        const formattedPlans = plans.map(plan => ({
            id: plan.id,
            name: plan.name,
            price_monthly: plan.price_monthly || 0,
            price_yearly: plan.price_yearly || 0,
            currency: plan.currency,
            features: plan.features,
            limits: plan.limits || {},
            is_active: plan.isActive
        }));

        return { plans: formattedPlans };
    });
}
