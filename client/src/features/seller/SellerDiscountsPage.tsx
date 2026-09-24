import { useState, type FormEvent } from 'react';
import { SellerNav } from './SellerNav';
import {
  useSellerDiscounts,
  useCreateDiscount,
  useToggleDiscount,
  useDeleteDiscount,
} from '../cart/useDiscount';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Field } from '../../components/Field';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { formatPrice } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import type { Discount } from '../../types';

export function SellerDiscountsPage() {
  const { data, isLoading } = useSellerDiscounts();
  const createDiscount = useCreateDiscount();
  const toggleDiscount = useToggleDiscount();
  const deleteDiscount = useDeleteDiscount();
  const { isArabic } = useI18n();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '15',
    minOrderAmount: '0',
    maxDiscount: '',
    usageLimit: '',
  });
  const [formError, setFormError] = useState('');

  const discounts: Discount[] = data?.discounts || [];

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanCode = form.code.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('Promo code is required.');
      return;
    }
    const val = parseFloat(form.discountValue);
    if (isNaN(val) || val <= 0) {
      setFormError('Discount value must be greater than zero.');
      return;
    }
    if (form.discountType === 'percentage' && val > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    createDiscount.mutate(
      {
        code: cleanCode,
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: val,
        minOrderAmount: parseFloat(form.minOrderAmount) || 0,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
      },
      {
        onSuccess: () => {
          setCreateModalOpen(false);
          setForm({
            code: '',
            description: '',
            discountType: 'percentage',
            discountValue: '15',
            minOrderAmount: '0',
            maxDiscount: '',
            usageLimit: '',
          });
        },
        onError: (err: Error) => {
          setFormError(err.message || 'Failed to create promo code');
        },
      }
    );
  };

  return (
    <div className="pb-16">
      <SellerNav activeTab="discounts" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-step-2 text-ink font-normal">
            {isArabic ? 'رموز الخصم والحملات الترويجية' : 'Promotional Campaigns & Codes'}
          </h2>
          <p className="font-sans text-stone text-[0.875rem] mt-1">
            {isArabic
              ? 'إنشاء وإدارة رموز الخصم التي يمكن للمتسوقين تطبيقها في سلة التسوق وصفحة الدفع.'
              : 'Create and manage coupon codes that customers can apply at cart and checkout.'}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => {
            setFormError('');
            setCreateModalOpen(true);
          }}
        >
          + {isArabic ? 'إنشاء رمز خصم جديد' : 'Create Promo Code'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : discounts.length === 0 ? (
        <EmptyState
          title={isArabic ? 'لا توجد رموز خصم حالياً' : 'No promo codes yet'}
          description={
            isArabic
              ? 'قم بإنشاء أول رمز خصم لمكافأة المتسوقين في مناسباتك ومجموعاتك.'
              : 'Create your first promotional code to reward collectors and buyers.'
          }
          action={
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setFormError('');
                setCreateModalOpen(true);
              }}
            >
              + {isArabic ? 'إنشاء رمز خصم جديد' : 'Create Promo Code'}
            </Button>
          }
        />
      ) : (
        <div className="border border-hairline/70 bg-canvas rounded-sm overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-[0.8125rem]">
              <thead className="bg-silk/40 border-b border-hairline/70 text-stone text-[0.6875rem] tracking-[0.16em] uppercase">
                <tr>
                  <th className="py-3.5 px-4 font-medium">{isArabic ? 'الرمز' : 'Code'}</th>
                  <th className="py-3.5 px-4 font-medium">{isArabic ? 'الخصم' : 'Discount'}</th>
                  <th className="py-3.5 px-4 font-medium">{isArabic ? 'الحد الأدنى' : 'Min Order'}</th>
                  <th className="py-3.5 px-4 font-medium">{isArabic ? 'الاستخدام' : 'Redemptions'}</th>
                  <th className="py-3.5 px-4 font-medium">{isArabic ? 'الحالة' : 'Status'}</th>
                  <th className="py-3.5 px-4 font-medium text-right">{isArabic ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/50">
                {discounts.map((d) => (
                  <tr key={d._id} className="hover:bg-silk/20 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-bold tracking-wider text-ink text-[0.875rem]">
                          {d.code}
                        </span>
                        {d.description && (
                          <span className="text-stone text-[0.75rem]">{d.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-oxblood">
                        {d.discountType === 'percentage'
                          ? `${d.discountValue}% OFF`
                          : `-${formatPrice(d.discountValue)}`}
                      </span>
                      {d.maxDiscount && (
                        <span className="text-stone text-[0.6875rem] block">
                          Up to {formatPrice(d.maxDiscount)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-stone tabular-nums">
                      {d.minOrderAmount > 0 ? formatPrice(d.minOrderAmount) : 'No minimum'}
                    </td>
                    <td className="py-4 px-4 tabular-nums text-stone">
                      <span className="font-medium text-ink">{d.usedCount}</span>
                      {d.usageLimit !== null ? ` / ${d.usageLimit}` : ' (unlimited)'}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-sm text-[0.6875rem] font-semibold tracking-wide uppercase ${
                          d.isActive
                            ? 'bg-peacock/10 text-peacock border border-peacock/30'
                            : 'bg-stone/10 text-stone border border-stone/30'
                        }`}
                      >
                        {d.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={toggleDiscount.isPending}
                          onClick={() => toggleDiscount.mutate(d._id)}
                        >
                          {d.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deleteDiscount.isPending}
                          onClick={() => deleteDiscount.mutate(d._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Promo Code Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={isArabic ? 'إنشاء رمز خصم جديد' : 'Create Promo Code'}
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-5">
          <Field
            label="Promo Code (uppercase, e.g. RAMADAN20)"
            type="text"
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="e.g. WELCOME10"
            required
          />

          <Field
            label="Description (Optional)"
            type="text"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="e.g. 15% off Ramadan Artisan Festival"
          />

          <div>
            <label className="block font-sans text-[0.75rem] tracking-[0.16em] uppercase text-stone mb-2 font-medium">
              Discount Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, discountType: 'percentage' }))}
                className={`py-2 px-3 text-center text-[0.8125rem] rounded-sm border font-medium transition-all ${
                  form.discountType === 'percentage'
                    ? 'bg-najd text-plaster border-najd dark:bg-gold-leaf dark:text-plaster dark:border-gold-leaf'
                    : 'bg-canvas text-stone border-hairline/70 hover:border-gold-leaf/60'
                }`}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, discountType: 'fixed' }))}
                className={`py-2 px-3 text-center text-[0.8125rem] rounded-sm border font-medium transition-all ${
                  form.discountType === 'fixed'
                    ? 'bg-najd text-plaster border-najd dark:bg-gold-leaf dark:text-plaster dark:border-gold-leaf'
                    : 'bg-canvas text-stone border-hairline/70 hover:border-gold-leaf/60'
                }`}
              >
                Fixed Amount ($)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={form.discountType === 'percentage' ? 'Percentage Value (%)' : 'Amount Value ($)'}
              type="number"
              min="1"
              max={form.discountType === 'percentage' ? '100' : '10000'}
              step={form.discountType === 'percentage' ? '1' : '0.01'}
              value={form.discountValue}
              onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
              required
            />

            <Field
              label="Minimum Order Subtotal ($)"
              type="number"
              min="0"
              step="1"
              value={form.minOrderAmount}
              onChange={(e) => setForm((prev) => ({ ...prev, minOrderAmount: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Max Discount Cap ($) (Optional)"
              type="number"
              min="1"
              step="1"
              value={form.maxDiscount}
              onChange={(e) => setForm((prev) => ({ ...prev, maxDiscount: e.target.value }))}
              placeholder="e.g. 50"
            />

            <Field
              label="Total Usage Limit (Optional)"
              type="number"
              min="1"
              step="1"
              value={form.usageLimit}
              onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
              placeholder="e.g. 100"
            />
          </div>

          {formError && (
            <p role="alert" className="text-oxblood text-[0.8125rem]">
              {formError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createDiscount.isPending}>
              {createDiscount.isPending ? 'Creating...' : 'Create Promo Code'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
