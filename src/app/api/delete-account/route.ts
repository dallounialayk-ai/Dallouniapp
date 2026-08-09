import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const fullName = String(body.fullName ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const note = String(body.note ?? '').trim();

  if (!phone || phone.length < 8) {
    return NextResponse.json({ error: 'أدخل رقم الهاتف المرتبط بالحساب' }, { status: 400 });
  }

  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from('account_deletion_requests').insert({
      full_name: fullName || null,
      phone,
      note: note || null,
      status: 'pending',
    });

    if (error) {
      if (/account_deletion_requests|schema cache|does not exist/i.test(error.message)) {
        return NextResponse.json(
          {
            error:
              'جدول طلبات الحذف غير جاهز بعد. نفّذ download/add-account-deletion-requests.sql في Supabase ثم أعد المحاولة.',
          },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      ok: true,
      message: 'تم استلام طلب حذف الحساب. سنعالجه خلال 7 أيام كحد أقصى.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'تعذّر إرسال الطلب';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
