'use client';

import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { Profile } from '@/lib/supabase';
import { getCategoryName } from '@/lib/constants';
import { isValidCoords, type LatLng } from '@/lib/geo';
import 'leaflet/dist/leaflet.css';

function FitBounds({
  points,
  user,
}: {
  points: LatLng[];
  user?: LatLng | null;
}) {
  const map = useMap();
  useEffect(() => {
    const all = [...points];
    if (user && isValidCoords(user.lat, user.lng)) all.push(user);
    if (all.length === 0) return;
    if (all.length === 1) {
      map.setView([all[0].lat, all[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(all.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
  }, [map, points, user]);
  return null;
}

function Recenter({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

function createProviderIcon(avatarUrl: string | null, name: string) {
  const initials = name.trim().slice(0, 1) || '؟';
  const img = avatarUrl
    ? `<img src="${avatarUrl.replace(/"/g, '')}" alt="" class="provider-marker-avatar" />`
    : `<span class="provider-marker-initial">${initials}</span>`;

  return L.divIcon({
    className: 'provider-map-marker',
    html: `
      <div class="provider-marker-wrap">
        <div class="provider-marker-avatar-ring">${img}</div>
        <div class="provider-marker-pin"></div>
      </div>
    `,
    iconSize: [48, 62],
    iconAnchor: [24, 58],
    popupAnchor: [0, -52],
  });
}

export type MapProvider = Profile & {
  avgRating?: number;
  distanceKm?: number;
};

export function ProvidersMap({
  providers,
  userLocation,
  center,
  zoom = 12,
  height = 280,
  onSelectProvider,
  interactive = true,
  showUserDot = true,
  className = '',
}: {
  providers: MapProvider[];
  userLocation?: LatLng | null;
  center: LatLng;
  zoom?: number;
  height?: number | string;
  onSelectProvider?: (p: MapProvider) => void;
  interactive?: boolean;
  showUserDot?: boolean;
  className?: string;
}) {
  const points = useMemo(
    () =>
      providers
        .filter((p) => isValidCoords(p.latitude, p.longitude))
        .map((p) => ({ lat: p.latitude!, lng: p.longitude! })),
    [providers]
  );

  return (
    <div
      className={`providers-map-shell relative w-full overflow-hidden rounded-2xl border border-border/50 ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        className="h-full w-full z-0"
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        <Recenter center={center} zoom={zoom} />
        {points.length > 0 && <FitBounds points={points} user={userLocation} />}

        {showUserDot && userLocation && isValidCoords(userLocation.lat, userLocation.lng) && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={8}
            pathOptions={{
              color: '#0071E3',
              fillColor: '#0071E3',
              fillOpacity: 0.9,
              weight: 3,
            }}
          >
            <Popup>موقعك الحالي</Popup>
          </CircleMarker>
        )}

        {providers.map((p) => {
          if (!isValidCoords(p.latitude, p.longitude)) return null;
          const icon = createProviderIcon(p.avatar_url, p.full_name);
          return (
            <Marker
              key={p.id}
              position={[p.latitude!, p.longitude!]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectProvider?.(p),
              }}
            >
              <Popup>
                <div className="text-right min-w-[140px]" dir="rtl">
                  <div className="font-bold text-sm">{p.full_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {getCategoryName(p.service_category ?? '')}
                  </div>
                  {typeof p.distanceKm === 'number' && (
                    <div className="text-[11px] text-primary mt-1 font-medium">
                      على بعد {p.distanceKm < 1
                        ? `${Math.round(p.distanceKm * 1000)} م`
                        : `${p.distanceKm.toFixed(1)} كم`}
                    </div>
                  )}
                  {onSelectProvider && (
                    <button
                      type="button"
                      className="mt-2 w-full text-xs font-semibold text-primary"
                      onClick={() => onSelectProvider(p)}
                    >
                      عرض الملف
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

/** خريطة معاينة بسيطة أثناء التسجيل (نقطة واحدة قابلة للتحريك بصريًا فقط) */
export function LocationPreviewMap({
  location,
  zoom = 14,
  height = 160,
}: {
  location: LatLng;
  zoom?: number;
  height?: number;
}) {
  return (
    <div
      className="providers-map-shell relative w-full overflow-hidden rounded-xl border border-border/50"
      style={{ height }}
    >
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={zoom}
        className="h-full w-full z-0"
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Recenter center={location} zoom={zoom} />
        <CircleMarker
          center={[location.lat, location.lng]}
          radius={10}
          pathOptions={{
            color: '#0071E3',
            fillColor: '#0071E3',
            fillOpacity: 0.85,
            weight: 3,
          }}
        />
      </MapContainer>
    </div>
  );
}

function createLabeledPinIcon(label: string) {
  const safe = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return L.divIcon({
    className: 'request-map-marker',
    html: `
      <div class="request-marker-wrap">
        <div class="request-marker-label">${safe}</div>
        <div class="request-marker-pin-stem">
          <div class="request-marker-dot"></div>
          <div class="request-marker-point"></div>
        </div>
      </div>
    `,
    iconSize: [230, 86],
    iconAnchor: [115, 82],
  });
}

/** خريطة موقع طلب الخدمة مع ملاحظة العنوان فوق الأيقونة */
export function RequestLocationMap({
  location,
  label,
  zoom = 16,
  height = '100%',
  interactive = true,
}: {
  location: LatLng;
  label: string;
  zoom?: number;
  height?: number | string;
  interactive?: boolean;
}) {
  const icon = useMemo(() => createLabeledPinIcon(label || 'موقع الخدمة'), [label]);

  return (
    <div
      className="providers-map-shell relative w-full overflow-hidden rounded-2xl border border-border/50"
      style={{ height }}
    >
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={zoom}
        className="h-full w-full z-0"
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OSM'
        />
        <Recenter center={location} zoom={zoom} />
        <Marker position={[location.lat, location.lng]} icon={icon}>
          <Popup>
            <div className="text-right text-sm font-medium" dir="rtl">
              {label || 'موقع الخدمة'}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

