export type Role = 'passenger' | 'driver' | 'admin';

export type AccountStatus = 'active' | 'suspended' | 'deactivated';

export type VerificationStatus =
'not_submitted' |
'pending' |
'approved' |
'rejected';

export type RideStatus =
'draft' |
'scheduled' |
'active' |
'completed' |
'cancelled';

export type RideStage =
'starting_soon' |
'driver_on_the_way' |
'ride_started' |
'in_progress' |
'arriving' |
'completed';

export type BookingStatus =
'pending' |
'confirmed' |
'rejected' |
'cancelled' |
'completed';

export interface LatLng {
  lat: number;
  lng: number;
}

/** users table */
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: Role;
  status: AccountStatus;
  avatar_url: string;
  rating: number;
  total_trips: number;
  created_at: string;
  updated_at: string;
}

/** Safe user shape returned by the API — never contains password_hash */
export type PublicUser = Omit<User, 'password_hash'>;

/** student_verifications table */
export interface StudentVerification {
  id: string;
  user_id: string;
  college_name: string;
  enrollment_no: string;
  document_name: string;
  document_url: string;
  status: VerificationStatus;
  remarks: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

/** driver_verifications table */
export interface DriverVerification {
  id: string;
  user_id: string;
  licence_number: string;
  licence_doc: string;
  gov_id_type: string;
  gov_id_doc: string;
  status: VerificationStatus;
  remarks: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

/** vehicles table */
export interface Vehicle {
  id: string;
  driver_id: string;
  make: string;
  model: string;
  manufacturing_year: number;
  number: string;
  color: string;
  seats: number;
  registration_doc: string;
  created_at: string;
}

/** rides table */
export interface Ride {
  id: string;
  driver_id: string;
  vehicle_id: string;
  source: string;
  destination: string;
  source_coords: LatLng;
  dest_coords: LatLng;
  departure_date: string;
  departure_time: string;
  total_seats: number;
  available_seats: number;
  total_cost: number;
  distance_km: number;
  duration_min: number;
  status: RideStatus;
  stage: RideStage;
  driver_location: LatLng | null;
  location_updated_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

/** bookings table */
export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats: number;
  base_fare: number;
  discount: number;
  final_fare: number;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

export type NotificationType =
'booking_request' |
'booking_confirmed' |
'booking_rejected' |
'ride_cancelled' |
'ride_starting' |
'ride_completed' |
'verification_approved' |
'verification_rejected' |
'chat_message' |
'sos';

/** notifications table */
export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

/** chat_messages table */
export interface ChatMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

/** emergency_contacts table */
export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone: string;
  created_at: string;
}

/** sos_incidents table */
export interface SosIncident {
  id: string;
  user_id: string;
  ride_id: string | null;
  location: LatLng | null;
  status: 'open' | 'acknowledged' | 'resolved';
  created_at: string;
}

/** trip_shares table */
export interface TripShare {
  id: string;
  token: string;
  ride_id: string;
  booking_id: string | null;
  created_by: string;
  created_at: string;
}

/** reported_issues table */
export interface ReportedIssue {
  id: string;
  user_id: string;
  ride_id: string | null;
  category: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  created_at: string;
}

export interface FareBreakdown {
  totalCost: number;
  confirmedPassengers: number;
  baseFare: number;
  discount: number;
  finalFare: number;
  discountEligible: boolean;
}