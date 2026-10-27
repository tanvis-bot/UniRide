import React from 'react';
import type { FareBreakdown as Fare } from '../../types';
import { currency } from '../../utils/format';

export function FareBreakdown({ fare, seats }: {fare: Fare;seats: number;}) {
  const rows = [
  { label: 'Total ride cost', value: currency(fare.totalCost) },
  {
    label: 'Confirmed passengers',
    value: `${fare.confirmedPassengers} ${fare.confirmedPassengers === 1 ? 'rider' : 'riders'}`
  },
  {
    label: `Base passenger fare${seats > 1 ? ` × ${seats} seats` : ''}`,
    value: currency(fare.baseFare)
  }];


  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-slate-500">
        Fare breakdown
      </h3>
      <dl className="mt-4 space-y-2.5">
        {rows.map((row) =>
        <div key={row.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-slate-600">{row.label}</dt>
            <dd className="text-sm font-semibold text-ink-900">{row.value}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-slate-600">
            Student discount
            {!fare.discountEligible &&
            <span className="ml-1 text-xs text-slate-400">(not verified)</span>
            }
          </dt>
          <dd
            className={`text-sm font-semibold ${
            fare.discount > 0 ? 'text-brand-700' : 'text-slate-400'}`
            }>
            
            {fare.discount > 0 ? `− ${currency(fare.discount)}` : '—'}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-slate-200 pt-4">
        <p className="font-display text-base font-bold text-ink-900">
          Final passenger fare
        </p>
        <p className="font-display text-2xl font-extrabold text-brand-700">
          {currency(fare.finalFare)}
        </p>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        The driver's total trip cost is divided evenly between confirmed
        passengers. If more riders join before departure, your share goes down.
      </p>
    </div>);

}