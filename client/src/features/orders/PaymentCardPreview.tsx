import { useMemo } from 'react';
import { useI18n } from '../../lib/i18n';

interface PaymentCardPreviewProps {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  className?: string;
}

export function PaymentCardPreview({
  cardholderName,
  cardNumber,
  expiry,
  className = '',
}: PaymentCardPreviewProps) {
  const { isArabic } = useI18n();

  // Detect card network based on prefix
  const network = useMemo<'visa' | 'mastercard' | 'amex' | 'default'>(() => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    return 'default';
  }, [cardNumber]);

  // Format display number: pad remaining digits with bullet points
  const displayCardNumber = useMemo(() => {
    const clean = cardNumber.replace(/\s/g, '');
    if (!clean) return '••••  ••••  ••••  ••••';

    // Format into groups of 4 (or 4-6-5 for AMEX)
    if (network === 'amex') {
      const g1 = clean.slice(0, 4);
      const g2 = clean.slice(4, 10);
      const g3 = clean.slice(10, 15);
      const paddedG1 = g1.padEnd(4, '•');
      const paddedG2 = g2.padEnd(6, '•');
      const paddedG3 = g3.padEnd(5, '•');
      return `${paddedG1}  ${paddedG2}  ${paddedG3}`;
    }

    const groups: string[] = [];
    for (let i = 0; i < 16; i += 4) {
      const slice = clean.slice(i, i + 4);
      if (slice.length > 0) {
        groups.push(slice.padEnd(4, '•'));
      } else {
        groups.push('••••');
      }
    }
    return groups.join('  ');
  }, [cardNumber, network]);

  const displayName = cardholderName.trim() ? cardholderName.toUpperCase() : 'ELEANOR VANCE';
  const displayExpiry = expiry.trim() ? expiry : 'MM/YY';

  return (
    <div
      className={`relative w-full max-w-[360px] aspect-[1.586] rounded-md p-5 sm:p-6 text-white shadow-card overflow-hidden select-none border border-gold-leaf/30 bg-gradient-to-br from-[#1c1c20] via-[#121214] to-[#0a0a0c] transition-all duration-300 ${className}`}
      style={{
        boxShadow: '0 12px 30px -8px rgba(0,0,0,0.45), 0 0 0 1px rgba(197, 168, 128, 0.25)',
      }}
      aria-hidden="true"
    >
      {/* Background luxury subtle watermark */}
      <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full border border-gold-leaf/10 pointer-events-none" />
      <div className="absolute -right-16 -bottom-16 w-60 h-60 rounded-full border border-gold-leaf/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Top row: Atelier Monogram & Contactless / Network */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display tracking-[0.2em] text-[0.8125rem] text-gold-leaf font-medium uppercase">
              Atelier
            </span>
            <span className="text-[0.625rem] text-stone/70 tracking-widest uppercase">
              Noir
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Contactless Wave Icon */}
            <svg
              className="w-4 h-4 text-stone/60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M8.5 16.5a5 5 0 0 1 0-9" />
              <path d="M12 19a8.5 8.5 0 0 0 0-14" />
              <path d="M15.5 21.5a12 12 0 0 0 0-19" />
            </svg>

            {/* Network Brand Badge */}
            <div className="h-6 w-10 flex items-center justify-center">
              {network === 'visa' && (
                <div className="h-5 w-8 rounded-[2px] overflow-hidden flex items-center justify-center border border-hairline/60 bg-white shadow-xs">
                  <img src="/images/payments/visa.svg" alt="Visa" className="h-full w-full object-contain p-0.5" />
                </div>
              )}
              {network === 'mastercard' && (
                <div className="h-5 w-8 rounded-[2px] overflow-hidden flex items-center justify-center border border-hairline/60 bg-white shadow-xs">
                  <img src="/images/payments/mastercard.svg" alt="Mastercard" className="h-full w-full object-contain p-0.5" />
                </div>
              )}
              {network === 'amex' && (
                <div className="h-5 w-8 rounded-[2px] overflow-hidden flex items-center justify-center border border-hairline/60 bg-[#2557D6] shadow-xs">
                  <img src="/images/payments/amex.svg" alt="AMEX" className="h-full w-full object-contain" />
                </div>
              )}
              {network === 'default' && (
                <div className="h-5 w-7 rounded-[2px] border border-gold-leaf/40 flex items-center justify-center bg-gold-leaf/10">
                  <span className="font-display text-[0.625rem] text-gold-leaf font-semibold tracking-wider">
                    AN
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EMV Chip */}
        <div className="my-1">
          <div className="w-9 h-7 rounded-[4px] bg-gradient-to-tr from-[#c5a880] via-[#e5d4be] to-[#b89569] p-0.5 shadow-sm border border-gold-leaf/60 flex items-center justify-center">
            <div className="w-full h-full rounded-[2px] border border-gold-leaf/40 grid grid-cols-2 grid-rows-2 opacity-75">
              <div className="border-r border-b border-gold-leaf/50" />
              <div className="border-b border-gold-leaf/50" />
              <div className="border-r border-gold-leaf/50" />
              <div />
            </div>
          </div>
        </div>

        {/* Card Number */}
        <div className="py-1">
          <span
            className="font-mono text-[0.9375rem] sm:text-[1.0625rem] tracking-[0.16em] text-white/95 font-normal select-all drop-shadow-xs"
            dir="ltr"
          >
            {displayCardNumber}
          </span>
        </div>

        {/* Bottom row: Cardholder Name & Expiry */}
        <div className={`flex items-end justify-between gap-3 text-[0.6875rem] font-sans ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className="flex flex-col min-w-0 max-w-[65%]">
            <span className="text-[0.5625rem] uppercase tracking-[0.18em] text-stone/80 font-medium">
              Cardholder
            </span>
            <span className="text-white/90 font-medium tracking-[0.08em] truncate uppercase mt-0.5">
              {displayName}
            </span>
          </div>

          <div className="flex flex-col items-end shrink-0" dir="ltr">
            <span className="text-[0.5625rem] uppercase tracking-[0.18em] text-stone/80 font-medium">
              Expires
            </span>
            <span className="text-white/90 font-medium font-mono tracking-wider mt-0.5">
              {displayExpiry}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
