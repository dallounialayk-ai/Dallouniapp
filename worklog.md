# دلّوني عليك - Worklog

---
Task ID: main
Agent: Super Z (main agent)
Task: بناء تطبيق "دلّوني عليك" - حلقة الوصل بين أصحاب الأراضي الراغبين ببناء منازلهم وبين مقدمي الخدمات (مهندسين، فنيين، حرفيين، محلات مواد بناء، مقاولين) في اليمن.

Work Log:
- تحميل مهارة fullstack-dev وتهيئة بيئة Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui
- تثبيت @supabase/supabase-js و @supabase/ssr للاتصال بقاعدة البيانات
- إنشاء ملف بيانات الاعتماد .env مع مفاتيح Supabase
- تصميم نظام ألوان Apple Design System (الوضع الفاتح) في globals.css مع:
  • لون أساسي Apple Blue (#0071E3)
  • خطوط Cairo + Tajawal للدعم العربي
  • ظلال ناعمة متعددة المستويات (elevate-1/2/3)
  • بطاقات زجاجية (glass-card)
  • انتقالات spring-like للأزرار
- إنشاء قائمة محافظات اليمن الـ 22 (YEMEN_GOVERNORATES)
- إنشاء 20 نوع خدمة (مواد بناء، هندسة، بناء، كهرباء، سباكة، طلاء، تلييس، بلاط، نجارة، حدادة، ألمنيوم، تكييف، مسابح، حدائق، تصميم داخلي، مساحة، أساسات، سقوف، نقل، استشارات)
- بناء مخطط SQL كامل (download/schema.sql) يشمل 8 جداول:
  profiles, service_requests, offers, reviews, reports, messages, catalog_items, notifications
  مع RLS policies لكل جدول + trigger لإنشاء profile تلقائيًا عند التسجيل + storage buckets
- بناء عميل Supabase مع الأنواع TypeScript الكاملة
- بناء Zustand store للمصادقة (useAuth) مع persist للمتصفح
- بناء AuthGate لتهيئة الجلسة تلقائيًا
- بناء شاشة المصادقة (AuthScreen) بثلاث مراحل: اختيار الدور → إنشاء حساب → تسجيل دخول
- بناء واجهة المستخدم العادي (UserApp) مع 3 تبويبات:
  • الرئيسية: تايم لاين أصحاب الخدمات مع بحث + فلترة + ترتيب بالتقييم
  • طلب خدمة: نموذج طلب + قائمة طلباتي السابقة
  • الملف الشخصي: تعديل البيانات + الرسائل + طلباتي مع العروض
- بناء واجهة صاحب الخدمة (ProviderApp) مع 2 تبويبات:
  • الرئيسية: قائمة الطلبات المفتوحة (مع إعطاء أولوية للطلبات في مجاله)
  • الملف الشخصي: تعديل البيانات + الكاتلوج + الرسائل
- بناء ProviderDetailSheet: تفاصيل كاملة + كاتلوج + تقييمات + شات + اتصال + مشاركة + بلاغ
- بناء RequestDetailSheet: تفاصيل الطلب + تقديم عرض + قبول/رفض العروض + شات + مشاركة + بلاغ
- بناء ChatSheet: محادثة فورية مع Supabase Realtime + تحديد كمقروء
- بناء NotificationsSheet: إشعارات فورية + تعليم كمقروء + مسح
- بناء SchemaChecker + SetupWizard: يكتشف غياب الجداول ويعرض خطوات إعداد واضحة مع نسخ SQL بنقرة واحدة
- تطبيق Apple Design System: بطاقات بزوايا 16px، ظلال خفيفة، انتقالات سلسة، أيقونات Lucide
- دعم RTL كامل عبر dir="rtl" و lang="ar"
- اختبار الـ lint (نجح بدون أخطاء)
- اختبار الـ build (نجح في dev server)
- اختبار Agent Browser: التطبيق يفتح بنجاح، شاشة الإعداد تظهر بشكل صحيح

Stage Summary:
- تم بناء التطبيق بشكل كامل بنظام Apple Design System (light mode)
- تم تطبيق schema.sql على Supabase بواسطة المستخدم — الجداول الثمانية جميعها تعمل
- تم التحقق من إنشاء profile تلقائيًا عند تسجيل مستخدم جديد (radfan@gmail.com)
- جميع سياسات RLS تعمل بشكل صحيح (قراءة عامة، كتابة ذاتية)
- التطبيق جاهز للاستخدام الكامل
- الملفات الناتجة:
  • /home/z/my-project/download/schema.sql — مخطط قاعدة البيانات
  • /home/z/my-project/download/setup-wizard.png — لقطة شاشة للمعالج (في حال الحاجة)
  • /home/z/my-project/download/setup-wizard-mobile.png — لقطة من الموبايل
- التطبيق متاح للمعاينة على: https://preview-<bot-id>.space-z.ai/

Notes for Next Iteration:
- عند توفر service_role key يمكن إضافة سكربت setup تلقائي
- يمكن إضافة تحقق من رقم الهاتف عبر OTP لاحقًا
- يمكن إضافة نظام محادثة صوتية/فيديو لاحقًا
- يمكن إضافة بوابة دفع للعروض المقبولة

---
Task ID: fix-rate-limit
Agent: Super Z (main agent)
Task: معالجة خطأ "email rate limit exceeded" عند تسجيل صاحب خدمة جديد

Work Log:
- تشخيص السبب: Supabase Auth يرسل بريد تأكيد تلقائيًا لكل مستخدم جديد، والخطة المجانية تحدّ هذه الرسائل بـ 3-4 في الساعة
- إنشاء ملف src/lib/auth-errors.ts يحتوي على:
  • translateAuthError: دالة تترجم جميع أخطاء Supabase Auth إلى رسائل عربية واضحة
  • AUTH_ERROR_CODES: قائمة بكل أكواد الأخطاء المعروفة
  • isRateLimitError: دالة للتمييز البرمجي
- تحديث src/store/auth.ts لاستخدام translateAuthError في signUp و signIn و catch blocks
- إضافة حالة خاصة: إذا تم إنشاء المستخدم لكن لم يرجع session → يحتاج تأكيد بريد
- تحديث src/components/auth/AuthScreen.tsx بإضافة:
  • ErrorBanner: بانر خطأ متحرك مع زر إغلاق، يغير لونه حسب نوع الخطأ (amber للتحذير، red للخطأ)
  • EmailConfirmationGuide: دليل خطوة بخطوة (5 خطوات) لإيقاف تأكيد البريد في Supabase
    مع رابط مباشر إلى Auth Providers + شرح بصري واضح
  • عرض الدليل تلقائيًا عند ظهور خطأ rate limit أو needs_email_confirmation
- اختبار Agent Browser:
  • فتح صفحة التسجيل → اختيار صاحب خدمة → ملء كل الحقول → إرسال
  • تم عرض الدليل فورًا مع رابط Auth Providers قابل للنقر
  • الدليل يظهر بشكل ممتاز على الموبايل (390x844) والديسكتوب
- اختبار الـ lint: نجح بدون أخطاء
- لا توجد أخطاء runtime في console

Stage Summary:
- التطبيق الآن يعرض رسائل خطأ عربية واضحة بدلاً من الرسائل التقنية الإنجليزية
- عند حدوث rate limit، يظهر دليل مرئي بخمس خطوات لإيقاف تأكيد البريد في Supabase
- المستخدم يحتاج فقط إلى:
  1. فتح Supabase Dashboard → Auth Providers
  2. الضغط على Email
  3. إطفاء مفتاح Confirm email
  4. الضغط على Save
  5. العودة للتطبيق وإعادة محاولة التسجيل
- لقطات الشاشة محفوظة في:
  • /home/z/my-project/download/rate-limit-error.png (ديسكتوب)
  • /home/z/my-project/download/rate-limit-error-mobile.png (موبايل)

---
Task ID: add-logout-buttons
Agent: Super Z (main agent)
Task: إضافة زر تسجيل الخروج في تبويب "حسابي" لكلا من المستخدم العادي ومقدم الخدمة

Work Log:
- تشخيص الوضع: زر تسجيل الخروج موجود بالفعل في أسفل كلا الملفين، لكنه يتطلب التمرير للوصول إليه
- إضافة زر تسجيل خروج علوي واضح في رأس تبويب "حسابي" لكلا الملفين
- تنفيذ نافذة تأكيد (Dialog) قبل تنفيذ الخروج لمنع الخروج بالخطأ
- ملف المستخدم (UserProfileTab.tsx):
  • إضافة imports: Dialog components + AlertTriangle icon
  • إضافة حالتين: signOutOpen + signingOut
  • إضافة دالة handleSignOut مع toast نجاح/فشل
  • تعديل رأس التبويب ليشمل زر "خروج" أحمر صغير بجوار العنوان
  • تعديل زر الخروج السفلي لفتح نافذة التأكيد بدلاً من التنفيذ المباشر
  • إضافة Dialog تأكيد بأيقونة تحذير + رسالة توضيحية + زرّي إلغاء/نعم خروج
- ملف مقدم الخدمة (ProviderProfileTab.tsx):
  • نفس التعديلات بالضبط (imports + state + handler + header button + dialog)
- اختبار Agent Browser:
  • تسجيل حسابين جديدين (مستخدم + مقدم خدمة) بنجاح عبر curl
  • التأكد أن المستخدم أوقف "Confirm email" في Supabase (التسجيل يعمل فورًا)
  • تسجيل دخول المستخدم → تبويب حسابي → ظهور زرّي الخروج (علوي + سفلي)
  • الضغط على زر الخروج العلوي → ظهور نافذة التأكيد بشكل صحيح
  • الضغط على "نعم، خروج" → الخروج + رسالة toast "تم تسجيل الخروج بنجاح"
  • تسجيل دخول مقدم خدمة → تبويب حسابي → ظهور زرّي الخروج
  • اختبار زر "إلغاء" → يلغي العملية ويبقى في الصفحة ✓
  • اختبار زر الإغلاق (X) → يلغي العملية ✓
  • اختبار زر الخروج السفلي → يفتح نفس نافذة التأكيد ✓
- لا توجد أخطاء في console أو errors
- اختبار الـ lint: نجح بدون أخطاء

Stage Summary:
- تم إضافة زرّي تسجيل الخروج في كلا تبويبّي "حسابي":
  1. زر علوي صغير في رأس الصفحة (مرئي فورًا بدون تمرير)
  2. زر سفلي كبير في نهاية المحتوى (موجود سابقًا)
- كلا الزرين يفتحان نافذة تأكيد أنيقة قبل الخروج
- نافذة التأكيد تحتوي: أيقونة تحذير + عنوان + رسالة + زرّي إلغاء/تأكيد
- زر التأكيد يعرض loading spinner أثناء عملية الخروج
- رسالة toast تظهر بعد الخروج الناجح
- لقطات الشاشة محفوظة في:
  • /home/z/my-project/download/user-profile-logout.png
  • /home/z/my-project/download/provider-profile-logout.png
  • /home/z/my-project/download/logout-confirmation.png
