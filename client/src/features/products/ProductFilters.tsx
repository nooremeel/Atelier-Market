import { Field } from '../../components/Field';
import { Select } from '../../components/Select';
import { Button } from '../../components/Button';
import type { ProductQuery } from './useProducts';

type Props = { value: ProductQuery; onChange: (next: ProductQuery) => void };

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'title_asc', label: 'Title A–Z' },
];

export function ProductFilters({ value, onChange }: Props) {
  const active = Boolean(value.q || value.sort || value.minPrice || value.maxPrice || value.category);
  return (
    <div className="flex flex-wrap items-end gap-4 py-4">
      <Field label="Search" name="q" defaultValue={value.q ?? ''}
        onChange={(e) => onChange({ ...value, q: e.target.value })} />
      <Select label="Sort" name="sort" options={SORT_OPTIONS} value={value.sort ?? 'newest'}
        onChange={(e) => onChange({ ...value, sort: e.target.value })} />
      <Field label="Min price" name="minPrice" type="number" defaultValue={value.minPrice ?? ''}
        onChange={(e) => onChange({ ...value, minPrice: e.target.value ? Number(e.target.value) : undefined })} />
      <Field label="Max price" name="maxPrice" type="number" defaultValue={value.maxPrice ?? ''}
        onChange={(e) => onChange({ ...value, maxPrice: e.target.value ? Number(e.target.value) : undefined })} />
      {active && <Button variant="ghost" onClick={() => onChange({ page: 1 })}>Clear filters</Button>}
    </div>
  );
}
