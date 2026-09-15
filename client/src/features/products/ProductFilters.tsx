import { Field } from '../../components/Field';
import { Select } from '../../components/Select';
import { Button } from '../../components/Button';
import { useI18n } from '../../lib/i18n';
import type { ProductQuery } from './useProducts';

type Props = { value: ProductQuery; onChange: (next: ProductQuery) => void };

export function ProductFilters({ value, onChange }: Props) {
  const { t } = useI18n();
  const active = Boolean(value.q || value.sort || value.minPrice || value.maxPrice || value.category);

  const sortOptions = [
    { value: 'newest', label: t('catalog.sortNewest') },
    { value: 'price_asc', label: t('catalog.sortPriceAsc') },
    { value: 'price_desc', label: t('catalog.sortPriceDesc') },
    { value: 'title_asc', label: t('catalog.sortTitleAsc') },
  ];

  return (
    <div className="flex flex-wrap items-end gap-4 p-5 mb-8 bg-canvas/80 border border-hairline/60 rounded-sm shadow-subtle transition-colors">
      <Field
        label={t('catalog.searchPlaceholder')}
        aria-label="Search"
        name="q"
        defaultValue={value.q ?? ''}
        onChange={(e) => onChange({ ...value, q: e.target.value })}
        className="w-48 sm:w-60"
      />
      <Select
        label={t('catalog.sort')}
        name="sort"
        options={sortOptions}
        value={value.sort ?? 'newest'}
        onChange={(e) => onChange({ ...value, sort: e.target.value })}
      />
      <Field
        label={t('catalog.minPrice')}
        name="minPrice"
        type="number"
        defaultValue={value.minPrice ?? ''}
        onChange={(e) => onChange({ ...value, minPrice: e.target.value ? Number(e.target.value) : undefined })}
        className="w-28"
      />
      <Field
        label={t('catalog.maxPrice')}
        name="maxPrice"
        type="number"
        defaultValue={value.maxPrice ?? ''}
        onChange={(e) => onChange({ ...value, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
        className="w-28"
      />
      {active && (
        <div className="pb-1">
          <Button variant="ghost" size="sm" onClick={() => onChange({ page: 1 })}>
            {t('catalog.clearFilters')}
          </Button>
        </div>
      )}
    </div>
  );
}
