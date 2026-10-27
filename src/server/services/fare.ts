import type { Booking, FareBreakdown, Ride } from '../../types';

/**
 * Cost-sharing model: the driver's declared total ride cost is split evenly
 * between the confirmed passengers on that ride. Approved student verification
 * applies the configured platform discount on top.
 */
export function calculateFare(
ride: Ride,
bookings: Booking[],
opts: {seats: number;studentApproved: boolean;discountPct: number;includeSelf?: boolean;})
: FareBreakdown {
  const confirmed = bookings.filter(
    (b) => b.ride_id === ride.id && b.status === 'confirmed'
  ).length;
  const confirmedPassengers = Math.max(
    1,
    confirmed + (opts.includeSelf === false ? 0 : 1)
  );
  const perSeat = Math.round(ride.total_cost / confirmedPassengers);
  const baseFare = perSeat * opts.seats;
  const discount = opts.studentApproved ?
  Math.round(baseFare * opts.discountPct / 100) :
  0;
  return {
    totalCost: ride.total_cost,
    confirmedPassengers,
    baseFare,
    discount,
    finalFare: baseFare - discount,
    discountEligible: opts.studentApproved
  };
}

export function formatCurrency(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}