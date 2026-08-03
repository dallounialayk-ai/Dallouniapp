# نشر دلّوني عليك على Google Play

التطبيق عبارة عن غلاف Android (Capacitor) يفتح موقع Next.js المنشور على Vercel.

- **Application ID:** `com.dallounialayk.app`
- **اسم التطبيق:** دلّوني عليك
- **سياسة الخصوصية:** `https://<YOUR_VERCEL_URL>/privacy`

## 1) نشر الويب على Vercel

1. ادفع الكود إلى GitHub واربط المشروع بـ Vercel.
2. عيّن متغيرات البيئة في Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` = رابط المشروع (مثال: `https://dallouniapp.vercel.app`)
3. بعد نجاح النشر، انسخ الرابط النهائي.

لاحقاً عند تخصيص نطاق، غيّر فقط `NEXT_PUBLIC_APP_URL` ثم أعد مزامنة Capacitor.

## 2) ربط الغلاف الأصلي برابط Vercel

محلياً (أو في CI قبل بناء AAB):

```bash
# في .env
NEXT_PUBLIC_APP_URL=https://YOUR_APP.vercel.app

npm run cap:sync
```

يفتح `capacitor.config.ts` هذا الرابط داخل WebView عند التشغيل على الجهاز.

## 3) أدوات البناء المطلوبة

- Android Studio (مع Android SDK)
- JDK 21 أو حسب إعداد Android Studio
- حساب [Google Play Console](https://play.google.com/console) (رسوم تسجيل لمرة واحدة)

## 4) إنشاء مفتاح التوقيع (مرة واحدة)

```bash
keytool -genkey -v -keystore dallouni-release.keystore -alias dallouni -keyalg RSA -keysize 2048 -validity 10000
```

احفظ الملف وكلمات المرور خارج Git. لا ترفع `*.keystore` أو `keystore.properties`.

مثال `android/key.properties` (محلي فقط):

```properties
storePassword=****
keyPassword=****
keyAlias=dallouni
storeFile=C:/secure/dallouni-release.keystore
```

## 5) بناء App Bundle (.aab)

```bash
npm run cap:sync
npm run cap:open:android
```

في Android Studio:

1. **Build → Generate Signed App Bundle / APK**
2. اختر **Android App Bundle**
3. اختر مفتاح التوقيع
4. ابنِ نسخة **release**

أو من الطرفية بعد إعداد التوقيع في Gradle:

```bash
cd android
./gradlew bundleRelease
```

الملف الناتج عادةً:

`android/app/build/outputs/bundle/release/app-release.aab`

ارفع رقم `versionCode` في `android/app/build.gradle` مع كل رفع جديد للمتجر.

## 6) Play Console — النقاط المهمة

### بيانات التطبيق
- العنوان: دلّوني عليك
- الوصف القصير والطويل بالعربية
- أيقونة عالية الدقة (512×512) من `public/logo.png` / أصول Android
- لقطات شاشة لهاتف (مطلوبة)
- Feature Graphic (1024×500)

### سياسة الخصوصية
ضع الرابط: `https://<YOUR_VERCEL_URL>/privacy`

### Data safety
صرّح على الأقل عن:
- **الموقع** (تقريبي و/أو دقيق) — لغرض وظائف التطبيق (بحث الجوار / طلبات الخدمة)
- **معلومات شخصية** (الاسم، البريد، الهاتف) — إدارة الحساب
- **صور** — رفع صورة الملف الشخصي والمعرض عند اختيار المستخدم

### المسار المقترح أولاً
Internal testing → Closed testing → Production

## 7) اختبار سريع قبل الرفع

1. ثبّت نسخة release أو debug على جهاز حقيقي.
2. تأكد أن التطبيق يفتح رابط Vercel (وليس صفحة `www` الاحتياطية فقط).
3. اختبر: تسجيل الدخول، إذن الموقع، رفع صورة، فتح `/privacy`.
4. تأكد أن زر الرجوع في Android يعود داخل التطبيق ثم يخرج عند الجذر.

## 8) النطاق المخصص لاحقاً

1. اربط النطاق في Vercel.
2. حدّث `NEXT_PUBLIC_APP_URL` إلى النطاق الجديد.
3. نفّذ `npm run cap:sync` وابنِ AAB جديداً إن لزم (أو اكتفِ بتحديث الويب إذا كان الغلاف يقرأ نفس المتغير عند إعادة البناء).
