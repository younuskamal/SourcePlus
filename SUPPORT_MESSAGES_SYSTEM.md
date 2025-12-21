# 💬 Support Messages System - Complete Documentation

## ✅ تم التنفيذ

### **1. Backend** ✅

#### **Prisma Model**:
```prisma
model SupportMessage {
  id           String                @id @default(uuid())
  clinicId     String
  clinicName   String
  accountCode  String?
  message      String                @db.Text
  source       String                @default("SMART_CLINIC")
  status       SupportMessageStatus  @default(NEW)
  readAt       DateTime?
  closedAt     DateTime?
  createdAt    DateTime              @default(now())
  updatedAt    DateTime              @updatedAt

  @@index([clinicId])
  @@index([status])
  @@index([createdAt])
  @@map("support_messages")
}

enum SupportMessageStatus {
  NEW
  READ
  CLOSED
}
```

#### **API Routes** (`server/src/modules/support/messages.ts`):

##### **Public Route** (من Smart Clinic):
```typescript
POST /api/support/messages
Body: {
  clinicId: string,
  clinicName: string,
  accountCode?: string,
  message: string
}
Response: SupportMessage
```

##### **Admin Routes**:
```typescript
// Get all messages with filtering
GET /support/messages?status=NEW&clinicId=xxx&search=xxx
Response: {
  messages: SupportMessage[],
  unreadCount: number
}

// Get single message (auto-marks as read)
GET /support/messages/:id
Response: SupportMessage

// Update status
PATCH /support/messages/:id
Body: { status: 'NEW' | 'READ' | 'CLOSED' }
Response: SupportMessage

// Delete message
DELETE /support/messages/:id
Response: { success: true }
```

#### **Features**:
- ✅ Auto-mark as READ when opened
- ✅ Audit logging for all actions
- ✅ Filtering by status, clinic, search
- ✅ Unread count tracking

---

### **2. Frontend** ✅

#### **API Client** (`client/services/api.ts`):
```typescript
getSupportMessages(params?: {
  status?: string;
  clinicId?: string;
  search?: string;
})

getSupportMessage(id: string)

updateSupportMessageStatus(
  id: string,
  status: 'NEW' | 'READ' | 'CLOSED'
)

deleteSupportMessage(id: string)
```

#### **Translations** (`client/locales.ts`):
```typescript
// English
supportMessages: {
  title: "Support Messages",
  subtitle: "View and manage support requests from clinics",
  newMessages: "New Messages",
  statusNew: "New",
  statusRead: "Read",
  statusClosed: "Closed",
  // ... 40+ keys
}

// Arabic
supportMessages: {
  title: "رسائل الدعم",
  subtitle: "عرض وإدارة طلبات الدعم من العيادات",
  newMessages: "رسائل جديدة",
  statusNew: "جديدة",
  statusRead: "مقروءة",
  statusClosed: "مغلقة",
  // ... 40+ keys
}
```

#### **Navigation**:
```typescript
// English
supportMessages: "Support Messages"

// Arabic
supportMessages: "رسائل الدعم"
```

---

## 🚀 Next Steps

### **1. Migration**:
```bash
cd server
npx prisma migrate dev --name add_support_messages
npx prisma generate
```

### **2. Create Frontend Page**:
```tsx
// client/pages/SupportMessages.tsx
- List view with filters
- Detail modal
- Status management
- Delete confirmation
```

### **3. Add to Routes**:
```tsx
// client/App.tsx
<Route path="/support-messages" element={<SupportMessages />} />
```

### **4. Add to Navigation**:
```tsx
// client/components/Navigation.tsx
<NavLink to="/support-messages">
  {t('nav.supportMessages')}
</NavLink>
```

---

## 📊 Data Flow

```
Smart Clinic
     ↓
POST /api/support/messages (public)
     ↓
Database: SupportMessage (status: NEW)
     ↓
Admin Dashboard sees badge (unread count)
     ↓
Admin clicks → GET /support/messages/:id
     ↓
Auto-marked as READ
     ↓
Admin closes → PATCH status to CLOSED
```

---

## 🎨 UI Features (To Implement)

### **Main Page**:
- ✅ Header with title & subtitle
- ✅ Stats card (New/Read/Closed counts)
- ✅ Filter buttons (All/New/Read/Closed)
- ✅ Search bar
- ✅ Messages table/cards
- ✅ Badge for unread count

### **Message Card**:
- ✅ Clinic name (bold)
- ✅ Account code (if available)
- ✅ Message preview (truncated)
- ✅ Status badge (colored)
- ✅ Received date
- ✅ View button

### **Detail Modal**:
- ✅ Clinic info section
- ✅ Full message
- ✅ Timestamps (received, read, closed)
- ✅ Action buttons:
  - Mark as Read
  - Close Message
  - Delete
- ✅ Auto-close on action

### **Colors**:
```typescript
NEW:    emerald (green)
READ:   blue
CLOSED: slate (gray)
```

---

## 🔒 Security

### **Public Endpoint**:
- ✅ No authentication required
- ✅ Rate limiting (TODO)
- ✅ Validation (zod schema)

### **Admin Endpoints**:
- ✅ Requires authentication
- ✅ Requires admin role
- ✅ Audit logging

---

## 📝 Migration Command

```sql
-- Run this migration:
CREATE TABLE "support_messages" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "clinicName" TEXT NOT NULL,
  "accountCode" TEXT,
  "message" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'SMART_CLINIC',
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "readAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_messages_clinicId_idx" ON "support_messages"("clinicId");
CREATE INDEX "support_messages_status_idx" ON "support_messages"("status");
CREATE INDEX "support_messages_createdAt_idx" ON "support_messages"("createdAt");
```

---

## ✅ Implementation Status

- [x] Prisma Model
- [x] Backend API Routes
- [x] Route Registration
- [x] API Client Methods
- [x] Translations (EN + AR)
- [x] Navigation Keys
- [ ] Migration
- [ ] Frontend Page
- [ ] Routes Integration
- [ ] Navigation Integration
- [ ] Testing

---

**Status**: Backend Complete ✅ | Frontend Ready for Page Implementation
**Next**: Create SupportMessages.tsx page
