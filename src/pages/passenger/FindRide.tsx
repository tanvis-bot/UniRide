import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FilterIcon, SearchXIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { RideCard } from '../../components/rides/RideCard';
import { RideSearchForm, type RideSearchValues } from '../../components/rides/RideSearchForm';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field, Select } from '../../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAuth } from '../../contexts/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { todayIso } from '../../utils/format';

export function FindRide() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { studentApproved } = useAuth();

  const [values, setValues] = useState<RideSearchValues>({
    source: params.get('source') ?? '',
    destination: params.get('destination') ?? '',
    date: params.get('date') ?? todayIso(),
    seats: Number(params.get('seats') ?? 1)
  });
  const [filters, setFilters] = useState({
    maxFare: params.get('maxFare') ?? '',
    timeBand: params.get('timeBand') ?? 'any',
    verifiedOnly: params.get('verifiedOnly') === 'true',
    sort: params.get('sort') ?? 'departure'
  });

  const query = useMemo(
    () => ({
      source: params.get('source') ?? '',
      destination: params.get('destination') ?? '',
      date: params.get('date') ?? '',
      seats: Number(params.get('seats') ?? 1),
      maxFare: params.get('maxFare') ?? '',
      timeBand: params.get('timeBand') ?? 'any',
      verifiedOnly: params.get('verifiedOnly') === 'true',
      sort: params.get('sort') ?? 'departure'
    }),
    [params]
  );

  const rides = useAsync(() => api.rides.search(query), [params.toString()]);

  function apply(next: Partial<Record<string, string>> = {}) {
    const merged = new URLSearchParams();
    if (values.source) merged.set('source', values.source);
    if (values.destination) merged.set('destination', values.destination);
    if (values.date) merged.set('date', values.date);
    merged.set('seats', String(values.seats));
    if (filters.maxFare) merged.set('maxFare', filters.maxFare);
    if (filters.timeBand !== 'any') merged.set('timeBand', filters.timeBand);
    if (filters.verifiedOnly) merged.set('verifiedOnly', 'true');
    if (filters.sort !== 'departure') merged.set('sort', filters.sort);
    Object.entries(next).forEach(([key, value]) => {
      if (value) merged.set(key, value);else
      merged.delete(key);
    });
    setParams(merged);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find a ride"
        description="Search verified drivers travelling your route and compare the fare per passenger." />
      

      <Card>
        <RideSearchForm
          values={values}
          onChange={setValues}
          onSubmit={() => apply()}
          loading={rides.loading} />
        
      </Card>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card as="section" className="h-fit">
          <div className="flex items-center gap-2 pb-4">
            <FilterIcon className="h-4 w-4 text-slate-500" aria-hidden />
            <h2 className="font-display text-sm font-bold text-ink-900">Filters</h2>
          </div>
          <div className="space-y-4">
            <Field label="Maximum fare" htmlFor="maxFare">
              <Select
                id="maxFare"
                value={filters.maxFare}
                onChange={(e) => setFilters({ ...filters, maxFare: e.target.value })}>
                
                <option value="">Any fare</option>
                <option value="100">Under ₹100</option>
                <option value="200">Under ₹200</option>
                <option value="350">Under ₹350</option>
                <option value="500">Under ₹500</option>
              </Select>
            </Field>
            <Field label="Departure time" htmlFor="timeBand">
              <Select
                id="timeBand"
                value={filters.timeBand}
                onChange={(e) => setFilters({ ...filters, timeBand: e.target.value })}>
                
                <option value="any">Any time</option>
                <option value="morning">Morning (before 12)</option>
                <option value="afternoon">Afternoon (12–17)</option>
                <option value="evening">Evening (after 17)</option>
              </Select>
            </Field>
            <Field label="Sort by" htmlFor="sort">
              <Select
                id="sort"
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
                
                <option value="departure">Earliest departure</option>
                <option value="fare">Lowest fare</option>
                <option value="seats">Most seats free</option>
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              
              Verified drivers only
            </label>
            <Button block onClick={() => apply()}>
              Apply filters
            </Button>
          </div>
        </Card>

        <section aria-live="polite">
          {rides.loading ?
          <LoadingState label="Finding available rides…" /> :
          rides.error ?
          <ErrorState message={rides.error} onRetry={rides.refetch} /> :
          (rides.data ?? []).length === 0 ?
          <EmptyState
            icon={<SearchXIcon className="h-5 w-5" aria-hidden />}
            title="No rides found for this route"
            description="Try changing your date or destination, or widen the filters."
            action={
            <Button
              variant="secondary"
              onClick={() => {
                setValues({ source: '', destination: '', date: '', seats: 1 });
                setFilters({ maxFare: '', timeBand: 'any', verifiedOnly: false, sort: 'departure' });
                setParams(new URLSearchParams());
              }}>
              
                  Clear search
                </Button>
            } /> :


          <>
              <p className="mb-3 text-sm text-slate-600">
                {rides.data!.length} ride{rides.data!.length === 1 ? '' : 's'} available
              </p>
              <ul className="space-y-4">
                {rides.data!.map((ride) =>
              <li key={ride.id}>
                    <RideCard
                  ride={ride}
                  studentDiscountPct={studentApproved ? 15 : 0}
                  onBook={() => navigate(`/passenger/rides/${ride.id}?book=1`)} />
                
                  </li>
              )}
              </ul>
            </>
          }
        </section>
      </div>
    </div>);

}