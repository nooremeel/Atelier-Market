import { useState } from 'react';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Select } from '../components/Select';
import { Textarea } from '../components/Textarea';
import { Checkbox } from '../components/Checkbox';
import { Radio } from '../components/Radio';
import { QuantityStepper } from '../components/QuantityStepper';
import { Spinner } from '../components/Spinner';
import { Skeleton } from '../components/Skeleton';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { Breadcrumb } from '../components/Breadcrumb';
import { Price } from '../components/Price';
import { Tag } from '../components/Tag';
import { Rule } from '../components/Rule';
import { RatingStars } from '../components/RatingStars';
import { Wordmark } from '../components/Wordmark';
import { ProductCard } from '../components/ProductCard';
import { ProductGrid } from '../components/ProductGrid';
import { CartLineItem } from '../components/CartLineItem';
import { OrderSummary } from '../components/OrderSummary';
import { FormLayout } from '../components/FormLayout';
import { AdminTable } from '../components/AdminTable';
import { useToast } from '../components/ToastProvider';
import type { Product } from '../types';

const DEMO_PRODUCT: Product = {
  _id: 'demo',
  title: 'Amber Mist',
  price: 42.5,
  description: 'A warm amber and cedar fragrance with a long dry-down.',
  imageUrl: 'images/placeholder.jpg',
  userId: 'u',
};

const COLOR_TOKENS: Array<{ name: string; className: string }> = [
  { name: 'najd', className: 'bg-najd' },
  { name: 'plaster', className: 'bg-plaster' },
  { name: 'ink', className: 'bg-ink' },
  { name: 'gold-leaf', className: 'bg-gold-leaf' },
  { name: 'peacock', className: 'bg-peacock' },
  { name: 'oxblood', className: 'bg-oxblood' },
  { name: 'stone', className: 'bg-stone' },
  { name: 'silk', className: 'bg-silk' },
  { name: 'charcoal', className: 'bg-charcoal' },
  { name: 'canvas', className: 'bg-canvas' },
];

const TYPE_STEPS = ['text-step--1', 'text-step-0', 'text-step-1', 'text-step-2', 'text-step-3', 'text-step-4', 'text-step-5'];

export function Styleguide() {
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [page, setPage] = useState(2);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 flex flex-col gap-16">
      <h1 className="text-step-5">Design system</h1>

      <section aria-labelledby="sg-color">
        <h2 id="sg-color" className="text-step-3 mb-4">Color</h2>
        <div className="flex flex-wrap gap-4">
          {COLOR_TOKENS.map((t) => (
            <div key={t.name} className="flex flex-col gap-1">
              <div className={`h-16 w-24 border border-hairline rounded-sm ${t.className}`} />
              <span className="font-sans text-step--1 text-ink">{t.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="sg-type">
        <h2 id="sg-type" className="text-step-3 mb-4">Typography</h2>
        <div className="flex flex-col gap-2">
          {TYPE_STEPS.map((step) => (
            <p key={step} className={step}>{step} — The quick brown fox</p>
          ))}
          <p className="font-display text-step-2">font-display — Cormorant Garamond &amp; Marcellus luxury serif</p>
          <p className="font-sans text-step-0">font-sans — Plus Jakarta Sans &amp; IBM Plex Sans Arabic body sample</p>
        </div>
      </section>

      <section aria-labelledby="sg-primitives">
        <h2 id="sg-primitives" className="text-step-3 mb-4">Primitives</h2>
        <div className="flex flex-wrap items-center gap-6">
          <Price value={42.5} compareAt={60} />
          <Tag tone="peacock">Peacock</Tag>
          <Tag tone="gold">Gold</Tag>
          <Tag tone="oxblood">Oxblood</Tag>
          <RatingStars value={4} />
          <span className="inline-block bg-najd px-3 py-2 rounded-sm"><Wordmark /></span>
        </div>
        <Rule className="mt-4" />
      </section>

      <section aria-labelledby="sg-buttons">
        <h2 id="sg-buttons" className="text-step-3 mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      </section>

      <section aria-labelledby="sg-forms">
        <h2 id="sg-forms" className="text-step-3 mb-4">Forms</h2>
        <div className="flex flex-col gap-4 max-w-measure">
          <Field label="Full name" name="name" />
          <Field label="Email" name="email" hint="We never share your email." />
          <Field label="Password" name="password" type="password" error="Password is too short." />
          <Select
            label="Country"
            name="country"
            options={[
              { value: 'sa', label: 'Saudi Arabia' },
              { value: 'ae', label: 'United Arab Emirates' },
              { value: 'eg', label: 'Egypt' },
            ]}
          />
          <Textarea label="Notes" name="notes" hint="Optional." />
          <Checkbox label="Subscribe to the newsletter" name="subscribe" />
          <div className="flex flex-col gap-2">
            <Radio label="Standard shipping" name="shipping" value="standard" defaultChecked />
            <Radio label="Express shipping" name="shipping" value="express" />
          </div>
          <QuantityStepper value={qty} onChange={setQty} />
        </div>
      </section>

      <section aria-labelledby="sg-feedback">
        <h2 id="sg-feedback" className="text-step-3 mb-4">Feedback</h2>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <Spinner />
            <Button onClick={() => notify('Saved', 'success')}>Trigger toast</Button>
            <Button variant="destructive" onClick={() => notify('Something failed', 'error')}>Trigger error toast</Button>
            <Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button>
          </div>
          <div className="flex flex-col gap-2 max-w-measure">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Breadcrumb
            items={[
              { label: 'Shop', to: '/' },
              { label: 'Products', to: '/products' },
              { label: 'Amber Mist' },
            ]}
          />
          <Pagination currentPage={page} lastPage={5} onNavigate={setPage} />
          <EmptyState
            title="No orders yet"
            description="When you place an order it will show up here."
            action={<Button>Browse products</Button>}
          />
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirm action">
            <p className="font-sans text-step-0 mb-4">This is a sample modal body rendered from the styleguide.</p>
            <Button onClick={() => setModalOpen(false)}>Close</Button>
          </Modal>
        </div>
      </section>

      <section aria-labelledby="sg-product-card">
        <h2 id="sg-product-card" className="text-step-3 mb-4">Product card</h2>
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ProductCard product={DEMO_PRODUCT} />
            <ProductCard product={DEMO_PRODUCT} onAddToCart={() => {}} adding />
          </div>
          <ProductGrid
            products={[DEMO_PRODUCT, { ...DEMO_PRODUCT, _id: 'demo2', title: 'Rose Water' }]}
            renderItem={(p) => <ProductCard product={p} />}
          />
        </div>
      </section>

      <section aria-labelledby="sg-cart-line">
        <h2 id="sg-cart-line" className="text-step-3 mb-4">Cart line item</h2>
        <CartLineItem
          line={{ product: DEMO_PRODUCT, quantity: 2 }}
          onIncrement={() => {}}
          onDecrement={() => {}}
          onRemove={() => {}}
        />
      </section>

      <section aria-labelledby="sg-order-summary">
        <h2 id="sg-order-summary" className="text-step-3 mb-4">Order summary</h2>
        <div className="max-w-xs">
          <OrderSummary totalItems={3} totalPrice={127.5} action={<Button className="w-full">Checkout</Button>} />
        </div>
      </section>

      <section aria-labelledby="sg-form-layout">
        <h2 id="sg-form-layout" className="text-step-3 mb-4">Form layout</h2>
        <FormLayout
          title="Sample form"
          error="Something needs fixing"
          onSubmit={(e) => e.preventDefault()}
          footer={<Button type="submit">Save</Button>}
        >
          <Field label="Name" name="name" />
        </FormLayout>
      </section>

      <section aria-labelledby="sg-admin-table">
        <h2 id="sg-admin-table" className="text-step-3 mb-4">Admin table</h2>
        <AdminTable
          columns={[
            { key: 'title', header: 'Title' },
            { key: 'price', header: 'Price' },
          ]}
          rows={[
            { id: '1', title: 'Amber Mist', price: '$42.50' },
            { id: '2', title: 'Rose Water', price: '$9.00' },
          ]}
        />
      </section>
    </div>
  );
}
