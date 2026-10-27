import React from 'react';
import { SearchIcon } from 'lucide-react';
import { places } from '../../data/places';
import { todayIso } from '../../utils/format';
import { Button } from '../ui/Button';
import { Field, Input, Select } from '../ui/Field';

export interface RideSearchValues {
  source: string;
  destination: string;
  date: string;
  seats: number;
}

interface RideSearchFormProps {
  values: RideSearchValues;
  onChange: (values: RideSearchValues) => void;
  onSubmit: () => void;
  loading?: boolean;
  compact?: boolean;
}

export function RideSearchForm({
  values,
  onChange,
  onSubmit,
  loading,
  compact
}: RideSearchFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={`grid gap-3 ${compact ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-5'}`}>
      
      <Field label="From" htmlFor="source">
        <Select
          id="source"
          value={values.source}
          onChange={(e) => onChange({ ...values, source: e.target.value })}>
          
          <option value="">Any pickup</option>
          {places.map((place) =>
          <option key={place.name} value={place.name}>
              {place.name}
            </option>
          )}
        </Select>
      </Field>
      <Field label="To" htmlFor="destination">
        <Select
          id="destination"
          value={values.destination}
          onChange={(e) => onChange({ ...values, destination: e.target.value })}>
          
          <option value="">Any destination</option>
          {places.map((place) =>
          <option key={place.name} value={place.name}>
              {place.name}
            </option>
          )}
        </Select>
      </Field>
      <Field label="Date" htmlFor="date">
        <Input
          id="date"
          type="date"
          min={todayIso()}
          value={values.date}
          onChange={(e) => onChange({ ...values, date: e.target.value })} />
        
      </Field>
      <Field label="Seats" htmlFor="seats">
        <Select
          id="seats"
          value={String(values.seats)}
          onChange={(e) => onChange({ ...values, seats: Number(e.target.value) })}>
          
          {[1, 2, 3, 4].map((n) =>
          <option key={n} value={n}>
              {n} {n === 1 ? 'seat' : 'seats'}
            </option>
          )}
        </Select>
      </Field>
      <div className="flex items-end">
        <Button
          type="submit"
          block
          size="lg"
          loading={loading}
          icon={<SearchIcon className="h-4 w-4" aria-hidden />}>
          
          Search
        </Button>
      </div>
    </form>);

}