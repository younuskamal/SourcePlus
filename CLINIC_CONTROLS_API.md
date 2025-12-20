# Clinic Controls API - Technical Reference

**Version**: 2.0  
**Last Updated**: 2025-12-21  
**Status**: Production Ready

---

## 📌 Quick Overview

هذا الـ API يسمح لـ **SourcePlus** بالتحكم الكامل في إعدادات كل عيادة، و**Smart Clinic** بقراءة وتطبيق هذه الإعدادات.

### **الأدوار**:
- **SourcePlus**: يكتب ويدير الـ Controls (Admin فقط)
- **Smart Clinic**: يقرأ وينفذ الـ Controls (Public access)

---

## 🔌 Endpoints

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
❌ **Not Required** - هذا endpoint عام ليستطيع Smart Clinic الوصول إليه بدون authentication

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

#### **Response 404 Not Found**
```json
{
  "message": "Clinic not found"
}
```

#### **Special Behavior**
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

---

### **2. PUT /api/clinics/:id/controls**

#### **الغرض**
تحديث إعدادات وحدود العيادة (Admin فقط من SourcePlus Dashboard)

#### **URL**
```
PUT https://sourceplus.yourdomain.com/api/clinics/:id/controls
```

#### **Parameters**
| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| `id` | string | path | ✅ Yes | معرّف العيادة (Clinic ID) |

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

#### **Body Fields**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `storageLimitMB` | number | ❌ | الحد الأقصى للتخزين (يجب أن يكون > 0) |
| `usersLimit` | number | ❌ | الحد الأقصى للمستخدمين (يجب أن يكون > 0) |
| `features` | object | ❌ | كائن features (يتم دمجه مع الموجود) |
| `locked` | boolean | ❌ | قفل/فتح العيادة |
| `lockReason` | string \| null | ❌ | سبب القفل |

#### **Feature Merging**
عند إرسال `features`، يتم **دمجها** مع الـ features الموجودة، لا استبدالها:

**مثال**:
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
curl -X PUT "https://sourceplus.yourdomain.com/api/clinics/abc-123/controls" \
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

#### **Response 404 Not Found**
```json
{
  "message": "Clinic not found"
}
```

#### **Response 401 Unauthorized**
```json
{
  "message": "Unauthorized"
}
```

#### **Response 400 Bad Request**
```json
{
  "message": "Validation error: storageLimitMB must be a positive number"
}
```

---

## 🔐 Authentication & Authorization

### **GET Endpoint**
- ❌ لا يحتاج authentication
- متاح لـ Smart Clinic للقراءة فقط

### **PUT Endpoint**
- ✅ يحتاج JWT token
- يجب أن يكون role = `admin`
- يتم التحقق عبر middleware:
  ```typescript
  app.authorize([Role.admin])
  ```

---

## 📝 Audit Logging

**كل عملية تحديث (PUT) تُسجّل في AuditLog**:

### **Logged Data**:
- `userId`: معرّف الـ admin الذي قام بالتعديل
- `action`: `"UPDATE_CLINIC_CONTROLS"`
- `details`: وصف تفصيلي للتغييرات
- `ip`: عنوان IP للطلب
- `timestamp`: وقت التعديل

### **Details Format** (Before/After):
```
Updated controls for clinic ABC Dental: 
storage: 1024MB → 2048MB; 
features: ai: false → true. 
Before: {"storageLimitMB":1024,"usersLimit":3,...}. 
After: {"storageLimitMB":2048,"usersLimit":3,...}
```

---

## 🎯 Use Cases

### **Use Case 1: Smart Clinic Bootstrap**

**Smart Clinic** يستدعي الـ endpoint عند:
- 🔹 بدء التشغيل (bootstrap)
- 🔹 تسجيل دخول المستخدم
- 🔹 كل 5-10 دقائق (refresh)

**Flow**:
```
User Login → Smart Clinic calls GET /controls → Check if locked → Apply limits
```

---

### **Use Case 2: Admin Updates Limits**

**SourcePlus Admin** يقوم بـ:
1. فتح Clinic Control Dashboard
2. تعديل Storage Limit من 1GB إلى 2GB
3. الضغط على Save
4. PUT request يُرسل
5. Audit log يُسجّل
6. Smart Clinic يحصل على التحديث في الـ refresh التالي

---

### **Use Case 3: Lock Clinic**

**Admin يقفل العيادة**:
```json
PUT /api/clinics/abc-123/controls
{
  "locked": true,
  "lockReason": "Payment overdue"
}
```

**Smart Clinic Response**:
- في الـ heartbeat التالي، يكتشف `locked: true`
- يعرض صفحة "Clinic Locked"
- يمنع الوصول لجميع المستخدمين

---

## ⚙️ Default Values

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

## 🗄️ Database Schema

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

**Cascade Delete**: عند حذف `Clinic`، يتم حذف `ClinicControl` تلقائياً

---

## 🔁 Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                    SourcePlus Admin                      │
│                                                           │
│  1. Opens Clinic Control Dashboard                       │
│  2. Modifies limits/features                             │
│  3. Clicks "Save"                                        │
│  4. PUT /api/clinics/:id/controls                        │
│     ↓                                                     │
│  5. Database updated                                     │
│  6. Audit log created                                    │
│     ↓                                                     │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│                      Smart Clinic                        │
│                                                           │
│  7. Periodic refresh (every 5 min)                       │
│  8. GET /api/clinics/:id/controls                        │
│     ↓                                                     │
│  9. Receives updated controls                            │
│ 10. Applies new limits immediately                       │
│ 11. Shows/hides features                                 │
│ 12. If locked → logout all users                         │
└──────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

### **Test 1: Read Controls (Public)**
```bash
curl -X GET "http://localhost:3001/api/clinics/test-clinic-id/controls"
```

**Expected**: Returns controls (with defaults if not found)

---

### **Test 2: Update Controls (Admin)**
```bash
curl -X PUT "http://localhost:3001/api/clinics/test-clinic-id/controls" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"storageLimitMB": 2048}'
```

**Expected**: Updates storage limit, returns new controls

---

### **Test 3: Lock Clinic**
```bash
curl -X PUT "http://localhost:3001/api/clinics/test-clinic-id/controls" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "locked": true,
    "lockReason": "Testing lock feature"
  }'
```

**Expected**: Clinic is locked, audit log created

---

### **Test 4: Enable Feature**
```bash
curl -X PUT "http://localhost:3001/api/clinics/test-clinic-id/controls" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "ai": true
    }
  }'
```

**Expected**: AI feature enabled, other features unchanged

---

## ⚠️ Error Handling

### **Common Errors**

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 404 | Clinic not found | Invalid clinic ID | Check clinic ID |
| 401 | Unauthorized | Missing/invalid token | Provide valid admin token |
| 400 | Validation error | Invalid data | Check request body |
| 500 | Internal server error | Server issue | Check server logs |

### **Error Response Format**
```json
{
  "message": "Error description"
}
```

---

## 📊 Rate Limiting

**Recommendations**:
- Smart Clinic: Call every 5-10 minutes (not on every request)
- Use caching to reduce load
- Implement exponential backoff on errors

---

## 🔐 Security Best Practices

1. ✅ **HTTPS Only** in production
2. ✅ **Validate clinicId** before processing
3. ✅ **Sanitize inputs** (Zod validation)
4. ✅ **Admin-only writes** (role check)
5. ✅ **Audit all changes** (logging)
6. ✅ **CORS properly configured**
7. ✅ **Rate limiting** implemented

---

## 📚 Related Documentation

- 📖 **Smart Clinic Integration**: `SMART_CLINIC_INTEGRATION.md`
- 📖 **Dashboard Guide**: `CLINIC_CONTROL_DASHBOARD.md`
- 📖 **Quick Reference**: `CLINIC_CONTROLS_QUICK_REF.md`
- 📖 **Implementation**: `CLINIC_CONTROLS_IMPLEMENTATION.md`

---

## 🆘 Support

**Issues or Questions?**
- Check server logs for errors
- Verify authentication tokens
- Test with curl/Postman first
- Review audit logs for changes

---

**API Version**: 2.0  
**Maintained by**: SourcePlus Development Team  
**Last Updated**: 2025-12-21
