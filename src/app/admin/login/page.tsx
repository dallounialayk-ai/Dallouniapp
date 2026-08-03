import { Suspense } from 'react';
import AdminLoginClient from './login-client';

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-sm text-muted-foreground">
          جاري التحميل…
        </div>
      }
    >
      <AdminLoginClient />
    </Suspense>
  );
}
