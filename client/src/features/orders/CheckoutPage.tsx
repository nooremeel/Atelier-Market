import { useState, useEffect, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckout, usePlaceOrder } from './useOrders';
import { useAddressBook } from '../account/useAccount';
import { useAuth } from '../../auth/AuthProvider';
import { useValidateDiscount, getStoredDiscount, setStoredDiscount } from '../cart/useDiscount';
import { OrderSummary } from '../../components/OrderSummary';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Skeleton } from '../../components/Skeleton';
import { PageHeader } from '../../components/PageHeader';
import { Price } from '../../components/Price';
import { Field } from '../../components/Field';
import { ProgressStepper } from '../../components/ProgressStepper';
import { PaymentCardPreview } from './PaymentCardPreview';
import { useI18n } from '../../lib/i18n';
import { getImageUrl, handleImageError } from '../../lib/image';
import type { AppliedDiscount } from '../../types';

interface ShippingForm {
  name: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
}

interface PaymentForm {
  method: 'card' | 'apple_pay' | 'cash_on_delivery';
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvc: string;
}

interface BillingForm {
  sameAsShipping: boolean;
  name: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

export function CheckoutPage() {
  const { data, isLoading } = useCheckout();
  const { data: addressBookData } = useAddressBook();
  const { user } = useAuth();
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();
  const { t, isArabic } = useI18n();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Address selection state
  const savedAddresses = addressBookData?.addresses || [];
  const defaultAddress = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>('custom');

  const [shipping, setShipping] = useState<ShippingForm>({
    name: '',
    street: '',
    city: '',
    country: '',
    postalCode: '',
    phone: '',
  });

  const [payment, setPayment] = useState<PaymentForm>({
    method: 'card',
    cardNumber: '4242 •••• •••• 4242',
    cardholderName: '',
    expiry: '12/28',
    cvc: '888',
  });

  const [billing, setBilling] = useState<BillingForm>({
    sameAsShipping: true,
    name: '',
    street: '',
    city: '',
    country: '',
    postalCode: '',
  });

  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [billingErrors, setBillingErrors] = useState<Record<string, string>>({});
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Profile persistence opt-in state
  const [saveContactInfo, setSaveContactInfo] = useState<boolean>(true);
  const [saveDefaultAddress, setSaveDefaultAddress] = useState<boolean>(true);
  const [saveDefaultPayment, setSaveDefaultPayment] = useState<boolean>(true);

  // Promo code discount state
  const validateDiscount = useValidateDiscount();
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(getStoredDiscount);
  const [discountError, setDiscountError] = useState<string>('');

  const handleApplyDiscount = (code: string) => {
    if (!data) return;
    setDiscountError('');
    validateDiscount.mutate(
      { code, subtotal: data.totalPrice },
      {
        onSuccess: (res) => {
          setAppliedDiscount(res.discount);
          setStoredDiscount(res.discount);
          setDiscountError('');
        },
        onError: (err: Error) => {
          setDiscountError(err.message || 'Invalid promo code');
        },
      }
    );
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setStoredDiscount(null);
    setDiscountError('');
  };

  // Sync default address and profile preferences when user or address book loads
  useEffect(() => {
    if (savedAddresses.length > 0 && selectedAddressId === 'custom' && defaultAddress) {
      setSelectedAddressId(defaultAddress._id);
      setShipping({
        name: defaultAddress.name || user?.name || '',
        street: defaultAddress.street,
        city: defaultAddress.city,
        country: defaultAddress.country,
        postalCode: defaultAddress.postalCode || '',
        phone: defaultAddress.phone || '',
      });
    } else if (savedAddresses.length === 0 && user) {
      setShipping((prev) => ({
        name: prev.name || user.name || '',
        street: prev.street || user.address?.street || '',
        city: prev.city || user.address?.city || '',
        country: prev.country || user.address?.country || '',
        postalCode: prev.postalCode || user.address?.postalCode || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [savedAddresses.length, defaultAddress, user]);

  // Sync saved payment preferences when user loads
  useEffect(() => {
    if (user) {
      if (user.defaultPaymentMethod) {
        setPayment((prev) => ({ ...prev, method: user.defaultPaymentMethod! }));
      }
      if (user.savedCard?.cardholderName || user.name) {
        setPayment((prev) => ({
          ...prev,
          cardholderName: prev.cardholderName || user.savedCard?.cardholderName || user.name || '',
          expiry: user.savedCard?.expiry || prev.expiry,
        }));
      }
    }
  }, [user]);

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    if (id === 'custom') {
      setShipping({
        name: user?.name || '',
        street: '',
        city: '',
        country: '',
        postalCode: '',
        phone: '',
      });
    } else {
      const addr = savedAddresses.find((a) => a._id === id);
      if (addr) {
        setShipping({
          name: addr.name || user?.name || '',
          street: addr.street,
          city: addr.city,
          country: addr.country,
          postalCode: addr.postalCode || '',
          phone: addr.phone || '',
        });
      }
    }
    setShippingErrors({});
  };

  const handleShippingChange = (field: keyof ShippingForm) => (e: ChangeEvent<HTMLInputElement>) => {
    setShipping((prev) => ({ ...prev, [field]: e.target.value }));
    if (shippingErrors[field]) {
      setShippingErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handlePaymentChange = (field: keyof PaymentForm) => (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (field === 'cardNumber') {
      const cleanDigits = value.replace(/\D/g, '').slice(0, 16);
      // Format 4-6-5 for AMEX (starts with 34 or 37), or 4-4-4-4 for others
      if (/^3[47]/.test(cleanDigits)) {
        const p1 = cleanDigits.slice(0, 4);
        const p2 = cleanDigits.slice(4, 10);
        const p3 = cleanDigits.slice(10, 15);
        value = [p1, p2, p3].filter(Boolean).join(' ');
      } else {
        value = cleanDigits.replace(/(\d{4})(?=\d)/g, '$1 ');
      }
    } else if (field === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      if (digits.length >= 3) {
        value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        value = digits;
      }
    } else if (field === 'cvc') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    setPayment((prev) => ({ ...prev, [field]: value }));
    if (paymentErrors[field]) {
      setPaymentErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleBillingChange = (field: keyof Omit<BillingForm, 'sameAsShipping'>) => (e: ChangeEvent<HTMLInputElement>) => {
    setBilling((prev) => ({ ...prev, [field]: e.target.value }));
    if (billingErrors[field]) {
      setBillingErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Step 1 Validation
  const validateShipping = (): boolean => {
    const errs: Record<string, string> = {};
    if (!shipping.name.trim()) errs.name = t('account.requiredField');
    if (!shipping.street.trim()) errs.street = t('account.requiredField');
    if (!shipping.city.trim()) errs.city = t('account.requiredField');
    if (!shipping.country.trim()) errs.country = t('account.requiredField');
    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation
  const validatePayment = (): boolean => {
    let valid = true;
    const pErrs: Record<string, string> = {};

    if (payment.method === 'card') {
      if (!payment.cardholderName.trim()) {
        pErrs.cardholderName = t('account.requiredField');
        valid = false;
      }
      const rawCard = payment.cardNumber.replace(/\s/g, '');
      const isAmex = /^3[47]/.test(rawCard);
      const minLen = isAmex ? 15 : 16;
      if (!rawCard || rawCard.length < minLen) {
        pErrs.cardNumber = t('checkout.invalidCardNumber');
        valid = false;
      }

      // Expiry validation: MM/YY
      const expiryParts = payment.expiry.split('/');
      if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
        pErrs.expiry = t('checkout.invalidExpiry');
        valid = false;
      } else {
        const month = parseInt(expiryParts[0], 10);
        const year = parseInt(`20${expiryParts[1]}`, 10);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (isNaN(month) || month < 1 || month > 12) {
          pErrs.expiry = t('checkout.invalidExpiry');
          valid = false;
        } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
          pErrs.expiry = t('checkout.invalidExpiry');
          valid = false;
        }
      }

      // CVC validation
      const minCvcLen = isAmex ? 4 : 3;
      if (!payment.cvc.trim() || payment.cvc.length < minCvcLen) {
        pErrs.cvc = t('checkout.invalidCvc');
        valid = false;
      }
    }
    setPaymentErrors(pErrs);

    // Billing validation if separate
    if (!billing.sameAsShipping) {
      const bErrs: Record<string, string> = {};
      if (!billing.name.trim()) bErrs.name = t('account.requiredField');
      if (!billing.street.trim()) bErrs.street = t('account.requiredField');
      if (!billing.city.trim()) bErrs.city = t('account.requiredField');
      if (!billing.country.trim()) bErrs.country = t('account.requiredField');
      setBillingErrors(bErrs);
      if (Object.keys(bErrs).length > 0) valid = false;
    }

    return valid;
  };

  const goToPayment = () => {
    if (validateShipping()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToReview = () => {
    if (validatePayment()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const submitOrder = () => {
    setIsAuthorizing(true);

    // Realistic simulated banking handshake
    setTimeout(() => {
      placeOrder.mutate(
        {
          shippingAddress: {
            name: shipping.name,
            street: shipping.street,
            city: shipping.city,
            country: shipping.country,
            postalCode: shipping.postalCode,
            phone: shipping.phone,
          },
          paymentMethod: payment.method,
          paymentDetails:
            payment.method === 'card'
              ? {
                  cardNumber: payment.cardNumber.replace(/\s/g, ''),
                  cardholderName: payment.cardholderName,
                  expiry: payment.expiry,
                }
              : undefined,
          billingAddress: billing.sameAsShipping
            ? undefined
            : {
                name: billing.name,
                street: billing.street,
                city: billing.city,
                country: billing.country,
                postalCode: billing.postalCode,
              },
          discountCode: appliedDiscount?.code,
          saveToProfile: {
            saveContactInfo,
            saveDefaultAddress,
            saveDefaultPayment,
          },
        },
        {
          onSuccess: () => {
            setStoredDiscount(null);
            navigate('/orders');
          },
          onSettled: () => setIsAuthorizing(false),
        },
      );
    }, 400);
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title={t('checkout.title')} />
        <Skeleton className="h-64" />
      </>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <>
        <PageHeader title={t('checkout.title')} />
        <EmptyState
          title={t('cart.emptyTitle')}
          action={<Button to="/products">{t('home.browseBtn')}</Button>}
        />
      </>
    );
  }

  const steps = [
    { id: 1, title: t('checkout.stepShipping'), description: t('checkout.stepShippingDesc') },
    { id: 2, title: t('checkout.stepPayment'), description: t('checkout.stepPaymentDesc') },
    { id: 3, title: t('checkout.stepConfirm'), description: t('checkout.stepConfirmDesc') },
  ];

  return (
    <div className="pb-20">
      <PageHeader title={t('checkout.title')} />

      {/* Progress Stepper */}
      <ProgressStepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={(stepId) => setCurrentStep(stepId as 1 | 2 | 3)}
        className="mb-8"
      />

      <div className="grid gap-12 lg:grid-cols-[1fr_380px] items-start">
        {/* Step 1: Shipping Address */}
        {currentStep === 1 && (
          <div className="bg-canvas border border-hairline/60 rounded-sm p-6 sm:p-8 shadow-subtle transition-colors">
            <div className="mb-6">
              <h2 className="font-display text-step-2 text-ink font-normal">
                {t('checkout.shippingTitle')}
              </h2>
              <p className="font-sans text-[0.8125rem] text-stone mt-1">
                {t('checkout.shippingSubtitle')}
              </p>
            </div>

            {/* Saved Addresses Selector (if available) */}
            {savedAddresses.length > 0 && (
              <div className="mb-8 flex flex-col gap-3">
                <span className="font-sans text-[0.6875rem] tracking-[0.18em] uppercase text-stone font-medium">
                  {t('checkout.savedAddresses')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr._id;
                    return (
                      <label
                        key={addr._id}
                        onClick={() => handleSelectAddress(addr._id)}
                        className={`relative p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-gold-leaf bg-gold-leaf/5 shadow-[0_0_0_1px_rgba(197,168,128,0.3)]'
                            : 'border-hairline/70 hover:border-stone/60 bg-transparent'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-sans text-[0.8125rem] font-medium text-ink">
                              {addr.label || addr.name}
                            </span>
                            {addr.isDefault && (
                              <span className="font-sans text-[0.625rem] tracking-wider uppercase font-medium px-1.5 py-0.5 rounded-sm border border-gold-leaf/40 text-gold-leaf bg-gold-leaf/10">
                                {t('account.defaultBadge')}
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-[0.75rem] text-stone leading-relaxed">
                            {addr.street}
                            <br />
                            {addr.city}, {addr.country} {addr.postalCode}
                          </p>
                        </div>
                        <input
                          type="radio"
                          name="shippingAddressSelection"
                          checked={isSelected}
                          onChange={() => handleSelectAddress(addr._id)}
                          className="sr-only"
                        />
                      </label>
                    );
                  })}

                  {/* Option for custom address */}
                  <label
                    onClick={() => handleSelectAddress('custom')}
                    className={`relative p-4 rounded-sm border cursor-pointer transition-all flex items-center justify-center ${
                      selectedAddressId === 'custom'
                        ? 'border-gold-leaf bg-gold-leaf/5 shadow-[0_0_0_1px_rgba(197,168,128,0.3)]'
                        : 'border-hairline/70 hover:border-stone/60 bg-transparent'
                    }`}
                  >
                    <span className="font-sans text-[0.8125rem] font-medium text-ink flex items-center gap-2">
                      <span className="text-gold-leaf text-base font-bold">+</span>
                      {t('checkout.useCustomAddress')}
                    </span>
                    <input
                      type="radio"
                      name="shippingAddressSelection"
                      checked={selectedAddressId === 'custom'}
                      onChange={() => handleSelectAddress('custom')}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Address Input Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t('checkout.recipientName')}
                value={shipping.name}
                onChange={handleShippingChange('name')}
                error={shippingErrors.name}
                required
                className="sm:col-span-2"
              />
              <Field
                label={t('checkout.street')}
                value={shipping.street}
                onChange={handleShippingChange('street')}
                error={shippingErrors.street}
                required
                className="sm:col-span-2"
              />
              <Field
                label={t('checkout.city')}
                value={shipping.city}
                onChange={handleShippingChange('city')}
                error={shippingErrors.city}
                required
              />
              <Field
                label={t('checkout.country')}
                value={shipping.country}
                onChange={handleShippingChange('country')}
                error={shippingErrors.country}
                required
              />
              <Field
                label={t('checkout.postalCode')}
                value={shipping.postalCode}
                onChange={handleShippingChange('postalCode')}
                error={shippingErrors.postalCode}
              />
              <Field
                label={t('checkout.phone')}
                value={shipping.phone}
                onChange={handleShippingChange('phone')}
                error={shippingErrors.phone}
              />
            </div>

            {/* Save to Profile Preferences */}
            <div className="mt-6 pt-5 border-t border-hairline/60 flex flex-col gap-3">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={saveContactInfo}
                  onChange={(e) => setSaveContactInfo(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-[2px] border-hairline/80 text-gold-leaf focus:ring-gold-leaf/40 accent-gold-leaf cursor-pointer transition-colors"
                />
                <span className="font-sans text-[0.8125rem] text-ink/80 group-hover:text-ink transition-colors leading-normal">
                  {t('checkout.saveContactInfo')}
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={saveDefaultAddress}
                  onChange={(e) => setSaveDefaultAddress(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-[2px] border-hairline/80 text-gold-leaf focus:ring-gold-leaf/40 accent-gold-leaf cursor-pointer transition-colors"
                />
                <span className="font-sans text-[0.8125rem] text-ink/80 group-hover:text-ink transition-colors leading-normal">
                  {t('checkout.saveDefaultAddress')}
                </span>
              </label>
            </div>

            <div className="mt-8 pt-6 border-t border-hairline/60 flex justify-end">
              <Button type="button" size="md" variant="primary" onClick={goToPayment}>
                {t('checkout.continueToPayment')} {isArabic ? '←' : '→'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {currentStep === 2 && (
          <div className="bg-canvas border border-hairline/60 rounded-sm p-6 sm:p-8 shadow-subtle transition-colors">
            <div className="mb-6">
              <h2 className="font-display text-step-2 text-ink font-normal">
                {t('checkout.paymentTitle')}
              </h2>
              <p className="font-sans text-[0.8125rem] text-stone mt-1">
                {t('checkout.paymentSubtitle')}
              </p>
            </div>

            {/* Payment Method Selector (3 Options) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8" role="radiogroup">
              {/* Option 1: Credit / Debit Card */}
              <label
                onClick={() => setPayment((prev) => ({ ...prev, method: 'card' }))}
                className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  payment.method === 'card'
                    ? 'border-gold-leaf bg-gold-leaf/5 shadow-[0_0_0_1px_rgba(197,168,128,0.3)]'
                    : 'border-hairline/70 hover:border-stone/60 bg-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[0.8125rem] font-medium text-ink">
                    {t('checkout.cardMethod')}
                  </span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={payment.method === 'card'}
                    onChange={() => setPayment((prev) => ({ ...prev, method: 'card' }))}
                    className="accent-gold-leaf"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="h-5 w-8 rounded-[2px] overflow-hidden flex items-center justify-center border border-hairline/60 bg-white shadow-xs">
                    <img src="/images/payments/visa.svg" alt="Visa" className="h-full w-full object-contain p-0.5" />
                  </div>
                  <div className="h-5 w-8 rounded-[2px] overflow-hidden flex items-center justify-center border border-hairline/60 bg-white shadow-xs">
                    <img src="/images/payments/mastercard.svg" alt="Mastercard" className="h-full w-full object-contain p-0.5" />
                  </div>
                  <div className="h-5 w-8 rounded-[2px] overflow-hidden flex items-center justify-center border border-hairline/60 bg-[#2557D6] shadow-xs">
                    <img src="/images/payments/amex.svg" alt="AMEX" className="h-full w-full object-contain" />
                  </div>
                </div>
              </label>

              {/* Option 2: Apple Pay */}
              <label
                onClick={() => setPayment((prev) => ({ ...prev, method: 'apple_pay' }))}
                className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  payment.method === 'apple_pay'
                    ? 'border-gold-leaf bg-gold-leaf/5 shadow-[0_0_0_1px_rgba(197,168,128,0.3)]'
                    : 'border-hairline/70 hover:border-stone/60 bg-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[0.8125rem] font-medium text-ink">
                    {t('checkout.applePayMethod')}
                  </span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={payment.method === 'apple_pay'}
                    onChange={() => setPayment((prev) => ({ ...prev, method: 'apple_pay' }))}
                    className="accent-gold-leaf"
                  />
                </div>
                <div className="flex items-center pt-1">
                  <div className="h-5 w-8 rounded-[2px] overflow-hidden flex items-center justify-center border border-hairline/60 bg-white shadow-xs">
                    <img src="/images/payments/apple-pay.svg" alt="Apple Pay" className="h-full w-full object-contain" />
                  </div>
                </div>
              </label>

              {/* Option 3: Concierge Settlement on Delivery */}
              <label
                onClick={() => setPayment((prev) => ({ ...prev, method: 'cash_on_delivery' }))}
                className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  payment.method === 'cash_on_delivery'
                    ? 'border-gold-leaf bg-gold-leaf/5 shadow-[0_0_0_1px_rgba(197,168,128,0.3)]'
                    : 'border-hairline/70 hover:border-stone/60 bg-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[0.8125rem] font-medium text-ink">
                    {t('checkout.codMethod')}
                  </span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={payment.method === 'cash_on_delivery'}
                    onChange={() => setPayment((prev) => ({ ...prev, method: 'cash_on_delivery' }))}
                    className="accent-gold-leaf"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-stone">
                  <svg className="w-4 h-4 text-gold-leaf shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75m0 0h-9m9 0a2.25 2.25 0 00-2.25 2.25v2.25" />
                  </svg>
                  <span className="font-sans text-[0.6875rem] text-stone truncate">
                    {t('checkout.codDesc')}
                  </span>
                </div>
              </label>
            </div>

            {/* Card Method Details */}
            {payment.method === 'card' && (
              <div className="flex flex-col gap-6 pt-1">
                {/* Visual Card Preview */}
                <div className="flex justify-center">
                  <PaymentCardPreview
                    cardholderName={payment.cardholderName}
                    cardNumber={payment.cardNumber}
                    expiry={payment.expiry}
                  />
                </div>

                {/* Card Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label={t('checkout.cardholderName')}
                    value={payment.cardholderName}
                    onChange={handlePaymentChange('cardholderName')}
                    placeholder="e.g. Eleanor Vance"
                    error={paymentErrors.cardholderName}
                    required
                    className="sm:col-span-2"
                  />
                  <Field
                    label={t('checkout.cardNumber')}
                    value={payment.cardNumber}
                    onChange={handlePaymentChange('cardNumber')}
                    placeholder="4242 •••• •••• 4242"
                    error={paymentErrors.cardNumber}
                    required
                    className="sm:col-span-2"
                  />
                  <Field
                    label={t('checkout.expiry')}
                    value={payment.expiry}
                    onChange={handlePaymentChange('expiry')}
                    placeholder="MM/YY"
                    error={paymentErrors.expiry}
                    required
                  />
                  <Field
                    label={t('checkout.cvc')}
                    value={payment.cvc}
                    onChange={handlePaymentChange('cvc')}
                    placeholder="CVC"
                    error={paymentErrors.cvc}
                    required
                  />
                </div>
              </div>
            )}

            {/* Apple Pay Method Details */}
            {payment.method === 'apple_pay' && (
              <div className="p-6 rounded-sm border border-hairline/70 bg-silk/30 dark:bg-canvas/50 flex flex-col items-center text-center gap-3">
                <div className="h-9 w-16 rounded-[4px] overflow-hidden flex items-center justify-center border border-hairline/60 bg-white shadow-xs">
                  <img src="/images/payments/apple-pay.svg" alt="Apple Pay" className="h-full w-full object-contain p-1" />
                </div>
                <div>
                  <h3 className="font-display text-step-1 text-ink font-normal">
                    {t('checkout.applePayDesc')}
                  </h3>
                  <p className="font-sans text-[0.8125rem] text-stone mt-1 max-w-md">
                    {t('checkout.applePayNotice')}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-sm border border-gold-leaf/40 bg-gold-leaf/10 text-gold-leaf font-sans text-[0.75rem]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Touch ID / Face ID Biometric Handshake Ready</span>
                </div>
              </div>
            )}

            {/* Cash on Delivery Details */}
            {payment.method === 'cash_on_delivery' && (
              <div className="p-6 rounded-sm border border-hairline/70 bg-silk/30 dark:bg-canvas/50 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full border border-gold-leaf/40 bg-gold-leaf/10 flex items-center justify-center text-gold-leaf">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75m0 0h-9m9 0a2.25 2.25 0 00-2.25 2.25v2.25" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-step-1 text-ink font-normal">
                    {t('checkout.codMethod')}
                  </h3>
                  <p className="font-sans text-[0.8125rem] text-stone mt-1 max-w-md">
                    {t('checkout.codNotice')}
                  </p>
                </div>
              </div>
            )}

            {/* Billing Address Toggle */}
            <div className="mt-8 pt-6 border-t border-hairline/60">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={billing.sameAsShipping}
                  onChange={(e) => setBilling((prev) => ({ ...prev, sameAsShipping: e.target.checked }))}
                  className="accent-gold-leaf w-4 h-4 rounded-sm border-hairline"
                />
                <span className="font-sans text-[0.8125rem] font-medium text-ink">
                  {t('checkout.sameAsShipping')}
                </span>
              </label>

              {/* Separate Billing Form if unchecked */}
              {!billing.sameAsShipping && (
                <div className="mt-5 p-5 rounded-sm border border-hairline/70 bg-silk/20 dark:bg-canvas/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <h4 className="font-sans text-[0.6875rem] tracking-[0.16em] uppercase text-stone font-medium">
                      {t('checkout.billingTitle')}
                    </h4>
                    <p className="font-sans text-[0.75rem] text-stone/70 mt-0.5">
                      {t('checkout.billingSubtitle')}
                    </p>
                  </div>
                  <Field
                    label={t('checkout.recipientName')}
                    value={billing.name}
                    onChange={handleBillingChange('name')}
                    error={billingErrors.name}
                    required
                    className="sm:col-span-2"
                  />
                  <Field
                    label={t('checkout.street')}
                    value={billing.street}
                    onChange={handleBillingChange('street')}
                    error={billingErrors.street}
                    required
                    className="sm:col-span-2"
                  />
                  <Field
                    label={t('checkout.city')}
                    value={billing.city}
                    onChange={handleBillingChange('city')}
                    error={billingErrors.city}
                    required
                  />
                  <Field
                    label={t('checkout.country')}
                    value={billing.country}
                    onChange={handleBillingChange('country')}
                    error={billingErrors.country}
                    required
                  />
                  <Field
                    label={t('checkout.postalCode')}
                    value={billing.postalCode}
                    onChange={handleBillingChange('postalCode')}
                    error={billingErrors.postalCode}
                  />
                </div>
              )}
            </div>

            {/* Save Payment Preference Option */}
            <div className="mt-6 pt-5 border-t border-hairline/60">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={saveDefaultPayment}
                  onChange={(e) => setSaveDefaultPayment(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-[2px] border-hairline/80 text-gold-leaf focus:ring-gold-leaf/40 accent-gold-leaf cursor-pointer transition-colors"
                />
                <span className="font-sans text-[0.8125rem] text-ink/80 group-hover:text-ink transition-colors leading-normal">
                  {t('checkout.saveDefaultPayment')}
                </span>
              </label>
            </div>

            {/* Security Assurance Notice */}
            <div className="mt-6 p-3.5 rounded-sm border border-hairline/70 bg-silk/40 dark:bg-canvas/50 flex items-center gap-3">
              <svg className="w-5 h-5 text-gold-leaf shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span className="font-sans text-[0.75rem] text-stone leading-relaxed">
                {t('checkout.secureNotice')}
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-hairline/60 flex items-center justify-between">
              <Button type="button" size="md" variant="secondary" onClick={() => setCurrentStep(1)}>
                {isArabic ? '→' : '←'} {t('checkout.backToShipping')}
              </Button>
              <Button type="button" size="md" variant="primary" onClick={goToReview}>
                {t('checkout.continueToReview')} {isArabic ? '←' : '→'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-6">
            <div className="bg-canvas border border-hairline/60 rounded-sm p-6 sm:p-8 shadow-subtle transition-colors">
              <div className="mb-6">
                <h2 className="font-display text-step-2 text-ink font-normal">
                  {t('checkout.reviewTitle')}
                </h2>
                <p className="font-sans text-[0.8125rem] text-stone mt-1">
                  {t('checkout.reviewSubtitle')}
                </p>
              </div>

              {/* Dossier Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* Shipping Destination Summary Card */}
                <div className="p-4 rounded-sm border border-hairline/70 bg-silk/30 dark:bg-canvas/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-sans text-[0.6875rem] tracking-[0.16em] uppercase text-gold-leaf font-medium">
                        {t('checkout.shippingTo')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="font-sans text-[0.75rem] text-stone hover:text-ink underline transition-colors"
                      >
                        {t('checkout.edit')}
                      </button>
                    </div>
                    <p className="font-sans text-[0.8125rem] text-ink font-medium">
                      {shipping.name}
                    </p>
                    <p className="font-sans text-[0.75rem] text-stone leading-relaxed mt-0.5">
                      {shipping.street}
                      <br />
                      {shipping.city}, {shipping.country} {shipping.postalCode}
                      {shipping.phone && <><br />{shipping.phone}</>}
                    </p>
                  </div>
                </div>

                {/* Payment Method Summary Card */}
                <div className="p-4 rounded-sm border border-hairline/70 bg-silk/30 dark:bg-canvas/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-sans text-[0.6875rem] tracking-[0.16em] uppercase text-gold-leaf font-medium">
                        {t('checkout.payingWith')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="font-sans text-[0.75rem] text-stone hover:text-ink underline transition-colors"
                      >
                        {t('checkout.edit')}
                      </button>
                    </div>
                    {payment.method === 'card' ? (
                      <div className="flex items-center gap-2.5">
                        <div className="h-5 w-8 rounded-[2px] overflow-hidden flex items-center justify-center border border-hairline/60 bg-white shrink-0 shadow-xs">
                          <img src="/images/payments/visa.svg" alt="Card" className="h-full w-full object-contain p-0.5" />
                        </div>
                        <div>
                          <p className="font-sans text-[0.8125rem] text-ink font-medium">
                            •••• {payment.cardNumber.replace(/\s/g, '').slice(-4) || '4242'}
                          </p>
                          <p className="font-sans text-[0.6875rem] text-stone">
                            {t('checkout.expiry')}: {payment.expiry}
                          </p>
                        </div>
                      </div>
                    ) : payment.method === 'apple_pay' ? (
                      <div className="flex items-center gap-2.5">
                        <div className="h-5 w-8 rounded-[2px] overflow-hidden flex items-center justify-center border border-hairline/60 bg-white shrink-0 shadow-xs">
                          <img src="/images/payments/apple-pay.svg" alt="Apple Pay" className="h-full w-full object-contain" />
                        </div>
                        <p className="font-sans text-[0.8125rem] text-ink font-medium">
                          {t('checkout.payingWithApplePay')}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-gold-leaf/10 border border-gold-leaf/40 flex items-center justify-center text-gold-leaf shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75m0 0h-9m9 0a2.25 2.25 0 00-2.25 2.25v2.25" />
                          </svg>
                        </div>
                        <p className="font-sans text-[0.8125rem] text-ink font-medium">
                          {t('checkout.payingWithCod')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Billing Destination Summary (if different from shipping) */}
                {!billing.sameAsShipping && (
                  <div className="sm:col-span-2 p-4 rounded-sm border border-hairline/70 bg-silk/30 dark:bg-canvas/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-sans text-[0.6875rem] tracking-[0.16em] uppercase text-gold-leaf font-medium">
                          {t('checkout.billingTo')}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="font-sans text-[0.75rem] text-stone hover:text-ink underline transition-colors"
                        >
                          {t('checkout.edit')}
                        </button>
                      </div>
                      <p className="font-sans text-[0.8125rem] text-ink font-medium">
                        {billing.name}
                      </p>
                      <p className="font-sans text-[0.75rem] text-stone leading-relaxed mt-0.5">
                        {billing.street}
                        <br />
                        {billing.city}, {billing.country} {billing.postalCode}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Update Confirmation Badge */}
              {(saveContactInfo || saveDefaultAddress || saveDefaultPayment) && (
                <div className="mb-6 p-3.5 rounded-sm border border-gold-leaf/30 bg-gold-leaf/5 dark:bg-gold-leaf/10 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold-leaf/20 flex items-center justify-center text-gold-leaf shrink-0">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-sans text-[0.75rem] text-ink font-medium">
                      {t('checkout.profilePreferencesHeading')}
                    </p>
                    <p className="font-sans text-[0.6875rem] text-stone mt-0.5">
                      {t('checkout.savedToProfileNotice')}
                    </p>
                  </div>
                </div>
              )}

              {/* Itemized Piece Review */}
              <h3 className="font-sans text-[0.6875rem] tracking-[0.18em] uppercase text-stone font-medium mb-3">
                {t('checkout.itemReview')} ({data.totalItems})
              </h3>
              <ul className="divide-y divide-hairline/60 mb-6">
                {data.items.map((line) => {
                  const lineKey = line._id || `${line.product._id}-${line.variantId || 'base'}`;
                  const unitPrice = line.unitPrice ?? line.variant?.price ?? line.product.price;
                  return (
                    <li key={lineKey} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={getImageUrl(line.product.imageUrl)}
                          alt=""
                          className="h-14 w-14 object-cover border border-hairline/60 rounded-sm bg-sand/20"
                          onError={handleImageError}
                        />
                        <div>
                          <p className="font-display text-step-0 text-ink">
                            {line.product.title}
                          </p>
                          {line.variant && (
                            <p className="font-sans text-[0.75rem] text-gold-leaf font-medium">
                              {line.variant.name}
                            </p>
                          )}
                          <span className="font-sans text-stone text-[0.8125rem]">
                            {t('cart.quantity')}: {line.quantity} &times; <Price value={unitPrice} />
                          </span>
                        </div>
                      </div>
                      <Price value={unitPrice * line.quantity} />
                    </li>
                  );
                })}
              </ul>

              {/* Step 3 Error display if order failed */}
              {placeOrder.isError && (
                <div
                  role="alert"
                  className="mt-6 p-3.5 rounded-sm border border-oxblood/40 bg-oxblood/10 text-oxblood font-sans text-[0.8125rem] leading-relaxed"
                >
                  {(placeOrder.error as Error)?.message || t('checkout.orderError')}
                </div>
              )}

              {/* Step 3 Actions: Back to Payment & Place Order */}
              <div className="mt-8 pt-6 border-t border-hairline/60 flex items-center justify-between">
                <Button type="button" size="md" variant="secondary" onClick={() => setCurrentStep(2)}>
                  {isArabic ? '→' : '←'} {t('checkout.backToPayment')}
                </Button>
                <Button
                  type="button"
                  size="md"
                  variant="primary"
                  loading={isAuthorizing || placeOrder.isPending}
                  disabled={isAuthorizing || placeOrder.isPending}
                  onClick={submitOrder}
                >
                  {isAuthorizing
                    ? t('checkout.authorizingPayment')
                    : placeOrder.isPending
                    ? t('checkout.securingOrder')
                    : t('checkout.placeOrder')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Order Summary */}
        <div className="sticky top-28">
          <OrderSummary
            totalItems={data.totalItems}
            totalPrice={data.totalPrice}
            appliedDiscount={appliedDiscount}
            onApplyDiscount={handleApplyDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            isDiscountLoading={validateDiscount.isPending}
            discountError={discountError}
          />
        </div>
      </div>
    </div>
  );
}

