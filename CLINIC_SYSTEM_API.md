# 📚 Clinic System - Complete API Documentation

**Version**: 3.0  
**Last Updated**: 2025-12-21  
**Status**: Production Ready

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Clinic Controls API](#clinic-controls-api)
3. [Clinic Usage API](#clinic-usage-api)
4. [Support Messages API](#support-messages-api)
5. [Authentication](#authentication)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## 🎯 Overview

يوفر SourcePlus مجموعة من الـ APIs لإدارة العيادات بشكل كامل:

### **الأدوار**:
- **SourcePlus Admin**: إدارة كاملة (قراءة/كتابة)
- **Smart Clinic**: قراءة الإعدادات وإرسال رسائل الدعم

### **Core APIs**:
1. ✅ **Controls API** - إدارة حدود وإعدادات العيادة
2. ✅ **Usage API** - تتبع استخدام الموارد
3. ✅ **Support Messages API** - إدارة رسائل الدعم

---

## 🎛️ Clinic Controls API

### **1. GET /api/clinics/:id/controls**

#### **الغرض**
قراءة إعدادات وحدود العيادة (للاستخدام من Smart Clinic)

#### **URL**
```
GET https://sourceplus.yourdomain.com/api/clinics/:id/controls
```

#### **Parameters**
| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| `id` | string | path | ✅ Yes | معرّف العيادة (Clinic ID) |

#### **Authentication**
❌ **Not Required** - Public access for Smart Clinic

#### **Request Example**
```bash
curl -X GET "https://sourceplus.yourdomain.com/api/clinics/abc-123-def/controls"
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

#### **Default Values**
عند إنشاء `ClinicControl` جديد (تلقائياً):
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

---

### **2. PUT /api/clinics/:id/controls**

#### **الغرض**
تحديث إعدادات وحدود العيادة (Admin فقط من SourcePlus Dashboard)

#### **URL**
```
PUT https://sourceplus.yourdomain.com/api/clinics/:id/controls
```

#### **Authentication**
✅ **Required** - يجب أن يكون المستخدم `admin`

```
Authorization: Bearer <admin_access_token>
```

#### **Request Headers**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

#### **Response 200 OK**
```json
{
  "storageLimitMB": 4096,
  "usersLimit": 10,
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

#### **Audit Logging**
كل عملية تحديث تُسجّل في AuditLog:
- `userId`: معرّف الـ admin
- `action`: `"UPDATE_CLINIC_CONTROLS"`
- `details`: وصف تفصيلي للتغييرات (before/after)
- `ip`: عنوان IP
- `timestamp`: وقت التعديل

---

## 📊 Clinic Usage API

### **3. GET /api/clinics/:id/usage**

#### **الغرض**
الحصول على إحصائيات استخدام موارد العيادة

#### **URL**
```
GET https://sourceplus.yourdomain.com/api/clinics/:id/usage
```

#### **Authentication**
✅ **Required** - Admin only

```
Authorization: Bearer <admin_access_token>
```

#### **Request Example**
```bash
curl -X GET "https://sourceplus.yourdomain.com/api/clinics/abc-123/usage" \
  -H "Authorization: Bearer <token>"
```

#### **Response 200 OK**
```json
{
  "activeUsersCount": 3,
  "storageUsedMB": 245,
  "lastUpdated": "2025-12-21T05:30:00.000Z"
}
```

#### **Response Fields**
| Field | Type | Description |
|-------|------|-------------|
| `activeUsersCount` | number | عدد المستخدمين النشطين (غير inactive) |
| `storageUsedMB` | number | المساحة المستخدمة بالميجابايت |
| `lastUpdated` | string (ISO 8601) | آخر وقت تحديث |

#### **Usage Calculation**
- **activeUsersCount**: يُحسب من قاعدة البيانات (users حيث status ≠ 'inactive')
- **storageUsedMB**: حالياً 0 (جاهز للتنفيذ مستقبلاً)

---

## 💬 Support Messages API

### **4. POST /api/support/messages** (Public)

#### **الغرض**
إرسال رسالة دعم من Smart Clinic إلى SourcePlus

#### **URL**
```
POST https://sourceplus.yourdomain.com/api/support/messages
```

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

#### **Body Fields**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clinicId` | string (UUID) | ✅ Yes | معرّف العيادة |
| `clinicName` | string | ✅ Yes | اسم العيادة |
| `accountCode` | string | ❌ No | رمز حساب العيادة |
| `message` | string (10-5000 chars) | ✅ Yes | نص الرسالة |

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
  "createdAt": "2025-12-21T05:30:00.000Z",
  "updatedAt": "2025-12-21T05:30:00.000Z"
}
```

---

### **5. GET /support/messages** (Admin)

#### **الغرض**
الحصول على جميع رسائل الدعم (مع filtering)

#### **URL**
```
GET https://sourceplus.yourdomain.com/support/messages
```

#### **Authentication**
✅ **Required** - Admin only

#### **Query Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `status` | string | ❌ No | Filter by status (NEW, READ, CLOSED) |
| `clinicId` | string | ❌ No | Filter by clinic ID |
| `search` | string | ❌ No | Search in clinic name, account code, message |

#### **Request Examples**
```bash
# Get all messages
curl -X GET "https://sourceplus.yourdomain.com/support/messages" \
  -H "Authorization: Bearer <token>"

# Get only new messages
curl -X GET "https://sourceplus.yourdomain.com/support/messages?status=NEW" \
  -H "Authorization: Bearer <token>"

# Search
curl -X GET "https://sourceplus.yourdomain.com/support/messages?search=الأشعة" \
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
      "createdAt": "2025-12-21T05:30:00.000Z",
      "updatedAt": "2025-12-21T05:30:00.000Z"
    }
  ],
  "unreadCount": 5
}
```

#### **Response Fields**
| Field | Type | Description |
|-------|------|-------------|
| `messages` | array | قائمة الرسائل (max 100) |
| `unreadCount` | number | عدد الرسائل الجديدة (NEW) |

---

### **6. GET /support/messages/:id** (Admin)

#### **الغرض**
الحصول على رسالة واحدة (auto-marks as READ)

#### **URL**
```
GET https://sourceplus.yourdomain.com/support/messages/:id
```

#### **Authentication**
✅ **Required** - Admin only

#### **Special Behavior**
⚡ **Auto-mark as READ**: إذا كانت الرسالة `NEW`، يتم تحديثها تلقائياً إلى `READ` وتسجيل `readAt`

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
  "readAt": "2025-12-21T05:35:00.000Z",
  "closedAt": null,
  "createdAt": "2025-12-21T05:30:00.000Z",
  "updatedAt": "2025-12-21T05:35:00.000Z"
}
```

---

### **7. PATCH /support/messages/:id** (Admin)

#### **الغرض**
تحديث حالة الرسالة

#### **URL**
```
PATCH https://sourceplus.yourdomain.com/support/messages/:id
```

#### **Authentication**
✅ **Required** - Admin only

#### **Request Body**
```json
{
  "status": "CLOSED"
}
```

#### **Body Fields**
| Field | Type | Required | Values |
|-------|------|----------|--------|
| `status` | string | ✅ Yes | "NEW", "READ", "CLOSED" |

#### **Response 200 OK**
```json
{
  "id": "msg-uuid-123",
  "status": "CLOSED",
  "closedAt": "2025-12-21T05:40:00.000Z",
  "...": "..."
}
```

#### **Audit Logging**
تُسجّل في AuditLog:
- `action`: `"SUPPORT_MESSAGE_STATUS_UPDATED"`
- `details`: `"Changed support message status to CLOSED for ABC Dental Clinic"`

---

### **8. DELETE /support/messages/:id** (Admin)

#### **الغرض**
حذف رسالة دعم

#### **URL**
```
DELETE https://sourceplus.yourdomain.com/support/messages/:id
```

#### **Authentication**
✅ **Required** - Admin only

#### **Response 200 OK**
```json
{
  "success": true
}
```

#### **Audit Logging**
تُسجّل في AuditLog:
- `action`: `"SUPPORT_MESSAGE_DELETED"`
- `details`: `"Deleted support message from ABC Dental Clinic"`

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

## ⚠️ Error Handling

### **Common Error Responses**

#### **404 Not Found**
```json
{
  "message": "Clinic not found"
}
```

#### **401 Unauthorized**
```json
{
  "message": "Unauthorized"
}
```

#### **400 Bad Request**
```json
{
  "message": "Validation error: message must be between 10 and 5000 characters"
}
```

#### **500 Internal Server Error**
```json
{
  "message": "Internal server error"
}
```

### **HTTP Status Codes**
| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/PUT/PATCH/DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal error |

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Smart Clinic                             │
│                                                              │
│  1. Bootstrap → GET /api/clinics/:id/controls               │
│     ↓                                                        │
│  2. Check locked status                                     │
│     ↓                                                        │
│  3. Apply limits & features                                 │
│     ↓                                                        │
│  4. User needs help → POST /api/support/messages            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  SourcePlus Admin                           │
│                                                              │
│  5. Views Support Messages → GET /support/messages          │
│     ↓                                                        │
│  6. Opens message → GET /support/messages/:id (auto-read)   │
│     ↓                                                        │
│  7. Closes message → PATCH /support/messages/:id            │
│     ↓                                                        │
│  8. Manages clinic → PUT /api/clinics/:id/controls          │
│     ↓                                                        │
│  9. Views usage → GET /api/clinics/:id/usage                │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Best Practices

### **For Smart Clinic Integration**

1. **Polling Frequency**:
   - Call `/api/clinics/:id/controls` every 5-10 minutes
   - Not on every user request
   - Use caching

2. **Error Handling**:
   ```typescript
   try {
     const controls = await fetch(`${API_URL}/api/clinics/${clinicId}/controls`);
     if (controls.locked) {
       // Logout all users
       // Show "Clinic Locked" message
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
     // Hide orthodontics module
   }
   ```

4. **Limits Enforcement**:
   ```typescript
   if (storageUsed > controls.storageLimitMB) {
     throw new Error('Storage limit exceeded');
   }
   
   if (activeUsers >= controls.usersLimit) {
     throw new Error('User limit reached');
   }
   ```

### **For SourcePlus Admin**

1. **Always Log Changes**:
   - Every PUT creates an audit log
   - Review audit logs regularly

2. **Gradual Changes**:
   - Don't reduce limits drastically
   - Warn clinics before locking

3. **Support Messages**:
   - Check daily for new messages
   - Respond promptly
   - Close resolved messages

---

## 🧪 Testing

### **Test Sequence**

```bash
# 1. Get clinic controls (public)
curl -X GET "http://localhost:3001/api/clinics/test-id/controls"

# 2. Get usage stats (admin)
curl -X GET "http://localhost:3001/api/clinics/test-id/usage" \
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
curl -X GET "http://localhost:3001/support/messages" \
  -H "Authorization: Bearer <token>"

# 6. View specific message (admin)
curl -X GET "http://localhost:3001/support/messages/<msg-id>" \
  -H "Authorization: Bearer <token>"

# 7. Close message (admin)
curl -X PATCH "http://localhost:3001/support/messages/<msg-id>" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "CLOSED"}'
```

---

## 📚 Related Documentation

- 📖 **Smart Clinic Integration**: `SMART_CLINIC_INTEGRATION.md`
- 📖 **Dashboard Guide**: `CLINIC_CONTROL_DASHBOARD.md`
- 📖 **Support Messages**: `SUPPORT_MESSAGES_SYSTEM.md`
- 📖 **Implementation**: `IMPLEMENTATION_SUMMARY.md`

---

## 🔒 Security Checklist

- ✅ HTTPS in production
- ✅ JWT validation
- ✅ Role-based access control
- ✅ Input validation (Zod schemas)
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Rate limiting
- ✅ Audit logging
- ✅ CORS configuration
- ✅ Sensitive data encryption

---

## 📈 API Versioning

**Current**: v3.0

**Changelog**:
- **v3.0** (2025-12-21): Added Support Messages API, Usage API
- **v2.0** (2025-12-20): Added Controls API
- **v1.0** (2025-12-15): Initial release

---

## 🆘 Support

**Issues or Questions?**
- Check server logs
- Verify authentication
- Test with curl/Postman
- Review audit logs
- Check this documentation

---

**API Version**: 3.0  
**Maintained by**: SourcePlus Development Team  
**Last Updated**: 2025-12-21  
**License**: Proprietary

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

**🎉 Happy Integrating!**
