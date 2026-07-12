-- ============================================================
-- إصلاح سياسة RLS لجدول notifications
-- المشكلة: سياسة INSERT الحالية تتطلب auth.uid() = user_id
-- لكن الإشعارات تُنشأ من مستخدم وتُرسل لمستخدم آخر
-- الحل: السماح لأي مستخدم مصدّق بإدراج إشعارات لأي مستخدم
-- يُطبّق في: Supabase SQL Editor (مرة واحدة فقط)
-- ============================================================

-- 1. حذف سياسة INSERT القديمة
drop policy if exists "notifications_insert_self" on public.notifications;

-- 2. إنشاء سياسة INSERT جديدة تسمح لأي مستخدم مصدّق بإدراج إشعارات
-- (المستخدم أ يرسل إشعارًا للمستخدم ب)
create policy "notifications_insert_any_authenticated" 
on public.notifications 
for insert 
with check (auth.role() = 'authenticated');

-- 3. تحديث سياسة SELECT (تبقى كما هي - كل مستخدم يرى إشعاراته فقط)
-- لا حاجة لتعديلها

-- 4. تحديث سياسة UPDATE (تبقى كما هي - كل مستخدم يعدّل إشعاراته فقط)
-- لا حاجة لتعديلها

-- 5. التحقق من السياسات
select policyname, cmd, qual, with_check 
from pg_policies 
where tablename = 'notifications'
order by policyname;
