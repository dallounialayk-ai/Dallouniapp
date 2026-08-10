// ============================================================
// تصنيف الخدمات — هيكل رئيسي → (مجموعات فرعية اختيارية) → تخصصات
// ============================================================

export type ServiceLeaf = {
  id: string;
  name: string;
};

export type ServiceSubgroup = {
  id: string;
  name: string;
  items: ServiceLeaf[];
};

export type ServiceMainCategory = {
  id: string;
  name: string;
  /** تخصصات مباشرة تحت التصنيف الرئيسي */
  items?: ServiceLeaf[];
  /** مجموعات فرعية تحتوي تخصصات */
  subgroups?: ServiceSubgroup[];
};

export const SERVICE_CATEGORY_TREE: ServiceMainCategory[] = [
  {
    id: 'design',
    name: 'التصميم والاستشارات',
    items: [
      { id: 'design_architect', name: 'مهندس معماري' },
      { id: 'design_civil', name: 'مهندس مدني' },
      { id: 'design_electrical', name: 'مهندس كهرباء' },
      { id: 'design_mechanical', name: 'مهندس ميكانيكا' },
      { id: 'design_surveyor', name: 'مهندس مساحة' },
      { id: 'design_interior', name: 'مصمم داخلي' },
      { id: 'design_supervisor', name: 'مشرف تنفيذ' },
      { id: 'design_consultant', name: 'استشاري هندسي' },
    ],
  },
  {
    id: 'contracting',
    name: 'المقاولات',
    items: [
      { id: 'contracting_builder', name: 'مقاول بناء' },
      { id: 'contracting_structure', name: 'مقاول عظم' },
      { id: 'contracting_finishing', name: 'مقاول تشطيب' },
      { id: 'contracting_turnkey', name: 'مقاول تسليم مفتاح' },
      { id: 'contracting_company', name: 'شركة مقاولات' },
      { id: 'contracting_demolition', name: 'مقاول هدم' },
      { id: 'contracting_renovation', name: 'مقاول ترميم' },
    ],
  },
  {
    id: 'crafts',
    name: 'العمال والحرفيون',
    subgroups: [
      {
        id: 'crafts_structural',
        name: 'أعمال الهيكل الإنشائي',
        items: [
          { id: 'crafts_builder_worker', name: 'عامل بناء' },
          { id: 'crafts_builder_master', name: 'معلم بناء' },
          { id: 'crafts_rebar', name: 'حداد تسليح' },
          { id: 'crafts_formwork', name: 'نجار مسلح' },
          { id: 'crafts_concrete', name: 'صب خرسانة' },
          { id: 'crafts_digger', name: 'حفار' },
          { id: 'crafts_equipment_op', name: 'مشغل معدات' },
        ],
      },
      {
        id: 'crafts_finishing',
        name: 'أعمال التشطيبات',
        items: [
          { id: 'crafts_tiler', name: 'مبلط' },
          { id: 'crafts_plasterer', name: 'مبيض (لياسة)' },
          { id: 'crafts_painter', name: 'دهان' },
          { id: 'crafts_gypsum', name: 'جبس وديكور' },
          { id: 'crafts_marble_install', name: 'تركيب رخام' },
          { id: 'crafts_stone_install', name: 'تركيب حجر' },
          { id: 'crafts_ceiling_master', name: 'معلم أسقف' },
        ],
      },
      {
        id: 'crafts_metal_wood',
        name: 'الأعمال المعدنية والخشبية',
        items: [
          { id: 'crafts_blacksmith', name: 'حداد' },
          { id: 'crafts_carpenter', name: 'نجار' },
          { id: 'crafts_aluminum', name: 'ألمنيوم' },
          { id: 'crafts_glass', name: 'زجاج' },
          { id: 'crafts_stainless', name: 'ستانلس ستيل' },
        ],
      },
      {
        id: 'crafts_electro_mech',
        name: 'الأعمال الكهربائية والميكانيكية',
        items: [
          { id: 'crafts_electrician', name: 'كهربائي' },
          { id: 'crafts_plumber', name: 'سباك' },
          { id: 'crafts_ac', name: 'فني تكييف' },
          { id: 'crafts_elevator', name: 'فني مصاعد' },
          { id: 'crafts_cctv', name: 'فني كاميرات مراقبة' },
          { id: 'crafts_solar', name: 'فني طاقة شمسية' },
        ],
      },
    ],
  },
  {
    id: 'workshops',
    name: 'ورش التصنيع',
    items: [
      { id: 'workshop_aluminum', name: 'ورشة ألمنيوم' },
      { id: 'workshop_blacksmith', name: 'ورشة حدادة' },
      { id: 'workshop_carpentry', name: 'ورشة نجارة' },
      { id: 'workshop_iron_doors', name: 'ورشة أبواب حديد' },
      { id: 'workshop_wood_doors', name: 'ورشة أبواب خشب' },
      { id: 'workshop_alum_kitchens', name: 'ورشة مطابخ ألمنيوم' },
      { id: 'workshop_wood_kitchens', name: 'ورشة مطابخ خشب' },
      { id: 'workshop_railings', name: 'ورشة درابزين' },
      { id: 'workshop_glass', name: 'ورشة زجاج' },
    ],
  },
  {
    id: 'materials',
    name: 'مواد البناء',
    subgroups: [
      {
        id: 'materials_basic',
        name: 'المواد الأساسية',
        items: [
          { id: 'materials_cement', name: 'إسمنت' },
          { id: 'materials_steel', name: 'حديد' },
          { id: 'materials_sand', name: 'رمل' },
          { id: 'materials_nis', name: 'نيس' },
          { id: 'materials_aggregate', name: 'كري' },
          { id: 'materials_ready_mix', name: 'خرسانة جاهزة' },
        ],
      },
      {
        id: 'materials_blocks',
        name: 'البلوك والطوب',
        items: [
          { id: 'materials_block_normal', name: 'بلك عادي' },
          { id: 'materials_block_solid', name: 'بلك مصمت' },
          { id: 'materials_block_volcanic', name: 'بلك بركاني' },
          { id: 'materials_red_brick', name: 'طوب أحمر' },
        ],
      },
      {
        id: 'materials_stones',
        name: 'الأحجار',
        items: [
          { id: 'materials_stone_black', name: 'حجر أسود' },
          { id: 'materials_stone_white', name: 'حجر أبيض' },
          { id: 'materials_stone_facade', name: 'حجر واجهات' },
          { id: 'materials_marble', name: 'رخام' },
          { id: 'materials_granite', name: 'جرانيت' },
        ],
      },
      {
        id: 'materials_finishing',
        name: 'مواد التشطيب',
        items: [
          { id: 'materials_ceramic', name: 'سيراميك' },
          { id: 'materials_porcelain', name: 'بورسلان' },
          { id: 'materials_paints', name: 'دهانات' },
          { id: 'materials_gypsum', name: 'جبس' },
          { id: 'materials_insulation', name: 'عوازل' },
          { id: 'materials_parquet', name: 'باركيه' },
        ],
      },
      {
        id: 'materials_plumbing_electrical',
        name: 'السباكة والكهرباء',
        items: [
          { id: 'materials_plumbing', name: 'مواد سباكة' },
          { id: 'materials_sanitary', name: 'لوازم صحية' },
          { id: 'materials_electrical', name: 'مواد كهرباء' },
          { id: 'materials_cables', name: 'أسلاك وكابلات' },
        ],
      },
    ],
  },
  {
    id: 'equipment',
    name: 'المعدات',
    items: [
      { id: 'equipment_mixer', name: 'خلاطة خرسانة' },
      { id: 'equipment_scaffolding', name: 'سقالات' },
      { id: 'equipment_crane', name: 'رافعات' },
      { id: 'equipment_excavator', name: 'حفارات' },
      { id: 'equipment_loader', name: 'شيولات' },
      { id: 'equipment_dump_truck', name: 'قلابات' },
    ],
  },
  {
    id: 'logistics',
    name: 'النقل والخدمات اللوجستية',
    items: [
      { id: 'logistics_building_materials', name: 'نقل مواد بناء' },
      { id: 'logistics_sand', name: 'نقل رمل' },
      { id: 'logistics_gravel', name: 'نقل بحص' },
      { id: 'logistics_stone', name: 'نقل حجر' },
      { id: 'logistics_water_truck', name: 'وايت ماء' },
      { id: 'logistics_dump', name: 'قلاب' },
      { id: 'logistics_crane', name: 'رافعة' },
    ],
  },
];

/** توافق مع التصنيفات القديمة المخزّنة في قاعدة البيانات */
export const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  building_materials: 'مواد بناء',
  engineering: 'خدمة هندسية',
  construction: 'بناء',
  electricity: 'كهرباء',
  plumbing: 'سباكة',
  painting: 'طلاء',
  plastering: 'تلييس',
  tiles: 'بلاط ورخام',
  carpentry: 'نجارة',
  blacksmith: 'حدادة',
  aluminum: 'ألمنيوم وزجاج',
  air_conditioning: 'تكييف',
  swimming_pools: 'مسابح',
  gardening: 'تنسيق حدائق',
  interior_design: 'تصميم داخلي',
  surveying: 'مساحة أراضي',
  foundation: 'أساسات',
  roofing: 'سقوف وعزل',
  transport: 'نقل ومقاولات',
  consulting: 'استشارات',
};

/** توجيه التصنيفات القديمة إلى أقرب تصنيف رئيسي للفلترة */
export const LEGACY_TO_MAIN: Record<string, string> = {
  building_materials: 'materials',
  engineering: 'design',
  construction: 'contracting',
  electricity: 'crafts',
  plumbing: 'crafts',
  painting: 'crafts',
  plastering: 'crafts',
  tiles: 'crafts',
  carpentry: 'crafts',
  blacksmith: 'crafts',
  aluminum: 'crafts',
  air_conditioning: 'crafts',
  swimming_pools: 'contracting',
  gardening: 'contracting',
  interior_design: 'design',
  surveying: 'design',
  foundation: 'crafts',
  roofing: 'crafts',
  transport: 'logistics',
  consulting: 'design',
};

function collectLeaves(tree: ServiceMainCategory[]): ServiceLeaf[] {
  const out: ServiceLeaf[] = [];
  for (const main of tree) {
    if (main.items) out.push(...main.items);
    if (main.subgroups) {
      for (const sg of main.subgroups) out.push(...sg.items);
    }
  }
  return out;
}

/** قائمة مسطّحة بكل التخصصات (للتوافق مع الكود القديم) */
export const SERVICE_CATEGORIES = collectLeaves(SERVICE_CATEGORY_TREE);

const leafById = new Map(SERVICE_CATEGORIES.map((l) => [l.id, l]));
const mainById = new Map(SERVICE_CATEGORY_TREE.map((m) => [m.id, m]));

export type CategoryMeta = {
  id: string;
  name: string;
  mainId: string;
  mainName: string;
  subgroupId?: string;
  subgroupName?: string;
  kind: 'leaf' | 'main' | 'subgroup' | 'legacy';
};

export function getLeaf(id: string): ServiceLeaf | undefined {
  return leafById.get(id);
}

export function getMainCategory(id: string): ServiceMainCategory | undefined {
  return mainById.get(id);
}

export function getCategoryMeta(id: string | null | undefined): CategoryMeta | null {
  if (!id) return null;

  const leaf = leafById.get(id);
  if (leaf) {
    for (const main of SERVICE_CATEGORY_TREE) {
      if (main.items?.some((i) => i.id === id)) {
        return {
          id,
          name: leaf.name,
          mainId: main.id,
          mainName: main.name,
          kind: 'leaf',
        };
      }
      if (main.subgroups) {
        for (const sg of main.subgroups) {
          if (sg.items.some((i) => i.id === id)) {
            return {
              id,
              name: leaf.name,
              mainId: main.id,
              mainName: main.name,
              subgroupId: sg.id,
              subgroupName: sg.name,
              kind: 'leaf',
            };
          }
        }
      }
    }
  }

  const main = mainById.get(id);
  if (main) {
    return {
      id: main.id,
      name: main.name,
      mainId: main.id,
      mainName: main.name,
      kind: 'main',
    };
  }

  for (const m of SERVICE_CATEGORY_TREE) {
    const sg = m.subgroups?.find((s) => s.id === id);
    if (sg) {
      return {
        id: sg.id,
        name: sg.name,
        mainId: m.id,
        mainName: m.name,
        subgroupId: sg.id,
        subgroupName: sg.name,
        kind: 'subgroup',
      };
    }
  }

  if (LEGACY_CATEGORY_LABELS[id]) {
    return {
      id,
      name: LEGACY_CATEGORY_LABELS[id],
      mainId: LEGACY_TO_MAIN[id] ?? id,
      mainName: getMainCategory(LEGACY_TO_MAIN[id] ?? '')?.name ?? LEGACY_CATEGORY_LABELS[id],
      kind: 'legacy',
    };
  }

  return { id, name: id, mainId: id, mainName: id, kind: 'legacy' };
}

/** اسم العرض للتخصص (أو التصنيف القديم) */
export const getCategoryName = (id: string): string => {
  if (!id) return '';
  return getCategoryMeta(id)?.name ?? id;
};

/** مسار هرمي للعرض: رئيسي › فرعي › تخصص */
export function getCategoryPath(id: string | null | undefined): string {
  const meta = getCategoryMeta(id);
  if (!meta) return '';
  if (meta.kind === 'main') return meta.mainName;
  if (meta.kind === 'subgroup') return `${meta.mainName} › ${meta.name}`;
  if (meta.subgroupName) return `${meta.mainName} › ${meta.subgroupName} › ${meta.name}`;
  if (meta.kind === 'leaf') return `${meta.mainName} › ${meta.name}`;
  return meta.name;
}

/** كل معرّفات الأوراق تحت تصنيف رئيسي أو مجموعة فرعية */
export function getDescendantLeafIds(filterId: string): string[] {
  if (filterId === 'all') return SERVICE_CATEGORIES.map((l) => l.id);

  const main = mainById.get(filterId);
  if (main) {
    const ids: string[] = [];
    if (main.items) ids.push(...main.items.map((i) => i.id));
    if (main.subgroups) {
      for (const sg of main.subgroups) ids.push(...sg.items.map((i) => i.id));
    }
    return ids;
  }

  for (const m of SERVICE_CATEGORY_TREE) {
    const sg = m.subgroups?.find((s) => s.id === filterId);
    if (sg) return sg.items.map((i) => i.id);
  }

  if (leafById.has(filterId)) return [filterId];

  // قديم: طابق التصنيف الرئيسي المكافئ
  const legacyMain = LEGACY_TO_MAIN[filterId];
  if (legacyMain) return getDescendantLeafIds(legacyMain);

  return [filterId];
}

/**
 * هل القيمة المخزّنة تطابق فلتر التصنيف؟
 * الفلتر قد يكون: all | main | subgroup | leaf | legacy
 */
export function matchesCategoryFilter(
  storedCategory: string | null | undefined,
  filterId: string
): boolean {
  if (!filterId || filterId === 'all') return true;
  if (!storedCategory) return false;
  if (storedCategory === filterId) return true;

  const leaves = getDescendantLeafIds(filterId);
  if (leaves.includes(storedCategory)) return true;

  // قيمة قديمة تحت نفس الرئيسي الذي يمثّله الفلتر
  const storedMain =
    getCategoryMeta(storedCategory)?.mainId ?? LEGACY_TO_MAIN[storedCategory];
  const filterMeta = getCategoryMeta(filterId);
  if (filterMeta?.kind === 'main' && storedMain === filterId) return true;
  if (LEGACY_TO_MAIN[storedCategory] === filterId) return true;

  return false;
}

export function getCategoryGroupId(serviceCategory: string | null | undefined): string | null {
  if (!serviceCategory) return null;
  return getCategoryMeta(serviceCategory)?.mainId ?? LEGACY_TO_MAIN[serviceCategory] ?? null;
}

/** خيارات مهلة الطلب الإلزامية عند الإنشاء */
export const REQUEST_DEADLINE_OPTIONS = [
  { days: 1, label: 'يوم واحد (مستعجل)' },
  { days: 2, label: 'يومان' },
  { days: 3, label: 'ثلاثة أيام' },
  { days: 4, label: 'أربعة أيام' },
  { days: 7, label: 'أسبوع' },
  { days: 14, label: 'أسبوعان' },
  { days: 30, label: 'شهر' },
] as const;

export type RequestDeadlineDays = (typeof REQUEST_DEADLINE_OPTIONS)[number]['days'];

export function getDeadlineLabel(days: number | null | undefined): string {
  if (days == null) return '';
  return REQUEST_DEADLINE_OPTIONS.find((o) => o.days === days)?.label ?? `${days} يوم`;
}

export function computeExpiresAt(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

// قائمة محافظات الجمهورية اليمنية
export const YEMEN_GOVERNORATES = [
  'أمانة العاصمة',
  'صنعاء',
  'عدن',
  'تعز',
  'الحديدة',
  'إب',
  'ذمار',
  'حضرموت',
  'حجة',
  'صعدة',
  'عمران',
  'البيضاء',
  'لحج',
  'أبين',
  'شبوة',
  'المهرة',
  'مأرب',
  'الجوف',
  'الضالع',
  'ريمة',
  'المحويت',
  'الوديعة',
];

export const APP_NAME = 'دلّوني عليك';
export const APP_VERSION = '0.3.4';
export const APP_TAGLINE = 'حلقة الوصل بينك وبين كل من تحتاجه لبناء منزلك';

/** فئة خدمة مواد البناء — لها كاتلوج منتجات بأسعار بدلاً من أعمال سابقة */
export const BUILDING_MATERIALS_CATEGORY = 'materials';

export const PRODUCT_UNITS = [
  'قطعة',
  'كيس',
  'متر',
  'متر مربع',
  'متر مكعب',
  'طن',
  'كيلوغرام',
  'لتر',
  'حبة',
  'صندوق',
  'لولب',
  'صفيحة',
] as const;

/** هل مقدم الخدمة ضمن مواد البناء (يشمل التخصصات الفرعية والقديم)؟ */
export function isBuildingMaterialsProvider(serviceCategory: string | null | undefined): boolean {
  if (!serviceCategory) return false;
  if (serviceCategory === 'building_materials') return true;
  return getCategoryGroupId(serviceCategory) === 'materials';
}
