
import React from 'react';
import { translations, Language } from '../locales';
import { 
    Server, 
    Database, 
    ShieldCheck, 
    Code2, 
    Cpu, 
    Layers, 
    Globe, 
    Lock 
} from 'lucide-react';

interface SystemInfoProps {
  currentLang: Language;
}

const SystemInfo: React.FC<SystemInfoProps> = ({ currentLang }) => {
  const t = translations[currentLang];

  return (
    <div className="space-y-8 pb-12" dir="rtl">
       <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden">
          <div className="relative z-10">
             <h1 className="text-3xl font-bold font-arabic mb-2">معلومات النظام والتقنيات</h1>
             <p className="text-slate-300 text-lg">توثيق شامل لمميزات خادم سورس بلس (SourcePlus) والبنية التقنية المستخدمة.</p>
          </div>
          <div className="absolute left-0 bottom-0 opacity-10 text-9xl">
             <Code2 size={200} />
          </div>
       </div>

       {/* Features Section */}
       <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 font-arabic">
             <Layers className="text-sky-600" />
             مميزات النظام الأساسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 font-arabic">1. إدارة التراخيص (Licensing)</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                   <li>توليد مفاتيح سيريال (Serial Keys) مرتبطة بخطط اشتراك محددة.</li>
                   <li>ربط الترخيص بجهاز الكمبيوتر (Hardware ID Lock) لمنع استخدامه على أجهزة متعددة غير مصرح بها.</li>
                   <li>دعم التراخيص المؤقتة (شهرية/سنوية) والتراخيص الدائمة.</li>
                   <li>إمكانية إبطال (Revoke) الترخيص فورياً وإيقاف النظام عند العميل.</li>
                </ul>
             </div>

             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 font-arabic">2. التحديثات والتنبيهات (Updates & Notifications)</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                   <li>رفع إصدارات جديدة مع ملاحظات التحديث (Release Notes).</li>
                   <li>دعم التحديث الإجباري (Force Update) للإصلاحات الأمنية الحرجة.</li>
                   <li>نظام إشعارات فوري (Push Notifications) لإرسال رسائل إدارية للمستخدمين على أجهزة الكمبيوتر.</li>
                   <li>إمكانية استهداف مستخدم محدد (بواسطة السيريال) أو إرسال إشعار عام للجميع.</li>
                </ul>
             </div>

             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 font-arabic">3. الدعم الفني المتقدم (Support)</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                   <li>استلام تذاكر الدعم مباشرة من داخل برنامج نقاط البيع.</li>
                   <li>عرض تفاصيل جهاز العميل تلقائياً (اسم الكمبيوتر، نظام التشغيل، إصدار التطبيق).</li>
                   <li>إمكانية الرد على العميل (Admin Reply) ليظهر الرد في واجهة المستخدم لديه.</li>
                </ul>
             </div>

             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 font-arabic">4. الإعدادات عن بعد (Remote Config)</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                   <li>التحكم في سلوك التطبيق دون الحاجة لتحديثه (Feature Flags).</li>
                   <li>تفعيل/إيقاف وضع الصيانة (Maintenance Mode).</li>
                   <li>تحديث أسعار العملات مركزياً ومزامنتها مع جميع الأجهزة.</li>
                </ul>
             </div>
          </div>
       </section>

       {/* Tech Stack Section */}
       <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 font-arabic">
             <Cpu className="text-emerald-600" />
             التقنيات المستخدمة (Tech Stack)
          </h2>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
             <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 dark:divide-slate-800">
                <div className="p-6 text-center">
                   <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe size={32} />
                   </div>
                   <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Frontend</h3>
                   <p className="text-slate-500 text-sm">React 18 + TypeScript</p>
                   <p className="text-slate-500 text-sm">Tailwind CSS (Styling)</p>
                   <p className="text-slate-500 text-sm">Lucide React (Icons)</p>
                   <p className="text-slate-500 text-sm">Recharts (Analytics)</p>
                </div>

                <div className="p-6 text-center">
                   <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Server size={32} />
                   </div>
                   <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Backend Architecture</h3>
                   <p className="text-slate-500 text-sm">Node.js / NestJS (Simulated)</p>
                   <p className="text-slate-500 text-sm">RESTful API Design</p>
                   <p className="text-slate-500 text-sm">JWT Authentication</p>
                </div>

                <div className="p-6 text-center">
                   <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Database size={32} />
                   </div>
                   <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Database</h3>
                   <p className="text-slate-500 text-sm">PostgreSQL (Structure)</p>
                   <p className="text-slate-500 text-sm">Relational Data Model</p>
                   <p className="text-slate-500 text-sm">UUID Primary Keys</p>
                </div>
             </div>
          </div>
       </section>

       <section className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
             <ShieldCheck className="text-sky-600 dark:text-sky-400 mt-1" size={24} />
             <div>
                <h3 className="font-bold text-sky-800 dark:text-sky-300 mb-2">معايير الأمان (Security Standards)</h3>
                <p className="text-sky-700 dark:text-sky-200/80 text-sm leading-relaxed">
                   تم تصميم النظام ليعمل بأعلى معايير الأمان، حيث يتم تشفير كلمات المرور، واستخدام رموز التحقق (Tokens) للجلسات، بالإضافة إلى نظام صلاحيات صارم (RBAC) يفصل بين المدير (Admin) والمطور (Developer). كما يتم حماية نقاط الاتصال (API Endpoints) والتحقق من صحة البيانات المدخلة لمنع هجمات الحقن (Injection Attacks).
                </p>
             </div>
          </div>
       </section>
    </div>
  );
};

export default SystemInfo;