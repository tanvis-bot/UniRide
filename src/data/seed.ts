import type {
  Booking,
  ChatMessage,
  DriverVerification,
  EmergencyContact,
  AppNotification,
  ReportedIssue,
  Ride,
  SosIncident,
  StudentVerification,
  TripShare,
  User,
  Vehicle } from
'../types';
import { coordsFor } from './places';
import { buildRoute } from '../utils/geo';
import { hashPassword } from '../server/security';

export const AVATARS = {
  rahul: "/1b3728d4-f8d9-4249-83f0-3828ccc54150.jpg",

  neha: "/56d7536b-ad01-4d13-8712-b7e719d4e095.jpg",
  imran: "/8f8489e6-fc81-4619-bca7-a3e21ecac86e.jpg",

  priya: "/4582d1ae-31fe-4170-a280-8f01bbed85e1.jpg",

  arjun: "/85cc4de4-e904-40ed-9dd8-8cda10ef4102.jpg"

};

export const IMAGES = {
  hero: "/fe5483d5-1b41-424e-8bbb-67f8913dab91.jpg",
  login: "/bdeda11d-656a-4794-8fdd-07655988ca05.jpg",

  signup: "/8e6d2d47-0240-4011-8dbf-3c917637a55d.jpg",

  safety: "/5ffd3c6e-494b-4b1f-a87e-e090171a87d6.jpg",

  sustainability: "/06f57505-2199-42c9-9897-ba866bbeee40.jpg"

};

export const DEMO_ACCOUNTS = [
{ label: 'Passenger', email: 'priya@student.edu', password: 'Passenger@123' },
{ label: 'Driver', email: 'rahul@uniride.app', password: 'Driver@123' },
{ label: 'Admin', email: 'admin@uniride.app', password: 'Admin@123' }];


const now = new Date();

function iso(daysAgo: number, hour = 9): string {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

export function dayOffset(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function user(
id: string,
full_name: string,
email: string,
phone: string,
role: User['role'],
avatar_url: string,
extra: Partial<User> = {})
: User {
  return {
    id,
    full_name,
    email,
    phone,
    password_hash: hashPassword(extra.password_hash ?? 'Passenger@123'),
    role,
    status: 'active',
    avatar_url,
    rating: 4.7,
    total_trips: 0,
    created_at: iso(120),
    updated_at: iso(3),
    ...extra,
    password_hash: hashPassword(
      role === 'admin' ?
      'Admin@123' :
      role === 'driver' ?
      'Driver@123' :
      'Passenger@123'
    )
  };
}

function ride(
id: string,
driver_id: string,
vehicle_id: string,
source: string,
destination: string,
departure_date: string,
departure_time: string,
total_seats: number,
booked: number,
total_cost: number,
status: Ride['status'],
stage: Ride['stage'] = 'starting_soon')
: Ride {
  const source_coords = coordsFor(source);
  const dest_coords = coordsFor(destination);
  const route = buildRoute(source_coords, dest_coords);
  return {
    id,
    driver_id,
    vehicle_id,
    source,
    destination,
    source_coords,
    dest_coords,
    departure_date,
    departure_time,
    total_seats,
    available_seats: total_seats - booked,
    total_cost,
    distance_km: route.distanceKm,
    duration_min: route.durationMin,
    status,
    stage,
    driver_location: status === 'active' ? route.coordinates[8] : null,
    location_updated_at: status === 'active' ? new Date().toISOString() : null,
    notes:
    status === 'cancelled' ?
    'Cancelled by driver — vehicle servicing.' :
    'Pickup at the gate. Please be on time, one small bag per passenger.',
    created_at: iso(6),
    updated_at: iso(1)
  };
}

export interface Database {
  users: User[];
  student_verifications: StudentVerification[];
  driver_verifications: DriverVerification[];
  vehicles: Vehicle[];
  rides: Ride[];
  bookings: Booking[];
  notifications: AppNotification[];
  chat_messages: ChatMessage[];
  emergency_contacts: EmergencyContact[];
  sos_incidents: SosIncident[];
  trip_shares: TripShare[];
  reported_issues: ReportedIssue[];
  settings: {student_discount_pct: number;platform_name: string;};
}

export function buildSeedDatabase(): Database {
  const users: User[] = [
  user('u_admin', 'Aditi Kulkarni', 'admin@uniride.app', '+91 98200 11223', 'admin', AVATARS.imran, {
    total_trips: 0
  }),
  user('u_p1', 'Priya Nair', 'priya@student.edu', '+91 98765 43210', 'passenger', AVATARS.priya, {
    total_trips: 24,
    rating: 4.9
  }),
  user('u_p2', 'Arjun Mehta', 'arjun@student.edu', '+91 91234 56780', 'passenger', AVATARS.arjun, {
    total_trips: 7,
    rating: 4.6
  }),
  user('u_p3', 'Sara Khan', 'sara@student.edu', '+91 90000 12345', 'passenger', AVATARS.neha, {
    total_trips: 2,
    rating: 4.4
  }),
  user('u_d1', 'Rahul Deshmukh', 'rahul@uniride.app', '+91 99887 76655', 'driver', AVATARS.rahul, {
    total_trips: 138,
    rating: 4.9
  }),
  user('u_d2', 'Neha Sharma', 'neha@uniride.app', '+91 99887 10101', 'driver', AVATARS.neha, {
    total_trips: 86,
    rating: 4.8
  }),
  user('u_d3', 'Imran Qureshi', 'imran@uniride.app', '+91 97777 22222', 'driver', AVATARS.imran, {
    total_trips: 0,
    rating: 0
  }),
  user('u_d4', 'Kavya Rao', 'kavya@uniride.app', '+91 96666 33333', 'driver', AVATARS.arjun, {
    total_trips: 41,
    rating: 4.7
  })];

  users[3].status = 'suspended';

  const student_verifications: StudentVerification[] = [
  {
    id: 'sv_1',
    user_id: 'u_p1',
    college_name: 'City Institute of Technology',
    enrollment_no: 'CIT2023CS041',
    document_name: 'priya-college-id.jpg',
    document_url: AVATARS.priya,
    status: 'approved',
    remarks: 'ID matches enrolment records.',
    submitted_at: iso(40),
    reviewed_at: iso(38)
  },
  {
    id: 'sv_2',
    user_id: 'u_p2',
    college_name: 'National College of Commerce',
    enrollment_no: 'NCC2024B117',
    document_name: 'arjun-student-card.png',
    document_url: AVATARS.arjun,
    status: 'pending',
    remarks: null,
    submitted_at: iso(2),
    reviewed_at: null
  },
  {
    id: 'sv_3',
    user_id: 'u_p3',
    college_name: 'City Institute of Technology',
    enrollment_no: 'CIT2022EC009',
    document_name: 'sara-id.jpg',
    document_url: AVATARS.neha,
    status: 'rejected',
    remarks: 'Document expired. Please upload a current-year ID card.',
    submitted_at: iso(20),
    reviewed_at: iso(19)
  }];


  const driver_verifications: DriverVerification[] = [
  {
    id: 'dv_1',
    user_id: 'u_d1',
    licence_number: 'MH12 20180004321',
    licence_doc: 'rahul-licence.pdf',
    gov_id_type: 'Aadhaar',
    gov_id_doc: 'rahul-govid.pdf',
    status: 'approved',
    remarks: 'All documents verified.',
    submitted_at: iso(90),
    reviewed_at: iso(88)
  },
  {
    id: 'dv_2',
    user_id: 'u_d2',
    licence_number: 'MH14 20190091122',
    licence_doc: 'neha-licence.pdf',
    gov_id_type: 'Passport',
    gov_id_doc: 'neha-govid.pdf',
    status: 'approved',
    remarks: 'Verified.',
    submitted_at: iso(70),
    reviewed_at: iso(69)
  },
  {
    id: 'dv_3',
    user_id: 'u_d3',
    licence_number: 'MH12 20210044556',
    licence_doc: 'imran-licence.pdf',
    gov_id_type: 'Aadhaar',
    gov_id_doc: 'imran-govid.pdf',
    status: 'pending',
    remarks: null,
    submitted_at: iso(1),
    reviewed_at: null
  },
  {
    id: 'dv_4',
    user_id: 'u_d4',
    licence_number: 'MH12 20200077889',
    licence_doc: 'kavya-licence.pdf',
    gov_id_type: 'Aadhaar',
    gov_id_doc: 'kavya-govid.pdf',
    status: 'approved',
    remarks: 'Verified.',
    submitted_at: iso(50),
    reviewed_at: iso(49)
  }];


  const vehicles: Vehicle[] = [
  {
    id: 'v_1',
    driver_id: 'u_d1',
    make: 'Maruti Suzuki',
    model: 'Baleno',
    number: 'MH 12 KJ 4409',
    color: 'Pearl White',
    seats: 4,
    registration_doc: 'baleno-rc.pdf',
    created_at: iso(88)
  },
  {
    id: 'v_2',
    driver_id: 'u_d2',
    make: 'Hyundai',
    model: 'i20 Asta',
    number: 'MH 14 BQ 7781',
    color: 'Titan Grey',
    seats: 4,
    registration_doc: 'i20-rc.pdf',
    created_at: iso(68)
  },
  {
    id: 'v_3',
    driver_id: 'u_d4',
    make: 'Tata',
    model: 'Nexon EV',
    number: 'MH 12 TZ 1902',
    color: 'Teal Blue',
    seats: 4,
    registration_doc: 'nexon-rc.pdf',
    created_at: iso(48)
  }];


  const rides: Ride[] = [
  ride('r_live', 'u_d1', 'v_1', 'Kothrud Depot', 'University Main Gate', dayOffset(0), '08:30', 4, 2, 320, 'active', 'in_progress'),
  ride('r_1', 'u_d1', 'v_1', 'University Main Gate', 'Hinjewadi Phase 1', dayOffset(1), '09:00', 4, 1, 420, 'scheduled'),
  ride('r_2', 'u_d2', 'v_2', 'University Main Gate', 'Viman Nagar', dayOffset(1), '17:45', 4, 2, 360, 'scheduled'),
  ride('r_3', 'u_d4', 'v_3', 'Wakad Bridge', 'Engineering College Campus', dayOffset(1), '08:15', 4, 0, 380, 'scheduled'),
  ride('r_4', 'u_d2', 'v_2', 'Kothrud Depot', 'Magarpatta City', dayOffset(2), '07:50', 4, 1, 440, 'scheduled'),
  ride('r_5', 'u_d1', 'v_1', 'City Railway Station', 'University Main Gate', dayOffset(2), '18:30', 4, 0, 300, 'scheduled'),
  ride('r_6', 'u_d4', 'v_3', 'University Main Gate', 'Airport Terminal', dayOffset(3), '05:30', 4, 1, 520, 'scheduled'),
  ride('r_7', 'u_d2', 'v_2', 'Baner Road', 'MG Road Camp', dayOffset(4), '10:00', 4, 0, 340, 'scheduled'),
  ride('r_past1', 'u_d1', 'v_1', 'University Main Gate', 'Kothrud Depot', dayOffset(-3), '18:00', 4, 3, 300, 'completed', 'completed'),
  ride('r_past2', 'u_d2', 'v_2', 'Viman Nagar', 'University Main Gate', dayOffset(-6), '08:30', 4, 2, 360, 'completed', 'completed'),
  ride('r_past3', 'u_d4', 'v_3', 'Katraj Chowk', 'Hinjewadi Phase 1', dayOffset(-9), '07:30', 4, 2, 480, 'cancelled')];


  const bookings: Booking[] = [
  {
    id: 'BK-24801',
    ride_id: 'r_live',
    passenger_id: 'u_p1',
    seats: 1,
    base_fare: 160,
    discount: 24,
    final_fare: 136,
    status: 'confirmed',
    created_at: iso(1, 20),
    updated_at: iso(1, 21)
  },
  {
    id: 'BK-24802',
    ride_id: 'r_live',
    passenger_id: 'u_p2',
    seats: 1,
    base_fare: 160,
    discount: 0,
    final_fare: 160,
    status: 'confirmed',
    created_at: iso(1, 19),
    updated_at: iso(1, 19)
  },
  {
    id: 'BK-24815',
    ride_id: 'r_1',
    passenger_id: 'u_p1',
    seats: 1,
    base_fare: 420,
    discount: 63,
    final_fare: 357,
    status: 'confirmed',
    created_at: iso(1, 12),
    updated_at: iso(1, 12)
  },
  {
    id: 'BK-24820',
    ride_id: 'r_2',
    passenger_id: 'u_p2',
    seats: 1,
    base_fare: 180,
    discount: 0,
    final_fare: 180,
    status: 'pending',
    created_at: iso(0, 8),
    updated_at: iso(0, 8)
  },
  {
    id: 'BK-24821',
    ride_id: 'r_2',
    passenger_id: 'u_p3',
    seats: 1,
    base_fare: 180,
    discount: 0,
    final_fare: 180,
    status: 'confirmed',
    created_at: iso(0, 9),
    updated_at: iso(0, 9)
  },
  {
    id: 'BK-24700',
    ride_id: 'r_past1',
    passenger_id: 'u_p1',
    seats: 1,
    base_fare: 100,
    discount: 15,
    final_fare: 85,
    status: 'completed',
    created_at: iso(4),
    updated_at: iso(3)
  },
  {
    id: 'BK-24701',
    ride_id: 'r_past2',
    passenger_id: 'u_p1',
    seats: 1,
    base_fare: 180,
    discount: 27,
    final_fare: 153,
    status: 'completed',
    created_at: iso(7),
    updated_at: iso(6)
  },
  {
    id: 'BK-24650',
    ride_id: 'r_past3',
    passenger_id: 'u_p2',
    seats: 1,
    base_fare: 240,
    discount: 0,
    final_fare: 240,
    status: 'cancelled',
    created_at: iso(10),
    updated_at: iso(9)
  }];


  const notifications: AppNotification[] = [
  {
    id: 'n_1',
    user_id: 'u_p1',
    type: 'ride_starting',
    title: 'Your ride is on the way',
    body: 'Rahul Deshmukh has started the trip to University Main Gate.',
    link: '/passenger/active-ride',
    is_read: false,
    created_at: iso(0, 8)
  },
  {
    id: 'n_2',
    user_id: 'u_p1',
    type: 'booking_confirmed',
    title: 'Booking confirmed',
    body: 'BK-24815 · University Main Gate → Hinjewadi Phase 1 has been confirmed.',
    link: '/passenger/bookings',
    is_read: false,
    created_at: iso(1, 12)
  },
  {
    id: 'n_3',
    user_id: 'u_p1',
    type: 'verification_approved',
    title: 'Student verification approved',
    body: 'You now receive the 15% student discount on every booking.',
    link: '/passenger/student-verification',
    is_read: true,
    created_at: iso(38)
  },
  {
    id: 'n_4',
    user_id: 'u_d1',
    type: 'booking_request',
    title: 'New booking request',
    body: 'Arjun Mehta requested 1 seat on University Main Gate → Viman Nagar.',
    link: '/driver/requests',
    is_read: false,
    created_at: iso(0, 8)
  },
  {
    id: 'n_5',
    user_id: 'u_d1',
    type: 'chat_message',
    title: 'New message from Priya Nair',
    body: 'I am waiting near the second gate.',
    link: '/driver/messages',
    is_read: false,
    created_at: iso(0, 8)
  },
  {
    id: 'n_6',
    user_id: 'u_admin',
    type: 'verification_approved',
    title: '2 verifications awaiting review',
    body: 'One driver and one student document need a decision.',
    link: '/admin/driver-verification',
    is_read: false,
    created_at: iso(1)
  }];


  const chat_messages: ChatMessage[] = [
  {
    id: 'c_1',
    ride_id: 'r_live',
    sender_id: 'u_d1',
    receiver_id: 'u_p1',
    body: 'Good morning! Starting from Kothrud in 5 minutes.',
    is_read: true,
    created_at: iso(0, 8)
  },
  {
    id: 'c_2',
    ride_id: 'r_live',
    sender_id: 'u_p1',
    receiver_id: 'u_d1',
    body: 'I am waiting near the second gate.',
    is_read: false,
    created_at: iso(0, 8)
  }];


  const emergency_contacts: EmergencyContact[] = [
  {
    id: 'ec_1',
    user_id: 'u_p1',
    name: 'Meera Nair',
    relationship: 'Mother',
    phone: '+91 98111 22334',
    created_at: iso(30)
  },
  {
    id: 'ec_2',
    user_id: 'u_p1',
    name: 'Campus Security Desk',
    relationship: 'Campus',
    phone: '+91 20 4455 6677',
    created_at: iso(30)
  }];


  const trip_shares: TripShare[] = [
  {
    id: 'ts_1',
    token: 'live-demo-trip',
    ride_id: 'r_live',
    booking_id: 'BK-24801',
    created_by: 'u_p1',
    created_at: iso(0, 8)
  }];


  const reported_issues: ReportedIssue[] = [
  {
    id: 'iss_1',
    user_id: 'u_p2',
    ride_id: 'r_past3',
    category: 'Ride cancelled late',
    description: 'Ride was cancelled 10 minutes before departure.',
    status: 'investigating',
    created_at: iso(9)
  },
  {
    id: 'iss_2',
    user_id: 'u_p3',
    ride_id: null,
    category: 'Verification issue',
    description: 'My college ID was rejected but it is valid this year.',
    status: 'open',
    created_at: iso(4)
  }];


  return {
    users,
    student_verifications,
    driver_verifications,
    vehicles,
    rides,
    bookings,
    notifications,
    chat_messages,
    emergency_contacts,
    sos_incidents: [] as SosIncident[],
    trip_shares,
    reported_issues,
    settings: { student_discount_pct: 15, platform_name: 'UniRide' }
  };
}