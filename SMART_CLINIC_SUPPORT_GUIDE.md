# 📚 دليل تطوير نظام الدعم في Smart Clinic

**النسخة**: 1.0  
**التاريخ**: 2025-12-21  
**الحالة**: Production Ready ✅

---

## 🎯 نظرة عامة

هذا الدليل موجه لأي مطور أو AI Agent يريد بناء نظام دعم فني في تطبيق **Smart Clinic** للتواصل مع **SourcePlus Support System**.

### **ما يقدمه هذا النظام**:
- ✅ إرسال رسائل دعم من العيادة إلى SourcePlus
- ✅ نظام محادثات كامل (Conversation-based)
- ✅ ردود ثنائية الاتجاه (Clinic ↔ Admin)
- ✅ أولويات للرسائل (LOW, NORMAL, HIGH, URGENT)
- ✅ حالات متعددة (NEW, READ, CLOSED)
- ✅ واجهة مشابهة لتطبيقات المحادثات

---

## 🔗 SourcePlus Support API

### **Base URL**:
```
https://api.sourceplus.com/api
```

### **Authentication**:
- ❌ **غير مطلوب** للـ Public Endpoints (إرسال، إضافة ردود، عرض)
- ✅ **مطلوب** للـ Admin Endpoints فقط

---

## 📋 الـ Endpoints المتاحة

### **1. إنشاء رسالة دعم جديدة** ✅

```http
POST /support/messages
```

**Request Body**:
```json
{
  "clinicId": "clinic-uuid",
  "clinicName": "عيادة الأمل الطبية",
  "accountCode": "CLINIC-2025-001",
  "subject": "مشكلة في تفعيل ميزة الأشعة",
  "message": "نحاول تفعيل ميزة X-Ray لكن النظام يعطي خطأ...",
  "priority": "HIGH"
}
```

**Response**:
```json
{
  "id": "msg-uuid",
  "subject": "مشكلة في تفعيل ميزة الأشعة",
  "status": "NEW",
  "priority": "HIGH",
  "createdAt": "2025-12-21T10:00:00Z"
}
```

**ملاحظات**:
- ✅ `clinicId`: UUID العيادة الخاص بك
- ✅ `subject`: عنوان الرسالة (3-200 حرف)
- ✅ `message`: محتوى الرسالة (10-5000 حرف)
- ✅ `priority`: اختياري (افتراضي: NORMAL)

---

### **2. إضافة رد على محادثة** ✅

```http
POST /support/messages/:id/replies
```

**Request Body**:
```json
{
  "content": "شكراً للرد السريع. جربنا الحل المقترح..."
}
```

**Response**:
```json
{
  "id": "reply-uuid",
  "messageId": "msg-uuid",
  "senderName": "عيادة الأمل الطبية",
  "content": "شكراً للرد السريع...",
  "isFromAdmin": false,
  "createdAt": "2025-12-21T10:05:00Z"
}
```

**ملاحظات**:
- ✅ يمكن إضافة ردود غير محدودة
- ✅ إذا كانت المحادثة مغلقة (CLOSED)، سيتم فتحها تلقائياً
- ✅ سيتم إشعار فريق الدعم بالرد الجديد

---

### **3. عرض المحادثة الكاملة** ✅

```http
GET /support/messages/:id/conversation
```

**Response**:
```json
{
  "id": "msg-uuid",
  "subject": "مشكلة في تفعيل ميزة الأشعة",
  "message": "نحاول تفعيل...",
  "status": "READ",
  "priority": "HIGH",
  "createdAt": "2025-12-21T10:00:00Z",
  "replies": [
    {
      "id": "reply-1",
      "senderName": "فريق الدعم",
      "content": "شكراً للتواصل. دعني أساعدك...",
      "isFromAdmin": true,
      "createdAt": "2025-12-21T10:02:00Z"
    },
    {
      "id": "reply-2",
      "senderName": "عيادة الأمل الطبية",
      "content": "شكراً للرد السريع...",
      "isFromAdmin": false,
      "createdAt": "2025-12-21T10:05:00Z"
    }
  ]
}
```

**ملاحظات**:
- ✅ الردود مرتبة من الأقدم للأحدث
- ✅ `isFromAdmin: true` = رد من فريق الدعم
- ✅ `isFromAdmin: false` = رد من العيادة

---

## 💻 أمثلة كود للتطبيق

### **مثال 1: إرسال رسالة دعم**

```typescript
// services/supportApi.ts
export const sendSupportMessage = async (
  clinicId: string,
  clinicName: string,
  subject: string,
  message: string,
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
) => {
  const response = await fetch('https://api.sourceplus.com/api/support/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clinicId,
      clinicName,
      subject,
      message,
      priority
    })
  });

  if (!response.ok) {
    throw new Error('Failed to send support message');
  }

  return await response.json();
};

// استخدام
const result = await sendSupportMessage(
  'clinic-uuid',
  'عيادة الأمل',
  'مشكلة في الطباعة',
  'الطابعة لا تعمل بعد التحديث الأخير',
  'HIGH'
);

console.log('Message sent with ID:', result.id);
```

---

### **مثال 2: إضافة رد**

```typescript
export const addReply = async (messageId: string, content: string) => {
  const response = await fetch(
    `https://api.sourceplus.com/api/support/messages/${messageId}/replies`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to add reply');
  }

  return await response.json();
};

// استخدام
await addReply('msg-uuid', 'المشكلة تم حلها، شكراً!');
```

---

### **مثال 3: جلب المحادثة**

```typescript
export const getConversation = async (messageId: string) => {
  const response = await fetch(
    `https://api.sourceplus.com/api/support/messages/${messageId}/conversation`
  );

  if (!response.ok) {
    throw new Error('Failed to get conversation');
  }

  return await response.json();
};

// استخدام
const conversation = await getConversation('msg-uuid');
console.log('Total replies:', conversation.replies.length);
```

---

### **مثال 4: Polling للتحديثات**

```typescript
// Poll every 30 seconds for new replies
let lastKnownReplyCount = 0;

const checkForNewReplies = async (messageId: string) => {
  const conversation = await getConversation(messageId);
  
  if (conversation.replies.length > lastKnownReplyCount) {
    const newReplies = conversation.replies.slice(lastKnownReplyCount);
    
    newReplies.forEach(reply => {
      if (reply.isFromAdmin) {
        showNotification(`رد جديد من فريق الدعم: ${reply.content}`);
      }
    });
    
    lastKnownReplyCount = conversation.replies.length;
  }
};

// Start polling
setInterval(() => checkForNewReplies('msg-uuid'), 30000);
```

---

## 🎨 تصميم واجهة المحادثات

### **مكونات الواجهة المطلوبة**:

#### **1. قائمة الرسائل (Messages List)**

```tsx
// components/SupportMessagesList.tsx
interface Message {
  id: string;
  subject: string;
  status: 'NEW' | 'READ' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: string;
  lastReply?: string;
}

const SupportMessagesList = ({ messages }: { messages: Message[] }) => {
  return (
    <div className="messages-list">
      {messages.map(msg => (
        <div key={msg.id} className="message-item">
          <div className="message-header">
            <h3>{msg.subject}</h3>
            <span className={`priority ${msg.priority.toLowerCase()}`}>
              {msg.priority}
            </span>
          </div>
          <div className="message-footer">
            <span className={`status ${msg.status.toLowerCase()}`}>
              {msg.status}
            </span>
            <span className="date">
              {new Date(msg.createdAt).toLocaleDateString('ar')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

#### **2. عرض المحادثة (Conversation View)**

```tsx
// components/ConversationView.tsx
interface Reply {
  id: string;
  senderName: string;
  content: string;
  isFromAdmin: boolean;
  createdAt: string;
}

const ConversationView = ({ 
  subject, 
  message, 
  replies 
}: { 
  subject: string;
  message: string;
  replies: Reply[];
}) => {
  return (
    <div className="conversation">
      {/* Initial Message */}
      <div className="message initial">
        <h2>{subject}</h2>
        <p>{message}</p>
      </div>

      {/* Replies */}
      {replies.map(reply => (
        <div 
          key={reply.id} 
          className={`reply ${reply.isFromAdmin ? 'admin' : 'clinic'}`}
        >
          <div className="reply-header">
            <strong>{reply.senderName}</strong>
            {reply.isFromAdmin && <span className="badge">دعم</span>}
            <span className="time">
              {new Date(reply.createdAt).toLocaleTimeString('ar')}
            </span>
          </div>
          <p>{reply.content}</p>
        </div>
      ))}
    </div>
  );
};
```

---

#### **3. إضافة رد (Reply Input)**

```tsx
// components/ReplyInput.tsx
const ReplyInput = ({ messageId }: { messageId: string }) => {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!content.trim()) return;
    
    setSending(true);
    try {
      await addReply(messageId, content);
      setContent('');
      // Refresh conversation
    } catch (error) {
      alert('فشل إرسال الرد');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="reply-input">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="اكتب ردك هنا..."
        disabled={sending}
      />
      <button onClick={handleSend} disabled={sending || !content.trim()}>
        {sending ? 'جاري الإرسال...' : 'إرسال'}
      </button>
    </div>
  );
};
```

---

## 🎯 مستويات الأولوية

| Priority | الاستخدام | وقت الرد المتوقع |
|----------|-----------|------------------|
| **URGENT** | نظام معطل / مشكلة خطيرة | < 1 ساعة |
| **HIGH** | ميزة لا تعمل | < 4 ساعات |
| **NORMAL** | أسئلة عامة | < 24 ساعة |
| **LOW** | طلبات ميزات / اقتراحات | < 72 ساعة |

### **إرشادات اختيار الأولوية**:

```typescript
const getPriority = (issue: string): Priority => {
  // URGENT
  if (issue.includes('معطل') || issue.includes('لا يعمل نهائياً')) {
    return 'URGENT';
  }
  
  // HIGH
  if (issue.includes('خطأ') || issue.includes('مشكلة')) {
    return 'HIGH';
  }
  
  // NORMAL (default)
  return 'NORMAL';
};
```

---

## 📱 تجربة المستخدم (UX)

### **1. إشعارات الردود الجديدة**

```typescript
// utils/notifications.ts
export const checkForNewReplies = async () => {
  const openMessages = await getOpenMessages(); // من local storage
  
  for (const msgId of openMessages) {
    const conversation = await getConversation(msgId);
    const lastReply = conversation.replies[conversation.replies.length - 1];
    
    // Check if last reply is from admin and is new
    if (lastReply?.isFromAdmin && isNewReply(lastReply.id)) {
      showNotification({
        title: 'رد جديد من الدعم الفني',
        body: truncate(lastReply.content, 100),
        onClick: () => openConversation(msgId)
      });
      
      markAsRead(lastReply.id);
    }
  }
};

// Run every 30 seconds when app is active
setInterval(checkForNewReplies, 30000);
```

---

### **2. Badge للرسائل غير المقروءة**

```typescript
const getUnreadCount = async (): Promise<number> => {
  const openMessages = await getOpenMessages();
  let unreadCount = 0;
  
  for (const msgId of openMessages) {
    const conversation = await getConversation(msgId);
    const unreadReplies = conversation.replies.filter(
      reply => reply.isFromAdmin && !isRead(reply.id)
    );
    unreadCount += unreadReplies.length;
  }
  
  return unreadCount;
};

// Display badge
<SupportIcon badge={unreadCount} />
```

---

### **3. Offline Support**

```typescript
// Store messages locally when offline
export const queueMessage = async (message: NewMessage) => {
  const queue = await getOfflineQueue();
  queue.push({
    ...message,
    timestamp: Date.now(),
    status: 'pending'
  });
  await saveOfflineQueue(queue);
};

// Sync when online
export const syncOfflineMessages = async () => {
  if (!navigator.onLine) return;
  
  const queue = await getOfflineQueue();
  const pending = queue.filter(msg => msg.status === 'pending');
  
  for (const msg of pending) {
    try {
      const result = await sendSupportMessage(
        msg.clinicId,
        msg.clinicName,
        msg.subject,
        msg.message,
        msg.priority
      );
      
      // Mark as sent
      msg.status = 'sent';
      msg.id = result.id;
    } catch (error) {
      console.error('Failed to sync message:', error);
    }
  }
  
  await saveOfflineQueue(queue);
};

// Listen for online event
window.addEventListener('online', syncOfflineMessages);
```

---

## ✅ Best Practices

### **1. Error Handling**

```typescript
const sendMessage = async (data: MessageData) => {
  try {
    const result = await sendSupportMessage(
      data.clinicId,
      data.clinicName,
      data.subject,
      data.message,
      data.priority
    );
    
    showSuccess('تم إرسال الرسالة بنجاح');
    return result;
    
  } catch (error) {
    if (error.message.includes('network')) {
      // Queue for offline sync
      await queueMessage(data);
      showInfo('سيتم إرسال الرسالة عند توفر الاتصال');
    } else {
      showError('فشل إرسال الرسالة. حاول مرة أخرى.');
    }
    
    throw error;
  }
};
```

---

### **2. Validation**

```typescript
const validateMessage = (subject: string, message: string): boolean => {
  // Subject validation
  if (subject.length < 3 || subject.length > 200) {
    showError('العنوان يجب أن يكون بين 3 و 200 حرف');
    return false;
  }
  
  // Message validation
  if (message.length < 10 || message.length > 5000) {
    showError('الرسالة يجب أن تكون بين 10 و 5000 حرف');
    return false;
  }
  
  return true;
};
```

---

### **3. Caching**

```typescript
// Cache conversations locally
const conversationCache = new Map<string, Conversation>();

export const getCachedConversation = async (
  messageId: string,
  forceRefresh = false
): Promise<Conversation> => {
  // Return from cache if available and not force refresh
  if (!forceRefresh && conversationCache.has(messageId)) {
    return conversationCache.get(messageId)!;
  }
  
  // Fetch from API
  const conversation = await getConversation(messageId);
  
  // Update cache
  conversationCache.set(messageId, conversation);
  
  return conversation;
};

// Clear cache after 5 minutes
setInterval(() => conversationCache.clear(), 5 * 60 * 1000);
```

---

## 🔄 تدفق العمل الكامل

```
1. المستخدم يفتح شاشة الدعم الفني
   ↓
2. يعرض قائمة الرسائل السابقة (من local storage أو API)
   ↓
3. يضغط "رسالة جديدة"
   ↓
4. يملأ النموذج (العنوان، الرسالة، الأولوية)
   ↓
5. يضغط "إرسال"
   ↓
6. POST /support/messages
   ↓
7. يتم حفظ ID الرسالة محلياً
   ↓
8. يُفتح عرض المحادثة تلقائياً
   ↓
9. يبدأ Polling كل 30 ثانية للتحقق من ردود جديدة
   ↓
10. عند وصول رد من Admin:
    - إظهار إشعار
    - تحديث واجهة المحادثة
    ↓
11. المستخدم يرد
    ↓
12. POST /support/messages/:id/replies
    ↓
13. يتم تحديث المحادثة
```

---

## 📦 المتطلبات

### **Frontend**:
- ✅ React / React Native
- ✅ Fetch API أو Axios
- ✅ Local Storage للـ caching
- ✅ Push Notifications (اختياري)

### **الأذونات**:
- ✅ Internet Access
- ✅ Notifications (اختياري)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure API
# في config.ts
export const SUPPORT_API_URL = 'https://api.sourceplus.com/api';

# 3. Create services/support.ts with API methods

# 4. Create UI components
# - MessagesList.tsx
# - ConversationView.tsx
# - ReplyInput.tsx

# 5. Test
npm run dev
```

---

## 🧪 Testing

```typescript
// Test sending message
const testSendMessage = async () => {
  const result = await sendSupportMessage(
    'test-clinic-id',
    'Test Clinic',
    'Test Message',
    'This is a test message',
    'NORMAL'
  );
  
  console.log('✅ Message sent:', result.id);
  return result.id;
};

// Test adding reply
const testAddReply = async (messageId: string) => {
  const result = await addReply(messageId, 'Test reply');
  console.log('✅ Reply added:', result.id);
};

// Test getting conversation
const testGetConversation = async (messageId: string) => {
  const conversation = await getConversation(messageId);
  console.log('✅ Conversation loaded:', conversation.replies.length, 'replies');
};

// Run tests
(async () => {
  const msgId = await testSendMessage();
  await testAddReply(msgId);
  await testGetConversation(msgId);
})();
```

---

## 📞 الدعم

**للمساعدة أو الاستفسارات**:
- 📧 Email: support@sourceplus.com
- 🌐 Docs: https://docs.sourceplus.com
- 💬 Support: استخدم نفس النظام!

---

**النسخة**: 1.0  
**آخر تحديث**: 2025-12-21  
**الحالة**: ✅ **جاهز للاستخدام**

---

**🎉 بالتوفيق في بناء نظام الدعم!**
