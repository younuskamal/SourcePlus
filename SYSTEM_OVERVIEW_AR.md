# نظرة شاملة على نظام **SourcePlus Licensing Server**

ملف توثيقي مختصر بالعربية يشرح طريقة التشغيل، هيكل الملفات، تدفق الواجهات، البيانات الوهمية، وكيفية التطوير مستقبلاً.

## التشغيل المحلي
- المتطلبات: Node.js
- تثبيت الحزم: `npm install`
- تشغيل بيئة التطوير: `npm run dev`
- متغيرات البيئة: ضع مفتاحك في `.env.local` تحت المتغير `GEMINI_API_KEY` (في حالة استخدامه لاحقاً).

## هيكل المجلدات السريع
- `index.html` : تحميل Tailwind عبر CDN، تعريف ألوان العلامة التجارية عبر CSS variables، وضبط خطوط Inter/Cairo ودعم الـRTL.
- `index.tsx` : نقطة الدخول لـ React/Vite.
- `App.tsx` : التحكم في اللغة، الثيم الداكن، حالة المستخدم، وتوجيه الصفحات.
- `components/Layout.tsx` : الإطار العام (Sidebar + Header) مع تبديل اللغة والثيم.
- `locales.ts` : نصوص الواجهة باللغتين EN/AR.
- `types.ts` : نماذج البيانات (تراخيص، خطط، مستخدمين، معاملات مالية، إعدادات النظام…).
- `services/mockBackend.ts` : خادم وهمي يحاكي قواعد البيانات والمنطق الخلفي.
- `pages/*` : كل شاشة رئيسية في النظام (Dashboard, Licenses, Plans, Financials, Updates, Notifications, Support, Currencies, Settings, Team, AuditLogs, ApiDocs, Login).

## تدفق التطبيق العام
1) **Login** (`pages/Login.tsx`)  
   - تسجيل دخول تجريبي بالبريد فقط (كلمات المرور غير متحقَّق منها).  
   - حسابان جاهزان: `admin@sourceplus.com` (صلاحية admin) و`ali@sourceplus.com` (developer).
2) بعد الدخول يتم تمرير `user` إلى `Layout` و`App`:
   - **تبديل اللغة**: زر العلم في الـHeader يبدّل بين `en`/`ar`.
   - **الثيم الداكن**: يُفعّل/يعطَّل عبر state في `App` ويضيف/يحذف `class="dark"` على الـhtml.
   - **تغيير اللون الأساسي**: يتم عبر `Settings` باستدعاء `onThemeChange` → دالة `updateThemeColors` في `App` التي تعيد حقن CSS variables.
3) **التحكم في الصفحات**: متغير `currentPage` في `App` يحدد أي صفحة تُعرض، ويتم ضبطه من الـSidebar أو من أزرار الحركة داخل الصفحات.
4) **نظام الصلاحيات (RBAC)**:
   - دور `admin`: وصول كامل لكل القوائم.
   - دور `developer`: ممنوع من (Plans, Currencies, Team, Audit Logs, Financials). الواجهة تُظهر زر "Access Restricted" عند محاولة الدخول.

## الخادم الوهمي `services/mockBackend.ts`
- يحتوي على بيانات أولية (seed) للمستخدمين، الخطط، العملات، الإعدادات، الإشعارات.
- يُخزن كل شيء في الذاكرة (لا يوجد API حقيقي). الدوال الأساسية:
  - **المستخدمون**: `login`, `getUsers`, `addUser`, `deleteUser`.
  - **الخطط**: `getPlans`, `addPlan`, `updatePlan`, `deletePlan`.
  - **التراخيص**: `generateLicense` (يدعم توليد جماعي، يختار Prefix TR/‏SP حسب كون الخطة مجانية أم مدفوعة)، `updateLicense`, `renewLicense` (يُسجل معاملات مالية)، `revokeLicense`, `togglePauseLicense`, `deleteLicense`.
  - **التذاكر**: `getTickets`, `replyToTicket`, `resolveTicket`.
  - **الإشعارات**: `getNotifications`, `sendNotification` (بث عام أو لسيريال محدد)، `deleteNotification`, `clearNotifications`.
  - **العملات**: `getCurrencies`, `addCurrency`, `updateRate`, `deleteCurrency`, `syncCurrencyRates` (تذبذب عشوائي).
  - **الإعدادات/الكونفيغ**: `getConfig`, `updateConfig`, `getSystemSettings`, `updateSystemSettings`.
  - **السجلات**: `getAuditLogs`, `clearAuditLogs`, إضافة Log تلقائي لكل عملية عند وجود مستخدم مسجل.
  - **التحليلات**: `getStats`, `getRevenueHistory`, `getFinancialStats`, `getTransactions`, `getServerHealth`.
- يوجد حساب مستخدم حالي `currentUser` لتسجيل الأحداث، ويتم ضبطه بعد `login`.

## نظرة على الصفحات الرئيسية
- **Dashboard**: إحصائيات الإيرادات/التراخيص، مخطط Recharts، مراقبة صحة الخادم (أرقام عشوائية)، آخر 5 سجلات Audit، أزرار وصول سريع.
- **Licenses**: بحث/فلاتر، توليد مفاتيح (مفرد أو Bulk)، إيقاف/إلغاء/تجديد، تصدير CSV، تفعيل أوفلاين (كود استجابة مبني على request code + السيريال)، تعديل اسم العميل، حذف نهائي.
- **Plans**: إضافة/تعديل/حذف الخطط مع مدة الاشتراك، حد الأجهزة، الميزات، وتسعير عملات بديلة مرتبط بجدول العملات.
- **Financials**: يعرض معاملات `mockBackend` (مشتريات/تجديدات) + إحصائيات إجمالي/شهري/يومي، وتصدير CSV.
- **Updates**: إدارة إصدارات التطبيق (إضافة، تعديل، تفعيل/إيقاف، Force Update)، تحميل ملف وهمي للتجربة.
- **Notifications**: إرسال إشعار عام أو لسيريال محدد، عرض السجل مع إمكانية الحذف أو التفريغ.
- **Support**: قائمة تذاكر الدعم (وهمية)، عرض التفاصيل (HWID، نسخة التطبيق، الجهاز)، رد أو إغلاق التذكرة.
- **Currencies**: CRUD لأسعار الصرف والرموز، زر مزامنة يغير الأسعار عشوائياً.
- **Settings**: تبويبات (عام، إعدادات الخادم، قنوات الإشعارات SMTP/Telegram، النسخ الاحتياطي، إعدادات العميل/remote config). يحفظ إلى `systemSettings` و`config` في الـbackend.
- **Team**: إضافة/حذف مستخدمين وأدوارهم.
- **Audit Logs**: تصفية/بحث/تصدير CSV، مع خيار مسح السجلات (يعيد Log واحد يوضح عملية المسح).
- **API Docs**: دليل مبسط لواجهات REST المتوقعة للعميل (Validate، Activate، Check update، Sync config، Support).

## التعريب والثيم
- النصوص تأتي من `locales.ts`، وأغلب الـUI يستخدم `t.<key>`.
- اتجاه الصفحة (RTL/LTR) يتغير حسب اللغة في `Layout`.
- الألوان: Tailwind يقرأ CSS variables `--color-primary-*` المعروفة في `index.html`. الدالة `updateThemeColors` تحسب تدرجات بسيطة عبر تفتيح/تغميق القيمة المختارة في الإعدادات.
- الثيم الداكن: يعتمد على class `dark` في عنصر `html` ويتم تفعيلها في `App.tsx`.

## ملاحظات للتطوير المستقبلي
1) **استبدال الـmock backend بـ API حقيقي**: إنشاء طبقة خدمات (fetch/axios) بنفس توقيع الدوال الحالية لتقليل التعديلات في الصفحات.  
2) **مصادقة حقيقية**: إضافة JWT + تخزين Password hash، وضبط حماية المسارات حسب الدور في الـAPI وليس فقط الواجهة.  
3) **حفظ دائم للبيانات**: ربط PostgreSQL (المخطط موجود في `types.ts`) مع مهايئ Prisma/ORM.  
4) **تحسين الأمان**: تسجيل IP الحقيقي، حماية عمليات الحذف/التفريغ بتأكيد إضافي/2FA، وتدقيق إدخال البيانات.  
5) **المزامنة مع العميل**: endpoints حقيقية لتفعيل الأوفلاين، تحديث الأسعار، وجلب Remote Config.  
6) **الاختبارات**: إضافة وحدات اختبار لدوال التوليد (Serial)، وللعمليات المالية/التجديد، واختبارات UI أساسية (Playwright/Vitest).

## نقاط سريعة يجب تذكرها
- السيريال يُولد بصيغة `TR-YYYY-XXXX-XXXX-XXXX` أو `SP-...` حسب كون الخطة مجانية أم مدفوعة.
- التوليد أو التجديد يسجل معاملات مالية تلقائياً في `transactions`.
- بعض الصفحات (Plans, Currencies, Team, AuditLogs, Financials) مخفية عن دور `developer`.
- الإشعارات وتذاكر الدعم والـAudit Logs كلها بيانات في الذاكرة؛ يتم فقدها عند تحديث الصفحة.
- لتحويل اللون الأساسي، استخدم تبويب الإعدادات → Branding، أو مرر `onThemeChange` من `App` لتطبيق اللون مباشرة.
