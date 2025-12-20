# Smart Clinic ↔ SourcePlus Integration Guide
## Complete API Reference for Real-World Implementation

**Last Updated**: 2025-12-21  
**Version**: 2.0  
**Target**: Smart Clinic Developers

---

## 🎯 Overview

هذا الدليل الشامل يوضح كيفية تكامل **Smart Clinic** مع **SourcePlus Control Center** للحصول على الإعدادات والحدود وتطبيقها في الوقت الفعلي.

### **المبدأ الأساسي**:
- ✅ **SourcePlus** = المصدر الوحيد للحقيقة (Single Source of Truth)
- ✅ **Smart Clinic** = قارئ ومنفذ فقط (Reader & Enforcer)
- ✅ **لا اعتماد على Plans** في Smart Clinic
- ✅ كل التحكم يأتي من **Clinic Controls API**

---

## 🔌 API Endpoint

### **Base URL**
```
https://sourceplus.yourdomain.com
```

أو للتطوير المحلي:
```
http://localhost:3001
```

### **Main Endpoint**

#### **GET /api/clinics/:clinicId/controls**

**الغرض**: الحصول على جميع إعدادات وحدود العيادة

**Authentication**: ❌ لا يتطلب (Public endpoint)

**Parameters**:
- `clinicId` (string, required): معرّف العيادة الفريد

**Response 200 OK**:
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

**Response 404 Not Found**:
```json
{
  "message": "Clinic not found"
}
```

**Behavior**:
- إذا لم توجد controls للعيادة، يتم إنشاؤها تلقائياً بالقيم الافتراضية
- لا يحتاج Smart Clinic إلى إرسال أي بيانات، فقط القراءة

---

## 🔧 Implementation in Smart Clinic

### **1. Bootstrap / Startup**

عند بدء تشغيل Smart Clinic، يجب استدعاء الـ Controls:

```typescript
// File: src/services/sourceplus.service.ts

const SOURCEPLUS_URL = process.env.SOURCEPLUS_URL || 'https://sourceplus.yourdomain.com';

export interface ClinicControls {
  storageLimitMB: number;
  usersLimit: number;
  features: {
    patients: boolean;
    appointments: boolean;
    orthodontics: boolean;
    xray: boolean;
    ai: boolean;
  };
  locked: boolean;
  lockReason: string | null;
}

export async function fetchClinicControls(clinicId: string): Promise<ClinicControls> {
  try {
    const response = await fetch(
      `${SOURCEPLUS_URL}/api/clinics/${clinicId}/controls`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        // لا حاجة لـ Authorization header
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch controls: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching clinic controls:', error);
    // في حالة الفشل، استخدم القيم الافتراضية
    return getDefaultControls();
  }
}

function getDefaultControls(): ClinicControls {
  return {
    storageLimitMB: 1024,
    usersLimit: 3,
    features: {
      patients: true,
      appointments: true,
      orthodontics: false,
      xray: false,
      ai: false
    },
    locked: false,
    lockReason: null
  };
}
```

---

### **2. System Bootstrap Endpoint**

دمج الـ Controls في Bootstrap الخاص بـ Smart Clinic:

```typescript
// File: src/routes/system.routes.ts

import { fetchClinicControls } from '../services/sourceplus.service';
import { calculateStorageUsage, getActiveUsersCount } from '../services/usage.service';

router.get('/system/bootstrap', async (req, res) => {
  try {
    const clinicId = req.user.clinicId; // من الـ JWT token
    
    // 1. جلب الـ Controls من SourcePlus
    const controls = await fetchClinicControls(clinicId);
    
    // 2. فحص إذا كانت العيادة مقفلة
    if (controls.locked) {
      return res.status(403).json({
        error: 'CLINIC_LOCKED',
        message: controls.lockReason || 'This clinic has been temporarily suspended.',
        locked: true
      });
    }
    
    // 3. حساب الاستخدام المحلي
    const storageUsedMB = await calculateStorageUsage(clinicId);
    const activeUsers = await getActiveUsersCount(clinicId);
    
    // 4. فحص تجاوز الحدود
    const storageExceeded = storageUsedMB > controls.storageLimitMB;
    const usersLimitReached = activeUsers >= controls.usersLimit;
    
    // 5. إرجاع البيانات الكاملة
    return res.json({
      clinic: {
        id: clinicId,
        name: req.user.clinicName,
        // ... بيانات أخرى
      },
      controls: {
        // الحدود
        storageLimitMB: controls.storageLimitMB,
        usersLimit: controls.usersLimit,
        
        // الاستخدام الفعلي
        storageUsedMB: storageUsedMB,
        storageUsagePercent: (storageUsedMB / controls.storageLimitMB) * 100,
        storageExceeded: storageExceeded,
        
        activeUsersCount: activeUsers,
        usersLimitReached: usersLimitReached,
        remainingUserSlots: Math.max(0, controls.usersLimit - activeUsers),
        
        // الميزات
        features: controls.features,
        
        // الحالة
        locked: controls.locked,
        lockReason: controls.lockReason
      },
      
      // بيانات إضافية
      user: req.user,
      permissions: calculatePermissions(req.user, controls),
      systemHealth: 'operational'
    });
    
  } catch (error) {
    console.error('Bootstrap error:', error);
    return res.status(500).json({
      error: 'BOOTSTRAP_FAILED',
      message: 'Failed to initialize system'
    });
  }
});
```

---

### **3. Middleware for Enforcement**

إنشاء middleware لتطبيق الـ Controls على كل request:

```typescript
// File: src/middleware/controls.middleware.ts

import { fetchClinicControls } from '../services/sourceplus.service';

// Cache للـ controls (refresh كل 5 دقائق)
const controlsCache = new Map<string, { controls: ClinicControls; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getClinicControls(clinicId: string): Promise<ClinicControls> {
  const cached = controlsCache.get(clinicId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.controls;
  }
  
  const controls = await fetchClinicControls(clinicId);
  controlsCache.set(clinicId, { controls, timestamp: now });
  
  return controls;
}

export async function enforceControls(req: any, res: any, next: any) {
  try {
    const clinicId = req.user?.clinicId;
    
    if (!clinicId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const controls = await getClinicControls(clinicId);
    
    // 1. فحص القفل
    if (controls.locked) {
      return res.status(403).json({
        error: 'CLINIC_LOCKED',
        message: controls.lockReason || 'Clinic access is currently restricted.',
        locked: true
      });
    }
    
    // 2. إضافة الـ controls إلى الـ request
    req.clinicControls = controls;
    
    next();
    
  } catch (error) {
    console.error('Controls enforcement error:', error);
    // في حالة الخطأ، السماح بالمرور (graceful degradation)
    next();
  }
}

// استخدام في جميع الـ routes
// app.use('/api/*', authenticateJWT, enforceControls);
```

---

### **4. Feature Toggles**

تطبيق Feature Flags في الـ Frontend:

```typescript
// File: src/contexts/ControlsContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ControlsContextType {
  controls: ClinicControls | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ControlsContext = createContext<ControlsContextType | undefined>(undefined);

export const ControlsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [controls, setControls] = useState<ClinicControls | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchControls = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system/bootstrap');
      const data = await response.json();
      
      if (data.locked) {
        // تسجيل خروج المستخدم
        window.location.href = '/locked';
        return;
      }
      
      setControls(data.controls);
    } catch (error) {
      console.error('Failed to fetch controls:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchControls();
    
    // Refresh كل 5 دقائق
    const interval = setInterval(fetchControls, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <ControlsContext.Provider value={{ controls, loading, refresh: fetchControls }}>
      {children}
    </ControlsContext.Provider>
  );
};

export const useControls = () => {
  const context = useContext(ControlsContext);
  if (!context) {
    throw new Error('useControls must be used within ControlsProvider');
  }
  return context;
};
```

**استخدام في Component**:

```tsx
// File: src/pages/Patients.tsx

import { useControls } from '../contexts/ControlsContext';

export const PatientsPage = () => {
  const { controls, loading } = useControls();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // فحص إذا كانت الميزة مفعّلة
  if (!controls?.features.patients) {
    return (
      <div className="p-6">
        <h2>Feature Not Available</h2>
        <p>The Patients module is not enabled for your clinic.</p>
        <p>Please contact support to enable this feature.</p>
      </div>
    );
  }
  
  // عرض الصفحة العادية
  return (
    <div>
      {/* محتوى صفحة المرضى */}
    </div>
  );
};
```

---

### **5. Storage Limit Enforcement**

منع رفع الملفات عند تجاوز الحد:

```typescript
// File: src/routes/upload.routes.ts

router.post('/api/upload', enforceControls, async (req, res) => {
  try {
    const controls = req.clinicControls;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // حساب الاستخدام الحالي
    const currentUsageMB = await calculateStorageUsage(req.user.clinicId);
    const fileSizeMB = file.size / (1024 * 1024);
    const projectedUsage = currentUsageMB + fileSizeMB;
    
    // فحص تجاوز الحد
    if (projectedUsage > controls.storageLimitMB) {
      return res.status(413).json({
        error: 'STORAGE_LIMIT_EXCEEDED',
        message: 'Storage limit exceeded. Please contact support to increase your limit.',
        currentUsageMB: currentUsageMB,
        limitMB: controls.storageLimitMB,
        fileSizeMB: fileSizeMB
      });
    }
    
    // رفع الملف
    const uploadResult = await uploadFile(file);
    
    return res.json({
      success: true,
      file: uploadResult,
      storageUsed: projectedUsage,
      storageLimit: controls.storageLimitMB
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
});
```

---

### **6. User Limit Enforcement**

منع إضافة مستخدمين جدد عند الوصول للحد:

```typescript
// File: src/routes/users.routes.ts

router.post('/api/users', enforceControls, async (req, res) => {
  try {
    const controls = req.clinicControls;
    
    // عد المستخدمين النشطين
    const activeUsersCount = await getActiveUsersCount(req.user.clinicId);
    
    // فحص الحد
    if (activeUsersCount >= controls.usersLimit) {
      return res.status(403).json({
        error: 'USERS_LIMIT_REACHED',
        message: `You have reached the maximum number of users (${controls.usersLimit}). Please contact support to increase your limit.`,
        currentUsers: activeUsersCount,
        limit: controls.usersLimit
      });
    }
    
    // إنشاء المستخدم
    const newUser = await createUser(req.body);
    
    return res.json({
      success: true,
      user: newUser,
      remainingSlots: controls.usersLimit - activeUsersCount - 1
    });
    
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});
```

---

## 📊 Usage Data Sync (Optional)

إرسال بيانات الاستخدام إلى SourcePlus لعرضها في Dashboard:

```typescript
// File: src/services/sync.service.ts

export async function syncUsageToSourcePlus(clinicId: string) {
  try {
    const storageUsed = await calculateStorageUsage(clinicId);
    const activeUsers = await getActiveUsersCount(clinicId);
    
    // هذا endpoint يجب إضافته في SourcePlus (اختياري)
    await fetch(`${SOURCEPLUS_URL}/api/clinics/${clinicId}/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLINIC_API_KEY}` // مفتاح API خاص بالعيادة
      },
      body: JSON.stringify({
        storageUsedMB: storageUsed,
        activeUsersCount: activeUsers,
        lastSyncAt: new Date().toISOString()
      })
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    // لا تفشل في حالة خطأ الـ sync
  }
}

// استدعاء كل ساعة
setInterval(() => {
  const clinicId = getCurrentClinicId();
  if (clinicId) {
    syncUsageToSourcePlus(clinicId);
  }
}, 60 * 60 * 1000); // كل ساعة
```

---

## 🔒 Handling Lock State

### **Scenario 1: Clinic Locked During Session**

```typescript
// File: src/services/heartbeat.service.ts

// فحص دوري كل دقيقة
setInterval(async () => {
  try {
    const clinicId = getCurrentClinicId();
    const controls = await fetchClinicControls(clinicId);
    
    if (controls.locked) {
      // تسجيل خروج فوري
      alert(controls.lockReason || 'Your clinic has been suspended.');
      
      // مسح الجلسة
      localStorage.clear();
      sessionStorage.clear();
      
      // إعادة توجيه لصفحة القفل
      window.location.href = '/locked';
    }
  } catch (error) {
    console.error('Heartbeat error:', error);
  }
}, 60 * 1000); // كل دقيقة
```

### **Locked Page**

```tsx
// File: src/pages/Locked.tsx

export const LockedPage = () => {
  const [lockReason, setLockReason] = useState('');
  
  useEffect(() => {
    const fetchLockReason = async () => {
      const clinicId = getStoredClinicId();
      const controls = await fetchClinicControls(clinicId);
      setLockReason(controls.lockReason || 'Your clinic has been temporarily suspended.');
    };
    
    fetchLockReason();
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50">
      <div className="max-w-md p-8 bg-white rounded-2xl shadow-2xl border-2 border-rose-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-rose-600 mb-4">
            Clinic Access Suspended
          </h1>
          <p className="text-slate-600 mb-6">
            {lockReason}
          </p>
          <p className="text-sm text-slate-500">
            Please contact support for assistance.
          </p>
          <a href="mailto:support@example.com" className="mt-6 inline-block px-6 py-3 bg-rose-600 text-white rounded-lg">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};
```

---

## 🎯 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Smart Clinic                         │
│                                                          │
│  1. User Login                                           │
│     ↓                                                    │
│  2. Call /api/system/bootstrap                          │
│     ↓                                                    │
│  3. Backend calls SourcePlus:                           │
│     GET /api/clinics/:id/controls                       │
│     ↓                                                    │
│  4. SourcePlus returns:                                 │
│     {                                                    │
│       storageLimitMB: 2048,                             │
│       usersLimit: 5,                                    │
│       features: {...},                                  │
│       locked: false                                     │
│     }                                                    │
│     ↓                                                    │
│  5. Smart Clinic checks:                                │
│     - Is locked? → Show locked page                     │
│     - Storage exceeded? → Block uploads                 │
│     - Users limit? → Block new users                    │
│     ↓                                                    │
│  6. Apply feature toggles in UI                         │
│     - Show/hide modules based on features               │
│     ↓                                                    │
│  7. Cache controls (refresh every 5 min)                │
│     ↓                                                    │
│  8. Heartbeat check (every 1 min)                       │
│     - Re-check if locked                                │
│                                                          │
│  9. On every action:                                    │
│     - Middleware enforces limits                        │
│     - Real-time validation                              │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Integration Checklist

### **Phase 1: Basic Integration** ✅
- [ ] Create `sourceplus.service.ts`
- [ ] Add `fetchClinicControls()` function
- [ ] Update `/system/bootstrap` to call SourcePlus
- [ ] Return controls in bootstrap response
- [ ] Test basic connection

### **Phase 2: Enforcement** ✅
- [ ] Create `controls.middleware.ts`
- [ ] Implement locked check
- [ ] Apply middleware to all protected routes
- [ ] Create locked page UI
- [ ] Test lock/unlock scenario

### **Phase 3: Limits** ✅
- [ ] Implement storage calculation
- [ ] Add storage check in upload endpoint
- [ ] Show storage warnings in UI
- [ ] Implement users count
- [ ] Block new users when limit reached
- [ ] Show user limit warnings

### **Phase 4: Features** ✅
- [ ] Create `ControlsContext`
- [ ] Wrap app with `ControlsProvider`
- [ ] Use `useControls()` in components
- [ ] Hide/show modules based on features
- [ ] Show "Feature not available" messages

### **Phase 5: Optimization** 🔜
- [ ] Implement caching
- [ ] Add heartbeat service
- [ ] Periodic controls refresh
- [ ] Error handling & fallbacks
- [ ] Logging & monitoring

### **Phase 6: Sync (Optional)** 🔮
- [ ] Implement usage sync to SourcePlus
- [ ] Schedule periodic sync
- [ ] Handle sync errors gracefully

---

## 🐛 Error Handling

### **SourcePlus Unavailable**

```typescript
export async function fetchClinicControls(clinicId: string): Promise<ClinicControls> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(
      `${SOURCEPLUS_URL}/api/clinics/${clinicId}/controls`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('SourcePlus connection error:', error);
    
    // Fallback: استخدام القيم المحفوظة محلياً
    const cached = localStorage.getItem(`controls_${clinicId}`);
    if (cached) {
      console.warn('Using cached controls due to connection error');
      return JSON.parse(cached);
    }
    
    // Fallback: استخدام القيم الافتراضية
    console.warn('Using default controls - SourcePlus unreachable');
    return getDefaultControls();
  }
}
```

---

## 🔐 Security Considerations

1. **HTTPS Only**: استخدم HTTPS دائماً في الإنتاج
2. **CORS**: تأكد من إعدادات CORS صحيحة في SourcePlus
3. **Rate Limiting**: طبّق حد للطلبات لتجنب الإفراط
4. **Caching**: استخدم cache لتقليل الطلبات
5. **Validation**: تحقق من البيانات المستلمة
6. **Graceful Degradation**: لا تعطل التطبيق عند فشل الاتصال

---

## 📞 Support

**للأسئلة أو المساعدة**:
- الرجوع إلى `CLINIC_CONTROLS_API.md`
- فحص الـ logs في SourcePlus
- التواصل مع فريق الدعم

---

**Last Updated**: 2025-12-21  
**Maintained by**: SourcePlus Team
