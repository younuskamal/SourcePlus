import { FastifyInstance } from 'fastify';
import { prisma } from '../../plugins/prisma.js'; // تأكد من مسار Prisma الصحيح

export default async function clientRoutes(fastify: FastifyInstance) {

  // 1. Validate Serial (التحضير)
  fastify.post('/validate', async (request, reply) => {
    const { serial } = request.body as any;
    // هنا منطق التحقق من قاعدة البيانات
    // للتجربة سنعيد رد نجاح وهمي
    return {
      valid: true,
      status: "active",
      plan: { name: "Standard Plan", features: ["Offline Mode"] },
      expireDate: "2025-12-31T00:00:00Z"
    };
  });

  // 2. Activate (التفعيل)
  fastify.post('/activate', async (request, reply) => {
    const { serial, hardwareId } = request.body as any;
    return {
      success: true,
      message: "Device activated successfully",
      licenseToken: "JWT-OR-KEY-HERE"
    };
  });

  // 3. Check License (الفحص اليومي)
  fastify.get('/check-license', async (request, reply) => {
    return {
      valid: true,
      status: "active",
      daysLeft: 365
    };
  });

  // 4. Heartbeat (نبض النظام)
  fastify.post('/heartbeat', async (request, reply) => {
    return { success: true, timestamp: new Date() };
  });

  // 5. Check Updates (التحديثات)
  fastify.get('/check-update', async (request, reply) => {
    return {
      shouldUpdate: false,
      latest: { version: "1.0.0" }
    };
  });

  // 6. Sync Config (المزامنة)
  fastify.get('/sync-config', async (request, reply) => {
    return { maintenance_mode: false, min_version: "1.0.0" };
  });

  // 7. Support (الدعم الفني)
  fastify.post('/support', async (request, reply) => {
    return { ticketId: "TICKET-12345", status: "open" };
  });

  fastify.get('/support', async (request, reply) => {
    return []; // إرجاع قائمة فارغة أو تذاكر وهمية
  });

  // 8. Notifications (الإشعارات)
  fastify.get('/notifications', async (request, reply) => {
    return [
      { id: 1, title: "مرحباً", body: "تم تفعيل النظام بنجاح", sentAt: new Date() }
    ];
  });
}