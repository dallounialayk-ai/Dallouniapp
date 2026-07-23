# دلّوني عليك

تطبيق يربط أصحاب الأراضي بمن يحتاجونهم لبناء منازلهم في اليمن (مهندسون، فنيون، حرفيون، مواد بناء، مقاولون).

## التقنيات

- Next.js 16 + TypeScript + Tailwind CSS 4
- Supabase (Auth + Postgres + Realtime + Storage)
- Leaflet / OpenStreetMap للخرائط والموقع
- Zustand لإدارة الحالة

## التشغيل المحلي

```bash
npm install
cp .env.example .env
# عبّئ NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

## إعداد قاعدة البيانات

نفّذ بالترتيب في Supabase SQL Editor عند الحاجة:

1. `download/schema.sql` — للمشاريع الجديدة
2. `download/add-whatsapp-column.sql`
3. `download/add-price-column.sql`
4. `download/add-location-columns.sql` — موقع المستخدم/مقدم الخدمة
5. `download/add-request-location-columns.sql` — موقع طلب الخدمة
6. `download/enable-realtime-messages.sql` — إن لزم للدردشة الفورية

## أوامر مفيدة

```bash
npm run build   # بناء الإنتاج
npm run start   # تشغيل البناء
npm run lint    # فحص ESLint
```

## ملاحظات أمنية

- لا ترفع ملف `.env` إلى GitHub (موجود في `.gitignore`)
- استخدم `.env.example` كقالب فقط
