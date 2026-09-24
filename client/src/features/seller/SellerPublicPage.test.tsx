import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SellerPublicPage } from './SellerPublicPage';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { server } from '../../test/server';
import { http, HttpResponse } from 'msw';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../components/ToastProvider';

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

const mockSellerData = {
  seller: {
    _id: 's1',
    name: 'Layla Al-Rashidi',
    email: 'layla@ateliermarket.com',
    avatar: '',
    createdAt: '2023-01-15T00:00:00.000Z',
    sellerProfile: {
      shopName: 'Al-Rashidi Ceramics',
      shopDescription: 'Third-generation ceramicist from the Gulf.',
      location: { city: 'Manama', country: 'Bahrain', lat: 26.2235, lng: 50.5876 },
    },
  },
  products: [
    {
      _id: 'p1',
      title: 'Artisanal Ceramic Vessel',
      price: 185,
      description: 'Wheel-thrown stoneware.',
      imageUrl: '/images/ceramics.jpg',
      userId: 's1',
    },
  ],
};

beforeEach(() => {
  queryClient.clear();
  server.use(
    http.get('/api/sellers/s1', () => HttpResponse.json(mockSellerData)),
    http.get('/api/sellers/unknown', () => HttpResponse.json({ message: 'Seller not found' }, { status: 404 })),
    http.get('/api/favourites', () => HttpResponse.json({ favourites: [] })),
  );
});

function renderPage(sellerId = 's1') {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[`/sellers/${sellerId}`]}>
            <Routes>
              <Route path="/sellers/:id" element={<SellerPublicPage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('SellerPublicPage', () => {
  it('renders studio name, artisan lead, location, and piece collection', async () => {
    renderPage('s1');

    expect(await screen.findByRole('heading', { level: 1, name: 'Al-Rashidi Ceramics' })).toBeInTheDocument();
    expect(screen.getByText(/Layla Al-Rashidi/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Manama, Bahrain/i)[0]).toBeInTheDocument();
    expect(screen.getByText('Artisanal Ceramic Vessel')).toBeInTheDocument();
    expect(screen.getByText('$185.00')).toBeInTheDocument();
  });

  it('shows not-found state for nonexistent seller', async () => {
    renderPage('unknown');

    expect(await screen.findByText(/atelier not found/i)).toBeInTheDocument();
  });
});
