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
