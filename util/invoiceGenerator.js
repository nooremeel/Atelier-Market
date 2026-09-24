const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Formats a currency amount into standard USD representation.
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return '$' + val.toFixed(2);
}

/**
 * Formats date into readable string: "Sep 24, 2026 at 01:25 AM"
 * @param {Date|string} dateInput
 * @returns {{ dateStr: string, timeStr: string }}
 */
function formatDateTime(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) {
    const now = new Date();
    return {
      dateStr: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timeStr: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  }
  return {
    dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timeStr: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

/**
 * Resolves human-readable payment method label.
 * @param {string} method
 * @returns {string}
 */
function getPaymentMethodLabel(method) {
  switch (method) {
    case 'cash_on_delivery':
      return 'Cash on White-Glove Delivery';
    case 'apple_pay':
      return 'Apple Pay (Biometric Authorized)';
    case 'card':
    default:
      return 'Credit / Debit Card (256-Bit SSL Vault)';
  }
}

/**
 * Generates an elegant, luxury PDF invoice for an order and pipes it to writableStream.
 * @param {Object} order
 * @param {import('stream').Writable} writableStream
 * @returns {PDFDocument}
 */
function generateInvoicePdf(order, writableStream) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Invoice - ${order._id}`,
      Author: 'Atelier Market',
      Subject: `Order Receipt #${order._id}`,
      Keywords: 'invoice, receipt, atelier market, luxury, handcrafted',
      CreationDate: order.createdAt ? new Date(order.createdAt) : new Date(),
    },
  });

  doc.pipe(writableStream);

  const pageWidth = 595.28;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2; // 515.28 pt

  // Atelier Design System Palette
  const cInk = '#161514';
  const cCharcoal = '#22211F';
  const cGold = '#C5A059';
  const cDarkGold = '#9E7D3B';
  const cStone = '#78726A';
  const cMuted = '#9C968E';
  const cHairline = '#E6E2DA';
  const cSilk = '#F7F5F0';
  const cOxblood = '#8B2635';
  const cEmeraldBg = '#EBF6EE';
  const cEmeraldText = '#1A6B37';

  // -------------------------------------------------------------
  // 1. BRAND HEADER (y = 40)
  // -------------------------------------------------------------
  const logoPath = path.join(__dirname, '..', 'client', 'public', 'apple-touch-icon.png');
  const hasLogo = fs.existsSync(logoPath);

  let headerTextX = margin;
  if (hasLogo) {
    try {
      doc.image(logoPath, margin, 40, { width: 44, height: 44 });
      headerTextX = margin + 54;
    } catch {
      headerTextX = margin;
    }
  }

  doc.font('Helvetica-Bold').fontSize(16).fillColor(cInk).text('ATELIER MARKET', headerTextX, 42, { characterSpacing: 1.5 });
  doc.font('Helvetica').fontSize(7.5).fillColor(cDarkGold).text('ARCHIVAL CURATION & INDEPENDENT MASTER STUDIOS', headerTextX, 61, { characterSpacing: 1 });
  doc.font('Helvetica').fontSize(7).fillColor(cStone).text('www.ateliermarket.com  ·  concierge@ateliermarket.com', headerTextX, 72);

  // Right Side Header (Invoice Number & Dates)
  const orderIdStr = (order._id ? order._id.toString() : 'ORD');
  const shortId = orderIdStr.slice(-8).toUpperCase();
  const { dateStr, timeStr } = formatDateTime(order.createdAt);

  doc.font('Helvetica-Bold').fontSize(16).fillColor(cInk).text('OFFICIAL INVOICE', 330, 40, { width: 225, align: 'right', characterSpacing: 0.5 });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(cDarkGold).text(`INVOICE #: INV-${shortId}`, 330, 60, { width: 225, align: 'right' });
  doc.font('Helvetica').fontSize(7.5).fillColor(cStone).text(`Date: ${dateStr} at ${timeStr}`, 330, 72, { width: 225, align: 'right' });
  doc.font('Helvetica').fontSize(7).fillColor(cMuted).text(`Order Ref: #${orderIdStr}`, 330, 83, { width: 225, align: 'right' });

  // Gold accent rule
  doc.rect(margin, 98, contentWidth, 2).fill(cGold);
  doc.rect(margin, 100.5, contentWidth, 0.5).fill(cHairline);

  // -------------------------------------------------------------
  // 2. CLIENT & ORDER DETAILS (y = 112)
  // -------------------------------------------------------------
  const boxTop = 112;
  const colWidth = (contentWidth - 16) / 2; // 249.6 pt

  // Left Column: Billed & Shipped To
  doc.roundedRect(margin, boxTop, colWidth, 80, 2).fillAndStroke(cSilk, cHairline);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(cDarkGold).text('BILLED & SHIPPED TO', margin + 12, boxTop + 10, { characterSpacing: 1 });

  const recipientName = order.shippingAddress?.name || order.user?.name || 'Valued Patron';
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(cInk).text(recipientName, margin + 12, boxTop + 23);
  doc.font('Helvetica').fontSize(8).fillColor(cCharcoal).text(order.user?.email || 'N/A', margin + 12, boxTop + 36);

  const addressParts = [];
  if (order.shippingAddress?.street) addressParts.push(order.shippingAddress.street);
  const cityCountry = [order.shippingAddress?.city, order.shippingAddress?.country].filter(Boolean).join(', ');
  if (cityCountry) addressParts.push(cityCountry);
  if (order.shippingAddress?.postalCode) addressParts.push(`Postal: ${order.shippingAddress.postalCode}`);

  doc.font('Helvetica').fontSize(7.5).fillColor(cStone).text(
    addressParts.join('  ·  ') || 'Bespoke White-Glove Courier Destination',
    margin + 12,
    boxTop + 48,
    { width: colWidth - 24, height: 26, ellipsis: true }
  );

  // Right Column: Order & Settlement Details
  const rightColX = margin + colWidth + 16;
  doc.roundedRect(rightColX, boxTop, colWidth, 80, 2).fillAndStroke(cSilk, cHairline);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(cDarkGold).text('ORDER & SETTLEMENT DETAILS', rightColX + 12, boxTop + 10, { characterSpacing: 1 });

  const methodLabel = getPaymentMethodLabel(order.paymentMethod);
  doc.font('Helvetica').fontSize(8).fillColor(cCharcoal).text('Payment Method:', rightColX + 12, boxTop + 24);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(cInk).text(methodLabel, rightColX + 82, boxTop + 24, { width: colWidth - 94, height: 12, ellipsis: true });

  doc.font('Helvetica').fontSize(8).fillColor(cCharcoal).text('Payment Status:', rightColX + 12, boxTop + 38);
  const isPaid = order.paymentStatus === 'paid';
  const statusText = isPaid ? 'PAID / SETTLED' : (order.paymentStatus === 'refunded' ? 'REFUNDED' : 'PENDING');
  const pillBg = isPaid ? cEmeraldBg : (order.paymentStatus === 'refunded' ? '#FEE2E2' : '#FEF3C7');
  const pillText = isPaid ? cEmeraldText : (order.paymentStatus === 'refunded' ? cOxblood : '#92400E');

  doc.roundedRect(rightColX + 82, boxTop + 36, 78, 13, 2).fill(pillBg);
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(pillText).text(statusText, rightColX + 82, boxTop + 39, { width: 78, align: 'center', characterSpacing: 0.5 });

  doc.font('Helvetica').fontSize(8).fillColor(cCharcoal).text('Fulfillment:', rightColX + 12, boxTop + 54);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(cInk).text((order.status || 'Confirmed').toUpperCase(), rightColX + 82, boxTop + 54);

  if (order.trackingNumber) {
    doc.font('Helvetica').fontSize(7.5).fillColor(cStone).text(`Tracking: ${order.trackingNumber}`, rightColX + 12, boxTop + 66);
  } else {
    doc.font('Helvetica').fontSize(7.5).fillColor(cStone).text('Insured White-Glove Courier Dispatch', rightColX + 12, boxTop + 66);
  }

  // -------------------------------------------------------------
  // 3. PRODUCT TABLE (starts y = 206)
  // -------------------------------------------------------------
  const tableTop = 206;
  const tableHeaderHeight = 22;
  doc.roundedRect(margin, tableTop, contentWidth, tableHeaderHeight, 2).fill(cCharcoal);

  // Column X Offsets (Total width: 515, margin = 40, right edge = 555)
  const colDescX = margin + 12; // 52
  const colDescW = 250;
  const colQtyX = 312;
  const colQtyW = 45;
  const colPriceX = 368;
  const colPriceW = 80;
  const colTotalX = 458;
  const colTotalW = 87; // ends at 545 (10pt inside table border)

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF');
  doc.text('PIECE / BESPOKE ACQUISITION', colDescX, tableTop + 7, { width: colDescW, characterSpacing: 0.8 });
  doc.text('QTY', colQtyX, tableTop + 7, { width: colQtyW, align: 'center', characterSpacing: 0.8 });
  doc.text('UNIT PRICE', colPriceX, tableTop + 7, { width: colPriceW, align: 'right', characterSpacing: 0.8 });
  doc.text('TOTAL', colTotalX, tableTop + 7, { width: colTotalW, align: 'right', characterSpacing: 0.8 });

  // -------------------------------------------------------------
  // 4. PRODUCT ROWS
  // -------------------------------------------------------------
  let curY = tableTop + tableHeaderHeight + 6;
  let computedSubtotal = 0;

  const products = Array.isArray(order.products) ? order.products : [];
  products.forEach((p, idx) => {
    const itemPrice = (p.variant && typeof p.variant.price === 'number') ? p.variant.price : (p.productData?.price || 0);
    const itemQty = p.quantity || 1;
    const itemTotal = Math.round(itemPrice * itemQty * 100) / 100;
    computedSubtotal += itemTotal;

    const variantLabel = p.variant?.name ? ` — ${p.variant.name}` : '';
    const itemTitle = `${p.productData?.title || 'Artisan Piece'}${variantLabel}`;

    const hasDesc = Boolean(p.productData?.description && p.productData.description.trim());
    const rowHeight = hasDesc ? 32 : 24;

    // Optional alternate subtle background
    if (idx % 2 === 1) {
      doc.rect(margin, curY - 3, contentWidth, rowHeight).fill('#FAF9F7');
    }

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(cInk).text(itemTitle, colDescX, curY, { width: colDescW, height: 12, ellipsis: true });
    if (hasDesc) {
      doc.font('Helvetica').fontSize(7).fillColor(cStone).text(p.productData.description, colDescX, curY + 12, { width: colDescW, height: 14, ellipsis: true });
    }

    doc.font('Helvetica').fontSize(8.5).fillColor(cCharcoal).text(String(itemQty), colQtyX, curY + 2, { width: colQtyW, align: 'center' });
    doc.font('Helvetica').fontSize(8.5).fillColor(cCharcoal).text(formatCurrency(itemPrice), colPriceX, curY + 2, { width: colPriceW, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(cInk).text(formatCurrency(itemTotal), colTotalX, curY + 2, { width: colTotalW, align: 'right' });

    // Row hairline divider
    doc.rect(margin, curY + rowHeight - 4, contentWidth, 0.5).fill(cHairline);
    curY += rowHeight;
  });

  curY += 8;

  // -------------------------------------------------------------
  // 5. SUMMARY & TOTALS SECTION
  // -------------------------------------------------------------
  const bottomSectionY = Math.max(curY, 340);

  // Left Card: Authenticity & Provenance Guarantee
  const leftCardW = 230;
  doc.roundedRect(margin, bottomSectionY, leftCardW, 110, 2).fillAndStroke(cSilk, cHairline);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(cDarkGold).text('AUTHENTICITY & PROVENANCE GUARANTEE', margin + 12, bottomSectionY + 10, { characterSpacing: 0.8 });
  doc.font('Helvetica').fontSize(7).fillColor(cStone).text(
    'Every piece acquired from Atelier Market is a certified authentic handcrafted work, produced in limited seasonal intakes directly by independent master studios across the Gulf and Levant regions.',
    margin + 12,
    bottomSectionY + 23,
    { width: leftCardW - 24, lineGap: 2.5 }
  );

  doc.rect(margin + 12, bottomSectionY + 68, leftCardW - 24, 0.5).fill(cHairline);
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(cCharcoal).text('PAYMENT VERIFICATION HASH', margin + 12, bottomSectionY + 74, { characterSpacing: 0.5 });
  const refHash = order.paymentReference || `VAULT-MKT-${orderIdStr.slice(-8).toUpperCase()}`;
  doc.font('Courier').fontSize(7).fillColor(cStone).text(refHash, margin + 12, bottomSectionY + 85, { width: leftCardW - 24, height: 10, ellipsis: true });
  doc.font('Helvetica').fontSize(6.5).fillColor(cMuted).text('Encrypted with 256-bit bank-grade SSL security.', margin + 12, bottomSectionY + 97);

  // Right Column: Itemized Financial Totals (ends at 545, matching colTotalX + colTotalW)
  const totalsX = 295;
  const totalsW = 250;
  let totY = bottomSectionY + 4;

  const finalSubtotal = order.subtotal && order.subtotal > 0 ? order.subtotal : computedSubtotal;

  // Subtotal line
  const countPieces = products.length;
  doc.font('Helvetica').fontSize(8.5).fillColor(cStone).text(`Subtotal (${countPieces} piece${countPieces > 1 ? 's' : ''}):`, totalsX, totY);
  doc.font('Helvetica').fontSize(8.5).fillColor(cInk).text(formatCurrency(finalSubtotal), totalsX, totY, { width: totalsW, align: 'right' });
  totY += 16;

  // Discount line (if present)
  if (order.discount && order.discount.amount > 0) {
    const promoCode = order.discount.code ? ` (${order.discount.code.toUpperCase()})` : '';
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(cOxblood).text(`Promotional Discount${promoCode}:`, totalsX, totY);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(cOxblood).text(`-${formatCurrency(order.discount.amount)}`, totalsX, totY, { width: totalsW, align: 'right' });
    totY += 16;
  }

  // Shipping line
  const shippingFee = typeof order.shippingFee === 'number' ? order.shippingFee : 0;
  doc.font('Helvetica').fontSize(8.5).fillColor(cStone).text('White-Glove Courier Delivery:', totalsX, totY);
  if (shippingFee > 0) {
    doc.font('Helvetica').fontSize(8.5).fillColor(cInk).text(formatCurrency(shippingFee), totalsX, totY, { width: totalsW, align: 'right' });
  } else {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(cDarkGold).text('COMPLIMENTARY', totalsX, totY, { width: totalsW, align: 'right', characterSpacing: 0.5 });
  }
  totY += 16;

  // Taxes / Duties line
  doc.font('Helvetica').fontSize(8.5).fillColor(cStone).text('Estimated Taxes & Duties:', totalsX, totY);
  doc.font('Helvetica').fontSize(8).fillColor(cMuted).text('Included (0.00)', totalsX, totY, { width: totalsW, align: 'right' });
  totY += 18;

  // Total Paid Banner Box
  doc.roundedRect(totalsX, totY, totalsW, 32, 2).fill(cCharcoal);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(cGold).text('TOTAL PAID', totalsX + 12, totY + 11, { characterSpacing: 1 });
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#FFFFFF').text(formatCurrency(order.totalPrice), totalsX, totY + 9, { width: totalsW - 12, align: 'right' });

  // -------------------------------------------------------------
  // 6. FOOTER (Pinned to bottom of page)
  // -------------------------------------------------------------
  const footerY = 750;
  doc.rect(margin, footerY, contentWidth, 0.5).fill(cHairline);
  doc.rect(margin, footerY + 1.5, contentWidth, 1).fill(cGold);

  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(cDarkGold).text(
    'ARTISANAL PROVENANCE  ·  CLIMATE-NEUTRAL COURIER  ·  14-DAY CONSIDERATION  ·  ARCHIVAL PACKAGING',
    margin,
    footerY + 10,
    { width: contentWidth, align: 'center', characterSpacing: 1.2 }
  );

  doc.font('Helvetica').fontSize(7).fillColor(cStone).text(
    'Inquiries & Concierge: concierge@ateliermarket.com  ·  Atelier Market Ltd., Financial Centre, Dubai, UAE & Manama, Bahrain',
    margin,
    footerY + 22,
    { width: contentWidth, align: 'center' }
  );

  doc.font('Helvetica').fontSize(6.5).fillColor(cMuted).text(
    `Official electronic invoice generated for Order #${orderIdStr}  ·  Page 1 of 1`,
    margin,
    footerY + 34,
    { width: contentWidth, align: 'center' }
  );

  doc.end();
  return doc;
}

module.exports = {
  generateInvoicePdf,
};
