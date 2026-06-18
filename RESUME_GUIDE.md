# 🔄 دليل استئناف مشروع "دلّوني عليك" — RESUME GUIDE

> اقرأ هذا الملف أولًا عند العودة لإكمال المشروع.

---

## ⚡ البدء السريع (3 خطوات)

### 1. تأكد أن بيئة التطوير تعمل
```bash
# تحقق من سجل التطوير
tail -20 /home/z/my-project/dev.log

# يجب أن ترى شيئًا مثل:
# ✓ Ready in 521ms
# GET / 200 in 31ms
```

إذا لم يعمل، شغّله:
```bash
cd /home/z/my-project
bun run dev
```

### 2. افتح التطبيق في المتصفح
- عبر Preview Panel في الواجهة، أو
- عبر Agent Browser: `agent-browser open http://localhost:3000`

### 3. اختبر بحسابات تجريبية جاهزة
```
مستخدم عادي:    test_user_logout_demo@example.com   /  test123456
مقدم خدمة:     test_provider_logout2@example.com   /  test123456
```

---

## 📚 اقرأ هذه الملفات بالترتيب

1. **`PROJECT_STATE.md`** — الحالة الكاملة للمشروع (ما تم + ما يتبقى)
2. **`worklog.md`** — سجل كل التعديلات (اقرأ آخر قسمين: `fix-rate-limit` و `add-logout-buttons` و `add-scrollbars`)
3. **`download/schema.sql`** — مخطط قاعدة البيانات (إذا احتجت لإعادة التطبيق)

---

## 🎯 أولويات العمل القادم

### عند الاستئناف، اختر من هذه القائمة حسب الأولوية:

#### 🔥 أولوية عالية (موصى بها للنسخة التالية)
1. **حذف البيانات التجريبية** قبل أي اختبار إنتاجي
   - 10 مقدمين: `test_scroll_provider_*@example.com`
   - 10 طلبات: "طلب خدمة تجريبي N لبناء سور"
   - حسابات: `test_user_logout_demo@example.com`، `test_provider_logout*.example.com`
   - احتفظ بـ `radfan@gmail.com` (مستخدم حقيقي)

2. **إضافة skeleton loaders** بدلًا من "جاري التحميل"
   - في UserHomeTab (LoadingList موجود — وسّعه)
   - في ProviderHomeTab (LoadingList موجود — وسّعه)
   - في UserProfileTab (لا يوجد — أضفه)
   - في ProviderProfileTab (لا يوجد — أضفه)

3. **حالة الطلب** (مفتوح → قيد التنفيذ → مكتمل)
   - أضف column `current_status` لـ service_requests
   - أضف زر "بدء التنفيذ" بعد قبول عرض
   - أضف زر "إتمام" → يفتح التقييم المتبادل

4. **تأكيد حذف الأعمال في الكاتلوج**
   - استخدم AlertDialog بدلًا من window.confirm

#### 🌟 أولوية متوسطة
1. نظام تقييم متبادل بعد إتمام الخدمة
2. لوحة تحكم مشرف (صفحة /admin)
3. إحصائيات للمستخدم ومقدم الخدمة
4. تحسين معالجة أخطاء رفع الصور

#### 🎨 تحسينات UI/UX
1. إضافة معاينة صورة قبل الرفع
2. وضع داكن (Dark Mode) — البنية جاهزة
3. خريطة تفاعلية للمواقع
4. إشعارات Push عبر PWA

---

## 🛠️ أوامر مفيدة

### فحص الكود
```bash
cd /home/z/my-project
bun run lint           # فحص ESLint
tail -30 dev.log       # آخر سجلات التطوير
```

### اختبار في المتصفح
```bash
agent-browser open http://localhost:3000
agent-browser snapshot -i
agent-browser screenshot /tmp/test.png --full
agent-browser errors
agent-browser console
```

### إدارة قاعدة البيانات
```bash
# فحص جدول معين
curl -s "https://mfogdjxvtpvuvxzyyjqn.supabase.co/rest/v1/profiles?select=*&limit=5" \
  -H "apikey: ANON_KEY"

# تسجيل مستخدم جديد (للاختبار)
curl -s -X POST "https://mfogdjxvtpvuvxzyyjqn.supabase.co/auth/v1/signup" \
  -H "apikey: ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"test123456","data":{"full_name":"Name","phone":"770000000","governorate":"صنعاء","role":"user"}}'
```

### تثبيت حزم جديدة
```bash
cd /home/z/my-project
bun add <package-name>
```

---

## ⚠️ تحذيرات مهمة

1. **لا تستخدم `bun run build`** — استخدم فقط `bun run dev` (البيئة تتعامل مع البناء تلقائيًا)
2. **لا تستخدم port غير 3000**
3. **لا تكتب API routes في مسارات أخرى** — فقط `/` (الصفحة الرئيسية هي نقطة الدخول)
4. **استخدم مسارات نسبية فقط** في fetch و WebSocket (مع `XTransformPort` إذا لزم)
5. **`z-ai-web-dev-sdk` للـ backend فقط** — لا تستخدمه في client components
6. **لا تعدّل `.next/`** — مجلد بناء تلقائي
7. **عند التعديل على ملف، استخدم `Edit` بدلًا من `Write`** للحفاظ على المحتوى المتبقي

---

## 📐 معايير التصميم (يجب الالتزام بها)

### Apple Design System
- **اللون الأساسي:** Apple Blue `oklch(0.55 0.21 256)` → `#0071E3`
- **اللون الثانوي:** Emerald للأساسي في بطاقات مقدمي الخدمة
- **نصف القطر (radius):** 0.875rem افتراضيًا، 16-24px للبطاقات
- **الظلال:** استخدم classes الموجودة: `elevate-1`, `elevate-2`, `elevate-3`
- **الانتقالات:** `transition-all duration-300` للأزرار، `cubic-bezier(0.34, 1.56, 0.64, 1)` للنقر
- **الخطوط:** Cairo (body) + Tajawal (display) — متاحة كـ CSS variables

### قواعد التمرير
- استخدم `scrollbar-thin` للقوائم العامة
- استخدم `scrollbar-overlay` للأوراق المنبثقة والنوافذ
- استخدم `scrollbar-hide` للكاروسيلات
- **لا تستخدم Radix ScrollArea** — استبدل بـ `<div className="overflow-y-auto scrollbar-thin">`

### قواعد RTL
- `<html lang="ar" dir="rtl">` موجود في layout.tsx
- استخدم `ml-2` بدلًا من `ml-2` للأيقونات قبل النص
- في النماذج، استخدم `dir="ltr"` للحقول الإنجليزية (إيميل، هاتف، كلمة سر)

### قواعد المحتوى
- **لا فقرات أقل من 3 جمل** (قاعدة Content Depth)
- لا أقسام أقل من 150 كلمة
- اشرح "لماذا" و "كيف"، ليس فقط "ماذا"
- أضف أمثلة وتفاصيل داعمة

---

## 🧩 بنية المكونات (للمراجعة عند التعديل)

```
<AuthGate>                         // يهيئ الجلسة
  <SchemaChecker>                  // يفحص الجداول
    <Root>                         // يقرر أي تطبيق يعرض
      → <AuthScreen>               // إذا لم يكن مسجل دخول
      → <UserApp>                  // إذا كان مستخدم عادي
      → <ProviderApp>              // إذا كان مقدم خدمة
    </Root>
  </SchemaChecker>
</AuthGate>
```

### تدفق البيانات
- `useAuth()` → حالة المستخدم (profile, loading, signIn, signUp, signOut, updateProfile)
- `supabase` → عميل قاعدة البيانات (مباشر، لا حاجة لـ API routes)
- Realtime عبر `supabase.channel().on('postgres_changes', ...)`

---

## 💡 نصائح للعمل القادم

1. **اختبر كل تغيير فورًا** في المتصفح عبر Agent Browser
2. **احفظ لقطة شاشة** لكل ميزة جديدة في `/home/z/my-project/download/screenshots/`
3. **حدّث `worklog.md`** بعد كل مهمة كبيرة بقسم جديد
4. **حدّث `PROJECT_STATE.md`** عند تغيير الحالة (مكتمل/جديد/معدّل)
5. **استخدم TodoWrite** لتتبع المهام في كل جلسة

---

## 🎬 عند الانتهاء من المهمة القادمة

1. اختبر بـ Agent Browser (افتح، انقر، تحقق)
2. شغّل `bun run lint` — يجب أن ينجح بدون أخطاء
3. تحقق من `dev.log` — لا أخطاء runtime
4. أضف قسم جديد في `worklog.md` بصيغة:
   ```markdown
   ---
   Task ID: <اسم-المهمة>
   Agent: <اسمك>
   Task: <وصف المهمة>
   
   Work Log:
   - خطوة 1
   - خطوة 2
   
   Stage Summary:
   - ما تم
   - ما يحتاج اختبارًا إضافيًا
   ```
5. حدّث `PROJECT_STATE.md` بنقل المهمة من "لم يُنجز" إلى "مكتمل"

---

**جاهز للاستئناف؟ ابدأ بقراءة `PROJECT_STATE.md` ثم اختر مهمة من قائمة الأولويات.** 🚀
