# 📚 Clinic System API - Complete Documentation

**Version**: 4.0 - Conversations Update  
**Last Updated**: 2025-12-21  
**Status**: Production Ready ✅

---

## 🎯 What's New in v4.0

### **💬 Conversation-Based Support System**
- ✅ Full chat/messaging interface
- ✅ Real-time replies from both sides
- ✅ Message threading
- ✅ Priority levels (LOW, NORMAL, HIGH, URGENT)
- ✅ Admin assignment
- ✅ Subject/Title for messages
- ✅ Auto-reopen on clinic reply

---

## 📑 Table of Contents

1. [Clinic Controls API](#clinic-controls-api)
2. [Clinic Usage API](#clinic-usage-api)
3. [Support Conversations API (NEW)](#support-conversations-api-new)
4. [Database Schema](#database-schema)
5. [Best Practices](#best-practices)

---

## 🎛️ Clinic Controls API

### **GET /api/clinics/:id/controls**

Get clinic settings and limits (public endpoint).

```bash
curl "https://api.sourceplus.com/api/clinics/abc-123/controls"
```

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
  "locked": false,
  "lockReason": null
}
```

---

### **PUT /api/clinics/:id/controls**

Update clinic controls (admin only).

```bash
curl -X PUT "https://api.sourceplus.com/api/clinics/abc-123/controls" \
  -H "Authorization: Bearer <token>" \
  -d '{"storageLimitMB": 4096}'
```

---

## 📊 Clinic Usage API

### **GET /api/clinics/:id/usage**

Get real-time usage statistics.

```bash
curl "https://api.sourceplus.com/api/clinics/abc-123/usage" \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "activeUsersCount": 3,
  "storageUsedMB": 245,
  "lastUpdated": "2025-12-21T12:00:00Z"
}
```

---

## 💬 Support Conversations API (NEW)

### **1. POST /api/support/messages** (Public)

Create a new support conversation.

**Request**:
```json
{
  "clinicId": "abc-123",
  "clinicName": "ABC Dental",
  "accountCode": "CLINIC-001",
  "subject": "Need help with X-Ray feature",
  "message": "We're having trouble activating the X-Ray module...",
  "priority": "HIGH"
}
```

**Response**:
```json
{
  "id": "msg-uuid",
  "clinicId": "abc-123",
  "clinicName": "ABC Dental",
  "accountCode": "CLINIC-001",
  "subject": "Need help with X-Ray feature",
  "message": "We're having trouble...",
  "source": "SMART_CLINIC",
  "status": "NEW",
  "priority": "HIGH",
  "assignedTo": null,
  "readAt": null,
  "closedAt": null,
  "createdAt": "2025-12-21T12:00:00Z",
  "updatedAt": "2025-12-21T12:00:00Z"
}
```

---

### **2. POST /api/support/messages/:id/replies** (Public)

Add a reply from clinic.

**Request**:
```json
{
  "content": "We also noticed the same issue yesterday..."
}
```

**Behavior**:
- ✅ Adds reply to conversation
- ✅ Re-opens message if it was closed
- ✅ Notifies assigned admin

---

### **3. GET /api/support/messages/:id/conversation** (Public)

Get full conversation (for clinic to view their messages).

**Response**:
```json
{
  "id": "msg-uuid",
  "subject": "Need help with X-Ray feature",
  "message": "Initial message...",
  "status": "READ",
  "priority": "HIGH",
  "createdAt": "2025-12-21T12:00:00Z",
  "replies": [
    {
      "id": "reply-1",
      "senderName": "ABC Dental",
      "content": "We also noticed...",
      "isFromAdmin": false,
      "createdAt": "2025-12-21T12:05:00Z"
    },
    {
      "id": "reply-2",
      "senderName": "Support Team",
      "content": "Thank you for reporting...",
      "isFromAdmin": true,
      "createdAt": "2025-12-21T12:10:00Z"
    }
  ]
}
```

---

### **4. GET /support/messages** (Admin)

Get all support conversations with filters.

**Query Parameters**:
- `status`: NEW | READ | CLOSED
- `priority`: LOW | NORMAL | HIGH | URGENT
- `clinicId`: Filter by clinic
- `search`: Search in subject/message
- `assignedTo`: Filter by assigned admin

**Request**:
```bash
curl "https://api.sourceplus.com/support/messages?status=NEW&priority=URGENT" \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "subject": "Urgent: System down",
      "clinicName": "XYZ Clinic",
      "status": "NEW",
      "priority": "URGENT",
      "assignedUser": {
        "id": "admin-1",
        "name": "John Doe",
        "email": "john@support.com"
      },
      "replies": [...],
      "_count": { "replies": 3 },
      "createdAt": "2025-12-21T12:00:00Z"
    }
  ],
  "unreadCount": 15
}
```

---

### **5. GET /support/messages/:id** (Admin)

Get single conversation with full details.

**Behavior**:
- ✅ Auto-marks as READ if status is NEW
- ✅ Logs admin view in audit
- ✅ Returns full conversation history

---

### **6. POST /support/messages/:id/replies** (Admin)

Send admin reply.

**Request**:
```json
{
  "content": "I can help you with that. Please try..."
}
```

**Behavior**:
- ✅ Adds reply as admin
- ✅ Marks message as READ
- ✅ Logs in audit trail

---

### **7. PATCH /support/messages/:id/status** (Admin)

Update conversation status.

**Request**:
```json
{
  "status": "CLOSED"
}
```

**Values**: NEW | READ | CLOSED

---

### **8. PATCH /support/messages/:id/assign** (Admin)

Assign conversation to admin.

**Request**:
```json
{
  "assignedTo": "admin-uuid"
}
```

---

### **9. PATCH /support/messages/:id/priority** (Admin)

Update priority level.

**Request**:
```json
{
  "priority": "URGENT"
}
```

**Values**: LOW | NORMAL | HIGH | URGENT

---

### **10. DELETE /support/messages/:id** (Admin)

Delete conversation and all replies (cascade).

```bash
curl -X DELETE "https://api.sourceplus.com/support/messages/msg-uuid" \
  -H "Authorization: Bearer <token>"
```

---

## 🗄️ Database Schema

### **SupportMessage Model**

```prisma
model SupportMessage {
  id           String               @id @default(uuid())
  clinicId     String
  clinicName   String
  accountCode  String?
  subject      String               // ✨ NEW
  message      String               @db.Text
  source       String               @default("SMART_CLINIC")
  status       SupportMessageStatus @default(NEW)
  priority     MessagePriority      @default(NORMAL) // ✨ NEW
  assignedTo   String?              // ✨ NEW
  assignedUser User?                @relation(...)
  readAt       DateTime?
  closedAt     DateTime?
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt
  
  replies      SupportReply[]       // ✨ NEW
  
  @@index([clinicId])
  @@index([status])
  @@index([priority])
  @@index([assignedTo])
  @@map("support_messages")
}
```

### **SupportReply Model** (NEW)

```prisma
model SupportReply {
  id          String         @id @default(uuid())
  messageId   String
  message     SupportMessage @relation(...)
  senderId    String?        // null for clinic
  senderName  String
  content     String         @db.Text
  isFromAdmin Boolean        @default(false)
  createdAt   DateTime       @default(now())
  
  @@index([messageId])
  @@map("support_replies")
}
```

### **Enums**

```prisma
enum SupportMessageStatus {
  NEW
  READ
  CLOSED
}

enum MessagePriority {  // ✨ NEW
  LOW
  NORMAL
  HIGH
  URGENT
}
```

---

## ✅ Best Practices

### **For Smart Clinic**

1. **Create descriptive subjects**:
```typescript
{
  subject: "X-Ray module activation issue",  // ✅ Good
  subject: "Help needed",                     // ❌ Bad
}
```

2. **Set appropriate priority**:
- `URGENT`: System down, data loss
- `HIGH`: Feature not working
- `NORMAL`: Questions, how-to
- `LOW`: Feature requests

3. **Monitor conversation**:
```typescript
// Poll for replies every 30 seconds
setInterval(async () => {
  const conversation = await api.getConversation(messageId);
  if (conversation.replies.length > lastKnownCount) {
    notifyUser("New reply from support!");
  }
}, 30000);
```

---

### **For SourcePlus Admin**

1. **Assign messages**:
- Assign URGENT messages immediately
- Distribute workload among team

2. **Reply promptly**:
- URGENT: < 1 hour
- HIGH: < 4 hours
- NORMAL: < 24 hours
- LOW: < 72 hours

3. **Close conversations**:
- Always ask "Is there anything else?" before closing
- Closed conversations can be reopened by clinic replies

---

## 📊 Workflow Example

### **Complete Support Flow**

```
1. Clinic sends message
   POST /api/support/messages
   {
     "subject": "Can't activate AI features",
     "message": "We upgraded but AI is still disabled",
     "priority": "HIGH"
   }
   
2. Admin sees NEW message (purple badge)
   GET /support/messages?status=NEW
   
3. Admin opens conversation
   GET /support/messages/:id
   → Auto-marks as READ
   
4. Admin assigns to specialist
   PATCH /support/messages/:id/assign
   { "assignedTo": "ai-specialist-uuid" }
   
5. Specialist replies
   POST /support/messages/:id/replies
   { "content": "I see the issue. Let me guide you..." }
   
6. Clinic replies back
   POST /api/support/messages/:id/replies
   { "content": "Thanks! That helped." }
   
7. Specialist closes
   PATCH /support/messages/:id/status
   { "status": "CLOSED" }
```

---

## 🎯 Quick Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/support/messages` | POST | ❌ No | Create conversation |
| `/api/support/messages/:id/replies` | POST | ❌ No | Clinic reply |
| `/api/support/messages/:id/conversation` | GET | ❌ No | View conversation |
| `/support/messages` | GET | ✅ Admin | List all |
| `/support/messages/:id` | GET | ✅ Admin | View details |
| `/support/messages/:id/replies` | POST | ✅ Admin | Admin reply |
| `/support/messages/:id/status` | PATCH | ✅ Admin | Update status |
| `/support/messages/:id/assign` | PATCH | ✅ Admin | Assign |
| `/support/messages/:id/priority` | PATCH | ✅ Admin | Update priority |
| `/support/messages/:id` | DELETE | ✅ Admin | Delete |

---

## 🔄 Migration Guide (v3 → v4)

### **Breaking Changes**:

1. **Added required field**: `subject`
2. **Changed endpoint**: `/support/messages/:id` → `/support/messages/:id/status` for status updates
3. **New endpoints**: See table above

### **Migration Steps**:

```bash
# 1. Run Prisma migration
cd server
npx prisma migrate dev --name support_conversations

# 2. Update API client
# - Add subject field to createMessage
# - Update updateStatus endpoint
# - Add new methods (addReply, assign, etc.)

# 3. Update UI
# - Add subject input field
# - Implement conversation view
# - Add priority selector
```

---

**API Version**: 4.0  
**Created**: 2025-12-21  
**Status**: ✅ **Production Ready**

---

**🎉 Happy Chatting!**
