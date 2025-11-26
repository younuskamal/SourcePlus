# نظرة تفصيلية على نظام SourcePlus Licensing Server

هذا الملف يشرح بنية النظام، مكونات السيرفر والواجهة، تدفق البيانات، وأهم الجداول والواجهات البرمجية، باللغة العربية.

---

## 1. مكوّنات النظام

- **Backend (server/)**  
  - Fastify + TypeScript  
  - Prisma 7 مع PostgreSQL  
  - JWT للمصادقة (Access + Refresh tokens)  
  - وحدات (Modules) لكل جزء من اللوحة: `auth`, `users`, `plans`, `licenses`, `currencies`, `tickets`, `notifications`, `settings`, `analytics`, `backup`, `client`, `licensing` (واجهات العميل).

- **Frontend (client/)**  
  - React + Vite + TypeScript  
  - TailwindCSS (عن طريق CDN) مع نظام ألوان قابل للتخصيص من الإعدادات  
  - لوحة تحكم كاملة: Dashboard, Licenses, Plans, Currencies, Updates, Financials, Support, Notifications, Settings, Team, Audit Logs, API Docs.

- **قاعدة البيانات (Prisma + Postgres)**  
  - نماذج رئيسية: `User`, `Session`, `Plan`, `PlanPrice`, `Currency`, `License`, `Transaction`, `AppVersion`, `Notification`, `SupportTicket`, `SupportReply`, `Attachment`, `AuditLog`, `SystemSetting`, `RemoteConfig`, `Device`, `Config`.

---

## 2. المصادقة والصلاحيات

- **المستخدمون** (`User`):
  - الحقول: `id`, `name`, `email`, `passwordHash`, `role`, `createdAt`, `lastLoginAt`, `lastLoginIp`.
  - الأدوار (`Role`): `admin`, `developer`, `viewer`.

- **الجلسات** (`Session`):
  - تُخزن `refreshToken`، تاريخ الانتهاء، معلومات الـ User Agent والـ IP.

- **JWT**:
  - عند تسجيل الدخول يتم إنشاء:
    - `accessToken` صالح لفترة قصيرة (15 دقيقة).
    - `refreshToken` صالح لمدة أطول (7 أيام) ويُخزن في جدول `Session`.
  - الواجهات المحمية تعتمد على:
    - `app.authenticate` للتحقق من وجود JWT صالح.
    - `app.authorize([Role.admin])` أو أدوار أخرى لتحديد الصلاحيات.

- **Seed للأدمن**:
  - عند تشغيل السيرفر لأول مرة:
    - يتم تشغيل `runSeed` من `src/seed.ts`، ويستخدم Prisma لإنشاء أو تحديث حساب الأدمن:
      - Email: `admin@sourceplus.com`
      - Password: `Admin12345` (مشفر بـ bcrypt)
      - Role: `admin`

---

## 3. إدارة التراخيص والخطط

- **Plan / PlanPrice**:
  - `Plan`: اسم الخطة، مدة الاشتراك بالشهور، السعر بالدولار، حد الأجهزة، قائمة الميزات (Json)، إلخ.
  - `PlanPrice`: أسعار بديلة لكل عملة (USD, IQD, ...).

- **License**:
  - الحقول الأساسية:
    - `serial` (رقم التسلسلي الفريد)
    - `planId` → الخطة المرتبطة
    - `customerName`
    - `deviceLimit` (حد الأجهزة)
    - `activationCount`
    - `hardwareId` (آخر HWID مرتبط)
    - `activationDate`, `expireDate`
    - `status` (`active`, `pending`, `expired`, `revoked`, `paused`)
    - `lastRenewalDate`, `lastCheckIn`, `isPaused`
  - يرتبط بـ:
    - `transactions` (سجل العمليات المالية)
    - `tickets` (تذاكر الدعم)
    - `devices` (الأجهزة المرتبطة بالترخيص)

- **Transactions**:
  - تسجل عمليات الشراء/التجديد/الاسترجاع مع المبلغ والعملة ونوع العملية (`purchase`, `renewal`, `refund`, `adjustment`).

---

## 4. أجهزة العميل (Device) و Config

- **Device**:
  - يمثل جهاز فعلي مفعّل بالترخيص:
    - `licenseId`, `hardwareId`, `deviceName`, `appVersion`, `systemVersion?`
    - `activationDate`, `lastCheckIn`, `isActive`, `createdAt`, `updatedAt`
  - يوجد قيد فريد: `@@unique([licenseId, hardwareId])` حتى لا يتكرر نفس الجهاز للترخيص.

- **Config**:
  - إعدادات عامة لتطبيق العميل:
    - `maintenance_mode` (وضع الصيانة)
    - `support_phone`
    - `features` (إعدادات/Features إضافية بصيغة Json).

---

## 5. واجهات الـ API للعميل (Licensing API)

كلها تحت prefix `/api` من خلال `src/modules/licensing`:

### 5.1 POST `/api/license/validate`

- **المدخل**:
  ```json
  { "serial": "TR-2025-XXXX-XXXX-XXXX" }
  ```
- **المنطق**:
  - يبحث عن الترخيص في `License` مع تضمين `plan`.
  - يحسب صلاحية الترخيص وحالته وتاريخ الانتهاء.
- **الخرج**:
  ```json
  {
    "valid": true,
    "status": "active",
    "plan": {
      "name": "Standard Plan",
      "features": ["Offline Mode", "Reports"]
    },
    "expireDate": "2025-12-31T00:00:00.000Z"
  }
  ```

### 5.2 POST `/api/license/activate`

- **المدخل**:
  ```json
  {
    "serial": "TR-2025-XXXX-XXXX-XXXX",
    "hardwareId": "HWID-123",
    "deviceName": "POS-1",
    "appVersion": "1.0.0"
  }
  ```
- **المنطق**:
  - يتحقق من الترخيص وحد الأجهزة.
  - يدير جدول `Device` (تحديث جهاز موجود أو إنشاء جهاز جديد).
  - يحدّث `License` إلى حالة `active` مع زيادة عداد التفعيل.
- **الخرج**:
  ```json
  {
    "success": true,
    "activationDate": "2025-01-01T10:00:00.000Z",
    "message": "Device activated successfully."
  }
  ```

### 5.3 GET `/api/subscription/status`

- يعتمد على:
  - `x-license-serial`, `x-hardware-id` في الـ headers، أو query string.
- **الخرج**:
  ```json
  {
    "status": "active",
    "remainingDays": 120,
    "forceLogout": false
  }
  ```
  حيث يتم حساب `forceLogout` بناءً على حالة الترخيص ووجود الجهاز.

### 5.4 GET `/api/app/update?version=1.0.0`

- يقارن إصدار العميل مع آخر إصدار نشط في `AppVersion`، ويعيد:
  ```json
  {
    "hasUpdate": true,
    "version": "1.1.0",
    "downloadUrl": "https://cdn.sourceplus.com/v1.1.0.exe",
    "releaseNotes": "Fixed receipt printing bug.",
    "forceUpdate": false
  }
  ```

### 5.5 GET `/api/config/sync`

- يعيد إعدادات `Config`:
  ```json
  {
    "maintenance_mode": false,
    "support_phone": "+9647700000000",
    "features": {
      "beta_reports": true
    }
  }
  ```

### 5.6 POST `/api/support/request`

- ينشئ تذكرة دعم في `SupportTicket`، ويعيد:
  ```json
  {
    "ticketId": "T-10293",
    "status": "received"
  }
  ```

---

## 6. النسخ الاحتياطي (Backups)

- وحدة `backup` توفر:
  - `GET /backup` – قائمة النسخ.
  - `POST /backup` – إنشاء Snapshot جديد (JSON).
  - `GET /backup/download/:filename` – تحميل النسخة.
  - `POST /backup/restore/:filename` – استعادة النظام من النسخة.
  - `POST /backup/upload` – رفع نسخة جاهزة.
  - `DELETE /backup/:filename` – حذف نسخة.

في لوحة التحكم:

- **Automated Backup**: يمكن إعداد Job خارجي على Render لاستدعاء `/backup` دورياً.  
- **System Snapshots**: أزرار لإنشاء واستعادة Snapshot يدوي من واجهة الإعدادات.

---

## 7. تشغيل النظام على Render

1. خدمة **SourcePlus** (API – Node):
   - Build:  
     `cd server && npm install && npx prisma migrate deploy && npx prisma generate && npm run build`
   - Start:  
     `cd server && npm start`
   - Env:  
     `DATABASE_URL`, `JWT_SECRET`, `PORT`

2. خدمة **SourceF** (الواجهة – Static Site):
   - Root: `client`
   - Build: `npm install && npm run build`
   - Publish: `build`
   - Env: `VITE_API_URL=https://sourceplus.onrender.com`

بعد ذلك:

- افتح لوحة التحكم من `https://sourcef.onrender.com`.
- استخدم واجهات `/api` من تطبيق العميل للتحقق من التراخيص، التفعيل، التحديثات، ومزامنة الإعدادات.
