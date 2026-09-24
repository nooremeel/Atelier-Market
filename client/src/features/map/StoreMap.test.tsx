import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StoreMap, type StoreMapMarker } from './StoreMap';
import { MemoryRouter } from 'react-router-dom';

// Mock react-leaflet for JSDOM
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom }: any) => (
    <div data-testid="mock-map-container" data-center={JSON.stringify(center)} data-zoom={zoom}>
      {children}
    </div>
  ),
  TileLayer: ({ url }: any) => <div data-testid="mock-tile-layer" data-url={url} />,
  Marker: ({ position, children, eventHandlers }: any) => (
    <div
      data-testid="mock-marker"
      data-position={JSON.stringify(position)}
      onClick={eventHandlers?.click}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="mock-popup">{children}</div>,
  useMap: () => ({
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
    getZoom: vi.fn(() => 12),
  }),
}));

const mockMarkers: StoreMapMarker[] = [
  {
    id: 'm1',
    lat: 26.2235,
    lng: 50.5876,
    title: 'Al-Rashidi Ceramics',
    subtitle: 'Wheel-thrown stoneware',
    city: 'Manama',
    country: 'Bahrain',
    link: '/sellers/s1',
  },
  {
    id: 'm2',
    lat: 30.0444,
    lng: 31.2357,
    title: 'Khalil Bindery',
    subtitle: 'Leather & bookbinding',
    city: 'Cairo',
    country: 'Egypt',
    link: '/sellers/s2',
  },
];

describe('StoreMap', () => {
  it('renders map container and markers', () => {
    render(
      <MemoryRouter>
        <StoreMap markers={mockMarkers} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('store-map-container')).toBeInTheDocument();
    expect(screen.getByTestId('mock-map-container')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-marker')).toHaveLength(2);
    expect(screen.getByText('Al-Rashidi Ceramics')).toBeInTheDocument();
    expect(screen.getByText('Khalil Bindery')).toBeInTheDocument();
  });

  it('triggers onSelectMarker when a marker is clicked', () => {
    const onSelect = vi.fn();
    render(
      <MemoryRouter>
        <StoreMap markers={mockMarkers} onSelectMarker={onSelect} />
      </MemoryRouter>
    );

    const markers = screen.getAllByTestId('mock-marker');
    fireEvent.click(markers[0]);
    expect(onSelect).toHaveBeenCalledWith(mockMarkers[0]);
  });

  it('filters out invalid NaN or null coordinates gracefully', () => {
    const mixedMarkers: StoreMapMarker[] = [
      ...mockMarkers,
      {
        id: 'm3',
        lat: NaN,
        lng: NaN,
        title: 'Invalid Marker',
      },
    ];

    render(
      <MemoryRouter>
        <StoreMap markers={mixedMarkers} />
      </MemoryRouter>
    );

    // Only 2 valid markers rendered
    expect(screen.getAllByTestId('mock-marker')).toHaveLength(2);
  });
});
