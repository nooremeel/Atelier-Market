import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Locale = 'en' | 'ar';

export const TRANSLATIONS = {
  en: {
    // Navigation
    'nav.announcement': 'Complimentary Worldwide Courier on Orders Over $200',
    'nav.shop': 'Shop',
    'nav.products': 'Products',
    'nav.cart': 'Cart',
    'nav.orders': 'Orders',
    'nav.admin': 'Admin',
    'nav.adminStudio': 'Admin Studio',
    'nav.login': 'Log in',
    'nav.logout': 'Log out',
    'nav.register': 'Register',
    'nav.menu': 'Menu',
    'nav.navigation': 'Navigation',
    'nav.itemsCount': '{count} items',
    'nav.tagline': 'Atelier of considered goods.',
    'nav.subtagline': 'Curated with discretion and craft.',
    'nav.wordmarkSub': 'CONSIDERED GOODS',
    'nav.themeToggle': 'Toggle dark mode',
    'nav.themeDark': 'Switch to dark mode',
    'nav.themeLight': 'Switch to light mode',
    'nav.langToggle': 'Switch language',

    // Home
    'home.collectionBadge': 'Collection No. 04 · Considered Artifacts',
    'home.heroTitle': 'The art of the curated object.',
    'home.heroSubtitle': 'Everyday goods chosen with quiet discernment. Formulated for longevity, tactile resonance, and timeless utility.',
    'home.exploreBtn': 'Explore Collection',
    'home.browseBtn': 'Browse all products',
    'home.exhibitBadge': 'Atelier Exhibit · No. 42',
    'home.pillar1Title': '01 Artisanal Provenance',
    'home.pillar1Desc': 'Crafted by multi-generational studios across Japan, Italy, and Scandinavia.',
    'home.pillar2Title': '02 Pure Materiality',
    'home.pillar2Desc': 'Noble metals, unglazed ceramics, vegetable-tanned leathers, and long-staple linen.',
    'home.pillar3Title': '03 Discrete Delivery',
    'home.pillar3Desc': 'Archival packaging with hand-signed authenticity dossier for every piece.',
    'home.showcaseTitle': 'Curated Showcase',
    'home.showcaseSubtitle': 'Selected works from our current seasonal intake.',
    'home.viewFullCatalogue': 'View full catalogue',
    'home.manifestoQuote': 'True luxury resides in restraint — fewer objects, deeper intention, and materials that speak in quiet tones.',
    'home.manifestoAuthor': 'The Atelier Manifesto',
    'home.noProductsYet': 'No products yet',
    'home.noProductsYetDesc': 'Check back soon.',

    // Catalog & Filters
    'catalog.title': 'The Collection',
    'catalog.subtitle': 'Considered objects for daily ritual, contemplative spaces, and quiet appreciation.',
    'catalog.searchPlaceholder': 'Search the collection...',
    'catalog.sort': 'Sort',
    'catalog.sortNewest': 'Newest first',
    'catalog.sortPriceAsc': 'Price: Low to High',
    'catalog.sortPriceDesc': 'Price: High to Low',
    'catalog.sortTitleAsc': 'Title: A to Z',
    'catalog.priceRange': 'Price range',
    'catalog.minPrice': 'Min',
    'catalog.maxPrice': 'Max',
    'catalog.filterBtn': 'Filter',
    'catalog.resetBtn': 'Reset',
    'catalog.emptyTitle': 'No products found',
    'catalog.emptyDesc': 'Try adjusting your search or filters.',
    'catalog.clearFilters': 'Clear filters',
    'catalog.viewDetails': 'View details',
    'catalog.addToCart': 'Add to cart',
    'catalog.adding': 'Adding...',

    // Product Detail
    'product.badge': 'Atelier Selection · Provenance Guaranteed',
    'product.courierNotice': 'Tax included. Complimentary bespoke courier.',
    'product.provenanceTitle': 'Materiality & Provenance',
    'product.provenanceText': 'Each piece is individually inspected and registered in our archive. Produced using sustainably harvested raw materials and non-toxic traditional processing.',
    'product.deliveryTitle': 'Delivery & Care',
    'product.deliveryText': 'Dispatched via climate-controlled courier in custom archival paperboard. Clean with soft untreated cloth; avoid chemical solvents.',
    'product.backToProducts': 'Back to products',
    'product.notFound': 'Product not found',
    'product.notFoundDesc': 'It may have been removed or relocated.',

    // Cart
    'cart.title': 'Shopping Bag',
    'cart.emptyTitle': 'Your cart is empty',
    'cart.emptyDesc': 'Explore our considered collection to find objects of quiet beauty.',
    'cart.exploreCollection': 'Explore the collection',
    'cart.orderSummary': 'Order Summary',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.complimentary': 'Complimentary',
    'cart.courierNote': 'Includes white-glove packaging and archival verification dossier.',
    'cart.estimatedTotal': 'Estimated Total',
    'cart.proceedCheckout': 'Proceed to Checkout',
    'cart.remove': 'Remove',

    // Checkout & Orders
    'checkout.title': 'Review & Place Order',
    'checkout.itemReview': 'Item Review',
    'checkout.placeOrder': 'Place Order',
    'checkout.placingOrder': 'Placing order...',
    'checkout.courierPromise': 'Orders are dispatched within 24 hours via bespoke courier.',
    'orders.title': 'Your Orders',
    'orders.subtitle': 'Archival records of all bespoke acquisitions.',
    'orders.emptyTitle': 'No orders yet',
    'orders.emptyDesc': 'Your placed orders will show up here.',
    'orders.orderNum': 'Order #',
    'orders.downloadInvoice': 'Download Invoice',
    'orders.total': 'Total',

    // Auth
    'auth.loginTitle': 'Welcome to Atelier',
    'auth.loginSubtitle': 'Access your personal portfolio and order archive.',
    'auth.email': 'Email address',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm password',
    'auth.signIn': 'Sign in',
    'auth.signingIn': 'Signing in...',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.registerLink': 'Register',
    'auth.forgotPassword': 'Forgot your password?',
    'auth.registerTitle': 'Create an Account',
    'auth.registerSubtitle': 'Begin collecting considered objects from master artisans.',
    'auth.createAccount': 'Create account',
    'auth.creatingAccount': 'Creating account...',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.resetTitle': 'Reset Password',
    'auth.resetSubtitle': 'Enter your email to receive a password reset link.',
    'auth.checkInbox': 'Check your inbox',
    'auth.checkInboxDesc': 'If that email exists, a reset link is on its way.',
    'auth.sendResetLink': 'Send reset link',
    'auth.rememberPassword': 'Remember your password?',
    'auth.setPasswordTitle': 'Set New Password',
    'auth.newPassword': 'New password',
    'auth.savePassword': 'Save password',

    // Admin
    'admin.title': 'Studio Inventory',
    'admin.subtitle': 'Manage catalog pieces, pricing, and provenance assets.',
    'admin.addPiece': 'Add new piece',
    'admin.editPiece': 'Edit piece',
    'admin.deleteConfirm': 'Are you sure you want to remove this piece from the archive?',
    'admin.cancel': 'Cancel',
    'admin.delete': 'Delete',
    'admin.save': 'Save',

    // Footer
    'footer.manifesto': 'Purveyors of quiet luxury, architectural goods, and tactile objects crafted with enduring provenance.',
    'footer.journalTitle': 'The Atelier Journal',
    'footer.journalDesc': 'Receive intimate dispatches on new acquisitions, artisan profiles, and seasonal monographs.',
    'footer.emailPlaceholder': 'Enter your email...',
    'footer.join': 'Join',
    'footer.subscribed': 'Thank you for subscribing to the Journal.',
    'footer.rights': 'All rights reserved.',
    'footer.curated': 'Curated with restraint and discipline.',

    // Pagination
    'pagination.previous': 'Previous',
    'pagination.next': 'Next',
    'pagination.page': 'Page',
    'pagination.of': 'of',
  },
  ar: {
    // Navigation
    'nav.announcement': 'شحن مجاني لكافة الوجهات للطلبات التي تتجاوز ٢٠٠$',
    'nav.shop': 'المتجر',
    'nav.products': 'المجموعات',
    'nav.cart': 'الحقيبة',
    'nav.orders': 'طلباتي',
    'nav.admin': 'الإدارة',
    'nav.adminStudio': 'استوديو الإدارة',
    'nav.login': 'تسجيل الدخول',
    'nav.logout': 'تسجيل الخروج',
    'nav.register': 'إنشاء حساب',
    'nav.menu': 'القائمة',
    'nav.navigation': 'التنقل',
    'nav.itemsCount': '{count} قطع',
    'nav.tagline': 'أتيليه المقتنيات الاستثنائية.',
    'nav.subtagline': 'منتقاة بخصوصية وبراعة فائقة.',
    'nav.wordmarkSub': 'مقتنيات منتقاة',
    'nav.themeToggle': 'تبديل المظهر',
    'nav.themeDark': 'تفعيل الوضع الليلي',
    'nav.themeLight': 'تفعيل الوضع المضيء',
    'nav.langToggle': 'تغيير اللغة',

    // Home
    'home.collectionBadge': 'المجموعة الرابعة · تحف منتقاة',
    'home.heroTitle': 'فن اقتناء القطع الفريدة.',
    'home.heroSubtitle': 'مقتنيات يومية اختيرت بذوق رفيع وهدوء بالغ. صُممت لتدوم، بحضور ملموس وأناقة خالدة.',
    'home.exploreBtn': 'استكشف المجموعة',
    'home.browseBtn': 'تصفح جميع المنتجات',
    'home.exhibitBadge': 'معرض الأتيليه · رقم ٤٢',
    'home.pillar1Title': '٠١ أصالة المصدر',
    'home.pillar1Desc': 'صُنعت في ورش عريقة متوارثة عبر الأجيال في اليابان وإيطاليا وإسكندنافيا.',
    'home.pillar2Title': '٠٢ نقاء الخامة',
    'home.pillar2Desc': 'معادن نبيلة، وخزف طبيعي، وجلود نقية مدبوغة نباتياً، وكتان أصيل.',
    'home.pillar3Title': '٠٣ تسليم راقٍ وموثق',
    'home.pillar3Desc': 'تغليف أرشيفي فاخر مصحوب بوثيقة أصالة موقّعة يدوياً لكل تحفة.',
    'home.showcaseTitle': 'معروضات استثنائية',
    'home.showcaseSubtitle': 'قطع مختارة بعناية من تشكيلة هذا الموسم.',
    'home.viewFullCatalogue': 'عرض الدليل الكامل',
    'home.manifestoQuote': 'الفخامة الحقيقية تكمن في البساطة الهادفة — قطع أقل، وحضور أعمق، وخامات تنبض بهدوء ووقار.',
    'home.manifestoAuthor': 'بيان الأتيليه',
    'home.noProductsYet': 'لم تتوفر منتجات بعد',
    'home.noProductsYetDesc': 'يرجى العودة قريباً للاطلاع على جديدنا.',

    // Catalog & Filters
    'catalog.title': 'المجموعة المعمارية',
    'catalog.subtitle': 'مقتنيات منتقاة للطقوس اليومية، ولأماكن التأمل والسكينة والتقدير الهادئ.',
    'catalog.searchPlaceholder': 'ابحث في المجموعة المعمارية...',
    'catalog.sort': 'الترتيب',
    'catalog.sortNewest': 'الأحدث أولاً',
    'catalog.sortPriceAsc': 'السعر: من الأقل للأعلى',
    'catalog.sortPriceDesc': 'السعر: من الأعلى للأقل',
    'catalog.sortTitleAsc': 'الاسم: أ إلى ي',
    'catalog.priceRange': 'نطاق السعر',
    'catalog.minPrice': 'الحد الأدنى',
    'catalog.maxPrice': 'الحد الأقصى',
    'catalog.filterBtn': 'تصفية',
    'catalog.resetBtn': 'إعادة ضبط',
    'catalog.emptyTitle': 'لم نجد أية منتجات',
    'catalog.emptyDesc': 'يرجى تجربة كلمات بحث أو معايير تصفية مختلفة.',
    'catalog.clearFilters': 'مسح معايير التصفية',
    'catalog.viewDetails': 'عرض التفاصيل',
    'catalog.addToCart': 'إضافة إلى الحقيبة',
    'catalog.adding': 'جارٍ الإضافة...',

    // Product Detail
    'product.badge': 'مختارات الأتيليه · أصالة موثقة',
    'product.courierNotice': 'شامل الضريبة. شحن استثنائي مجاني.',
    'product.provenanceTitle': 'الخامات وأصالة الصنع',
    'product.provenanceText': 'تُفحص كل قطعة بعناية وتُقيد في سجلاتنا الأرشيفية. مصنّعة من خامات مستدامة مستخرجة بمسؤولية وخالية من المعالجات الصناعية الضارة.',
    'product.deliveryTitle': 'الشحن وإرشادات العناية',
    'product.deliveryText': 'تُشحن عبر خدمة توصيل مخصصة داخل علبة أرشيفية فاخرة. تُنظف بقطعة قماش ناعمة جافة بعيداً عن المذيبات الكيميائية.',
    'product.backToProducts': 'العودة إلى المنتجات',
    'product.notFound': 'المنتج غير متوفر',
    'product.notFoundDesc': 'قد يكون تم نقله أو نفاد كميته الأرشيفية.',

    // Cart
    'cart.title': 'حقيبة التسوق',
    'cart.emptyTitle': 'حقيبتك فارغة حالياً',
    'cart.emptyDesc': 'استكشف مجموعتنا المنتقاة لتجد مقتنيات ذات بهاء هادئ وحضور استثنائي.',
    'cart.exploreCollection': 'استكشف المجموعة',
    'cart.orderSummary': 'ملخص الطلب',
    'cart.subtotal': 'المجموع الفرعي',
    'cart.shipping': 'الشحن',
    'cart.complimentary': 'مجاني',
    'cart.courierNote': 'يشمل تغليفاً فاخراً وشهادة التحقق الأرشيفية الموقّعة.',
    'cart.estimatedTotal': 'الإجمالي التقديري',
    'cart.proceedCheckout': 'متابعة لإتمام الطلب',
    'cart.remove': 'إزالة',

    // Checkout & Orders
    'checkout.title': 'مراجعة وتأكيد الطلب',
    'checkout.itemReview': 'مراجعة المقتنيات',
    'checkout.placeOrder': 'تأكيد الطلب',
    'checkout.placingOrder': 'جارٍ تأكيد الطلب...',
    'checkout.courierPromise': 'يتم إرسال الطلبات خلال ٢٤ ساعة عبر ناقل خاص معتمد.',
    'orders.title': 'سجل طلباتكم',
    'orders.subtitle': 'السجل الأرشيفي لكافة مقتنياتكم المعتمدة.',
    'orders.emptyTitle': 'لم تُسجل أي طلبات بعد',
    'orders.emptyDesc': 'ستظهر هنا سجلات طلباتكم وفواتير الشراء بصيغة PDF.',
    'orders.orderNum': 'طلب رقم #',
    'orders.downloadInvoice': 'تحميل الفاتورة الرسمية',
    'orders.total': 'الإجمالي',

    // Auth
    'auth.loginTitle': 'مرحباً بكم في الأتيليه',
    'auth.loginSubtitle': 'سجل دخولك للوصول إلى مجموعتك وسجل طلباتك الخاصة.',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.signIn': 'تسجيل الدخول',
    'auth.signingIn': 'جارٍ تسجيل الدخول...',
    'auth.dontHaveAccount': 'ليس لديك حساب؟',
    'auth.registerLink': 'إنشاء حساب',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.registerTitle': 'إنشاء حساب جديد',
    'auth.registerSubtitle': 'انضم إلينا لبدء اقتناء قطع نادرة من أمهر الحرفيين.',
    'auth.createAccount': 'تسجيل الحساب',
    'auth.creatingAccount': 'جارٍ تسجيل الحساب...',
    'auth.alreadyHaveAccount': 'لديك حساب بالفعل؟',
    'auth.resetTitle': 'استعادة كلمة المرور',
    'auth.resetSubtitle': 'أدخل بريدك الإلكتروني لاستلام رابط إعادة تعيين كلمة المرور.',
    'auth.checkInbox': 'تحقق من بريدك الإلكتروني',
    'auth.checkInboxDesc': 'إذا كان هذا البريد مسجلاً لدينا، فستصلك رسالة تحتوي على رابط التعيين.',
    'auth.sendResetLink': 'إرسال رابط التعيين',
    'auth.rememberPassword': 'تذكرت كلمة المرور؟',
    'auth.setPasswordTitle': 'تعيين كلمة مرور جديدة',
    'auth.newPassword': 'كلمة المرور الجديدة',
    'auth.savePassword': 'حفظ كلمة المرور',

    // Admin
    'admin.title': 'مخزون الأتيليه',
    'admin.subtitle': 'إدارة قطع المجموعة والأسعار والأصول الأرشيفية.',
    'admin.addPiece': 'إضافة قطعة جديدة',
    'admin.editPiece': 'تعديل القطعة',
    'admin.deleteConfirm': 'هل أنت متأكد من رغبتك في حذف هذه القطعة من الأرشيف نهائياً؟',
    'admin.cancel': 'إلغاء',
    'admin.delete': 'حذف',
    'admin.save': 'حفظ التعديلات',

    // Footer
    'footer.manifesto': 'وجهتكم للفخامة الهادئة والقطع الراقية المصنوعة ببراعة تدوم طويلاً.',
    'footer.journalTitle': 'نشرة الأتيليه',
    'footer.journalDesc': 'اشترك لتصلك رسائلنا الحصرية حول المجموعات الجديدة وسير كبار الحرفيين.',
    'footer.emailPlaceholder': 'أدخل بريدك الإلكتروني...',
    'footer.join': 'انضمام',
    'footer.subscribed': 'شكراً لانضمامك إلى مجلة الأتيليه.',
    'footer.rights': 'جميع الحقوق محفوظة.',
    'footer.curated': 'صُنعت بحرفية وعناية فائقة.',

    // Pagination
    'pagination.previous': 'السابق',
    'pagination.next': 'التالي',
    'pagination.page': 'صفحة',
    'pagination.of': 'من',
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
  isArabic: boolean;
}

const defaultT = (key: string, params?: Record<string, string | number>): string => {
  const dict = TRANSLATIONS.en;
  let text = (dict as Record<string, string>)[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    });
  }
  return text;
};

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  toggleLocale: () => {},
  t: defaultT,
  dir: 'ltr',
  isArabic: false,
});

const LOCALE_KEY = 'atelier_locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const stored = localStorage.getItem(LOCALE_KEY);
      if (stored === 'en' || stored === 'ar') return stored;
    } catch {
      // ignore
    }
    return 'en';
  });

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('dir', dir);
    root.setAttribute('lang', locale);
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale, dir]);

  const setLocale = (newLocale: Locale) => setLocaleState(newLocale);
  const toggleLocale = () => setLocaleState((prev) => (prev === 'en' ? 'ar' : 'en'));

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = TRANSLATIONS[locale] ?? TRANSLATIONS.en;
    let text = (dict as Record<string, string>)[key] ?? (TRANSLATIONS.en as Record<string, string>)[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        toggleLocale,
        t,
        dir,
        isArabic: locale === 'ar',
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
