#!/bin/bash
# ============================================================
# سكريبت فحص ما قبل النشر — Pre-deployment verification
# ============================================================

set -e

PROJECT_DIR="/home/z/my-project"
cd "$PROJECT_DIR"

echo "🔍 بدء الفحص الشامل قبل النشر..."
echo "================================"

# 1. فحص ملف .env
echo ""
echo "📋 1. فحص ملف .env"
if [ -f ".env" ]; then
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env; then
    echo "   ✅ ملف .env موجود ويحتوي على المفاتيح المطلوبة"
  else
    echo "   ❌ ملف .env ناقص المفاتيح"
    exit 1
  fi
else
  echo "   ❌ ملف .env غير موجود"
  exit 1
fi

# 2. فحص ESLint
echo ""
echo "📋 2. فحص جودة الكود (ESLint)"
LINT_OUTPUT=$(bun run lint 2>&1)
if [ $? -eq 0 ]; then
  echo "   ✅ ESLint نظيف"
else
  echo "   ⚠️  ESLint لديه تحذيرات/أخطاء:"
  echo "$LINT_OUTPUT" | tail -5
fi

# 3. فحص البناء
echo ""
echo "📋 3. فحص البناء (Build)"
if [ -d ".next/standalone" ] && [ -f ".next/standalone/server.js" ]; then
  echo "   ✅ البناء موجود وجاهز"
  echo "   📦 حجم البناء: $(du -sh .next/ | cut -f1)"
else
  echo "   ❌ البناء غير موجود — تشغيل bun run build"
  exit 1
fi

# 4. فحص الملفات الأساسية
echo ""
echo "📋 4. فحص الملفات الأساسية"
FILES=(
  "src/app/page.tsx"
  "src/app/layout.tsx"
  "src/lib/supabase.ts"
  "src/lib/constants.ts"
  "src/lib/auth-errors.ts"
  "src/store/auth.ts"
  "src/components/MobileShell.tsx"
  "src/components/AuthGate.tsx"
  "src/components/SchemaChecker.tsx"
)
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file غير موجود"
    exit 1
  fi
done

# 5. فحص قاعدة البيانات
echo ""
echo "📋 5. فحص اتصال قاعدة البيانات"
SUPABASE_URL="https://mfogdjxvtpvuvxzyyjqn.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mb2dkanh2dHB2dXZ4enl5anFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjAyMzQsImV4cCI6MjA5NzI5NjIzNH0.VRx_e8XtFYAB_HgYfkc5cEaJpL09IEWUT6OA_icv0Bc"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $ANON_KEY" \
  "$SUPABASE_URL/rest/v1/profiles?select=id&limit=1")

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ اتصال Supabase يعمل (HTTP $HTTP_CODE)"
else
  echo "   ❌ فشل اتصال Supabase (HTTP $HTTP_CODE)"
  exit 1
fi

# 6. فحص dev server
echo ""
echo "📋 6. فحص خادم التطوير"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
  echo "   ✅ خادم التطوير يعمل على المنفذ 3000"
else
  echo "   ⚠️  خادم التطوير لا يعمل"
fi

# 7. فحص المخرجات النهائية
echo ""
echo "📋 7. فحص مخرجات البناء"
if [ -d ".next/standalone/.next/static" ]; then
  echo "   ✅ static files منسوخة"
else
  echo "   ❌ static files غير منسوخة"
  exit 1
fi

if [ -d ".next/standalone/public" ]; then
  echo "   ✅ public files منسوخة"
else
  echo "   ❌ public files غير منسوخة"
  exit 1
fi

if [ -f ".next/standalone/.env" ]; then
  echo "   ✅ .env منسوخ لـ standalone"
else
  echo "   ⚠️  .env غير منسوخ لـ standalone"
fi

echo ""
echo "================================"
echo "🎉 الفحص اكتمل! التطبيق جاهز للنشر."
