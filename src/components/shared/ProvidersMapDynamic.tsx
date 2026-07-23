'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

const ProvidersMapInner = dynamic(
  () => import('./ProvidersMap').then((m) => m.ProvidersMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] rounded-2xl bg-muted/40 border border-border/40 animate-pulse flex items-center justify-center">
        <span className="text-xs text-muted-foreground">جاري تحميل الخريطة…</span>
      </div>
    ),
  }
);

const LocationPreviewMapInner = dynamic(
  () => import('./ProvidersMap').then((m) => m.LocationPreviewMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-40 rounded-xl bg-muted/40 border border-border/40 animate-pulse" />
    ),
  }
);

const RequestLocationMapInner = dynamic(
  () => import('./ProvidersMap').then((m) => m.RequestLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[240px] rounded-2xl bg-muted/40 border border-border/40 animate-pulse flex items-center justify-center">
        <span className="text-xs text-muted-foreground">جاري تحميل الخريطة…</span>
      </div>
    ),
  }
);

export function ProvidersMap(props: ComponentProps<typeof ProvidersMapInner>) {
  return <ProvidersMapInner {...props} />;
}

export function LocationPreviewMap(
  props: ComponentProps<typeof LocationPreviewMapInner>
) {
  return <LocationPreviewMapInner {...props} />;
}

export function RequestLocationMap(
  props: ComponentProps<typeof RequestLocationMapInner>
) {
  return <RequestLocationMapInner {...props} />;
}
