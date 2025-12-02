# 🔧 Support System Fix

## المشكلة
```
GET /api/support/messages → 404 Not Found
```

## السبب
لم يكن هناك support module في الـ backend.

## الحل ✅

### 1. إضافة Support Routes
**File**: `server/src/modules/support/routes.ts`

**Endpoints**:
- `GET /api/support/messages` - Get all support messages (Admin/Developer)
- `POST /api/support/messages` - Submit support message (Public)
- `PATCH /api/support/messages/:id` - Update message status
- `DELETE /api/support/messages/:id` - Delete message (Admin only)

### 2. إضافة Database Models
**File**: `server/prisma/schema.prisma`

**Models**:
```prisma
model SupportMessage {
  id        String   @id @default(uuid())
  name      String
  serial    String?
  message   String
  status    String   @default("pending")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  replies   SupportReply[]
}

model SupportReply {
  id        String         @id @default(uuid())
  messageId String
  message   SupportMessage @relation(...)
  userId    String
  user      User           @relation(...)
  reply     String
  createdAt DateTime       @default(now())
}
```

### 3. تسجيل Routes
**File**: `server/src/routes.ts`

```typescript
import supportRoutes from './modules/support/routes.js';

app.register(supportRoutes, { prefix: '/api/support' });
```

### 4. Migration
**File**: `server/prisma/migrations/20241202_add_support_messages/migration.sql`

## كيفية التطبيق

### خطوة 1: Generate Prisma Client
```bash
cd server
npx prisma generate
```

### خطوة 2: Run Migration
```bash
npx prisma migrate deploy
```

أو إذا كنت في development:
```bash
npx prisma migrate dev
```

### خطوة 3: Restart Server
```bash
npm run dev
```

## الميزات

### ✅ Submit Support Message (Public)
```http
POST /api/support/messages
Content-Type: application/json

{
  "name": "John Doe",
  "serial": "SP-2024-XXXX-XXXX",
  "message": "I need help with..."
}
```

### ✅ Get All Messages (Admin/Developer)
```http
GET /api/support/messages
Authorization: Bearer {token}
```

### ✅ Update Status
```http
PATCH /api/support/messages/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "resolved"
}
```

**Statuses**:
- `pending` - جديدة
- `resolved` - تم الحل
- `closed` - مغلقة

### ✅ Delete Message (Admin)
```http
DELETE /api/support/messages/{id}
Authorization: Bearer {token}
```

## Audit Logging

جميع العمليات يتم تسجيلها في Audit Log:
- `SUPPORT_MESSAGE_SUBMITTED` - عند إرسال رسالة
- `SUPPORT_MESSAGE_UPDATED` - عند تحديث الحالة
- `SUPPORT_MESSAGE_DELETED` - عند الحذف

## Security

- ✅ Public endpoint للإرسال (لا يحتاج authentication)
- ✅ Admin/Developer فقط لعرض الرسائل
- ✅ Admin فقط للحذف
- ✅ Validation باستخدام Zod
- ✅ Audit logging لجميع العمليات

## Frontend Integration

الـ frontend يجب أن يستخدم:
```typescript
// في api.ts
async getSupportMessages() {
  return doRequest<SupportMessage[]>('/api/support/messages');
}

async submitSupportMessage(data: { name: string; serial?: string; message: string }) {
  return doRequest('/api/support/messages', {
    method: 'POST',
    body: JSON.stringify(data)
  }, false); // false = no auth required
}
```

## Testing

### Test Submit (Public)
```bash
curl -X POST http://localhost:3000/api/support/messages \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","message":"Test message"}'
```

### Test Get (Requires Auth)
```bash
curl http://localhost:3000/api/support/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## الآن الخطأ 404 تم حله! ✅

بعد تطبيق هذه التغييرات:
1. ✅ الـ endpoint موجود
2. ✅ الـ database جاهزة
3. ✅ الـ routes مسجلة
4. ✅ الـ validation موجودة
5. ✅ الـ audit logging يعمل

## Next Steps

يمكنك الآن:
1. إنشاء صفحة Support في الـ frontend
2. عرض الرسائل للـ Admin
3. إضافة نظام الردود (Replies)
4. إضافة إشعارات عند رسالة جديدة
