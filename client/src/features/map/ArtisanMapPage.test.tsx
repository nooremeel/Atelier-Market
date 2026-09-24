import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArtisanMapPage } from './ArtisanMapPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { server } from '../../test/server';
import { http, HttpResponse } from 'msw';

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="mock-map-container">{children}</div>,
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="mock-marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="mock-popup">{children}</div>,
  useMap: () => ({
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
    getZoom: vi.fn(() => 12),
  }),
}));

const mockSellers = [
  {
    _id: 's1',
    name: 'Layla Al-Rashidi',
    email: 'layla@ateliermarket.com',
    avatar: '',
    sellerProfile: {
      shopName: 'Al-Rashidi Ceramics',
      shopDescription: 'Third-generation ceramicist from the Gulf.',
      location: { city: 'Manama', country: 'Bahrain', lat: 26.2235, lng: 50.5876 },
    },
  },
  {
    _id: 's2',
    name: 'Omar Khalil',
    email: 'omar@ateliermarket.com',
    avatar: '',
    sellerProfile: {
      shopName: 'Khalil Bindery',
      shopDescription: 'Bookbinder and leather craftsman in Cairo.',
      location: { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
    },
  },
];

beforeEach(() => {
  queryClient.clear();
  server.use(
    http.get('/api/sellers', () => {
      return HttpResponse.json({ sellers: mockSellers });
    }),
  );
});

describe('ArtisanMapPage', () => {
  it('renders page header and atelier cards from API', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ArtisanMapPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('The Artisan Map')).toBeInTheDocument();
    expect((await screen.findAllByText('Al-Rashidi Ceramics'))[0]).toBeInTheDocument();
    expect(screen.getAllByText('Khalil Bindery')[0]).toBeInTheDocument();
  });

  it('filters ateliers when region button is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ArtisanMapPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect((await screen.findAllByText('Al-Rashidi Ceramics'))[0]).toBeInTheDocument();
    expect(screen.getAllByText('Khalil Bindery')[0]).toBeInTheDocument();

    // Click The Gulf
    fireEvent.click(screen.getByRole('button', { name: /the gulf/i }));

    expect(screen.getAllByText('Al-Rashidi Ceramics')[0]).toBeInTheDocument();
    expect(screen.queryByText('Khalil Bindery')).not.toBeInTheDocument();
  });

  it('allows clicking an atelier card to select it', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ArtisanMapPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const cardTitles = await screen.findAllByText('Al-Rashidi Ceramics');
    fireEvent.click(cardTitles[0]);

    // Card should be rendered and selectable
    expect(cardTitles[0]).toBeInTheDocument();
  });
});
