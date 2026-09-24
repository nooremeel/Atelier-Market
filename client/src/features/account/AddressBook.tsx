import { useState } from 'react';
import {
  useAddressBook,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
} from './useAccount';
import { AccountNav } from './AccountNav';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Field } from '../../components/Field';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/ToastProvider';
import { useI18n } from '../../lib/i18n';
import type { AddressBookItem } from '../../types';

export function AddressBook() {
  const { data, isLoading } = useAddressBook();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const { notify } = useToast();
  const { t } = useI18n();

  const addresses = data?.addresses || [];

  // Form Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('Home');
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete Modal State
  const [deletingAddr, setDeletingAddr] = useState<AddressBookItem | null>(null);

  const openAddModal = () => {
    setEditingId(null);
    setLabel('Home');
    setName('');
    setStreet('');
    setCity('');
    setCountry('');
    setPostalCode('');
    setPhone('');
    setIsDefault(addresses.length === 0);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEditModal = (addr: AddressBookItem) => {
    setEditingId(addr._id);
    setLabel(addr.label || 'Home');
    setName(addr.name || '');
    setStreet(addr.street);
    setCity(addr.city);
    setCountry(addr.country);
    setPostalCode(addr.postalCode || '');
    setPhone(addr.phone || '');
    setIsDefault(addr.isDefault);
    setFormErrors({});
    setFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!street.trim()) errors.street = t('account.requiredField');
    if (!city.trim()) errors.city = t('account.requiredField');
    if (!country.trim()) errors.country = t('account.requiredField');

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      label: label.trim() || 'Home',
      name: name.trim(),
      street: street.trim(),
      city: city.trim(),
      country: country.trim(),
      postalCode: postalCode.trim(),
      phone: phone.trim(),
      isDefault,
    };

    if (editingId) {
      updateAddress.mutate(
        { addressId: editingId, ...payload },
        {
          onSuccess: () => {
            notify(t('account.addressSavedSuccess'), 'success');
            setFormOpen(false);
          },
          onError: (err: any) => {
            notify(err?.message || 'Failed to update address', 'error');
          },
        },
      );
    } else {
      addAddress.mutate(payload, {
        onSuccess: () => {
          notify(t('account.addressSavedSuccess'), 'success');
          setFormOpen(false);
        },
        onError: (err: any) => {
          notify(err?.message || 'Failed to add address', 'error');
        },
      });
    }
  };

  const handleSetDefault = (addr: AddressBookItem) => {
    updateAddress.mutate(
      {
        addressId: addr._id,
        street: addr.street,
        city: addr.city,
        country: addr.country,
        isDefault: true,
      },
      {
        onSuccess: () => {
          notify(t('account.defaultUpdatedSuccess'), 'success');
        },
        onError: (err: any) => {
          notify(err?.message || 'Could not set default address', 'error');
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!deletingAddr) return;
    deleteAddress.mutate(deletingAddr._id, {
      onSuccess: () => {
        notify(t('account.addressDeletedSuccess'), 'success');
        setDeletingAddr(null);
      },
      onError: (err: any) => {
        notify(err?.message || 'Failed to delete address', 'error');
      },
    });
  };

  if (isLoading) {
    return (
      <div>
        <AccountNav activeTab="addresses" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-sm" />
          <Skeleton className="h-48 rounded-sm" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AccountNav activeTab="addresses" />

      {/* Top Header & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-step-2 text-ink font-normal">
            {t('account.addressesTitle')}
          </h2>
          <p className="text-[0.8125rem] text-stone font-sans mt-0.5">
            {t('account.addressesSubtitle')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openAddModal}>
          + {t('account.addAddress')}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="border border-hairline/60 bg-canvas rounded-sm p-8 shadow-subtle">
          <EmptyState
            title={t('account.noAddressesTitle')}
            description={t('account.noAddressesDesc')}
            action={
              <Button variant="secondary" onClick={openAddModal}>
                + {t('account.addAddress')}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className="relative bg-canvas border border-hairline/70 rounded-sm p-6 shadow-luxury flex flex-col justify-between transition-colors hover:border-gold-leaf/50"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3 border-b border-hairline/40 pb-2.5">
                  <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase font-semibold text-ink">
                    {addr.label || 'Home'}
                  </span>
                  {addr.isDefault && (
                    <span className="inline-flex items-center px-2 py-0.5 text-[0.625rem] font-sans tracking-[0.16em] uppercase font-medium bg-gold-leaf/15 text-gold-leaf border border-gold-leaf/30 rounded-sm">
                      {t('account.defaultBadge')}
                    </span>
                  )}
                </div>

                {addr.name && (
                  <p className="font-display text-step-0 text-ink font-normal mb-1">
                    {addr.name}
                  </p>
                )}
                <p className="font-sans text-[0.875rem] text-ink leading-relaxed">
                  {addr.street}
                </p>
                <p className="font-sans text-[0.8125rem] text-stone leading-relaxed">
                  {addr.city}, {addr.country} {addr.postalCode && `· ${addr.postalCode}`}
                </p>
                {addr.phone && (
                  <p className="font-sans text-[0.75rem] text-stone/80 mt-2">
                    {addr.phone}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-hairline/50 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr)}
                      disabled={updateAddress.isPending}
                      className="font-sans text-[0.75rem] text-stone hover:text-gold-leaf font-medium transition-colors"
                    >
                      {t('account.setAsDefault')}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="font-sans text-[0.75rem] text-stone hover:text-ink font-medium transition-colors"
                  >
                    {t('account.edit')}
                  </button>
                  <span className="text-hairline/80">|</span>
                  <button
                    type="button"
                    onClick={() => setDeletingAddr(addr)}
                    className="font-sans text-[0.75rem] text-oxblood hover:text-oxblood/80 font-medium transition-colors"
                  >
                    {t('account.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? t('account.editAddress') : t('account.addAddress')}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={t('account.addressLabel')}
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Home, Studio, Office"
            />
            <Field
              label={t('account.recipientName')}
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Layla Al-Mansoor"
            />
          </div>

          <Field
            label={t('account.streetAddress')}
            name="street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Street name, building, apartment"
            error={formErrors.street}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={t('account.city')}
              name="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Riyadh, Dubai, Cairo"
              error={formErrors.city}
              required
            />
            <Field
              label={t('account.country')}
              name="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Saudi Arabia"
              error={formErrors.country}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={t('account.postalCode')}
              name="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="12345"
            />
            <Field
              label={t('account.phone')}
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+966 50 000 0000"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-hairline accent-gold-leaf"
              />
              <span className="font-sans text-[0.8125rem] text-ink">
                {t('account.setDefaultCheckbox')}
              </span>
            </label>
          </div>

          <div className="mt-4 pt-4 border-t border-hairline/60 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setFormOpen(false)}
            >
              {t('account.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={addAddress.isPending || updateAddress.isPending}
            >
              {addAddress.isPending || updateAddress.isPending
                ? t('account.savingAddress')
                : t('account.saveAddress')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deletingAddr)}
        onClose={() => setDeletingAddr(null)}
        title={t('account.deleteConfirmTitle')}
      >
        <div className="mt-2 text-start">
          <p className="font-sans text-[0.875rem] text-stone leading-relaxed mb-6">
            {t('account.deleteConfirmDesc')}
          </p>
          {deletingAddr && (
            <div className="bg-canvas/50 border border-hairline/60 rounded-sm p-4 mb-6">
              <p className="font-sans font-medium text-[0.8125rem] text-ink">
                {deletingAddr.label}: {deletingAddr.street}
              </p>
              <p className="font-sans text-[0.75rem] text-stone">
                {deletingAddr.city}, {deletingAddr.country}
              </p>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setDeletingAddr(null)}
            >
              {t('account.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={confirmDelete}
              disabled={deleteAddress.isPending}
              className="bg-oxblood hover:bg-oxblood/90 dark:hover:bg-oxblood/80 text-white dark:text-white border-transparent"
            >
              {t('account.confirmDelete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
