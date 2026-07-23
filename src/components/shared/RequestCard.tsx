'use client';

import { MapPin, MessageCircle, Clock, ChevronLeft, Tag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ServiceRequest, Profile } from '@/lib/supabase';
import { getCategoryName } from '@/lib/constants';
import { getInitials, formatRelativeTime } from '@/lib/utils';

export function RequestCard({
  request, profile, offersCount, onClick,
}: {
  request: ServiceRequest;
  profile?: Profile;
  offersCount?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-right bg-card rounded-2xl p-4 border border-border/60 elevate-1 hover:elevate-2 hover:-translate-y-0.5 transition-all duration-300 group"
    >
      <div className="flex items-start gap-3">
        {profile && (
          <Avatar className="w-12 h-12 rounded-xl shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-sm">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
              {request.title}
            </h3>
            <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          </div>

          {profile && (
            <div className="text-xs text-muted-foreground mb-1.5">
              {profile.full_name}
            </div>
          )}

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
            {request.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <Badge variant="secondary" className="font-medium flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              {getCategoryName(request.category)}
            </Badge>
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-2.5 h-2.5" />
              {request.governorate}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              {formatRelativeTime(request.created_at)}
            </span>
            {offersCount !== undefined && offersCount > 0 && (
              <span className="flex items-center gap-1 text-primary font-medium">
                <MessageCircle className="w-2.5 h-2.5" />
                {offersCount} عرض
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
