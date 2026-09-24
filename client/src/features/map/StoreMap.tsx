import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { Link } from '../../components/Link';

export type StoreMapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  city?: string;
  country?: string;
  avatar?: string;
  link?: string;
  linkText?: string;
};

export type StoreMapProps = {
  markers: StoreMapMarker[];
  selectedId?: string;
  onSelectMarker?: (marker: StoreMapMarker) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string | number;
  interactive?: boolean;
  showControls?: boolean;
};

// Custom gold-leaf map pin adhering to Atelier Noir luxury aesthetic
function createAtelierPinIcon(selected = false) {
  const size = selected ? 34 : 28;
  const pinColor = '#c5a880'; // gold-leaf
  const darkPinColor = '#d4af37';

  return L.divIcon({
    className: 'atelier-custom-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size + 6}px; cursor: pointer; transition: transform 0.25s ease;">
        ${selected ? `<span style="position: absolute; width: ${size + 14}px; height: ${size + 14}px; border-radius: 9999px; background: rgba(197, 168, 128, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>` : ''}
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 9999px;
          background: #141416;
          border: 2px solid ${selected ? darkPinColor : pinColor};
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        ">
          <div style="
            width: ${selected ? 10 : 8}px;
            height: ${selected ? 10 : 8}px;
            border-radius: 9999px;
            background: ${selected ? darkPinColor : pinColor};
          "></div>
        </div>
        <div style="
          position: absolute;
          bottom: 2px;
          width: 6px;
          height: 6px;
          background: ${selected ? darkPinColor : pinColor};
          transform: rotate(45deg);
          z-index: 1;
        "></div>
      </div>
    `,
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 4],
    popupAnchor: [0, -(size + 4)],
  });
}

// Controller to fly to active marker when selected
function MapFlyController({
  center,
  zoom,
  markers,
  selectedId,
}: {
  center?: [number, number];
  zoom?: number;
  markers: StoreMapMarker[];
  selectedId?: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedId) {
      const selected = markers.find((m) => m.id === selectedId);
      if (selected && !isNaN(selected.lat) && !isNaN(selected.lng)) {
        map.flyTo([selected.lat, selected.lng], zoom ?? 13, { duration: 1.2 });
        return;
      }
    }

    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom ?? map.getZoom(), { duration: 1.2 });
    } else if (markers.length > 1) {
      const validMarkers = markers.filter((m) => !isNaN(m.lat) && !isNaN(m.lng));
      if (validMarkers.length > 1) {
        const bounds = L.latLngBounds(validMarkers.map((m) => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [center, zoom, selectedId, markers, map]);

  return null;
}

export function StoreMap({
  markers,
  selectedId,
  onSelectMarker,
  center,
  zoom = 5,
  className = '',
  height = '420px',
  interactive = true,
  showControls = true,
}: StoreMapProps) {
  const { isDark } = useTheme();
  const { isArabic } = useI18n();

  // Filter valid markers
  const validMarkers = useMemo(
    () => markers.filter((m) => typeof m.lat === 'number' && typeof m.lng === 'number' && !isNaN(m.lat) && !isNaN(m.lng)),
    [markers],
  );

  // Compute default center (Gulf & Levant region center: [27.5, 42.0])
  const initialCenter: [number, number] = useMemo(() => {
    if (center) return center;
    if (validMarkers.length === 1) return [validMarkers[0].lat, validMarkers[0].lng];
    if (validMarkers.length > 1) {
      const avgLat = validMarkers.reduce((sum, m) => sum + m.lat, 0) / validMarkers.length;
      const avgLng = validMarkers.reduce((sum, m) => sum + m.lng, 0) / validMarkers.length;
      return [avgLat, avgLng];
    }
    return [27.5, 42.0]; // Default region center
  }, [center, validMarkers]);

  const initialZoom = useMemo(() => {
    if (zoom) return zoom;
    if (validMarkers.length === 1) return 12;
    return 5;
  }, [zoom, validMarkers.length]);

  // CartoDB Tile URL based on theme
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div
      data-testid="store-map-container"
      className={`relative overflow-hidden rounded-sm border border-hairline/80 shadow-luxury ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        zoomControl={showControls}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          key={isDark ? 'carto-dark' : 'carto-light'}
          url={tileUrl}
          attribution={attribution}
          subdomains={['a', 'b', 'c', 'd']}
          maxZoom={19}
        />

        <MapFlyController
          center={center}
          zoom={zoom}
          markers={validMarkers}
          selectedId={selectedId}
        />

        {validMarkers.map((marker) => {
          const isSelected = marker.id === selectedId;
          const icon = createAtelierPinIcon(isSelected);

          return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectMarker) onSelectMarker(marker);
                },
              }}
            >
              <Popup>
                <div className="p-3.5 max-w-[240px] text-start">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-gold-leaf"></span>
                    <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-medium text-gold-leaf">
                      {marker.city && marker.country
                        ? `${marker.city}, ${marker.country}`
                        : marker.city || marker.country || 'Atelier'}
                    </span>
                  </div>
                  <h4 className="font-display text-step-1 text-ink font-normal leading-snug">
                    {marker.title}
                  </h4>
                  {marker.subtitle && (
                    <p className="font-sans text-[0.75rem] text-stone mt-1 line-clamp-2 leading-relaxed">
                      {marker.subtitle}
                    </p>
                  )}
                  {marker.link && (
                    <div className="mt-3 pt-2 border-t border-hairline/60">
                      <Link
                        to={marker.link}
                        className="inline-flex items-center gap-1 font-sans text-[0.6875rem] tracking-[0.16em] uppercase font-medium text-gold-leaf hover:underline"
                      >
                        <span>{marker.linkText || (isArabic ? 'استكشف الورشة' : 'Explore Studio')}</span>
                        <span aria-hidden="true">{isArabic ? '←' : '→'}</span>
                      </Link>
                    </div>
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
