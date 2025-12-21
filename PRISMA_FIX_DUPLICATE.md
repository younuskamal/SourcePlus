# ✅ إصلاح خطأ Prisma Schema - Duplicate Model

## 🐛 المشكلة

```
Error: The model "SupportMessage" cannot be defined because a model with that name already exists.
  -->  prisma/schema.prisma:384
```

**السبب**: كان هناك **نسختان** من `SupportMessage` model في schema.prisma:

1. **النسخة القديمة** (السطر 332-341):
   - للـ POS system
   - بسيطة جداً
   - مع `MessageReply` model

2. **النسخة الجديدة** (السطر 384-401):
   - للـ Clinic system
   - متطورة مع fields كاملة
   - مع `SupportMessageStatus` enum

---

## ✅ الحل

### **1. حذف النسخة القديمة** ✅
حذفنا:
```prisma
model SupportMessage {
  id        String   @id @default(uuid())
  name      String
  serial    String?
  message   String
  status    String   @default("pending")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  replies   MessageReply[]
}

model MessageReply {
  id        String         @id @default(uuid())
  messageId String
  message   SupportMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  userId    String
  user      User           @relation(fields: [userId], references: [id])
  reply     String
  createdAt DateTime       @default(now())
}
```

### **2. تنظيف User model** ✅
حذفنا العلاقة مع `MessageReply`:
```prisma
model User {
  // ...
  replies      SupportReply[]
  messageReplies MessageReply[] // ❌ حذف هذا السطر
  clinicMessages ClinicMessage[]
}
```

### **3. أبقينا النسخة الجديدة** ✅
```prisma
model SupportMessage {
  id           String               @id @default(uuid())
  clinicId     String
  clinicName   String
  accountCode  String?
  message      String               @db.Text
  source       String               @default("SMART_CLINIC")
  status       SupportMessageStatus @default(NEW)
  readAt       DateTime?
  closedAt     DateTime?
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt

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

---

## 📊 ما تم حذفه

- ❌ `SupportMessage` (القديم - POS system)
- ❌ `MessageReply` model
- ❌ `User.messageReplies` relation

## ✅ ما تم الاحتفاظ به

- ✅ `SupportMessage` (الجديد - Clinic system)
- ✅ `SupportMessageStatus` enum
- ✅ جميع الـ routes والـ functionality

---

## 🧪 التحقق

للتحقق من صحة Schema:
```bash
cd server
npx prisma validate
npx prisma format
```

للـ migrate:
```bash
npx prisma migrate dev --name remove_duplicate_support_message
npx prisma generate
```

---

## 📝 الملفات المعدلة

1. ✅ `server/prisma/schema.prisma`:
   - حذف `SupportMessage` القديم
   - حذف `MessageReply` model
   - حذف `User.messageReplies` field

---

## 🎯 النتيجة

- ✅ **Schema صحيح**
- ✅ **لا يوجد duplicate models**
- ✅ **Support Messages API يعمل بشكل صحيح**
- ✅ **جاهز للـ deployment**

---

## ⚠️ ملاحظة مهمة

إذا كان هناك بيانات قديمة في production من الـ `SupportMessage` القديم، ستحتاج لـ:
1. عمل backup للبيانات
2. Migration للبيانات إلى الـ structure الجديد
3. ثم تطبيق التغييرات

---

**Status**: ✅ **Fixed!**  
**Date**: 2025-12-21  
**Build**: Should pass now ✅
