import { Select } from '../../components/Select';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { useI18n } from '../../lib/i18n';
import type { ProductQuery } from './useProducts';

type Props = { value: ProductQuery; onChange: (next: ProductQuery, immediate?: boolean) => void };

function ActiveFilter({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.7rem] tracking-[0.1em] uppercase font-medium border border-gold-leaf/60 text-gold-leaf hover:bg-gold-leaf/10 rounded-sm transition-colors"
    >
      {label}
      <span aria-hidden className="text-[0.9em]">✕</span>
    </button>
  );
}

export function ProductFilters({ value, onChange }: Props) {
  const { t } = useI18n();

  const categories = [
    { value: '',         label: t('category.all') },
    { value: 'ceramics', label: t('category.ceramics') },
    { value: 'leather',  label: t('category.leather') },
    { value: 'glass',    label: t('category.glass') },
    { value: 'books',    label: t('category.books') },
    { value: 'textiles', label: t('category.textiles') },
    { value: 'metals',   label: t('category.metals') },
    { value: 'paper',    label: t('category.paper') },
    { value: 'other',    label: t('category.other') },
  ];

  const sortOptions = [
    { value: 'newest',     label: t('sort.newest') },
    { value: 'rating',     label: t('sort.rating') },
    { value: 'price_asc',  label: t('sort.priceAsc') },
    { value: 'price_desc', label: t('sort.priceDesc') },
  ];

  const badgeOptions = [
    { value: '',          label: t('badge.all') },
    { value: 'new',       label: t('badge.new') },
    { value: 'bestseller',label: t('badge.bestseller') },
    { value: 'limited',   label: t('badge.limited') },
    { value: 'sale',      label: t('badge.sale') },
  ];

  const isCustomSort = Boolean(value.sort && value.sort !== 'newest');
  const hasFilters = Boolean(
    value.q ||
    isCustomSort ||
    value.minPrice !== undefined ||
    value.maxPrice !== undefined ||
    value.category ||
    value.badge
  );
  const clearAll = () => onChange({ page: 1, sort: 'newest' }, true);

  return (
    <div className="mb-8 space-y-4">
      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-end gap-3 p-5 bg-canvas/80 border border-hairline/60 rounded-sm">
        {/* Search */}
        <Field
          label={t('filters.search')}
          name="q"
          value={value.q ?? ''}
          onChange={(e) => onChange({ ...value, q: e.target.value, page: 1 })}
          className="w-48 sm:w-64"
        />

        {/* Category */}
        <Select
          label={t('filters.category')}
          name="category"
          options={categories}
          value={value.category ?? ''}
          onChange={(e) => onChange({ ...value, category: e.target.value || undefined, page: 1 }, true)}
        />

        {/* Sort */}
        <Select
          label={t('filters.sortBy')}
          name="sort"
          options={sortOptions}
          value={value.sort ?? 'newest'}
          onChange={(e) => onChange({ ...value, sort: e.target.value, page: 1 }, true)}
        />

        {/* Badge */}
        <Select
          label={t('filters.collection')}
          name="badge"
          options={badgeOptions}
          value={value.badge ?? ''}
          onChange={(e) => onChange({ ...value, badge: e.target.value || undefined, page: 1 }, true)}
        />

        {/* Price range */}
        <Field
          label={t('filters.minPrice')}
          name="minPrice"
          type="number"
          value={value.minPrice ?? ''}
          onChange={(e) => onChange({ ...value, minPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
          className="w-28"
        />
        <Field
          label={t('filters.maxPrice')}
          name="maxPrice"
          type="number"
          value={value.maxPrice ?? ''}
          onChange={(e) => onChange({ ...value, maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
          className="w-28"
        />

        {/* Clear all */}
        {hasFilters && (
          <div className="pb-1">
            <Button variant="ghost" size="sm" onClick={clearAll}>
              {t('catalog.clearFilters')}
            </Button>
          </div>
        )}
      </div>

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 px-1">
          {value.q && (
            <ActiveFilter label={`"${value.q}"`} onRemove={() => onChange({ ...value, q: undefined, page: 1 }, true)} />
          )}
          {isCustomSort && (
            <ActiveFilter
              label={`${t('catalog.sort')}: ${sortOptions.find((s) => s.value === value.sort)?.label ?? value.sort}`}
              onRemove={() => onChange({ ...value, sort: 'newest', page: 1 }, true)}
            />
          )}
          {value.category && (
            <ActiveFilter
              label={categories.find((c) => c.value === value.category)?.label ?? value.category}
              onRemove={() => onChange({ ...value, category: undefined, page: 1 }, true)}
            />
          )}
          {value.badge && (
            <ActiveFilter
              label={badgeOptions.find((b) => b.value === value.badge)?.label ?? value.badge}
              onRemove={() => onChange({ ...value, badge: undefined, page: 1 }, true)}
            />
          )}
          {(value.minPrice !== undefined || value.maxPrice !== undefined) && (
            <ActiveFilter
              label={`$${value.minPrice ?? 0} – $${value.maxPrice ?? '∞'}`}
              onRemove={() => onChange({ ...value, minPrice: undefined, maxPrice: undefined, page: 1 }, true)}
            />
          )}
        </div>
      )}
    </div>
  );
}

