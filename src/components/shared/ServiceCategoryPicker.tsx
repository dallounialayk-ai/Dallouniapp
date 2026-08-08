'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Layers, Search, X } from 'lucide-react';
import {
  SERVICE_CATEGORY_TREE,
  getCategoryPath,
  getCategoryMeta,
  getMainCategory,
  type ServiceMainCategory,
  type ServiceSubgroup,
  type ServiceLeaf,
} from '@/lib/constants';
import { createPortal } from 'react-dom';
import { useAppPortalContainer } from '@/hooks/use-app-portal';

type PickerMode = 'select' | 'filter';

type Props = {
  value: string;
  onChange: (value: string) => void;
  mode?: PickerMode;
  /** في وضع الفلترة: خيار «الكل» */
  allowAll?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
};

type PanelView =
  | { level: 'main' }
  | { level: 'subgroup'; main: ServiceMainCategory }
  | { level: 'items'; main: ServiceMainCategory; subgroup?: ServiceSubgroup };

/**
 * اختيار هرمي لأنواع الخدمات:
 * تصنيف رئيسي → مجموعة فرعية (إن وُجدت) → تخصص.
 * في وضع الفلترة يمكن اختيار التصنيف الرئيسي أو المجموعة أيضاً.
 */
export function ServiceCategoryPicker({
  value,
  onChange,
  mode = 'select',
  allowAll = false,
  placeholder = 'اختر نوع الخدمة',
  className,
  triggerClassName,
  disabled,
}: Props) {
  const portal = useAppPortalContainer();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PanelView>({ level: 'main' });
  const [q, setQ] = useState('');

  const label = useMemo(() => {
    if (!value || value === 'all') {
      return allowAll ? 'كل المجالات' : placeholder;
    }
    return getCategoryPath(value) || placeholder;
  }, [value, allowAll, placeholder]);

  const isPlaceholder = !value || value === 'all';

  const openPanel = () => {
    if (disabled) return;
    setQ('');
    // افتح عند مستوى مناسب للقيمة الحالية
    const meta = getCategoryMeta(value);
    if (meta?.kind === 'leaf' || meta?.kind === 'subgroup') {
      const main = getMainCategory(meta.mainId);
      if (main) {
        if (meta.subgroupId && main.subgroups) {
          const sg = main.subgroups.find((s) => s.id === meta.subgroupId);
          if (sg) {
            setView({ level: 'items', main, subgroup: sg });
            setOpen(true);
            return;
          }
        }
        if (main.subgroups?.length) {
          setView({ level: 'subgroup', main });
        } else {
          setView({ level: 'items', main });
        }
        setOpen(true);
        return;
      }
    }
    setView({ level: 'main' });
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setQ('');
  };

  const pick = (id: string) => {
    onChange(id);
    close();
  };

  const searchResults = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return null;
    const results: { id: string; title: string; subtitle: string }[] = [];
    for (const main of SERVICE_CATEGORY_TREE) {
      if (main.name.includes(term) && mode === 'filter') {
        results.push({ id: main.id, title: main.name, subtitle: 'تصنيف رئيسي' });
      }
      const pushLeaf = (leaf: ServiceLeaf, path: string) => {
        if (leaf.name.toLowerCase().includes(term) || path.toLowerCase().includes(term)) {
          results.push({ id: leaf.id, title: leaf.name, subtitle: path });
        }
      };
      if (main.items) {
        for (const leaf of main.items) pushLeaf(leaf, main.name);
      }
      if (main.subgroups) {
        for (const sg of main.subgroups) {
          if (sg.name.includes(term) && mode === 'filter') {
            results.push({
              id: sg.id,
              title: sg.name,
              subtitle: `${main.name} · مجموعة`,
            });
          }
          for (const leaf of sg.items) {
            pushLeaf(leaf, `${main.name} › ${sg.name}`);
          }
        }
      }
    }
    return results;
  }, [q, mode]);

  const panel = open && (
    <div
      className={`${
        portal ? 'absolute' : 'fixed'
      } inset-0 z-[80] flex flex-col bg-background animate-fade-rise`}
    >
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border/50 space-y-2 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {view.level !== 'main' && !searchResults && (
              <button
                type="button"
                onClick={() => {
                  if (view.level === 'items' && view.main.subgroups?.length) {
                    setView({ level: 'subgroup', main: view.main });
                  } else {
                    setView({ level: 'main' });
                  }
                }}
                className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground">تصنيف الخدمة</div>
              <div className="font-bold text-sm truncate">
                {view.level === 'main' && 'اختر التصنيف الرئيسي'}
                {view.level === 'subgroup' && view.main.name}
                {view.level === 'items' &&
                  (view.subgroup ? view.subgroup.name : view.main.name)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث سريع في التخصصات…"
            className="w-full h-10 rounded-xl border border-border/60 bg-muted/30 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2 pb-8">
        {searchResults ? (
          searchResults.length === 0 ? (
            <EmptyMsg text="لا توجد نتائج مطابقة" />
          ) : (
            searchResults.map((r) => (
              <RowButton
                key={r.id}
                title={r.title}
                subtitle={r.subtitle}
                active={value === r.id}
                onClick={() => pick(r.id)}
              />
            ))
          )
        ) : (
          <>
            {view.level === 'main' && (
              <>
                {allowAll && (
                  <RowButton
                    title="كل المجالات"
                    subtitle="عرض جميع التصنيفات"
                    active={value === 'all' || !value}
                    onClick={() => pick('all')}
                    icon={<Layers className="w-4 h-4 text-primary" />}
                  />
                )}
                {SERVICE_CATEGORY_TREE.map((main) => {
                  const count =
                    (main.items?.length ?? 0) +
                    (main.subgroups?.reduce((s, g) => s + g.items.length, 0) ?? 0);
                  return (
                    <RowButton
                      key={main.id}
                      title={main.name}
                      subtitle={`${count} تخصص`}
                      active={value === main.id}
                      showChevron
                      onClick={() => {
                        if (main.subgroups?.length) {
                          setView({ level: 'subgroup', main });
                        } else {
                          setView({ level: 'items', main });
                        }
                      }}
                      trailing={
                        mode === 'filter' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              pick(main.id);
                            }}
                            className="text-[11px] text-primary font-semibold px-2 py-1 rounded-lg bg-primary/10"
                          >
                            فلترة
                          </button>
                        ) : undefined
                      }
                    />
                  );
                })}
              </>
            )}

            {view.level === 'subgroup' && (
              <>
                {mode === 'filter' && (
                  <RowButton
                    title={`كل «${view.main.name}»`}
                    subtitle="يشمل جميع التخصصات تحت هذا التصنيف"
                    active={value === view.main.id}
                    onClick={() => pick(view.main.id)}
                  />
                )}
                {view.main.subgroups?.map((sg) => (
                  <RowButton
                    key={sg.id}
                    title={sg.name}
                    subtitle={`${sg.items.length} تخصص`}
                    active={value === sg.id}
                    showChevron
                    onClick={() => setView({ level: 'items', main: view.main, subgroup: sg })}
                    trailing={
                      mode === 'filter' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            pick(sg.id);
                          }}
                          className="text-[11px] text-primary font-semibold px-2 py-1 rounded-lg bg-primary/10"
                        >
                          فلترة
                        </button>
                      ) : undefined
                    }
                  />
                ))}
              </>
            )}

            {view.level === 'items' && (
              <>
                {mode === 'filter' && (
                  <RowButton
                    title={
                      view.subgroup
                        ? `كل «${view.subgroup.name}»`
                        : `كل «${view.main.name}»`
                    }
                    subtitle="فلترة على المستوى الحالي"
                    active={value === (view.subgroup?.id ?? view.main.id)}
                    onClick={() => pick(view.subgroup?.id ?? view.main.id)}
                  />
                )}
                {(view.subgroup?.items ?? view.main.items ?? []).map((leaf) => (
                  <RowButton
                    key={leaf.id}
                    title={leaf.name}
                    active={value === leaf.id}
                    onClick={() => pick(leaf.id)}
                    trailing={
                      value === leaf.id ? <Check className="w-4 h-4 text-primary" /> : undefined
                    }
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled}
        onClick={openPanel}
        className={
          triggerClassName ??
          'w-full h-12 rounded-xl bg-muted/40 border border-border/60 px-3 text-sm text-right flex items-center justify-between gap-2 disabled:opacity-50'
        }
      >
        <span className={`truncate ${isPlaceholder ? 'text-muted-foreground' : 'text-foreground'}`}>
          {label}
        </span>
        <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open &&
        createPortal(
          panel,
          portal ?? document.body
        )}
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <div className="py-12 text-center text-sm text-muted-foreground">{text}</div>
  );
}

function RowButton({
  title,
  subtitle,
  active,
  onClick,
  showChevron,
  trailing,
  icon,
}: {
  title: string;
  subtitle?: string;
  active?: boolean;
  onClick: () => void;
  showChevron?: boolean;
  trailing?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-right rounded-2xl border px-3.5 py-3 flex items-center gap-3 transition-colors ${
        active
          ? 'border-primary/40 bg-primary/5'
          : 'border-border/50 bg-card hover:bg-muted/40'
      }`}
    >
      {icon && (
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{title}</div>
        {subtitle && (
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</div>
        )}
      </div>
      {trailing}
      {showChevron && !trailing && (
        <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
    </button>
  );
}
