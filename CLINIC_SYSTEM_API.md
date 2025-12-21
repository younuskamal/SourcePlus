# 📚 Clinic System - Complete API Documentation

**Version**: 3.1 (Updated)  
**Last Updated**: 2025-12-21  
**Status**: Production Ready ✅  
**Base URL**: `https://your-domain.com`

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Clinic Controls API](#clinic-controls-api)
4. [Clinic Usage API](#clinic-usage-api)
5. [Support Messages API (New)](#support-messages-api-new)
6. [Support Routes API (Legacy)](#support-routes-api-legacy)
7. [Error Handling](#error-handling)
8. [Database Schema](#database-schema)
9. [Best Practices](#best-practices)

---

## 🎯 Overview

SourcePlus يوفر مجموعة من الـ APIs لإدارة العيادات بشكل كامل:

### **الأدوار**:
- **SourcePlus Admin**: إدارة كاملة (create, read, update, delete)
- **Smart Clinic**: قراءة الإعدادات + إرسال رسائل دعم

### **Core APIs**:
1. ✅ **Controls API** (2 endpoints) - إدارة حدود وإعدادات العيادة
2. ✅ **Usage API** (1 endpoint) - تتبع استخدام الموارد
3. ✅ **Support Messages API** (5 endpoints) - نظام رسائل دعم حديث
4. ✅ **Support Routes API** (3 endpoints) - للتوافق مع POS القديم

---

## 🔐 Authentication

### **JWT Token Structure**
```javascript
{
  "userId": "user-uuid-123",
  "email": "admin@sourceplus.com",
  "role": "admin", // or "developer"
  "iat": 1703145600,
  "exp": 1703232000
}
```

### **How to Get Token**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@sourceplus.com",
  "password": "your-password"
}
```

### **Response**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "user-uuid-123",
    "name": "Admin User",
    "role": "admin"
  }
}
```

### **Using Token**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🎛️ Clinic Controls API

### **1. GET /api/clinics/:id/controls**

#### **الغرض**
قراءة إعدادات وحدود العيادة (للاستخدام من Smart Clinic)

#### **Authentication**
❌ **Not Required** - Public access for Smart Clinic

#### **Parameters**
| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| `id` | string (UUID) | path | ✅ Yes | معرّف العيادة |

#### **Request Example**
```bash
curl -X GET "https://api.sourceplus.com/api/clinics/abc-123-def/controls"
```

#### **Response 200 OK**
```json
{
  "storageLimitMB": 2048,
  "usersLimit": 5,
  "features": {
    "patients": true,
    "appointments": true,
    "orthodontics": true,
    "xray": false,
    "ai": true
  },
  "locked": false,
  "lockReason": null
}
```

#### **Response Fields**
| Field | Type | Description |
|-------|------|-------------|
| `storageLimitMB` | number | الحد الأقصى للتخزين بالميجابايت |
| `usersLimit` | number | الحد الأقصى للمستخدمين |
| `features` | object | كائن يحتوي على feature flags |
| `features.patients` | boolean | تفعيل/تعطيل وحدة المرضى |
| `features.appointments` | boolean | تفعيل/تعطيل المواعيد |
| `features.orthodontics` | boolean | تفعيل/تعطيل تقويم الأسنان |
| `features.xray` | boolean | تفعيل/تعطيل الأشعة |
| `features.ai` | boolean | تفعيل/تعطيل ميزات الذكاء الاصطناعي |
| `locked` | boolean | هل العيادة مقفلة؟ |
| `lockReason` | string \| null | سبب القفل (إذا كانت مقفلة) |

#### **Auto-Creation Behavior**
⚡ إذا لم توجد `ClinicControl` للعيادة، يتم إنشاؤها **تلقائياً** بالقيم الافتراضية:
```json
{
  "storageLimitMB": 1024,
  "usersLimit": 3,
  "features": {
    "patients": true,
    "appointments": true,
    "orthodontics": false,
    "xray": false,
    "ai": false
  },
  "locked": false,
  "lockReason": null
}
```

#### **Response 404 Not Found**
```json
{
  "message": "Clinic not found"
}
```

---

### **2. PUT /api/clinics/:id/controls**

#### **الغرض**
تحديث إعدادات وحدود العيادة (Admin فقط)

#### **Authentication**
✅ **Required** - Admin only

```
Authorization: Bearer <admin_access_token>
```

#### **Parameters**
| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| `id` | string (UUID) | path | ✅ Yes | معرّف العيادة |

#### **Request Body** (جميع الحقول اختيارية)
```json
{
  "storageLimitMB": 4096,
  "usersLimit": 10,
  "features": {
    "ai": true,
    "orthodontics": true
  },
  "locked": false,
  "lockReason": null
}
```

#### **Validation Rules**
| Field | Type | Validation |
|-------|------|------------|
| `storageLimitMB` | number | Must be positive integer |
| `usersLimit` | number | Must be positive integer |
| `features` | object | Boolean values only |
| `locked` | boolean | true or false |
| `lockReason` | string \| null | Optional |

#### **Feature Merging**
عند إرسال `features`، يتم **دمجها** مع الـ features الموجودة:

```javascript
// القيمة الحالية
{ patients: true, appointments: true, ai: false }

// الإرسال
{ ai: true }

// النتيجة
{ patients: true, appointments: true, ai: true }
```

#### **Request Example**
```bash
curl -X PUT "https://api.sourceplus.com/api/clinics/abc-123/controls" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "storageLimitMB": 4096,
    "features": {
      "ai": true
    }
  }'
```

#### **Response 200 OK**
```json
{
  "storageLimitMB": 4096,
  "usersLimit": 5,
  "features": {
    "patients": true,
    "appointments": true,
    "orthodontics": false,
    "xray": false,
    "ai": true
  },
  "locked": false,
  "lockReason": null
}
```

#### **Audit Logging**
كل عملية تحديث تُسجّل في AuditLog مع تفاصيل Before/After:
```javascript
{
  "userId": "admin-uuid",
  "action": "UPDATE_CLINIC_CONTROLS",
  "details": "Updated controls for clinic ABC Dental: storage: 1024MB → 4096MB; features: ai: false → true. Before: {...}. After: {...}",
  "ip": "192.168.1.1",
  "timestamp": "2025-12-21T06:15:00.000Z"
}
```

#### **Error Responses**
- **404**: Clinic not found
- **401**: Unauthorized (missing/invalid token)
- **400**: Validation error (invalid data)

---

## 📊 Clinic Usage API

### **3. GET /api/clinics/:id/usage**

#### **الغرض**
الحصول على إحصائيات استخدام موارد العيادة

#### **Authentication**
✅ **Required** - Admin only

```
Authorization: Bearer <admin_access_token>
```

#### **Parameters**
| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| `id` | string (UUID) | path | ✅ Yes | معرّف العيادة |

#### **Request Example**
```bash
curl -X GET "https://api.sourceplus.com/api/clinics/abc-123/usage" \
  -H "Authorization: Bearer <token>"
```

#### **Response 200 OK**
```json
{
  "activeUsersCount": 3,
  "storageUsedMB": 0,
  "lastUpdated": "2025-12-21T06:15:00.000Z"
}
```

#### **Response Fields**
| Field | Type | Description |
|-------|------|-------------|
| `activeUsersCount` | number | عدد المستخدمين النشطين (status ≠ SUSPENDED) |
| `storageUsedMB` | number | المساحة المستخدمة بالميجابايت (حالياً: 0) |
| `lastUpdated` | string (ISO 8601) | آخر وقت تحديث |

#### **Usage Calculation**
```typescript
// Active Users Count
const activeUsersCount = await prisma.user.count({
    where: {
        clinicId: id,
        status: { not: 'SUSPENDED' }
    }
});

// Storage (TODO - hardcoded to 0 for now)
const storageUsedMB = 0; // Will be implemented in future
```

#### **Response 404 Not Found**
```json
{
  "message": "Clinic not found"
}
```

---

## 💬 Support Messages API (New)

### **4. POST /api/support/messages** (Public)

#### **الغرض**
إرسال رسالة دعم من Smart Clinic إلى SourcePlus

#### **Authentication**
❌ **Not Required** - Public endpoint for Smart Clinic

#### **Request Body**
```json
{
  "clinicId": "abc-123-def",
  "clinicName": "ABC Dental Clinic",
  "accountCode": "CLINIC-2024-001",
  "message": "نحتاج مساعدة في تفعيل ميزة الأشعة"
}
```

#### **Validation Schema**
```typescript
{
  clinicId: z.string().uuid(),
  clinicName: z.string(),
  accountCode: z.string().optional(),
  message: z.string().min(10).max(5000)
}
```

#### **Request Example**
```bash
curl -X POST "https://api.sourceplus.com/api/support/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "clinicId": "abc-123-def",
    "clinicName": "ABC Dental Clinic",
    "accountCode": "CLINIC-2024-001",
    "message": "نحتاج مساعدة في تفعيل ميزة الأشعة"
  }'
```

#### **Response 201 Created**
```json
{
  "id": "msg-uuid-123",
  "clinicId": "abc-123-def",
  "clinicName": "ABC Dental Clinic",
  "accountCode": "CLINIC-2024-001",
  "message": "نحتاج مساعدة في تفعيل ميزة الأشعة",
  "source": "SMART_CLINIC",
  "status": "NEW",
  "readAt": null,
  "closedAt": null,
  "createdAt": "2025-12-21T06:15:00.000Z",
  "updatedAt": "2025-12-21T06:15:00.000Z"
}
```

#### **Audit Log**
```javascript
{
  "action": "SUPPORT_MESSAGE_CREATED",
  "details": "Support message from ABC Dental Clinic (abc-123-def)",
  "ip": "192.168.1.1"
}
```

---

### **5. GET /support/messages** (Admin)

#### **الغرض**
الحصول على جميع رسائل الدعم (مع filtering)

#### **Authentication**
✅ **Required** - Admin only

#### **Query Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `status` | string | ❌ No | Filter: NEW, READ, CLOSED |
| `clinicId` | string | ❌ No | Filter by clinic ID |
| `search` | string | ❌ No | Search in name/code/message |

#### **Request Examples**
```bash
# Get all messages
curl "https://api.sourceplus.com/support/messages" \
  -H "Authorization: Bearer <token>"

# Get only new messages
curl "https://api.sourceplus.com/support/messages?status=NEW" \
  -H "Authorization: Bearer <token>"

# Search
curl "https://api.sourceplus.com/support/messages?search=الأشعة" \
  -H "Authorization: Bearer <token>"
```

#### **Response 200 OK**
```json
{
  "messages": [
    {
      "id": "msg-uuid-123",
      "clinicId": "abc-123-def",
      "clinicName": "ABC Dental Clinic",
      "accountCode": "CLINIC-2024-001",
      "message": "نحتاج مساعدة في تفعيل ميزة الأشعة",
      "source": "SMART_CLINIC",
      "status": "NEW",
      "readAt": null,
      "closedAt": null,
      "createdAt": "2025-12-21T06:15:00.000Z",
      "updatedAt": "2025-12-21T06:15:00.000Z"
    }
  ],
  "unreadCount": 5
}
```

#### **Search Logic**
```typescript
// Case-insensitive search in multiple fields
where: {
  OR: [
    { clinicName: { contains: search, mode: 'insensitive' } },
    { accountCode: { contains: search, mode: 'insensitive' } },
    { message: { contains: search, mode: 'insensitive' } }
  ]
}
```

#### **Limits**
- Maximum 100 messages per request
- Ordered by `createdAt DESC`

---

### **6. GET /support/messages/:id** (Admin)

#### **الغرض**
الحصول على رسالة واحدة (auto-marks as READ)

#### **Authentication**
✅ **Required** - Admin only

#### **Parameters**
| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| `id` | string (UUID) | path | ✅ Yes | معرّف الرسالة |

#### **Special Behavior**
⚡ **Auto-mark as READ**: إذا كانت الرسالة `NEW`، يتم تحديثها تلقائياً إلى `READ` وتسجيل `readAt`

#### **Request Example**
```bash
curl "https://api.sourceplus.com/support/messages/msg-uuid-123" \
  -H "Authorization: Bearer <token>"
```

#### **Response 200 OK**
```json
{
  "id": "msg-uuid-123",
  "clinicId": "abc-123-def",
  "clinicName": "ABC Dental Clinic",
  "accountCode": "CLINIC-2024-001",
  "message": "نحتاج مساعدة في تفعيل ميزة الأشعة",
  "source": "SMART_CLINIC",
  "status": "READ",
  "readAt": "2025-12-21T06:20:00.000Z",
  "closedAt": null,
  "createdAt": "2025-12-21T06:15:00.000Z",
  "updatedAt": "2025-12-21T06:20:00.000Z"
}
```

#### **Audit Log (if auto-marked)**
```javascript
{
  "userId": "admin-uuid",
  "action": "SUPPORT_MESSAGE_READ",
  "details": "Read support message from ABC Dental Clinic",
  "ip": "192.168.1.1"
}
```

#### **Response 404 Not Found**
```json
{
  "message": "Support message not found"
}
```

---

### **7. PATCH /support/messages/:id** (Admin)

#### **الغرض**
تحديث حالة الرسالة

#### **Authentication**
✅ **Required** - Admin only

#### **Parameters**
| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| `id` | string (UUID) | path | ✅ Yes | معرّف الرسالة |

#### **Request Body**
```json
{
  "status": "CLOSED"
}
```

####** Validation Schema**
```typescript
{
  status: z.enum(['NEW', 'READ', 'CLOSED'])
}
```

#### **Request Example**
```bash
curl -X PATCH "https://api.sourceplus.com/support/messages/msg-uuid-123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "CLOSED"}'
```

#### **Response 200 OK**
```json
{
  "id": "msg-uuid-123",
  "status": "CLOSED",
  "closedAt": "2025-12-21T06:25:00.000Z",
  "readAt": "2025-12-21T06:20:00.000Z",
  "...": "..."
}
```

#### **Timestamp Logic**
```typescript
if (status === 'READ' && !message.readAt) {
  updateData.readAt = new Date();
}

if (status === 'CLOSED' && !message.closedAt) {
  updateData.closedAt = new Date();
}
```

#### **Audit Log**
```javascript
{
  "userId": "admin-uuid",
  "action": "SUPPORT_MESSAGE_STATUS_UPDATED",
  "details": "Changed support message status to CLOSED for ABC Dental Clinic",
  "ip": "192.168.1.1"
}
```

---

### **8. DELETE /support/messages/:id** (Admin)

#### **الغرض**
حذف رسالة دعم

#### **Authentication**
✅ **Required** - Admin only

#### **Parameters**
| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| `id` | string (UUID) | path | ✅ Yes | معرّف الرسالة |

#### **Request Example**
```bash
curl -X DELETE "https://api.sourceplus.com/support/messages/msg-uuid-123" \
  -H "Authorization: Bearer <token>"
```

#### **Response 200 OK**
```json
{
  "success": true
}
```

#### **Audit Log**
```javascript
{
  "userId": "admin-uuid",
  "action": "SUPPORT_MESSAGE_DELETED",
  "details": "Deleted support message from ABC Dental Clinic",
  "ip": "192.168.1.1"
}
```

#### **Response 404 Not Found**
```json
{
  "message": "Support message not found"
}
```

---

## 📮 Support Routes API (Legacy)

هذه الـ endpoints للتوافق مع POS القديم. تستخدم نفس الـ database لكن بـ schema مختلف.

### **9. POST /api/support/messages** (Public - Legacy)

#### **Request Body**
```json
{
  "name": "ABC Dental Clinic",
  "serial": "CLINIC-001",
  "message": "نحتاج مساعدة"
}
```

#### **Mapping to New Schema**
```typescript
{
  clinicId: 'legacy-support',
  clinicName: data.name,
  accountCode: data.serial,
  message: data.message,
  source: 'LEGACY_POS',
  status: 'NEW'
}
```

---

## ⚠️ Error Handling

### **HTTP Status Codes**
| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/PUT/PATCH/DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal error |

### **Error Response Format**
```json
{
  "message": "Error description"
}
```

### **Common Errors**

#### **Validation Error (400)**
```json
{
  "message": "Validation error: message must be between 10 and 5000 characters"
}
```

#### **Unauthorized (401)**
```json
{
  "message": "Unauthorized"
}
```

#### **Not Found (404)**
```json
{
  "message": "Clinic not found"
}
```

---

## 🗄️ Database Schema

### **ClinicControl Model**
```prisma
model ClinicControl {
  id               String   @id @default(uuid())
  clinicId         String   @unique
  storageLimitMB   Int      @default(1024)
  usersLimit       Int      @default(3)
  features         Json     @default("{\"patients\":true,\"appointments\":true,\"orthodontics\":false,\"xray\":false,\"ai\":false}")
  locked           Boolean  @default(false)
  lockReason       String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  clinic           Clinic   @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  
  @@map("clinic_controls")
}
```

### **SupportMessage Model**
```prisma
model SupportMessage {
  id           String               @id @default(uuid())
  clinicId     String
  clinicName   String
  accountCode  String?
  message      String               @db.Text
  source       String               @default("SMART_CLINIC")
  status       SupportMessageStatus @default(NEW)
  readAt       DateTime?
  closedAt     DateTime?
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt

  @@index([clinicId])
  @@index([status])
  @@index([createdAt])
  @@map("support_messages")
}

enum SupportMessageStatus {
  NEW
  READ
  CLOSED
}
```

---

## ✅ Best Practices

### **For Smart Clinic Integration**

1. **Polling Frequency**:
   ```typescript
   // Call controls every 5-10 minutes
   setInterval(async () => {
     const controls = await fetchControls(clinicId);
     applyControls(controls);
   }, 5 * 60 * 1000); // 5 minutes
   ```

2. **Error Handling**:
   ```typescript
   try {
     const controls = await fetch(`${API_URL}/api/clinics/${clinicId}/controls`);
     if (controls.locked) {
       logoutAllUsers();
       showLockedScreen(controls.lockReason);
     }
   } catch (error) {
     // Use cached controls
     // Log error
     // Retry with exponential backoff
   }
   ```

3. **Feature Flags**:
   ```typescript
   if (!controls.features.orthodontics) {
     hideOrthodonticsModule();
   }
   ```

4. **Limits Enforcement**:
   ```typescript
   if (storageUsed > controls.storageLimitMB * 1024 * 1024) {
     throw new Error('Storage limit exceeded');
   }
   
   if (activeUsers >= controls.usersLimit) {
     throw new Error('User limit reached');
   }
   ```

### **For SourcePlus Admin**

1. **Gradual Changes**:
   - Don't reduce limits drastically
   - Warn clinics before locking

2. **Support Messages**:
   - Check daily for new messages
   - Respond promptly
   - Close resolved messages

3. **Audit Review**:
   - Review audit logs regularly
   -Monitor control changes

---

## 🧪 Testing

### **Complete Test Flow**
```bash
# 1. Get clinic controls (public)
curl "http://localhost:3001/api/clinics/test-id/controls"

# 2. Get usage stats (admin)
curl "http://localhost:3001/api/clinics/test-id/usage" \
  -H "Authorization: Bearer <token>"

# 3. Update controls (admin)
curl -X PUT "http://localhost:3001/api/clinics/test-id/controls" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"storageLimitMB": 2048}'

# 4. Send support message (public)
curl -X POST "http://localhost:3001/api/support/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "clinicId": "test-id",
    "clinicName": "Test Clinic",
    "message": "Test support message"
  }'

# 5. Get support messages (admin)
curl "http://localhost:3001/support/messages" \
  -H "Authorization: Bearer <token>"

# 6. View message (admin - auto-read)
curl "http://localhost:3001/support/messages/<msg-id>" \
  -H "Authorization: Bearer <token>"

# 7. Close message (admin)
curl -X PATCH "http://localhost:3001/support/messages/<msg-id>" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "CLOSED"}'

# 8. Delete message (admin)
curl -X DELETE "http://localhost:3001/support/messages/<msg-id>" \
  -H "Authorization: Bearer <token>"
```

---

## 🎯 Quick Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/clinics/:id/controls` | GET | ❌ No | Get clinic controls |
| `/api/clinics/:id/controls` | PUT | ✅ Admin | Update controls |
| `/api/clinics/:id/usage` | GET | ✅ Admin | Get usage stats |
| `/api/support/messages` | POST | ❌ No | Send support message |
| `/support/messages` | GET | ✅ Admin | List messages |
| `/support/messages/:id` | GET | ✅ Admin | View message (auto-read) |
| `/support/messages/:id` | PATCH | ✅ Admin | Update status |
| `/support/messages/:id` | DELETE | ✅ Admin | Delete message |

---

## 🔒 Security Checklist

- ✅ HTTPS in production
- ✅ JWT validation
- ✅ Role-based access control
- ✅ Input validation (Zod schemas)
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Rate limiting (recommended)
- ✅ Audit logging
- ✅ CORS configuration
- ✅ Sensitive data encryption

---

## 📈 API Versioning

**Current**: v3.1

**Changelog**:
- **v3.1** (2025-12-21): Updated documentation with actual implementation
- **v3.0** (2025-12-21): Added Support Messages API, Usage API
- **v2.0** (2025-12-20): Added Controls API
- **v1.0** (2025-12-15): Initial release

---

**API Version**: 3.1  
**Maintained by**: SourcePlus Development Team  
**Last Updated**: 2025-12-21  
**License**: Proprietary

---

**🎉 Happy Integrating!**
