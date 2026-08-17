import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, adminUnauthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type Ctx = { params: Promise<{ id: string }> };

async function insertNotif(
  db: ReturnType<typeof getSupabaseAdmin>,
  row: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
) {
  await db.from('notifications').insert({
    user_id: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data ?? { source: 'admin' },
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await requireAdminApi())) return adminUnauthorized();
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (typeof body.is_approved === 'boolean') patch.is_approved = body.is_approved;
  if (typeof body.is_blocked === 'boolean') patch.is_blocked = body.is_blocked;
  if (typeof body.admin_verified === 'boolean') patch.admin_verified = body.admin_verified;
  if (body.rating_override === null) {
    patch.rating_override = null;
    patch.rating_override_note = null;
  } else if (body.rating_override !== undefined) {
    const n = Number(body.rating_override);
    if (!Number.isFinite(n) || n < 1 || n > 5) {
      return NextResponse.json({ error: 'التقييم يجب أن يكون بين 1 و 5' }, { status: 400 });
    }
    patch.rating_override = Math.round(n * 10) / 10;
    if (typeof body.rating_override_note === 'string') {
      patch.rating_override_note = body.rating_override_note;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'لا توجد تعديلات' }, { status: 400 });
  }

  try {
    const db = getSupabaseAdmin();
    const { data: before } = await db.from('profiles').select('*').eq('id', id).maybeSingle();
    const { data, error } = await db
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      const msg = error.message || '';
      if (/admin_verified/i.test(msg) || (/column/i.test(msg) && 'admin_verified' in patch)) {
        return NextResponse.json(
          {
            error:
              'عمود التوثيق غير موجود في قاعدة البيانات. نفّذ ملف download/add-provider-verification.sql في Supabase SQL Editor ثم أعد المحاولة.',
          },
          { status: 500 }
        );
      }
      throw error;
    }

    if (patch.is_approved === true && data?.role === 'provider') {
      await insertNotif(db, {
        user_id: id,
        type: 'admin_approval',
        title: 'تمت الموافقة على حسابك',
        body: 'يمكنك الآن استخدام حساب مقدم الخدمة بالكامل.',
        data: { source: 'admin', action: 'profile' },
      });
    }
    if (patch.is_approved === false && data?.role === 'provider' && before?.is_approved !== false) {
      await insertNotif(db, {
        user_id: id,
        type: 'admin_unapproved',
        title: 'تم إيقاف تفعيل حسابك',
        body: 'أوقفت الإدارة تفعيل حساب مقدم الخدمة. تواصل مع الدعم إن لزم.',
        data: { source: 'admin', action: 'profile' },
      });
    }

    if (patch.admin_verified === true && data?.role === 'provider') {
      await insertNotif(db, {
        user_id: id,
        type: 'admin_verified',
        title: 'تم توثيق حسابك',
        body: 'ظهرت علامة التوثيق الزرقاء على بطاقتك وملفك الشخصي.',
        data: { source: 'admin', action: 'profile' },
      });
    }
    if (patch.admin_verified === false && before?.admin_verified) {
      await insertNotif(db, {
        user_id: id,
        type: 'admin_unverified',
        title: 'تم إلغاء توثيق حسابك',
        body: 'أزالت الإدارة علامة التوثيق من حسابك.',
        data: { source: 'admin', action: 'profile' },
      });
    }

    if (patch.is_blocked === true) {
      await insertNotif(db, {
        user_id: id,
        type: 'admin_blocked',
        title: 'تم حظر حسابك',
        body: 'حظرت الإدارة حسابك مؤقتاً. لن تتمكن من استخدام التطبيق حتى يُرفع الحظر.',
        data: { source: 'admin', action: 'profile' },
      });
    }
    if (patch.is_blocked === false && before?.is_blocked) {
      await insertNotif(db, {
        user_id: id,
        type: 'admin_unblocked',
        title: 'تم رفع الحظر عن حسابك',
        body: 'يمكنك الآن استخدام التطبيق مجدداً.',
        data: { source: 'admin', action: 'profile' },
      });
    }

    if (patch.rating_override !== undefined && patch.rating_override !== null && data?.role === 'provider') {
      await insertNotif(db, {
        user_id: id,
        type: 'rating_updated',
        title: 'تم تحديث تقييمك من الإدارة',
        body: `ضبطت الإدارة تقييم حسابك إلى ${patch.rating_override} نجوم.`,
        data: { source: 'admin', action: 'profile' },
      });
    }

    return NextResponse.json({ item: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'تعذّر التحديث';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function removeUserStorageFiles(
  db: ReturnType<typeof getSupabaseAdmin>,
  userId: string
) {
  for (const bucket of ['avatars', 'catalog'] as const) {
    const { data } = await db.storage.from(bucket).list('', {
      limit: 1000,
      search: userId,
    });
    const names = (data ?? [])
      .map((f) => f.name)
      .filter((name) => name.startsWith(userId));
    if (names.length) {
      await db.storage.from(bucket).remove(names);
    }
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await requireAdminApi())) return adminUnauthorized();
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'معرّف المستخدم مطلوب' }, { status: 400 });

  try {
    const db = getSupabaseAdmin();
    const { data: profile, error: fetchError } = await db
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!profile) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    await removeUserStorageFiles(db, id);

    const { error: authError } = await db.auth.admin.deleteUser(id);
    if (authError) {
      // إن لم يوجد في Auth أو فشل الكاسكيد: احذف الملف الشخصي مباشرة
      const { error: profileError } = await db.from('profiles').delete().eq('id', id);
      if (profileError) {
        throw new Error(authError.message || profileError.message);
      }
    }

    return NextResponse.json({ ok: true, id, name: profile.full_name, role: profile.role });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'تعذّر حذف المستخدم';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

