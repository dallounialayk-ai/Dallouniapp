# 📋 حالة مشروع "دلّوني عليك" — PROJECT STATE
> تاريخ آخر تحديث: 2026-06-18
> حالة المشروع: **قيد التطوير — 85% مكتمل** (النسخة الأولية كاملة وقابلة للاستخدام)

---

## 🎯 ملخص المشروع

تطبيق "دلّوني عليك" هو حلقة الوصل بين أصحاب الأراضي الراغبين ببناء منازلهم وبين جميع مقدمي الخدمات (مهندسين، فنيين، حرفيين، محلات مواد بناء، مقاولين) في اليمن.

**التقنيات الأساسية:**
- Next.js 16 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui
- Supabase (Auth + Postgres + Realtime + Storage)
- Zustand لإدارة الحالة، Framer Motion للحركات
- خطوط Cairo + Tajawal للدعم العربي الكامل (RTL)

**نظام التصميم:** Apple Design System (الوضع الفاتح) — لون Apple Blue، بطاقات زجاجية، ظلال ناعمة، انتقالات spring-like.

---

## ✅ ما تم إنجازه (مكتمل)

### 1. البنية التحتية ✅
- [x] تهيئة بيئة Next.js 16 كاملة
- [x] تثبيت @supabase/supabase-js و @supabase/ssr
- [x] ملف `.env` مع مفاتيح Supabase (URL + anon key)
- [x] عميل Supabase مع أنواع TypeScript الكاملة في `src/lib/supabase.ts`
- [x] قائمة محافظات اليمن الـ 22 + 20 نوع خدمة في `src/lib/constants.ts`
- [x] نظام ترجمة أخطاء Supabase Auth في `src/lib/auth-errors.ts`

### 2. قاعدة البيانات ✅
- [x] مخطط SQL كامل في `/home/z/my-project/download/schema.sql`
- [x] 8 جداول: profiles, service_requests, offers, reviews, reports, messages, catalog_items, notifications
- [x] سياسات RLS لكل جدول (قراءة عامة، كتابة ذاتية)
- [x] Trigger لإنشاء profile تلقائيًا عند التسجيل
- [x] Storage Buckets: avatars, catalog
- [x] **تم تطبيق schema.sql على Supabase بنجاح** (المستخدم قام بذلك)
- [x] **تم إيقاف "Confirm email" في Supabase** (التسجيل يعمل فورًا)

### 3. نظام المصادقة ✅
- [x] Zustand store للمصادقة (`src/store/auth.ts`) مع persist للمتصفح
- [x] AuthGate لتهيئة الجلسة تلقائيًا
- [x] AuthScreen بثلاث مراحل: اختيار الدور → إنشاء حساب → تسجيل دخول
- [x] شاشة اختيار الدور (مستخدم / صاحب خدمة) بتصميم Apple
- [x] نموذج التسجيل يدعم: الاسم الثلاثي، الهاتف، الإيميل، المحافظة، نوع الخدمة (لمقدم الخدمة)، البايو، كلمة السر
- [x] معالجة أخطاء عربية واضحة (rate limit، تأكيد البريد، كلمة سر ضعيفة، إلخ)
- [x] EmailConfirmationGuide — دليل خطوة بخطوة لإيقاف تأكيد البريد
- [x] ErrorBanner — بانر خطأ متحرك مع زر إغلاق

### 4. واجهة المستخدم العادي (UserApp) ✅
- [x] تبويب الرئيسية: تايم لاين مقدمي الخدمات + بحث + فلترة (مجال/محافظة) + ترتيب بالتقييم
- [x] تبويب طلب خدمة: نموذج طلب جديد + قائمة طلباتي السابقة + إشعار تلقائي لمقدمي الخدمة في نفس المجال
- [x] تبويب الملف الشخصي: تعديل البيانات + رفع الصورة + الرسائل + طلباتي مع العروض
- [x] زر تسجيل خروج علوي (مرئي فورًا) + زر تسجيل خروج سفلي + نافذة تأكيد

### 5. واجهة مقدم الخدمة (ProviderApp) ✅
- [x] تبويب الرئيسية: قائمة الطلبات المفتوحة مع إعطاء أولوية للطلبات في مجاله + بحث وفلترة + Realtime
- [x] تبويب الملف الشخصي: تعديل البيانات + إدارة الكاتلوج (رفع صور الأعمال) + الرسائل
- [x] زر تسجيل خروج علوي + زر تسجيل خروج سفلي + نافذة تأكيد

### 6. المكونات المشتركة ✅
- [x] ProviderCard — بطاقة مقدم خدمة
- [x] RequestCard — بطاقة طلب خدمة
- [x] ProviderDetailSheet — تفاصيل مقدم الخدمة + كاتلوج + تقييمات + شات + اتصال + مشاركة + بلاغ
- [x] RequestDetailSheet — تفاصيل الطلب + تقديم عرض + قبول/رفض العروض + شات + مشاركة + بلاغ
- [x] ChatSheet — محادثة فورية Realtime + تحديد كمقروء
- [x] NotificationsSheet — إشعارات فورية Realtime + تعليم كمقروء + مسح
- [x] SchemaChecker + SetupWizard — يكتشف غياب الجداول ويعرض خطوات إعداد واضحة

### 7. الميزات المتقدمة ✅
- [x] نظام دردشة فوري Realtime
- [x] نظام إشعارات فوري Realtime
- [x] نظام تقييمات (1-5 نجوم) مع تعليقات
- [x] نظام بلاغات
- [x] نظام مشاركة (Web Share API)
- [x] رفع الصور (avatars + catalog) عبر Supabase Storage
- [x] إشعارات تلقائية عند: رسالة جديدة، عرض سعر جديد، طلب جديد في المجال، قبول عرض

### 8. نظام التمرير (آخر تحديث) ✅
- [x] نظام أشرطة تمرير موحد من 4 متغيرات في globals.css:
  - `scrollbar-thin` — رفيع 6px للقوائم والتبويبات
  - `scrollbar-overlay` — شفاف 6px للأوراق المنبثقة
  - `scrollbar-hide` — مخفي للكاروسيلات
  - `fade-y-mask` — تأثير تلاشي
- [x] استبدال جميع Radix ScrollArea بـ div + CSS classes (أداء أفضل + دعم touch native)
- [x] تطبيق التمرير على كل التبويبات والأوراق المنبثقة والقوائم المنسدلة

### 9. تصميم Apple Design System ✅
- [x] لون أساسي Apple Blue (#0071E3 / oklch(0.55 0.21 256))
- [x] خطوط Cairo (body) + Tajawal (display)
- [x] بطاقات زجاجية (glass-card) بزوايا 16px
- [x] ظلال ناعمة متعددة المستويات (elevate-1/2/3)
- [x] انتقالات spring-like للأزرار (cubic-bezier)
- [x] دعم RTL كامل (dir="rtl" + lang="ar")
- [x] دعم safe area للهواتف (env(safe-area-inset-bottom))
- [x] أيقونات Lucide React

---

## 📊 البيانات المختبرة في قاعدة البيانات

تم إنشاء بيانات اختبار فعلية في Supabase (يمكن حذفها لاحقًا):
- مستخدم عادي: `test_user_logout_demo@example.com` (كلمة السر: test123456)
- مقدم خدمة 1: `test_provider_logout2@example.com` (كهرباء)
- مقدم خدمة 2: `test_provider_logout@example.com`
- مقدم خدمة حقيقي: `radfan@gmail.com` (تعز)
- 10 مقدمي خدمات تجريبيين: `test_scroll_provider_1@..` حتى `test_scroll_provider_10@example.com`
- 10 طلبات خدمة تجريبية بعنوان "طلب خدمة تجريبي N لبناء سور"

**ملاحظة:** جميع كلمات السر للاختبار: `test123456`

---

## 📁 هيكل الملفات الرئيسي

```
/home/z/my-project/
├── .env                                    # مفاتيح Supabase
├── worklog.md                              # سجل العمل الكامل
├── PROJECT_STATE.md                        # هذا الملف
├── RESUME_GUIDE.md                         # دليل استئناف العمل
├── prisma/schema.prisma                    # مخطط Prisma (غير مستخدم — نستخدم Supabase)
│
├── download/
│   ├── README.md
│   ├── schema.sql                          # مخطط قاعدة البيانات الكامل
│   └── screenshots/                        # كل لقطات الشاشة
│       ├── setup-wizard.png
│       ├── setup-wizard-mobile.png
│       ├── rate-limit-error.png
│       ├── rate-limit-error-mobile.png
│       ├── user-profile-logout.png
│       ├── provider-profile-logout.png
│       ├── logout-confirmation.png
│       ├── scroll-test-user-home.png
│       ├── scroll-test-provider-home.png
│       ├── scroll-test-provider-detail-sheet.png
│       ├── scroll-test-provider-sheet.png
│       ├── scroll-test-user-profile.png
│       ├── scroll-desktop-provider-home.png
│       └── scroll-provider-home-with-scrollbar.png
│
└── src/
    ├── app/
    │   ├── layout.tsx                      # RTL + خطوط Cairo/Tajawal
    │   ├── page.tsx                        # نقطة الدخول (AuthGate + SchemaChecker + Root)
    │   └── globals.css                     # نظام Apple + أشرطة التمرير
    │
    ├── lib/
    │   ├── supabase.ts                     # عميل Supabase + الأنواع
    │   ├── constants.ts                    # المحافظات + الخدمات + اسم التطبيق
    │   ├── auth-errors.ts                  # ترجمة أخطاء Supabase للعربية
    │   ├── utils.ts                        # cn + getInitials + formatRelativeTime + formatCurrency
    │   └── db.ts                           # Prisma (غير مستخدم)
    │
    ├── store/
    │   └── auth.ts                         # Zustand auth store + persist
    │
    └── components/
        ├── AuthGate.tsx                    # تهيئة جلسة Supabase
        ├── SchemaChecker.tsx               # فحص الجداول + SetupWizard
        │
        ├── auth/
        │   └── AuthScreen.tsx              # شاشة المصادقة الكاملة
        │
        ├── user/
        │   ├── UserApp.tsx                 # تطبيق المستخدم (3 تبويبات)
        │   ├── UserHomeTab.tsx             # تبويب الرئيسية
        │   ├── UserRequestTab.tsx          # تبويب طلب خدمة
        │   └── UserProfileTab.tsx          # تبويب الملف الشخصي
        │
        ├── provider/
        │   ├── ProviderApp.tsx             # تطبيق مقدم الخدمة (2 تبويب)
        │   ├── ProviderHomeTab.tsx         # تبويب الطلبات
        │   └── ProviderProfileTab.tsx      # تبويب الملف الشخصي + الكاتلوج
        │
        └── shared/
            ├── ProviderCard.tsx            # بطاقة مقدم خدمة
            ├── RequestCard.tsx             # بطاقة طلب
            ├── ProviderDetailSheet.tsx     # ورقة تفاصيل مقدم الخدمة
            ├── RequestDetailSheet.tsx      # ورقة تفاصيل الطلب
            ├── ChatSheet.tsx               # دردشة Realtime
            ├── NotificationsSheet.tsx      # إشعارات Realtime
            └── (scroll-area.tsx غير مستخدم الآن)
```

---

## ⚙️ الإعدادات الحالية لـ Supabase

- **Project URL:** `https://mfogdjxvtpvuvxzyyjqn.supabase.co`
- **Project ref:** `mfogdjxvtpvuvxzyyjqn`
- **Auth Providers:** Email مُفعّل، **Confirm email معطّل** (يسمح بتسجيل فوري)
- **Storage Buckets:** `avatars` (عام) + `catalog` (عام)
- **Realtime:** مُفعّل لجداول messages و notifications و service_requests و offers
- **RLS:** مُفعّل على كل الجداول مع سياسات قراءة عامة + كتابة ذاتية

---

## 🚧 ما لم يُنجز بعد (للنسخة القادمة)

### أولوية عالية:
- [ ] **حذف البيانات التجريبية** من Supabase قبل الإطلاق (10 مقدمين + 10 طلبات + حسابات test_*)
- [ ] **تحسين معالجة الأخطاء** في رفع الصور (ملفات كبيرة، صيغ غير مدعومة)
- [ ] **إضافة تأكيد الحذف** للأعمال في الكاتلوج
- [ ] **تحسين أداء البحث** بإضافة فهرس نصي على full_name و bio في profiles
- [ ] **إضافة skeleton loaders** بدلًا من نص "جاري التحميل" في كل القوائم

### أولوية متوسطة:
- [ ] **تفعيل OTP عبر SMS** للهاتف (يتطلب مزود SMS)
- [ ] **نظام تقييم متبادل** بعد إتمام الخدمة (صاحب الطلب يقيم مقدم الخدمة والعكس)
- [ ] **حالة الطلب**: مفتوح → قيد التنفيذ → مكتمل (مع تنبيهات)
- [ ] **نظام محفظة/مدفوعات** للعروض المقبولة
- [ ] **لوحة تحكم مشرف** لمراجعة البلاغات وإدارة المستخدمين
- [ ] **إحصائيات للمستخدم**: عدد الطلبات، العروض المستلمة، إلخ
- [ ] **إحصائيات لمقدم الخدمة**: عدد العروض المقدمة، نسبة القبول، إلخ

### أولوية منخفضة:
- [ ] **خريطة تفاعلية** لمواقع مقدمي الخدمات
- [ ] **وضع داكن** (Dark Mode) — البنية جاهزة عبر next-themes لكن غير مفعّل
- [ ] **تطبيق Mobile App** عبر React Native أو Capacitor
- [ ] **إشعارات Push** عبر PWA أو FCM
- [ ] **دعم متعدد اللغات** (عربي/إنجليزي)
- [ ] **نظام إخفاء/إظهار** الطلبات المنتهية
- [ ] **بحث جغرافي** بالقرب من المستخدم

### إصلاحات معروفة:
- [ ] الـ CatalogThumb في ProviderDetailSheet يستخدم Dialog منفصل — يمكن دمجه
- [ ] بعض الأيقونات المستوردة غير مستخدمة في بعض الملفات (تنظيف imports)
- [ ] إضافة معاينة صورة قبل الرفع في الكاتلوج و avatar

---

## 🔑 المعلومات المهمة للاستئناف

1. **التطبيق يعمل حاليًا على:** `http://localhost:3000` (port 3000 فقط)
2. **معاينة المستخدم:** عبر Preview Panel أو `https://preview-<bot-id>.space-z.ai/`
3. **قاعدة البيانات تعمل** وجاهزة — لا حاجة لإعادة تطبيق schema.sql
4. **تسجيل الدخول التجريبي:** استخدم `test_user_logout_demo@example.com` / `test123456`
5. **تسجيل دخول مقدم خدمة:** استخدم `test_provider_logout2@example.com` / `test123456`
6. **لا تنسَ:** المستخدم أوقف "Confirm email" في Supabase Auth → التسجيل يعمل فورًا

---

## 📞 بيانات Supabase (للرجوع إليها)

```
Project URL: https://mfogdjxvtpvuvxzyyjqn.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mb2dkanh2dHB2dXZ4enl5anFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjAyMzQsImV4cCI6MjA5NzI5NjIzNH0.VRx_e8XtFYAB_HgYfkc5cEaJpL09IEWUT6OA_icv0Bc
Dashboard: https://supabase.com/dashboard/project/mfogdjxvtpvuvxzyyjqn
SQL Editor: https://supabase.com/dashboard/project/mfogdjxvtpvuvxzyyjqn/sql/new
Auth Settings: https://supabase.com/dashboard/project/mfogdjxvtpvuvxzyyjqn/auth/providers
Storage: https://supabase.com/dashboard/project/mfogdjxvtpvuvxzyyjqn/storage/buckets
```

---

## ✨ خلاصة

التطبيق في حالة **النسخة الأولية الكاملة القابلة للاستخدام**. جميع الميزات الأساسية تعمل:
- ✅ مصادقة كاملة (تسجيل/دخول/خروج)
- ✅ ملفات شخصية للمستخدم ومقدم الخدمة
- ✅ قوائم مقدمي الخدمات والطلبات
- ✅ دردشة Realtime
- ✅ إشعارات Realtime
- ✅ عروض أسعار + قبول/رفض
- ✅ تقييمات + بلاغات
- ✅ كاتلوج أعمال سابقة
- ✅ رفع صور (avatars + catalog)
- ✅ تصميم Apple أنيق + أشرطة تمرير

**جاهز للاستئناف في أي وقت.** عند العودة، اقرأ `RESUME_GUIDE.md` للبدء بسرعة.
