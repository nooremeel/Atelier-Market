// jsdom's Blob/File implementation makes MSW's `request.formData()` hang on a
// multipart body that contains a file part. Use Node's spec-compliant versions
// so the interceptor can parse the upload. Must run before msw/interceptors load.
import { File as NodeFile, Blob as NodeBlob } from 'node:buffer';
globalThis.File = NodeFile as unknown as typeof File;
globalThis.Blob = NodeBlob as unknown as typeof Blob;

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { server } from '../../test/server';
import { queryClient } from '../../lib/queryClient';
import { ToastProvider } from '../../components/ToastProvider';
import { AdminFormPage } from './AdminFormPage';

beforeEach(() => { queryClient.clear(); });

function wrap(ui: ReactNode, path = '/admin/products/new') {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/admin/products/new" element={ui} />
            <Route path="/admin/products/:id/edit" element={ui} />
            <Route path="/admin/products" element={<div>admin list</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

it('creates a product and returns to the list', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/admin/products', () => {
      return HttpResponse.json({ product: { _id: 'p9', title: 'Amber Mist', price: 42, description: 'd', imageUrl: 'i', userId: 'u' } }, { status: 201 });
    }),
  );
  render(wrap(<AdminFormPage mode="create" />));
  await userEvent.type(screen.getByLabelText(/title/i), 'Amber Mist');
  await userEvent.type(screen.getByLabelText(/price/i), '42');
  await userEvent.type(screen.getByLabelText(/description/i), 'A warm amber scent');
  const file = new File(['x'], 'a.png', { type: 'image/png' });
  await userEvent.upload(screen.getByLabelText(/image/i), file);
  await userEvent.click(screen.getByRole('button', { name: /save product/i }));
  expect(await screen.findByText('admin list')).toBeInTheDocument();
});

it('shows a 422 banner', async () => {
  server.use(
    http.get('/api/csrf-token', () => HttpResponse.json({ csrfToken: 't' })),
    http.post('/api/admin/products', () => HttpResponse.json({ errorMessage: 'Please enter a valid price', validationErrors: [{ path: 'price', msg: 'Please enter a valid price' }] }, { status: 422 })),
  );
  render(wrap(<AdminFormPage mode="create" />));
  await userEvent.type(screen.getByLabelText(/title/i), 'X');
  await userEvent.type(screen.getByLabelText(/description/i), 'long enough');
  const file = new File(['x'], 'a.png', { type: 'image/png' });
  await userEvent.upload(screen.getByLabelText(/image/i), file);
  await userEvent.click(screen.getByRole('button', { name: /save product/i }));
  expect(await screen.findByText('Please enter a valid price')).toBeInTheDocument();
});
