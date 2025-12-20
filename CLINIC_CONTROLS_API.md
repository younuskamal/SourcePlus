# Clinic Controls API Documentation

## Overview
This API allows SourcePlus to act as a centralized Control Center for all clinics. Each clinic has independent settings that Smart Clinic systems read and enforce.

## Key Principles
- ❌ **No Plan Dependencies**: Clinic controls are independent of subscription plans
- ✅ **SourcePlus as Single Source of Truth**: All control settings come from SourcePlus
- ✅ **Smart Clinic Read-Only**: Smart Clinic applications only read and enforce settings
- ✅ **Instant Changes**: Any control update reflects immediately on the clinic

---

## Endpoints

### 1. Get Clinic Controls (Read-Only for Smart Clinic)

**Endpoint**: `GET /api/clinics/:id/controls`

**Authentication**: None required (can be called by Smart Clinic)

**Description**: Returns the current control settings for a clinic. If no controls exist, they are automatically created with default values.

**Response**:
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
  "locked": false
}
```

**Fields**:
- `storageLimitMB` (number): Maximum storage allowed in megabytes
- `usersLimit` (number): Maximum number of users allowed
- `features` (object): Feature toggles
  - `patients` (boolean): Enable/disable patients module
  - `appointments` (boolean): Enable/disable appointments module
  - `orthodontics` (boolean): Enable/disable orthodontics module
  - `xray` (boolean): Enable/disable X-ray module
  - `ai` (boolean): Enable/disable AI features
- `locked` (boolean): If true, clinic is completely locked from access

**Usage in Smart Clinic**:
Smart Clinic should call this endpoint on:
- System bootstrap/startup
- Periodic intervals (e.g., every 5-10 minutes)
- After user login

---

### 2. Update Clinic Controls (Admin Only)

**Endpoint**: `PUT /api/clinics/:id/controls`

**Authentication**: Required (Admin role)

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Description**: Updates clinic control settings. Creates controls if they don't exist.

**Request Body**:
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
  "locked": false
}
```

**Note**: All fields are optional. Only provided fields will be updated.

**Response**:
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
  "locked": false
}
```

**Audit Logging**: All changes are automatically logged in AuditLog with:
- `action`: "UPDATE_CLINIC_CONTROLS"
- `details`: Description of changes made
- `userId`: Admin who made the change
- `ip`: IP address of the request

---

## Default Values

When a clinic is created or controls don't exist, these defaults are applied:

```javascript
{
  storageLimitMB: 1024,      // 1GB
  usersLimit: 3,
  features: {
    patients: true,
    appointments: true,
    orthodontics: false,
    xray: false,
    ai: false
  },
  locked: false
}
```

---

## Integration with Smart Clinic

### 1. Bootstrap Endpoint Integration

Smart Clinic's `/system/bootstrap` should fetch clinic controls and return them:

```typescript
// In Smart Clinic
app.get('/system/bootstrap', async (req, res) => {
  const clinicId = req.user.clinicId;
  
  // Fetch controls from SourcePlus
  const controls = await fetch(
    `${SOURCEPLUS_URL}/api/clinics/${clinicId}/controls`
  ).then(r => r.json());
  
  // Enforce limits locally
  const storageUsed = await calculateStorageUsage();
  const usersCount = await getUsersCount();
  
  res.json({
    clinic: {...},
    controls: {
      storageLimitMB: controls.storageLimitMB,
      storageUsedMB: storageUsed,
      storageExceeded: storageUsed > controls.storageLimitMB,
      usersLimit: controls.usersLimit,
      usersCount: usersCount,
      usersLimitReached: usersCount >= controls.usersLimit,
      features: controls.features,
      locked: controls.locked
    }
  });
});
```

### 2. Feature Toggle Enforcement

```typescript
// Check if feature is enabled
if (controls.features.orthodontics) {
  // Show orthodontics module
} else {
  // Hide or disable orthodontics module
}
```

### 3. Locked Clinic Handling

```typescript
// On every request
if (controls.locked) {
  return res.status(403).json({
    error: 'CLINIC_LOCKED',
    message: 'This clinic has been temporarily suspended'
  });
}
```

---

## Examples

### Example 1: Check Clinic Controls (Smart Clinic)

```bash
curl http://sourceplus.com/api/clinics/abc-123/controls
```

Response:
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
  "locked": false
}
```

### Example 2: Update Storage Limit (Admin)

```bash
curl -X PUT http://sourceplus.com/api/clinics/abc-123/controls \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "storageLimitMB": 2048
  }'
```

### Example 3: Enable AI Feature (Admin)

```bash
curl -X PUT http://sourceplus.com/api/clinics/abc-123/controls \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "ai": true
    }
  }'
```

### Example 4: Lock Clinic (Admin)

```bash
curl -X PUT http://sourceplus.com/api/clinics/abc-123/controls \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "locked": true
  }'
```

---

## Error Responses

### 404 - Clinic Not Found
```json
{
  "message": "Clinic not found"
}
```

### 401 - Unauthorized (for PUT requests)
```json
{
  "message": "Unauthorized"
}
```

### 400 - Validation Error
```json
{
  "message": "Validation error: storageLimitMB must be a positive number"
}
```

---

## Database Schema

```prisma
model ClinicControl {
  id               String   @id @default(uuid())
  clinicId         String   @unique
  storageLimitMB   Int      @default(1024)
  usersLimit       Int      @default(3)
  features         Json     @default("{\"patients\":true,\"appointments\":true,\"orthodontics\":false,\"xray\":false,\"ai\":false}")
  locked           Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  clinic           Clinic   @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  
  @@map("clinic_controls")
}
```

---

## Architecture Benefits

1. **Centralized Control**: All clinic settings managed from one place (SourcePlus)
2. **No Plan Coupling**: Controls are independent of subscription plans
3. **Instant Updates**: Changes reflect immediately without restart
4. **Scalable**: Easy to add new features or limits
5. **Audit Trail**: All changes are logged for compliance
6. **Flexible**: Each clinic can have completely different settings

---

## Migration Path

For existing clinics without controls:
1. Controls are automatically created on first GET request
2. Default values ensure backward compatibility
3. No manual migration needed

---

## Future Enhancements

Possible future additions:
- API rate limiting per clinic
- Custom feature flags
- Scheduled limit changes
- Usage analytics and recommendations
- Automatic scaling based on usage
