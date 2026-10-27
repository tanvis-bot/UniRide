import React from 'react';
import { CheckIcon } from 'lucide-react';
import { rideStageLabel } from '../../utils/format';

const order = [
'starting_soon',
'driver_on_the_way',
'ride_started',
'in_progress',
'arriving',
'completed'];


export function RideStageTimeline({ stage }: {stage: string;}) {
  const current = Math.max(0, order.indexOf(stage));
  return (
    <ol className="space-y-0">
      {order.map((key, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                done ?
                'bg-brand-600 text-white' :
                active ?
                'bg-ink-900 text-white' :
                'bg-slate-200 text-slate-500'}`
                }
                aria-hidden>
                
                {done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
              </span>
              {index < order.length - 1 &&
              <span
                className={`my-1 w-px flex-1 ${done ? 'bg-brand-400' : 'bg-slate-200'}`}
                aria-hidden />

              }
            </div>
            <p
              className={`pb-4 text-sm ${
              active ?
              'font-semibold text-ink-900' :
              done ?
              'text-slate-600' :
              'text-slate-400'}`
              }>
              
              {rideStageLabel[key]}
              {active &&
              <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  Now
                </span>
              }
            </p>
          </li>);

      })}
    </ol>);

}