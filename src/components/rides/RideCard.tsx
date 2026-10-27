import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, ClockIcon, StarIcon, UsersIcon } from 'lucide-react';
import type { HydratedRide } from '../../services/api';
import { currency, formatDay, formatTime } from '../../utils/format';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { VerifiedBadge } from '../ui/Status';

interface RideCardProps {
  ride: HydratedRide;
  studentDiscountPct?: number;
  onBook?: (ride: HydratedRide) => void;
}

export function RideCard({ ride, studentDiscountPct = 0, onBook }: RideCardProps) {
  const discounted = Math.round(ride.per_seat_fare * (1 - studentDiscountPct / 100));

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-colors duration-150 ease-out hover:border-brand-300">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={ride.driver.full_name} src={ride.driver.avatar_url} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-display text-base font-bold text-ink-900">
                {ride.driver.full_name}
              </p>
              <VerifiedBadge verified={ride.driver.verified} />
            </div>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <StarIcon className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                {ride.driver.rating.toFixed(1)}
              </span>
              <span aria-hidden>·</span>
              <span>
                {ride.vehicle ?
                `${ride.vehicle.make} ${ride.vehicle.model} · ${ride.vehicle.number}` :
                'Vehicle pending'}
              </span>
            </p>
          </div>
        </div>

        <div className="text-right">
          {studentDiscountPct > 0 ?
          <>
              <p className="font-display text-2xl font-extrabold text-ink-900">
                {currency(discounted)}
              </p>
              <p className="text-xs font-medium text-brand-700">
                <span className="text-slate-400 line-through">
                  {currency(ride.per_seat_fare)}
                </span>{' '}
                student fare
              </p>
            </> :

          <>
              <p className="font-display text-2xl font-extrabold text-ink-900">
                {currency(ride.per_seat_fare)}
              </p>
              <p className="text-xs text-slate-500">per passenger</p>
            </>
          }
        </div>
      </div>

      <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-[1.6fr_1fr]">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex flex-col items-center" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full border-2 border-ink-900" />
            <span className="my-1 h-7 w-px bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{ride.source}</p>
            <p className="mt-4 truncate text-sm font-semibold text-ink-900">
              {ride.destination}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-1 sm:gap-2">
          <div className="flex items-center gap-2 text-slate-600">
            <ClockIcon className="h-4 w-4 text-slate-400" aria-hidden />
            <dd>
              {formatDay(ride.departure_date)} · {formatTime(ride.departure_time)}
            </dd>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <UsersIcon className="h-4 w-4 text-slate-400" aria-hidden />
            <dd>
              {ride.available_seats} of {ride.total_seats} seats free
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          {ride.distance_km} km · about {ride.duration_min} min
        </p>
        <div className="flex gap-2">
          <Link to={`/passenger/rides/${ride.id}`}>
            <Button variant="secondary" size="sm">
              View Details
            </Button>
          </Link>
          {onBook ?
          <Button
            size="sm"
            icon={<ArrowRightIcon className="h-4 w-4" aria-hidden />}
            onClick={() => onBook(ride)}>
            
              Book Ride
            </Button> :

          <Link to={`/passenger/rides/${ride.id}`}>
              <Button size="sm">Book Ride</Button>
            </Link>
          }
        </div>
      </div>
    </article>);

}