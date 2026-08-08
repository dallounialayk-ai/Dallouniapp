'use client';

import { MapPin, MessageCircle, Clock, ChevronLeft, Tag, Hourglass } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ServiceRequest, Profile } from '@/lib/supabase';
import { getCategoryPath, getDeadlineLabel } from '@/lib/constants';
import { getInitials, formatRelativeTime, formatDeadlineRemaining } from '@/lib/utils';

export function RequestCard({
  request, profile, offersCount, onClick,
}: {
  request: ServiceRequest;
  profile?: Profile;
  offersCount?: number;
  onClick?: () => void;
}) {
  const deadline = formatDeadlineRemaining(request.expires_at);

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

          {deadline && (
            <div
              className={`mb-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold ${
                deadline.expired || deadline.urgent
                  ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                  : 'bg-sky-50 text-sky-800 border border-sky-200/80'
              }`}
            >
              <Hourglass className="w-3 h-3 shrink-0" />
              <span>{deadline.text}</span>
              {request.deadline_days != null && (
                <span className="font-normal opacity-80">
                  · {getDeadlineLabel(request.deadline_days)}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <Badge variant="secondary" className="font-medium flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              {getCategoryPath(request.category)}
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
