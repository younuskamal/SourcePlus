# SourcePlus Licensing Server - Implementation Guide

تم تنفيذ جميع المتطلبات المطلوبة. إليك ملخص شامل للتغييرات والاختبارات:

## ✅ 1. Excel Export System (XLSX)

**الملف المعدل:** `client/utils/excelExport.ts`

### الميزات:
- ✅ تنسيق العرض الذاتي للأعمدة (Auto Column Width)
- ✅ تنسيق رؤوس الجدول (Header Styling) - أزرق غامق مع نص أبيض
- ✅ معالجة صيغ التاريخ تلقائياً (YYYY-MM-DD)
- ✅ معالجة الكائنات المعقدة (JSON Stringify)

### الاستخدام:
```typescript
const data = licenses.map(l => ({
  "Serial Key": l.serial,
  "Customer Name": l.customerName,
  // ...
}));
exportToExcel(data, "filename", "Sheet Name");
```

### الصفحات المتصلة:
- ✅ `Licenses.tsx` - Export to Excel
- ✅ `Financials.tsx` - Export to Excel
- ✅ `AuditLogs.tsx` - Export to Excel

**الاختبار:**
```
1. افتح صفحة Licenses
2. اضغط على زر "Export Excel"
3. يجب أن ينزل ملف Excel بتاريخ اليوم في الاسم
4. افتح الملف وتحقق من:
   - عرض الأعمدة مناسب
   - رؤوس الجدول بلون أزرق
   - التواريخ بصيغة YYYY-MM-DD
```

---

## ✅ 2. Sync Currency Rates

**الملف المعدل:** `server/src/modules/currencies/routes.ts` - Endpoint `POST /currencies/sync`

### الميزات:
- ✅ محاولة الاتصال بـ API حقيقية: `https://api.exchangerate-api.com/v4/latest/USD`
- ✅ fallback إلى معدلات محاكاة إذا فشل الاتصال
- ✅ معدلات واقعية للعملات الشرقية (IQD, SAR, AED, TRY, etc.)
- ✅ USD تبقى دائماً = 1.0
- ✅ تسجيل Audit Log للعملية

### المعدلات المحاكاة:
```
EUR: 0.92, GBP: 0.79, JPY: 149.50
IQD: 1310.00, SAR: 3.75, AED: 3.67
TRY: 32.50, EGP: 30.90, KWD: 0.31
... وغيرها
```

**الاختبار:**
```
1. افتح صفحة Currencies
2. اضغط على زر "Sync Rates"
3. تحقق من أن معدلات العملات قد تم تحديثها
4. تحقق من Audit Logs للتأكد من تسجيل العملية
```

---

## ✅ 3. System Reset

**الملفات:**
- Backend: `server/src/modules/settings/routes.ts` - Endpoint `POST /settings/reset`
- Frontend: `client/pages/Settings.tsx` - Tab "System Reset"
- API Service: `services/api.ts` - `resetSystem()`

### الوظيفة:
- يمسح البيانات التالية:
  - ✅ جميع الترخيصات (Licenses)
  - ✅ جميع المعاملات (Transactions)
  - ✅ تذاكر الدعم (Support Tickets)
  - ✅ الإخطارات (Notifications)
  - ✅ سجلات التدقيق (Audit Logs)

- يحافظ على:
  - ✅ المستخدمين (Users)
  - ✅ الخطط (Plans)
  - ✅ العملات (Currencies)
  - ✅ إعدادات الخادم (Server Settings)

### UI:
- الـ Tab الحالي في Settings اسمه "System Reset" (سابقاً "Remote Config")
- يحتوي على تحذير بـ Red color مع تفاصيل ما سيتم حذفه
- زر "Reset System Data" مع مراسلة تأكيد

**الاختبار:**
```
1. اذهب إلى Settings > System Reset tab
2. اضغط على "Reset System Data"
3. تأكد من المراسلة
4. تحقق من أن الترخيصات والمعاملات قد تم حذفها
5. تحقق من Audit Logs - يجب أن تجد سجل "SYSTEM_RESET"
```

---

## ✅ 4. Client Synchronization Endpoints

**الملف:** `server/src/modules/client/routes.ts`

### الـ Endpoints الجديدة:

#### 1️⃣ **POST /client/offline-activation**
```json
{
  "activationCode": "ABC123DEF456GHI789",
  "hardwareId": "ABC123DEF"
}
```
**الرد:**
```json
{
  "success": true,
  "license": {
    "serial": "ABC123...",
    "expireDate": "2025-12-31",
    "status": "active"
  }
}
```

#### 2️⃣ **GET /client/plans**
**الرد:** قائمة بجميع الخطط النشطة مع الأسعار والميزات

#### 3️⃣ **GET /client/config**
**الرد:** Remote Configuration كاملة

#### 4️⃣ **GET /client/check-license?serial=ABC123**
```json
{
  "valid": true,
  "status": "active",
  "expireDate": "2025-12-31",
  "daysLeft": 180,
  "plan": { "name": "Pro", "deviceLimit": 5 }
}
```

#### 5️⃣ **POST /client/heartbeat**
```json
{
  "serial": "ABC123",
  "hardwareId": "ABC123DEF",
  "appVersion": "1.0.0",
  "deviceName": "My Device"
}
```
**يحدث:** lastCheckIn timestamp

#### 6️⃣ **POST /client/update-hwid**
```json
{
  "serial": "ABC123",
  "oldHardwareId": "OLD123",
  "newHardwareId": "NEW456"
}
```

#### الـ Endpoints الموجودة سابقاً:
- POST /client/validate
- POST /client/activate
- GET /client/check-update
- GET /client/sync-config
- POST /client/support

**الاختبار مع Postman:**
```
1. افتح Postman
2. اختبر كل endpoint:
   - POST http://localhost:3005/client/offline-activation
   - GET http://localhost:3005/client/plans
   - GET http://localhost:3005/client/config
   - GET http://localhost:3005/client/check-license?serial=YOUR_SERIAL
   - POST http://localhost:3005/client/heartbeat
   - POST http://localhost:3005/client/update-hwid
```

---

## ✅ 5. Application Update System

**الملفات:**
- Database Model: `server/schema.prisma` - AppVersion model
- Backend: `server/src/modules/versions/routes.ts`
- Frontend: `client/pages/Updates.tsx`
- API: `services/api.ts`

### الـ Endpoints:
- `POST /versions` - إنشاء نسخة جديدة
- `GET /versions` - الحصول على جميع النسخ
- `PATCH /versions/:id` - تعديل نسخة
- `DELETE /versions/:id` - حذف نسخة
- `GET /versions/latest` - آخر نسخة نشطة
- `GET /client/check-update?version=1.0.0` - التحقق من التحديثات

### الـ Schema:
```prisma
model AppVersion {
  id           String   @id @default(uuid())
  version      String
  releaseNotes String
  downloadUrl  String
  forceUpdate  Boolean  @default(false)
  isActive     Boolean  @default(true)
  releaseDate  DateTime @default(now())
  createdAt    DateTime @default(now())
}
```

**الاختبار:**
```
1. افتح صفحة Updates
2. اضغط على "Deploy New Build"
3. أدخل:
   - Version: 2.0.0
   - Notes: الميزات الجديدة
   - Download URL: https://example.com/download
   - Force Update: اختياري
4. انقر Save
5. تحقق من أن النسخة تظهر في القائمة
6. اختبر /client/check-update endpoint
```

---

## ✅ 6. Financials Page

**الملف:** `client/pages/Financials.tsx`

### الميزات:
- ✅ عرض المعاملات من API
- ✅ إحصائيات مالية (إجمالي، يومي، شهري)
- ✅ تصفية حسب نوع المعاملة
- ✅ بحث عن المعاملات
- ✅ تصدير إلى Excel
- ✅ عرض جدول مفصل

**الاختبار:**
```
1. اذهب إلى صفحة Financials
2. تحقق من أن الإحصائيات تظهر بشكل صحيح
3. اختبر البحث والتصفية
4. انقر على Export Excel
5. تحقق من الملف المُنزل
```

---

## 🧪 Verification Checklist

### ✅ Excel Export
- [ ] تصدير الترخيصات (Licenses)
- [ ] تصدير السجلات (Audit Logs)
- [ ] تصدير المعاملات (Financials)
- [ ] التحقق من عرض الأعمدة
- [ ] التحقق من تنسيق التاريخ

### ✅ Sync Rates
- [ ] اضغط Sync Rates
- [ ] تحقق من تحديث أسعار العملات
- [ ] تحقق من أن EUR ≈ 0.92
- [ ] تحقق من أن USD = 1.0 دائماً
- [ ] تحقق من Audit Logs

### ✅ System Reset
- [ ] إنشاء ترخيصات واختبار
- [ ] تشغيل System Reset
- [ ] تحقق من أن الترخيصات قد حُذفت
- [ ] تحقق من أن المستخدمين بقوا
- [ ] تحقق من أن Audit Log تم تسجيله

### ✅ Client Sync Endpoints
- [ ] اختبر offline-activation
- [ ] اختبر check-license
- [ ] اختبر heartbeat
- [ ] اختبر update-hwid
- [ ] اختبر plans endpoint
- [ ] اختبر config endpoint

### ✅ Updates System
- [ ] أنشئ نسخة جديدة
- [ ] عدّل نسخة موجودة
- [ ] احذف نسخة
- [ ] اختبر check-update endpoint
- [ ] اختبر forceUpdate flag

### ✅ Financials
- [ ] تحقق من عرض المعاملات
- [ ] تحقق من الإحصائيات
- [ ] اختبر البحث والتصفية
- [ ] اختبر Export Excel

---

## 🚀 Commands to Run

### Build Server
```bash
cd server
npm run build
```

### Start Server
```bash
cd server
npm run start
# أو
npm run dev  # للتطوير
```

### Build Client
```bash
cd client
npm run build
```

### Start Client (Dev)
```bash
cd client
npm run dev
```

---

## 📝 Database Migrations

إذا أضفت مجالات جديدة إلى Prisma Schema، قم بـ:

```bash
cd server
npx prisma migrate dev --name describe_the_change
```

---

## 🔌 API Base URLs

**Local Development:**
- Backend: `http://localhost:3005`
- Frontend: `http://localhost:5173` (default Vite)

**Environment Variables:**
في `client/.env.local`:
```
VITE_API_URL=http://localhost:3005
```

---

## ✨ ملاحظات مهمة

1. **لا تغييرات UI كبيرة**: تم ربط جميع الوظائف بدون تغيير تصميم الواجهة
2. **Backward Compatible**: جميع الـ endpoints القديمة تعمل كما هي
3. **Audit Logging**: جميع العمليات تم تسجيلها في Audit Logs
4. **Error Handling**: معالجة أخطاء شاملة في جميع الـ endpoints

---

## 📞 Support

لأي مشاكل أو أسئلة، تحقق من:
- Audit Logs للتفاصيل
- Server Logs لرسائل الأخطاء
- API responses للمزيد من المعلومات
