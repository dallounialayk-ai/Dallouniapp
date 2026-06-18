'use client';

import { Star, MapPin, MessageCircle, Phone, ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Profile } from '@/lib/supabase';
import { getCategoryName } from '@/lib/constants';
import { getInitials } from '@/lib/utils';

export function ProviderCard({
  provider, rating, reviewsCount, onClick,
}: {
  provider: Profile;
  rating?: number;
  reviewsCount?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-right bg-card rounded-2xl p-4 border border-border/60 elevate-1 hover:elevate-2 hover:-translate-y-0.5 transition-all duration-300 group"
    >
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <Avatar className="w-16 h-16 rounded-2xl border border-border/50">
            <AvatarImage src={provider.avatar_url ?? undefined} />
            <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary/20 to-accent text-primary font-bold">
              {getInitials(provider.full_name)}
            </AvatarFallback>
          </Avatar>
          {rating !== undefined && rating > 0 && (
            <div className="absolute -bottom-1 -left-1 bg-amber-400 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 flex items-center gap-0.5 border-2 border-card">
              <Star className="w-2.5 h-2.5 fill-current" />
              {rating.toFixed(1)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">
              {provider.full_name}
            </h3>
            <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
          </div>
          <Badge variant="secondary" className="mt-1 mb-1.5 font-medium">
            {getCategoryName(provider.service_category ?? '')}
          </Badge>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {provider.bio || 'لا يوجد وصف'}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {provider.governorate}
            </span>
            {reviewsCount !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {reviewsCount} تقييم
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export function ProviderRowCompact({
  provider, rating, onClick,
}: {
  provider: Profile;
  rating?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-right flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
    >
      <Avatar className="w-12 h-12 rounded-xl">
        <AvatarImage src={provider.avatar_url ?? undefined} />
        <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-sm">
          {getInitials(provider.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{provider.full_name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {getCategoryName(provider.service_category ?? '')}
        </div>
      </div>
      {rating !== undefined && (
        <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
          <Star className="w-3 h-3 fill-current" />
          {rating.toFixed(1)}
        </div>
      )}
    </button>
  );
}

export { MessageCircle, Phone };
