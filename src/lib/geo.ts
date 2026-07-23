/** إحداثيات مراكز محافظات اليمن (للخريطة كمركز افتراضي) */
export const GOVERNORATE_COORDS: Record<
  string,
  { lat: number; lng: number; zoom: number }
> = {
  'أمانة العاصمة': { lat: 15.3694, lng: 44.191, zoom: 12 },
  صنعاء: { lat: 15.3547, lng: 44.2067, zoom: 11 },
  عدن: { lat: 12.7855, lng: 45.0187, zoom: 12 },
  تعز: { lat: 13.5779, lng: 44.0178, zoom: 12 },
  الحديدة: { lat: 14.7979, lng: 42.9545, zoom: 11 },
  إب: { lat: 13.9667, lng: 44.1833, zoom: 12 },
  ذمار: { lat: 14.55, lng: 44.4, zoom: 11 },
  حضرموت: { lat: 15.95, lng: 48.8, zoom: 9 },
  حجة: { lat: 15.694, lng: 43.601, zoom: 11 },
  صعدة: { lat: 16.94, lng: 43.76, zoom: 11 },
  عمران: { lat: 15.66, lng: 43.94, zoom: 11 },
  البيضاء: { lat: 13.97, lng: 45.57, zoom: 10 },
  لحج: { lat: 13.05, lng: 44.88, zoom: 10 },
  أبين: { lat: 13.32, lng: 46.0, zoom: 10 },
  شبوة: { lat: 14.55, lng: 46.85, zoom: 9 },
  المهرة: { lat: 16.6, lng: 52.15, zoom: 9 },
  مأرب: { lat: 15.47, lng: 45.32, zoom: 10 },
  الجوف: { lat: 16.15, lng: 44.85, zoom: 9 },
  الضالع: { lat: 13.7, lng: 44.73, zoom: 11 },
  ريمة: { lat: 14.63, lng: 43.72, zoom: 11 },
  المحويت: { lat: 15.47, lng: 43.55, zoom: 11 },
  الوديعة: { lat: 17.45, lng: 47.1, zoom: 10 },
};

export type LatLng = { lat: number; lng: number };

export type LocationErrorCode =
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';

export type LocationResult =
  | { ok: true; coords: LatLng }
  | { ok: false; code: LocationErrorCode; message: string };

/** نصف قطر البحث في الجوار (كم) */
export const NEARBY_RADIUS_KM = 40;

export function getGovernorateCenter(governorate: string): LatLng & { zoom: number } {
  return (
    GOVERNORATE_COORDS[governorate] ?? {
      lat: 15.5527,
      lng: 48.5164,
      zoom: 6,
    }
  );
}

/** مسافة Haversine بالكيلومتر */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isValidCoords(lat?: number | null, lng?: number | null): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function getCurrentPosition(options?: PositionOptions): Promise<LocationResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({
      ok: false,
      code: 'unsupported',
      message: 'جهازك لا يدعم تحديد الموقع',
    });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          coords: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({
            ok: false,
            code: 'denied',
            message: 'تم رفض إذن الموقع',
          });
        } else if (err.code === err.TIMEOUT) {
          resolve({
            ok: false,
            code: 'timeout',
            message: 'انتهت مهلة تحديد الموقع',
          });
        } else {
          resolve({
            ok: false,
            code: 'unavailable',
            message: 'خدمة الموقع غير مفعّلة على الجهاز',
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30_000,
        ...options,
      }
    );
  });
}

/**
 * يفتح صفحة إعدادات الموقع في الجهاز قدر الإمكان (Android / iOS)،
 * ثم يعيد طلب الإذن عبر المتصفح.
 */
export function openDeviceLocationSettings(): void {
  if (typeof window === 'undefined') return;

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  try {
    if (isAndroid) {
      // Intent لفتح إعدادات الموقع على أندرويد (يعمل في Chrome / WebView)
      const intent =
        'intent://settings#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end';
      window.location.href = intent;
      return;
    }
    if (isIOS) {
      // روابط تفضيلات iOS (قد تُحظر في Safari؛ نحاول عدة مسارات)
      const links = [
        'App-Prefs:Privacy&path=LOCATION',
        'prefs:root=Privacy&path=LOCATION',
        'App-prefs:root=Privacy&path=LOCATION',
      ];
      window.location.href = links[0];
      return;
    }
  } catch {
    // تجاهل — سنعتمد على طلب الإذن من المتصفح
  }

  // سطح المكتب / احتياطي: إعادة طلب الإذن تفتح نافذة المتصفح إن أمكن
  navigator.geolocation?.getCurrentPosition(
    () => {},
    () => {},
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

/** بعد العودة من الإعدادات: انتظر ظهور الصفحة ثم اسحب الموقع */
export function watchVisibilityAndLocate(
  onResult: (result: LocationResult) => void,
  timeoutMs = 60_000
): () => void {
  let done = false;
  const finish = (result: LocationResult) => {
    if (done) return;
    done = true;
    cleanup();
    onResult(result);
  };

  const tryLocate = async () => {
    if (document.visibilityState !== 'visible') return;
    const result = await getCurrentPosition({ maximumAge: 0 });
    if (result.ok) finish(result);
  };

  const onVis = () => {
    void tryLocate();
  };

  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('focus', onVis);

  const timer = window.setTimeout(() => {
    finish({
      ok: false,
      code: 'timeout',
      message: 'لم يتم تفعيل الموقع بعد',
    });
  }, timeoutMs);

  const cleanup = () => {
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('focus', onVis);
    window.clearTimeout(timer);
  };

  // محاولة فورية أيضًا
  void tryLocate();

  return cleanup;
}

type NominatimAddress = Record<string, string | undefined>;

const AMENITY_AR: Record<string, string> = {
  school: 'مدرسة',
  university: 'جامعة',
  college: 'كلية',
  kindergarten: 'روضة',
  mosque: 'مسجد',
  place_of_worship: 'دار عبادة',
  hospital: 'مستشفى',
  clinic: 'عيادة',
  pharmacy: 'صيدلية',
  marketplace: 'سوق',
  supermarket: 'سوبرماركت',
  restaurant: 'مطعم',
  cafe: 'مقهى',
  bank: 'بنك',
  fuel: 'محطة وقود',
  police: 'مركز شرطة',
  post_office: 'بريد',
  library: 'مكتبة',
  community_centre: 'مركز مجتمعي',
  park: 'حديقة',
  playground: 'ملعب',
  stadium: 'ملعب رياضي',
  hotel: 'فندق',
  bus_station: 'محطة باصات',
};

function amenityPrefix(tags: Record<string, string | undefined>): string {
  const key = tags.amenity || tags.shop || tags.tourism || tags.leisure || tags.historic || '';
  const ar = AMENITY_AR[key];
  if (ar) return ar;
  if (tags.shop) return 'محل';
  if (tags.tourism) return 'معلم';
  if (tags.leisure) return 'مرفق';
  if (tags.historic) return 'معلم تاريخي';
  if (tags.building === 'school') return 'مدرسة';
  return '';
}

function haversineMeters(a: LatLng, b: LatLng): number {
  return distanceKm(a, b) * 1000;
}

type NearbyPlace = {
  name: string;
  meters: number;
  kind: string;
};

/** أقرب المعالم المسماة حول الإحداثيات عبر Overpass (OpenStreetMap) */
async function findNearestLandmarks(
  lat: number,
  lng: number,
  radiusM = 450,
  limit = 3
): Promise<NearbyPlace[]> {
  const query = `
[out:json][timeout:10];
(
  node(around:${radiusM},${lat},${lng})["name"]["amenity"];
  node(around:${radiusM},${lat},${lng})["name"]["shop"];
  node(around:${radiusM},${lat},${lng})["name"]["tourism"];
  node(around:${radiusM},${lat},${lng})["name"]["leisure"];
  node(around:${radiusM},${lat},${lng})["name"]["historic"];
  node(around:${radiusM},${lat},${lng})["name"]["office"];
  way(around:${radiusM},${lat},${lng})["name"]["amenity"];
  way(around:${radiusM},${lat},${lng})["name"]["shop"];
  way(around:${radiusM},${lat},${lng})["name"]["tourism"];
  way(around:${radiusM},${lat},${lng})["name"]["leisure"];
  way(around:${radiusM},${lat},${lng})["name"]["building"~"school|university|mosque|hospital"];
);
out center ${Math.max(limit * 8, 24)};
`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return [];

    const data = (await res.json()) as {
      elements?: Array<{
        type: string;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };

    const origin = { lat, lng };
    const places: NearbyPlace[] = [];
    const seen = new Set<string>();

    for (const el of data.elements ?? []) {
      const name = el.tags?.['name:ar'] || el.tags?.name;
      if (!name || name.length < 2) continue;
      const pLat = el.lat ?? el.center?.lat;
      const pLng = el.lon ?? el.center?.lon;
      if (pLat == null || pLng == null) continue;
      const key = name.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const kind = amenityPrefix(el.tags ?? {});
      places.push({
        name: name.trim(),
        meters: haversineMeters(origin, { lat: pLat, lng: pLng }),
        kind,
      });
    }

    return places.sort((a, b) => a.meters - b.meters).slice(0, limit);
  } catch {
    return [];
  }
}

function pickAreaName(address?: NominatimAddress): string | undefined {
  if (!address) return undefined;
  return (
    address.neighbourhood ||
    address.suburb ||
    address.quarter ||
    address.city_district ||
    address.village ||
    address.hamlet ||
    address.residential ||
    address.locality ||
    address.city_block
  );
}

function pickCityName(address?: NominatimAddress, fallback?: string): string | undefined {
  if (!address) return fallback;
  return (
    address.city ||
    address.town ||
    address.municipality ||
    address.state ||
    address.county ||
    fallback
  );
}

/** بناء عنوان عربي مفصل من Nominatim + أقرب المعالم */
export function formatPlaceLabel(
  address?: NominatimAddress,
  displayName?: string,
  governorateFallback?: string,
  nearby?: NearbyPlace[]
): string {
  const parts: string[] = [];
  const city = pickCityName(address, governorateFallback);
  const area = pickAreaName(address);
  const road = address?.road || address?.pedestrian || address?.path || address?.residential;
  const house = address?.house_number;
  const namedPlace = address?.amenity || address?.building || address?.shop || address?.tourism;

  if (city) parts.push(city);
  if (area && area !== city) parts.push(area);
  if (road && road !== area) {
    parts.push(house ? `${road} رقم ${house}` : road);
  }

  // معلم من نتيجة reverse نفسها
  if (namedPlace && namedPlace !== area && namedPlace !== road) {
    parts.push(`جوار ${namedPlace}`);
  }

  // أقرب المعالم من Overpass (الأدق محليًا)
  if (nearby && nearby.length > 0) {
    const top = nearby[0];
    const label =
      top.kind && !top.name.includes(top.kind)
        ? `جوار ${top.kind} ${top.name}`
        : `جوار ${top.name}`;
    // تجنب التكرار إن كان نفس الاسم موجودًا
    if (!parts.some((p) => p.includes(top.name))) {
      parts.push(label);
    }
    // معلم ثانٍ إن كان قريبًا جدًا (< 180م) ويضيف معلومة
    if (nearby[1] && nearby[1].meters < 180) {
      const second = nearby[1];
      if (!parts.some((p) => p.includes(second.name))) {
        const secondLabel =
          second.kind && !second.name.includes(second.kind)
            ? `قرب ${second.kind} ${second.name}`
            : `قرب ${second.name}`;
        parts.push(secondLabel);
      }
    }
  }

  if (parts.length >= 2) {
    return parts.slice(0, 4).join('، ');
  }

  if (displayName) {
    const fromDisplay = displayName
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
    if (fromDisplay.length > 0) return fromDisplay.join('، ');
  }

  return parts.join('، ') || governorateFallback || 'موقع على الخريطة';
}

/**
 * تحويل إحداثيات إلى عنوان مقروء دقيق:
 * 1) Nominatim للعناوين/الأحياء
 * 2) Overpass لأقرب المعالم المسماة (مدارس، مساجد، أسواق…)
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  governorateFallback?: string
): Promise<string | null> {
  if (!isValidCoords(lat, lng)) return null;

  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'jsonv2',
      'accept-language': 'ar',
      addressdetails: '1',
      namedetails: '1',
      extratags: '1',
      zoom: '18',
    });

    const [nominatimRes, nearby] = await Promise.all([
      fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      }),
      findNearestLandmarks(lat, lng, 450, 3),
    ]);

    let address: NominatimAddress | undefined;
    let displayName: string | undefined;

    if (nominatimRes.ok) {
      const data = (await nominatimRes.json()) as {
        address?: NominatimAddress;
        display_name?: string;
        name?: string;
        namedetails?: Record<string, string>;
      };
      address = data.address;
      // فضّل الاسم العربي للمكان إن وُجد
      const arName = data.namedetails?.name_ar || data.namedetails?.['name:ar'];
      displayName = data.display_name;
      if (arName && address && !address.amenity) {
        address = { ...address, amenity: arName };
      } else if (data.name && address && !pickAreaName(address) && !address.amenity) {
        address = { ...address, amenity: data.name };
      }
    }

    const label = formatPlaceLabel(address, displayName, governorateFallback, nearby);
    return label;
  } catch {
    return governorateFallback ?? null;
  }
}
