import { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { Spinner } from '../../components/Spinner';
import {
  useSimulatePaymobSuccess,
  useCancelPaymobOrder,
  useProcessPaymobDirectPayment,
  type PaymobInitiateResponse,
} from './useOrders';

interface PaymobModalProps {
  open: boolean;
  onClose: () => void;
  session: PaymobInitiateResponse | null;
  onSuccess: (orderId: string) => void;
  initialCardData?: {
    cardNumber?: string;
    cardholderName?: string;
    expiry?: string;
    cvv?: string;
  };
}

export function PaymobModal({ open, onClose, session, onSuccess, initialCardData }: PaymobModalProps) {
  const simulatePayment = useSimulatePaymobSuccess();
  const processDirectPayment = useProcessPaymobDirectPayment();
  const cancelOrder = useCancelPaymobOrder();

  // States: 'form' | 'processing_3ds' | 'redirecting' | 'authorized' | 'declined'
  const [state, setState] = useState<'form' | 'processing_3ds' | 'redirecting' | 'authorized' | 'declined'>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useLegacyIframe, setUseLegacyIframe] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  // Form input states
  const [cardNumber, setCardNumber] = useState(
    initialCardData?.cardNumber || (session?.isSimulation ? '4242 •••• •••• 4242' : '4111 1111 1111 1111')
  );
  const [cardholderName, setCardholderName] = useState(initialCardData?.cardholderName || 'Eleanor Vance');
  const [expiry, setExpiry] = useState(initialCardData?.expiry || '12/28');
  const [cvv, setCvv] = useState(initialCardData?.cvv || '123');

  useEffect(() => {
    if (open) {
      setState('form');
      setErrorMessage(null);
      setIframeLoading(true);
      if (initialCardData?.cardNumber) {
        setCardNumber(initialCardData.cardNumber);
      } else if (session?.isSimulation) {
        setCardNumber('4242 •••• •••• 4242');
      } else {
        setCardNumber('4111 1111 1111 1111');
      }

      if (initialCardData?.cardholderName) {
        setCardholderName(initialCardData.cardholderName);
      }
      if (initialCardData?.expiry) {
        setExpiry(initialCardData.expiry);
      }
      if (initialCardData?.cvv) {
        setCvv(initialCardData.cvv);
      } else if (session?.isSimulation) {
        setCvv('888');
      } else {
        setCvv('123');
      }
    }
  }, [open, session?.orderId, session?.isSimulation, initialCardData]);

  if (!open || !session) return null;

  const handleDismiss = () => {
    if (session?.orderId && state !== 'authorized' && state !== 'redirecting') {
      cancelOrder.mutate(session.orderId);
    }
    onClose();
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setExpiry(raw);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(raw);
  };

  const getCardBrand = () => {
    const clean = cardNumber.replace(/\s+/g, '');
    if (clean.startsWith('4')) return { brand: 'visa', icon: '/images/payments/visa.svg', label: 'Visa' };
    if (/^5[1-5]/.test(clean)) return { brand: 'mastercard', icon: '/images/payments/mastercard.svg', label: 'Mastercard' };
    if (/^3[47]/.test(clean)) return { brand: 'amex', icon: '/images/payments/amex.svg', label: 'Amex' };
    return null;
  };

  const handlePay = (forceDecline = false) => {
    setErrorMessage(null);
    setState('processing_3ds');

    // 1. Simulation Mode Handler
    if (session.isSimulation) {
      setTimeout(() => {
        if (forceDecline || cvv === '000') {
          setState('declined');
          return;
        }

        simulatePayment.mutate(session.orderId, {
          onSuccess: () => {
            setState('authorized');
            setTimeout(() => {
              onSuccess(session.orderId);
            }, 950);
          },
          onError: () => {
            setState('declined');
          },
        });
      }, 1400);
      return;
    }

    // 2. Real Paymob Financial Rail Handler
    const cleanCard = cardNumber.replace(/\s+/g, '');
    const cleanExpiry = expiry.replace(/\D/g, '');
    const month = cleanExpiry.slice(0, 2);
    const year = cleanExpiry.slice(2, 4);

    if (cleanCard.length < 16) {
      setState('form');
      setErrorMessage('Please enter a complete 16-digit card number.');
      return;
    }

    if (month.length < 2 || year.length < 2) {
      setState('form');
      setErrorMessage('Please enter a valid expiry date (MM/YY).');
      return;
    }

    processDirectPayment.mutate(
      {
        orderId: session.orderId,
        paymentToken: session.paymentToken,
        card: {
          number: cleanCard,
          holderName: cardholderName,
          expiryMonth: month,
          expiryYear: year,
          cvv,
        },
      },
      {
        onSuccess: (data) => {
          if (data.requires3ds && data.redirectionUrl) {
            setState('redirecting');
            // Give user 600ms visual confirmation of redirect
            setTimeout(() => {
              window.location.href = data.redirectionUrl!;
            }, 600);
          } else if (data.success) {
            setState('authorized');
            setTimeout(() => {
              onSuccess(session.orderId);
            }, 950);
          } else {
            setState('declined');
            setErrorMessage(data.message || 'Payment could not be authorized.');
          }
        },
        onError: (err) => {
          setState('form');
          setErrorMessage(err.message || 'Payment failed. Please verify your card details.');
        },
      }
    );
  };

  const brand = getCardBrand();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-sm p-4 transition-all"
      dir="ltr"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && state !== 'processing_3ds' && state !== 'redirecting') {
          handleDismiss();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paymob Payment Vault"
        dir="ltr"
        lang="en"
        className="w-full max-w-md max-h-[92dvh] overflow-y-auto border border-hairline bg-canvas text-ink p-5 sm:p-7 shadow-luxury rounded-sm animate-in fade-in zoom-in-95 duration-200 text-left"
        style={{ direction: 'ltr', textAlign: 'left' }}
      >
        {/* Header Block */}
        <div className="flex items-start justify-between border-b border-hairline/60 pb-4 mb-4 sm:mb-5" dir="ltr">
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-sans text-[0.6875rem] tracking-[0.2em] uppercase text-gold-leaf font-semibold">
                PAYMOB GATEWAY
              </span>
              {session.isSimulation && (
                <span className="px-1.5 py-0.5 text-[0.625rem] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-[2px] font-mono uppercase tracking-wider">
                  Simulation Mode
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[0.6875rem] text-stone">
                <svg className="w-3 h-3 text-peacock" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                256-Bit Encrypted
              </span>
            </div>
            <h2 className="font-display text-step-2 text-ink font-normal">
              Secure Payment
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4" dir="ltr">
            <div className="text-right">
              <span className="block font-sans text-[0.6875rem] uppercase tracking-wider text-stone font-medium">
                Total to Pay
              </span>
              <span className="font-display text-step-2 text-ink font-medium">
                <Price value={session.totalPrice} />
              </span>
            </div>
            {state !== 'processing_3ds' && state !== 'redirecting' && (
              <button
                type="button"
                onClick={handleDismiss}
                className="p-2 -mr-1.5 -mt-1 rounded-sm text-stone hover:text-ink hover:bg-stone/10 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Optional Legacy iFrame View */}
        {useLegacyIframe && !session.isSimulation ? (
          <div className="flex flex-col gap-3" dir="ltr">
            <div className="relative min-h-[520px] w-full border border-hairline/70 rounded-sm bg-white dark:bg-canvas shadow-xs" dir="ltr" style={{ direction: 'ltr' }}>
              {iframeLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-canvas/90 z-10" dir="ltr">
                  <Spinner />
                  <span className="font-sans text-[0.8125rem] text-stone">
                    Initializing secure Paymob iFrame...
                  </span>
                </div>
              )}
              <iframe
                src={session.iframeUrl}
                title="Paymob Payment Frame"
                className="w-full h-[520px] rounded-sm border-0"
                allow="payment"
                dir="ltr"
                lang="en"
                style={{ direction: 'ltr' }}
                onLoad={() => setIframeLoading(false)}
              />
            </div>
            <button
              type="button"
              onClick={() => setUseLegacyIframe(false)}
              className="text-xs text-gold-leaf hover:underline self-center py-1"
            >
              ← Return to Atelier Noir custom card form
            </button>
          </div>
        ) : (
          /* Primary Atelier Noir Luxury Card Form */
          <div dir="ltr">
            {state === 'form' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePay(false);
                }}
                className="flex flex-col gap-3.5 text-left"
                dir="ltr"
              >
                {errorMessage && (
                  <div className="p-2.5 rounded-sm bg-oxblood/10 border border-oxblood/30 text-oxblood text-xs flex items-center gap-2" dir="ltr">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block font-sans text-[0.6875rem] font-medium text-stone uppercase tracking-wider mb-1 text-left" dir="ltr">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="cc-name"
                    autoCapitalize="words"
                    dir="ltr"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="w-full h-11 px-3 border border-hairline/80 rounded-sm bg-silk/30 dark:bg-canvas text-ink font-sans text-sm text-left focus:border-gold-leaf focus:bg-canvas focus:outline-none transition-colors"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div>
                  <label className="block font-sans text-[0.6875rem] font-medium text-stone uppercase tracking-wider mb-1 text-left" dir="ltr">
                    Card Number
                  </label>
                  <div className="relative" dir="ltr">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      pattern="[0-9 ]*"
                      required
                      dir="ltr"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4111 •••• •••• ••••"
                      className="w-full h-11 pl-3 pr-14 border border-hairline/80 rounded-sm bg-silk/30 dark:bg-canvas text-ink font-mono text-sm tracking-widest text-left focus:border-gold-leaf focus:bg-canvas focus:outline-none transition-colors"
                      style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'isolate' }}
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none" dir="ltr">
                      <div className="h-5 w-8 rounded-[2px] overflow-hidden flex items-center justify-center border border-hairline/60 bg-white shadow-xs">
                        {brand ? (
                          <img src={brand.icon} alt={brand.label} className="h-full w-full object-contain p-0.5" />
                        ) : (
                          <svg className="w-4 h-4 text-stone/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <rect width="20" height="14" x="2" y="5" rx="2" strokeWidth="1.5" />
                            <path d="M2 10h20" strokeWidth="1.5" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3" dir="ltr">
                  <div>
                    <label className="block font-sans text-[0.6875rem] font-medium text-stone uppercase tracking-wider mb-1 text-left" dir="ltr">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      required
                      dir="ltr"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={handleExpiryChange}
                      className="w-full h-11 px-3 border border-hairline/80 rounded-sm bg-silk/30 dark:bg-canvas text-ink font-mono text-sm text-left focus:border-gold-leaf focus:bg-canvas focus:outline-none transition-colors"
                      style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'isolate' }}
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-[0.6875rem] font-medium text-stone uppercase tracking-wider mb-1 text-left" dir="ltr">
                      Security Code (CVV)
                    </label>
                    <div className="relative" dir="ltr">
                      <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        required
                        dir="ltr"
                        maxLength={4}
                        placeholder="123"
                        value={cvv}
                        onChange={handleCvvChange}
                        className="w-full h-11 pl-3 pr-9 border border-hairline/80 rounded-sm bg-silk/30 dark:bg-canvas text-ink font-mono text-sm tracking-widest text-left focus:border-gold-leaf focus:bg-canvas focus:outline-none transition-colors"
                        style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'isolate' }}
                      />
                      <svg className="w-3.5 h-3.5 text-stone/60 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2 sm:pt-3" dir="ltr">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-3 shadow-luxury text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secure Payment · <Price value={session.totalPrice} /></span>
                  </Button>
                </div>
              </form>
            )}

            {/* 3D-Secure Processing State (Instant Animated Feedback) */}
            {state === 'processing_3ds' && (
              <div className="py-10 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in duration-200">
                <Spinner />
                <div>
                  <h3 className="font-display text-step-1 text-ink font-normal">
                    Connecting to Paymob Financial Rail
                  </h3>
                  <p className="font-sans text-[0.8125rem] text-stone mt-1 max-w-xs mx-auto">
                    Contacting card network and initializing 3D-Secure verification...
                  </p>
                </div>
                <div className="w-48 h-1 bg-hairline/60 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-gold-leaf animate-pulse w-3/4 rounded-full" />
                </div>
                <div className="flex items-center gap-3 pt-2 opacity-75">
                  <span className="font-sans text-[0.6875rem] tracking-wider uppercase text-stone">Verified by</span>
                  <div className="h-4 w-10 overflow-hidden flex items-center justify-center bg-white px-1 rounded-[1px] border border-hairline/60">
                    <img src="/images/payments/visa.svg" alt="Visa" className="h-full w-full object-contain" />
                  </div>
                  <div className="h-4 w-8 overflow-hidden flex items-center justify-center bg-white px-1 rounded-[1px] border border-hairline/60">
                    <img src="/images/payments/mastercard.svg" alt="Mastercard" className="h-full w-full object-contain" />
                  </div>
                </div>
              </div>
            )}

            {/* Redirecting State */}
            {state === 'redirecting' && (
              <div className="py-10 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in duration-200">
                <div className="w-10 h-10 rounded-full bg-gold-leaf/10 border border-gold-leaf/30 text-gold-leaf flex items-center justify-center">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-step-1 text-ink font-normal">
                    Transferring to 3D-Secure
                  </h3>
                  <p className="font-sans text-[0.8125rem] text-stone mt-1 max-w-xs mx-auto">
                    Challenge received. Opening secure bank OTP verification page...
                  </p>
                </div>
              </div>
            )}

            {/* Completed Success State */}
            {state === 'authorized' && (
              <div className="py-9 flex flex-col items-center justify-center text-center gap-3 animate-in fade-in">
                <div className="w-12 h-12 rounded-full border border-peacock/40 bg-peacock/10 text-peacock flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display text-step-2 text-ink">
                  Payment Authorized
                </h3>
                <p className="font-sans text-[0.8125rem] text-stone">
                  Cryptographic transaction verified. Finalizing your order...
                </p>
              </div>
            )}

            {/* Declined State */}
            {state === 'declined' && (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-3 animate-in fade-in">
                <div className="w-12 h-12 rounded-full border border-oxblood/40 bg-oxblood/10 text-oxblood flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="font-display text-step-1 text-ink">
                  Transaction Declined by Bank
                </h3>
                <p className="font-sans text-[0.8125rem] text-stone max-w-sm">
                  {errorMessage || 'The payment gateway reported a card decline (Insufficient funds or verification failed).'}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setState('form')}>
                    Try Different Card
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDismiss}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Vault Assurance Footer */}
        <div className="mt-5 pt-3.5 border-t border-hairline/60 flex items-center justify-between text-[0.6875rem] font-sans text-stone">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gold-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span>Powered by Paymob Financial Services</span>
          </div>

          <div className="flex items-center gap-3">
            {!session.isSimulation && state === 'form' && (
              <button
                type="button"
                onClick={() => setUseLegacyIframe(!useLegacyIframe)}
                className="text-[0.625rem] text-stone/60 hover:text-ink transition-colors underline"
              >
                {useLegacyIframe ? 'Use custom form' : 'Switch to hosted iframe'}
              </button>
            )}

            {/* Simulation decline trigger for portfolio demos */}
            {session.isSimulation && state === 'form' && (
              <button
                type="button"
                onClick={() => handlePay(true)}
                className="text-[0.625rem] text-stone/50 hover:text-oxblood transition-colors"
                title="Demo testing: triggers realistic decline response"
              >
                Demo: Test Decline
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
