# Quick Reference: Clinic Controls

## 🚀 Quick Start

### 1. Run Migration
```bash
cd server
npx prisma migrate dev --name add_clinic_controls_with_lock_reason
npx prisma generate
npm run dev
```

### 2. Test in UI
1. Go to **Admin → Manage Clinics**
2. Click purple **Settings** button on any clinic
3. Modify controls and save

### 3. Verify
- Check audit logs
- Call GET `/api/clinics/:id/controls`
- Confirm changes reflected

---

## 📡 API Quick Reference

### Get Controls (Public)
```bash
curl http://localhost:3001/api/clinics/{id}/controls
```

### Update Controls (Admin)
```bash
curl -X PUT http://localhost:3001/api/clinics/{id}/controls \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "storageLimitMB": 2048,
    "usersLimit": 5,
    "features": { "ai": true },
    "locked": false
  }'
```

### Lock Clinic
```bash
curl -X PUT http://localhost:3001/api/clinics/{id}/controls \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "locked": true,
    "lockReason": "Payment overdue"
  }'
```

---

## 🔧 Smart Clinic Integration

### Bootstrap Example
```typescript
// In Smart Clinic /system/bootstrap
const controls = await fetch(
  `${SOURCEPLUS_URL}/api/clinics/${clinicId}/controls`
).then(r => r.json());

// Enforce lock
if (controls.locked) {
  throw new Error(controls.lockReason || 'Clinic suspended');
}

// Check features
if (!controls.features.orthodontics) {
  // Hide orthodontics module
}

// Check limits
const currentUsers = await getUserCount();
if (currentUsers >= controls.usersLimit) {
  throw new Error('User limit reached');
}
```

---

## 🎨 UI Components

### Open Controls Modal
```tsx
import ClinicControlsModal from '../components/ClinicControlsModal';

<ClinicControlsModal
  clinic={selectedClinic}
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    refreshData();
    setShowModal(false);
  }}
/>
```

### Add Settings Button
```tsx
<button
  onClick={() => setControlsModal(clinic)}
  className="p-2 text-purple-500 hover:bg-purple-500/10 rounded-lg"
>
  <Settings size={18} />
</button>
```

---

## 📦 Default Controls
```javascript
{
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
}
```

---

## 🔐 Permission Matrix

| Endpoint | Method | Auth | Role |
|----------|--------|------|------|
| `/api/clinics/:id/controls` | GET | None | Public |
| `/api/clinics/:id/controls` | PUT | Required | Admin |

---

## 📝 TypeScript Types

```typescript
interface ClinicControl {
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
```

---

## 🐛 Common Issues

### Controls not created?
```bash
# Check if clinic exists
npx prisma studio

# Manually create
await prisma.clinicControl.create({
  data: { clinicId: '...', ...defaults }
});
```

### Can't update?
- ✅ Check admin auth token
- ✅ Verify clinic ID exists
- ✅ Check request payload structure

### Changes not reflected?
- ✅ Smart Clinic should call endpoint on every bootstrap
- ✅ Check Smart Clinic is not caching controls
- ✅ Verify no network errors

---

## 📊 Monitoring

```bash
# Check recent control updates
SELECT * FROM audit_logs 
WHERE action = 'UPDATE_CLINIC_CONTROLS' 
ORDER BY created_at DESC 
LIMIT 10;

# View all controls
SELECT * FROM clinic_controls;

# Find locked clinics
SELECT c.name, cc.locked, cc.lock_reason
FROM clinics c
JOIN clinic_controls cc ON c.id = cc.clinic_id
WHERE cc.locked = true;
```

---

## 🎯 Testing Checklist

- [ ] Create new clinic → Controls auto-created
- [ ] Update storage limit → Saved successfully
- [ ] Enable AI feature → Feature flag toggled
- [ ] Lock clinic → lockReason saved
- [ ] Unlock clinic → lockReason cleared
- [ ] Reset to defaults → All values reset
- [ ] Delete clinic → Controls cascade deleted
- [ ] Check audit log → Before/after logged
- [ ] Dark mode → UI still readable
- [ ] Arabic mode → Translations work

---

## 🔗 Related Files

```
server/
  ├── prisma/schema.prisma          # Database schema
  └── src/modules/clinics/
      ├── routes.ts                 # Main clinic routes
      └── controls.ts               # Controls API

client/
  ├── components/
  │   └── ClinicControlsModal.tsx   # UI component
  ├── pages/
  │   └── Clinics.tsx               # Integration
  ├── services/
  │   └── api.ts                    # API client
  └── locales-controls.ts           # Translations

CLINIC_CONTROLS_API.md              # Full documentation
CLINIC_CONTROLS_IMPLEMENTATION.md   # Implementation guide
```

---

**Updated**: 2025-12-21
