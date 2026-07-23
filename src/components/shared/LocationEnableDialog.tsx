'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MapPin, Navigation } from 'lucide-react';

export function LocationEnableDialog({
  open,
  onOpenChange,
  governorate,
  onEnable,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  governorate: string;
  onEnable: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl max-w-[min(100%-2rem,22rem)] gap-4">
        <AlertDialogHeader className="gap-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-primary" />
          </div>
          <AlertDialogTitle className="text-center text-base font-bold">
            تفعيل تحديد الموقع
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
            الرجاء تفعيل خيار الموقع لتحديد مكانك بالضبط في محافظة{' '}
            <span className="font-semibold text-foreground">{governorate}</span>
            . يساعدنا ذلك في إظهار الخدمات القريبة منك على الخريطة.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onEnable();
            }}
            className="w-full h-11 rounded-xl font-semibold gap-2"
          >
            <Navigation className="w-4 h-4" />
            تفعيل الموقع
          </AlertDialogAction>
          <AlertDialogCancel className="w-full h-11 rounded-xl mt-0">
            لاحقًا
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
