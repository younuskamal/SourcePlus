# اختبار API - دليل Postman

## 🔧 إعداد Postman

### 1. متغيرات البيئة

أنشئ Environment جديد بالمتغيرات التالية:

```json
{
  "baseUrl": "http://localhost:3005",
  "accessToken": "YOUR_JWT_TOKEN_HERE",
  "serialNumber": "TEST001-ABC123",
  "hardwareId": "ABC123DEF456"
}
```

### 2. الحصول على Access Token

**الطلب:**
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "your_password"
}
```

**النتيجة:** انسخ `accessToken` من الرد وضعه في متغيرات البيئة

---

## 📡 اختبارات الـ Endpoints

### 1. Client Synchronization Endpoints

#### ✅ GET /client/plans
```http
GET {{baseUrl}}/client/plans
```
**الوصف:** الحصول على قائمة الخطط النشطة

---

#### ✅ GET /client/config
```http
GET {{baseUrl}}/client/config
```
**الوصف:** الحصول على Remote Configuration

---

#### ✅ POST /client/offline-activation
```http
POST {{baseUrl}}/client/offline-activation
Content-Type: application/json

{
  "activationCode": "{{serialNumber}}ABC",
  "hardwareId": "{{hardwareId}}"
}
```
**الوصف:** تفعيل ترخيص أوفلاين

---

#### ✅ GET /client/check-license
```http
GET {{baseUrl}}/client/check-license?serial={{serialNumber}}
```
**الوصف:** التحقق من صلاحية الترخيص

---

#### ✅ POST /client/heartbeat
```http
POST {{baseUrl}}/client/heartbeat
Content-Type: application/json

{
  "serial": "{{serialNumber}}",
  "hardwareId": "{{hardwareId}}",
  "appVersion": "1.0.0",
  "deviceName": "My Desktop"
}
```
**الوصف:** إرسال نبضة قلب (Check-in)

---

#### ✅ POST /client/update-hwid
```http
POST {{baseUrl}}/client/update-hwid
Content-Type: application/json

{
  "serial": "{{serialNumber}}",
  "oldHardwareId": "{{hardwareId}}",
  "newHardwareId": "NEW_HARDWARE_ID_123"
}
```
**الوصف:** تحديث معرف الجهاز

---

#### ✅ GET /client/check-update
```http
GET {{baseUrl}}/client/check-update?version=1.0.0
```
**الوصف:** التحقق من التحديثات المتاحة

---

### 2. Currency Sync

#### ✅ POST /currencies/sync
```http
POST {{baseUrl}}/currencies/sync
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```
**الوصف:** مزامنة أسعار العملات من API أو محاكاة

**النتيجة المتوقعة:**
```json
{
  "updated": 20,
  "source": "exchangerate-api.com"
}
```
أو
```json
{
  "updated": 20,
  "source": "simulated"
}
```

---

#### ✅ GET /currencies
```http
GET {{baseUrl}}/currencies
Authorization: Bearer {{accessToken}}
```
**الوصف:** الحصول على قائمة جميع العملات

---

### 3. System Reset

#### ✅ POST /settings/reset
```http
POST {{baseUrl}}/settings/reset
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```
**الوصف:** إعادة تعيين بيانات النظام

**تحذير:** هذا سيحذف:
- جميع الترخيصات
- جميع المعاملات
- تذاكر الدعم
- الإخطارات
- سجلات التدقيق

---

### 4. Backup Operations

#### ✅ GET /backup
```http
GET {{baseUrl}}/backup
Authorization: Bearer {{accessToken}}
```
**الوصف:** الحصول على قائمة النسخ الاحتياطية

---

#### ✅ POST /backup
```http
POST {{baseUrl}}/backup
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```
**الوصف:** إنشاء نسخة احتياطية جديدة

---

#### ✅ POST /backup/:filename/restore
```http
POST {{baseUrl}}/backup/backup-2025-11-25.json/restore
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```
**الوصف:** استعادة نسخة احتياطية

---

#### ✅ DELETE /backup/:filename
```http
DELETE {{baseUrl}}/backup/backup-2025-11-25.json
Authorization: Bearer {{accessToken}}
```
**الوصف:** حذف نسخة احتياطية

---

### 5. Versions (Updates)

#### ✅ POST /versions
```http
POST {{baseUrl}}/versions
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "version": "2.0.0",
  "releaseNotes": "Major update with new features",
  "downloadUrl": "https://example.com/releases/v2.0.0",
  "forceUpdate": false,
  "isActive": true
}
```
**الوصف:** إنشاء نسخة جديدة

---

#### ✅ GET /versions
```http
GET {{baseUrl}}/versions
Authorization: Bearer {{accessToken}}
```
**الوصف:** الحصول على جميع النسخ

---

#### ✅ PATCH /versions/:id
```http
PATCH {{baseUrl}}/versions/abc123
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "releaseNotes": "Updated notes",
  "isActive": false
}
```
**الوصف:** تعديل نسخة موجودة

---

#### ✅ DELETE /versions/:id
```http
DELETE {{baseUrl}}/versions/abc123
Authorization: Bearer {{accessToken}}
```
**الوصف:** حذف نسخة

---

#### ✅ GET /versions/latest
```http
GET {{baseUrl}}/versions/latest
```
**الوصف:** الحصول على آخر نسخة نشطة

---

### 6. Analytics (Financials)

#### ✅ GET /analytics/transactions
```http
GET {{baseUrl}}/analytics/transactions
Authorization: Bearer {{accessToken}}
```
**الوصف:** الحصول على جميع المعاملات

---

#### ✅ GET /analytics/financial-stats
```http
GET {{baseUrl}}/analytics/financial-stats
Authorization: Bearer {{accessToken}}
```
**الوصف:** الحصول على الإحصائيات المالية

**النتيجة المتوقعة:**
```json
{
  "totalRevenue": 5000,
  "dailyRevenue": 500,
  "monthlyRevenue": 3000
}
```

---

#### ✅ GET /analytics/revenue-history
```http
GET {{baseUrl}}/analytics/revenue-history
Authorization: Bearer {{accessToken}}
```
**الوصف:** الحصول على سجل الإيرادات الشهري

---

## 🧪 سيناريوهات الاختبار المتكاملة

### السيناريو 1: تفعيل عميل جديد
```
1. POST /client/offline-activation
   → تفعيل مع activation code و hardware id
2. POST /client/heartbeat
   → إرسال check-in
3. GET /client/check-license
   → التحقق من الحالة
```

### السيناريو 2: تحديث النسخة
```
1. POST /versions
   → إنشاء نسخة جديدة
2. GET /client/check-update
   → التحقق من وجود تحديثات
3. PATCH /versions/:id
   → تفعيل النسخة كـ forceUpdate
```

### السيناريو 3: عملية مالية شاملة
```
1. GET /analytics/financial-stats
   → عرض الإحصائيات
2. GET /analytics/transactions
   → عرض المعاملات
3. GET /analytics/revenue-history
   → عرض السجل الشهري
```

### السيناريو 4: النسخ الاحتياطية
```
1. POST /backup
   → إنشاء نسخة
2. GET /backup
   → عرض النسخ
3. POST /backup/:filename/restore
   → استعادة نسخة (اختياري)
```

---

## 📊 Response Status Codes

| Code | المعنى |
|------|--------|
| 200 | نجح |
| 201 | تم الإنشاء |
| 204 | لا محتوى (حذف ناجح) |
| 400 | طلب خاطئ |
| 401 | غير مصرح (بدون token) |
| 403 | ممنوع (بدون صلاحية) |
| 404 | غير موجود |
| 500 | خطأ سيرفر |

---

## 💾 استيراد Collection في Postman

1. انسخ المحتوى من هذا الملف
2. افتح Postman
3. اضغط على "Import"
4. اختر "Paste Raw Text"
5. الصق المحتوى
6. اضغط "Import"

---

## 🔐 ملاحظات الأمان

- استخدم HTTPS في الإنتاج (ليس HTTP)
- احفظ التوكن في متغيرات البيئة
- لا تشارك URLs الداخلية
- استخدم admin access للعمليات الحساسة

---

## 📌 ملاحظات إضافية

- جميع الـ timestamps بـ ISO 8601
- جميع الأسعار بـ USD إلا إذا حدد خلاف ذلك
- جميع IDs بـ UUID format
- جميع الأخطاء موثقة في Audit Logs
