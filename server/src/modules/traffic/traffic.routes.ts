import { FastifyInstance } from 'fastify';
import { getTrafficLogs, getTrafficLogDetails, clearTrafficLogs } from './traffic.controller.js';

export async function trafficRoutes(app: FastifyInstance) {
    app.get(
        '/',
        {
            preHandler: [app.authenticate],
        },
        getTrafficLogs
    );

    app.get(
        '/:id',
        {
            preHandler: [app.authenticate],
        },
        getTrafficLogDetails
    );

    app.post(
        '/clear',
        {
            preHandler: [app.authenticate],
        },
        clearTrafficLogs
    );
}
