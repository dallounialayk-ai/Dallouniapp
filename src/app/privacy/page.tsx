import Link from 'next/link';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

export const metadata = {
  title: `سياسة الخصوصية | ${APP_NAME}`,
  description: `سياسة الخصوصية لتطبيق ${APP_NAME}`,
};

export default function PrivacyPage() {
  return (
    <main className="h-dvh w-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 py-8 pb-16 space-y-6">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{APP_NAME}</p>
          <h1 className="text-2xl font-bold tracking-tight">سياسة الخصوصية</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {APP_TAGLINE}. توضّح هذه الصفحة كيف نجمع ونستخدم بياناتك عند استخدام
            التطبيق على الويب أو عبر Google Play.
          </p>
          <p className="text-[11px] text-muted-foreground">آخر تحديث: أغسطس 2026</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. البيانات التي نجمعها</h2>
          <ul className="list-disc pr-5 text-sm text-muted-foreground space-y-1.5 leading-relaxed">
            <li>بيانات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف، وواتساب إن أضفته.</li>
            <li>بيانات الملف الشخصي: المحافظة، نبذة تعريفية، صورة شخصية، وأعمال/منتجات سابقة.</li>
            <li>
              بيانات الموقع: إحداثيات تقريبية أو دقيقة عند موافقتك، لعرض الخدمات القريبة
              وتحسين طلبات الخدمة.
            </li>
            <li>محتوى الاستخدام: طلبات الخدمة، العروض، والرسائل داخل التطبيق.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. كيف نستخدم البيانات</h2>
          <ul className="list-disc pr-5 text-sm text-muted-foreground space-y-1.5 leading-relaxed">
            <li>تشغيل الحساب وتأمين تسجيل الدخول.</li>
            <li>ربط أصحاب الأراضي بمقدمي الخدمات المناسبين.</li>
            <li>عرض الخرائط والبحث في الجوار عند تفعيل الموقع.</li>
            <li>إرسال إشعارات متعلقة بالطلبات والعروض والرسائل.</li>
            <li>تحسين جودة الخدمة ومنع إساءة الاستخدام.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. الموقع والصلاحيات</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            نطلب إذن الموقع فقط عند الحاجة (مثل التسجيل أو البحث في الجوار أو إنشاء طلب خدمة).
            يمكنك رفض الإذن والاستمرار باستخدام التطبيق بالمحافظة فقط دون إحداثيات دقيقة.
            نطلب أيضاً إذن الصور/الكاميرا عند رفع صورة الملف الشخصي أو المعرض، ولا نصل إلى
            صورك دون اختيارك.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">4. التخزين والطرف الثالث</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            تُخزَّن البيانات عبر خدمات Supabase (مصادقة، قاعدة بيانات، وتخزين ملفات) وفق
            إعدادات المشروع الأمنية. قد تُعالَج بعض الطلبات عبر مزوّد الاستضافة (مثل Vercel)
            لتقديم التطبيق. لا نبيع بياناتك الشخصية لأطراف أخرى لأغراض تسويقية.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">5. الاحتفاظ والحذف</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            نحتفظ ببياناتك طالما حسابك نشط أو حسب ما يلزم لتقديم الخدمة والامتثال للمتطلبات
            القانونية. يمكنك طلب تصحيح بياناتك أو حذف الحساب عبر التواصل معنا.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">6. أمان البيانات</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            نستخدم اتصالاً مشفّراً (HTTPS) وصلاحيات وصول مناسبة. ومع ذلك لا يمكن ضمان أمان
            مطلق عبر الإنترنت، فنرجو اختيار كلمة مرور قوية وعدم مشاركة بيانات الدخول.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">7. الأطفال</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            التطبيق موجّه لخدمات البناء والمقاولات للبالغين، وليس موجّهاً للأطفال دون سن 13.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">8. التعديلات</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            قد نحدّث هذه السياسة من وقت لآخر. سنشر التعديل على هذه الصفحة مع تحديث تاريخ
            «آخر تحديث». استمرارك في استخدام التطبيق بعد التحديث يعني اطّلاعك على النسخة الجديدة.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">9. التواصل</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            للاستفسارات المتعلقة بالخصوصية أو طلب حذف الحساب، تواصل معنا عبر قنوات الدعم
            الرسمية المرتبطة بتطبيق {APP_NAME}.
          </p>
        </section>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            العودة للتطبيق
          </Link>
        </div>
      </div>
    </main>
  );
}
