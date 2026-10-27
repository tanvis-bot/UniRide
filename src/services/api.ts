import type {
  AppNotification,
  Booking,
  ChatMessage,
  DriverVerification,
  EmergencyContact,
  FareBreakdown,
  LatLng,
  PublicUser,
  ReportedIssue,
  Role,
  SosIncident,
  StudentVerification,
  TripShare,
  Vehicle,
  VerificationStatus } from
'../types';
import type { HydratedRide } from '../server/controllers/rideController';
import { http } from './http';

export interface SessionResponse {
  token: string;
  user: PublicUser;
  verification: {student: VerificationStatus;driver: VerificationStatus;};
}

export interface MeResponse {
  user: PublicUser;
  verification: {student: VerificationStatus;driver: VerificationStatus;};
  studentApproved: boolean;
  driverApproved: boolean;
}

export type BookingWithRide = Booking & {ride: HydratedRide;};
export type BookingRequestRow = BookingWithRide & {
  passenger: PublicUser;
  student_verified: boolean;
};

export interface ChatThread {
  ride_id: string;
  route: string;
  ride_status: string;
  departure: string;
  participant: PublicUser;
  online: boolean;
  unread: number;
  last_message: ChatMessage | null;
}

export interface AdminStats {
  totals: Record<string, number>;
  activity: Array<{day: string;rides: number;bookings: number;}>;
  rideMix: Array<{name: string;value: number;}>;
}

export type AdminUserRow = PublicUser & {
  student_verified: boolean;
  driver_verified: boolean;
  vehicles: number;
};

export interface VerificationRow {
  type: 'student' | 'driver';
  record: StudentVerification | DriverVerification;
  user: PublicUser;
  vehicles: Vehicle[];
}

export interface UploadDescriptor {
  name: string;
  type: string;
  sizeMb: number;
  previewUrl?: string;
  file?: File;
}

export const api = {
  auth: {
    register: (data: {
      full_name: string;
      email: string;
      phone: string;
      password: string;
      confirm_password: string;
      role: Exclude<Role, 'admin'>;
    }) => http.post<SessionResponse>('/api/auth/register', data),
    login: (data: {email: string;password: string;}) =>
    http.post<SessionResponse>('/api/auth/login', data),
    me: () => http.get<MeResponse>('/api/auth/me'),
    logout: () =>
    http.post<{ success: boolean; message: string }>(
     '/api/auth/logout'
    ),
    forgotPassword: (email: string) =>
    http.post<{message: string;resetToken: string | null;}>(
      '/api/auth/forgot-password',
      { email }
    ),
    resetPassword: (data: {email: string;password: string;confirm_password: string;}) =>
    http.post<{message: string;}>('/api/auth/reset-password', data)
  },
  users: {
    updateProfile: (data: {full_name?: string;phone?: string;avatar_url?: string;}) =>
    http.patch<PublicUser>('/api/users/me', data),
    changePassword: (data: {
      current_password: string;
      password: string;
      confirm_password: string;
    }) => http.post<{message: string;}>('/api/users/me/password', data)
  },
  rides: {
    search: (params: Record<string, unknown>) =>
    http.get<HydratedRide[]>('/api/rides', { params }),
    get: (id: string) => http.get<HydratedRide>(`/api/rides/${id}`),
    mine: () => http.get<HydratedRide[]>('/api/rides/mine'),
    active: () => http.get<(HydratedRide & {booking?: Booking;}) | null>('/api/rides/active'),
    fareQuote: (id: string, seats: number) =>
    http.get<FareBreakdown>(`/api/rides/${id}/fare-quote`, { params: { seats } }),
    create: (data: Record<string, unknown>) => http.post<HydratedRide>('/api/rides', data),
    update: (id: string, data: Record<string, unknown>) =>
    http.patch<HydratedRide>(`/api/rides/${id}`, data),
    cancel: (id: string) =>
  http.patch<{
    success: boolean;
    message: string;
    ride: {
      id: number;
      status: string;
      ride_stage: string;
    };
  }>(`/api/rides/${id}/cancel`),
    setStage: (id: string, stage: string) =>
    http.post<HydratedRide>(`/api/rides/${id}/status`, { stage }),
    pushLocation: (id: string, coords: LatLng) =>
    http.post<{ok: boolean;updatedAt: string;}>(`/api/rides/${id}/location`, coords),
    passengers: (id: string) =>
    http.get<
      Array<{booking: Booking;passenger: PublicUser;student_verified: boolean;}>>(
      `/api/rides/${id}/passengers`),
    share: (id: string) => http.post<TripShare>(`/api/rides/${id}/share`)
  },
  bookings: {
    create: (ride_id: string, seats: number) =>
    http.post<BookingWithRide>('/api/bookings', { ride_id, seats }),
    mine: () => http.get<BookingWithRide[]>('/api/bookings/mine'),
    get: (id: string) => http.get<BookingWithRide>(`/api/bookings/${id}`),
    cancel: (id: string) =>
  http.patch<{
    success: boolean;
    message: string;
    booking: {
      id: number;
      ride_id: number;
      status: string;
    };
  }>(`/api/bookings/${id}/cancel`),
    requests: () => http.get<BookingRequestRow[]>('/api/bookings/requests'),
    decide: (id: string, decision: 'accept' | 'reject') =>
    http.post<BookingWithRide>(`/api/bookings/${id}/decision`, { decision })
  },
  students: {
  me: () =>
    http.get<StudentVerification>('/api/students/me'),

  submit: (data: {
    college_name: string;
    enrollment_no: string;
    file: UploadDescriptor;
  }) => {
    const formData = new FormData();

    formData.append('college_name', data.college_name);
    formData.append('enrollment_no', data.enrollment_no);

    if (data.file.file) {
      formData.append('file', data.file.file);
    }

    return http.post<StudentVerification>(
      '/api/students/verify',
      formData
    );
  }
},
  drivers: {
    verification: () => http.get<DriverVerification>('/api/drivers/me/verification'),
    submit: (data: {
  licence_number: string;
  gov_id_type: string;
  gov_id_number: string;
  licence_file: UploadDescriptor;
  gov_id_file: UploadDescriptor;
}) => {
  if (!data.licence_file.file || !data.gov_id_file.file) {
    throw new Error('Both verification documents are required.');
  }

  const formData = new FormData();

  formData.append('licence_number', data.licence_number);
  formData.append('gov_id_type', data.gov_id_type);
  formData.append(
  'gov_id_number',
  data.gov_id_number
);

  formData.append(
    'licence_document',
    data.licence_file.file
  );

  formData.append(
    'government_id_document',
    data.gov_id_file.file
  );

  return http.post<DriverVerification>(
    '/api/drivers/verify',
    formData
  );
}
  },
  vehicles: {
    list: () => http.get<Vehicle[]>('/api/vehicles'),
    create: (data: {
  make: string;
  model: string;
  manufacturing_year: string;
  number: string;
  color: string;
  seats: string;
  registration_file: UploadDescriptor | null;
}) => {
  if (!data.registration_file?.file) {
    throw new Error(
      'Vehicle registration document is required.'
    );
  }

  const formData = new FormData();

  formData.append('make', data.make);
  formData.append('model', data.model);

  formData.append(
    'manufacturing_year',
    data.manufacturing_year
  );

  formData.append('number', data.number);
  formData.append('color', data.color);
  formData.append('seats', data.seats);

  formData.append(
    'registration_document',
    data.registration_file.file
  );

  return http.post<Vehicle>(
    '/api/vehicles',
    formData
  );
},
    update: (id: string, data: Record<string, unknown>) =>
    http.patch<Vehicle>(`/api/vehicles/${id}`, data),
    remove: (id: string) => http.delete<{ok: boolean;}>(`/api/vehicles/${id}`)
  },
  notifications: {
    list: () => http.get<AppNotification[]>('/api/notifications'),
    read: (id: string) => http.post<AppNotification>(`/api/notifications/${id}/read`),
    readAll: () => http.post<{ok: boolean;}>('/api/notifications/read-all')
  },
  chat: {
    threads: () => http.get<ChatThread[]>('/api/chat/threads'),
    messages: (rideId: string, userId: string) =>
    http.get<ChatMessage[]>(`/api/chat/${rideId}/${userId}`),
    send: (rideId: string, receiver_id: string, body: string) =>
    http.post<ChatMessage>(`/api/chat/${rideId}`, { receiver_id, body })
  },
  emergency: {
    list: () => http.get<EmergencyContact[]>('/api/emergency'),
    add: (data: {name: string;relationship: string;phone: string;}) =>
    http.post<EmergencyContact>('/api/emergency', data),
    remove: (id: string) => http.delete<{ok: boolean;}>(`/api/emergency/${id}`)
  },
  sos: {
    trigger: (data: {ride_id: string | null;location: LatLng | null;}) =>
    http.post<SosIncident>('/api/sos', data),
    mine: () => http.get<SosIncident[]>('/api/sos/mine')
  },
  trips: {
    share: (token: string) => http.get<any>(`/api/trip-shares/${token}`)
  },
  issues: {
    report: (data: {category: string;description: string;ride_id?: string | null;}) =>
    http.post<ReportedIssue>('/api/issues', data)
  },
  admin: {
    stats: () => http.get<AdminStats>('/api/admin/stats'),
    users: (params: Record<string, unknown>) =>
    http.get<AdminUserRow[]>('/api/admin/users', { params }),
    setUserStatus: (id: string, status: string) =>
    http.patch<PublicUser>(`/api/admin/users/${id}/status`, { status }),
    verifications: (params: Record<string, unknown>) =>
    http.get<VerificationRow[]>('/api/admin/verifications', { params }),
    review: (
    id: string,
    data: {type: 'student' | 'driver';decision: 'approve' | 'reject';remarks?: string;}) =>
    http.post<StudentVerification | DriverVerification>(
      `/api/admin/verifications/${id}/review`,
      data
    ),
    rides: (params: Record<string, unknown>) =>
    http.get<HydratedRide[]>('/api/admin/rides', { params }),
    bookings: (params: Record<string, unknown>) =>
    http.get<any[]>('/api/admin/bookings', { params }),
    issues: () => http.get<{issues: any[];sos: any[];}>('/api/admin/issues'),
    updateIssue: (id: string, status: string) =>
    http.patch<ReportedIssue>(`/api/admin/issues/${id}`, { status })
  }
};

export type { HydratedRide };