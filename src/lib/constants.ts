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

// قائمة أنواع الخدمات / المجالات
export const SERVICE_CATEGORIES = [
  { id: 'building_materials', name: 'مواد بناء', icon: 'Brick' },
  { id: 'engineering', name: 'خدمة هندسية', icon: 'Ruler' },
  { id: 'construction', name: 'بناء', icon: 'Building' },
  { id: 'electricity', name: 'كهرباء', icon: 'Zap' },
  { id: 'plumbing', name: 'سباكة', icon: 'Wrench' },
  { id: 'painting', name: 'طلاء', icon: 'PaintRoller' },
  { id: 'plastering', name: 'تلييس', icon: 'Trowel' },
  { id: 'tiles', name: 'بلاط ورخام', icon: 'Grid3x3' },
  { id: 'carpentry', name: 'نجارة', icon: 'Hammer' },
  { id: 'blacksmith', name: 'حدادة', icon: 'Anvil' },
  { id: 'aluminum', name: 'ألمنيوم وزجاج', icon: 'Frame' },
  { id: 'air_conditioning', name: 'تكييف', icon: 'Wind' },
  { id: 'swimming_pools', name: 'مسابح', icon: 'Waves' },
  { id: 'gardening', name: 'تنسيق حدائق', icon: 'Trees' },
  { id: 'interior_design', name: 'تصميم داخلي', icon: 'Sofa' },
  { id: 'surveying', name: 'مساحة أراضي', icon: 'MapPin' },
  { id: 'foundation', name: 'أساسات', icon: 'Layers' },
  { id: 'roofing', name: 'سقوف وعزل', icon: 'Home' },
  { id: 'transport', name: 'نقل ومقاولات', icon: 'Truck' },
  { id: 'consulting', name: 'استشارات', icon: 'Lightbulb' },
] as const;

export const getCategoryName = (id: string): string => {
  return SERVICE_CATEGORIES.find((c) => c.id === id)?.name ?? id;
};

export const APP_NAME = 'دلّوني عليك';
export const APP_TAGLINE = 'حلقة الوصل بينك وبين كل من تحتاجه لبناء منزلك';

// فئة خدمة مواد البناء — لها كاتلوج منتجات بأسعار بدلاً من أعمال سابقة
export const BUILDING_MATERIALS_CATEGORY = 'building_materials';

// وحدات القياس الشائعة لمواد البناء
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

// التحقق إذا كان مقدم الخدمة يبيع مواد بناء (منتجات بأسعار)
export function isBuildingMaterialsProvider(serviceCategory: string | null | undefined): boolean {
  return serviceCategory === BUILDING_MATERIALS_CATEGORY;
}
