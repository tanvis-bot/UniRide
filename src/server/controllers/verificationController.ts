import type { DriverVerification, StudentVerification, Vehicle } from '../../types';
import { db, nowIso, persist, uid } from '../db';
import {
  ApiError,
  requireAuth,
  requireRole,
  validate,
  type Ctx } from
'../middleware/auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE_MB = 5;

/**
 * Mirrors the Multer `fileFilter` + `limits` configuration used on the server
 * before the file is streamed to Cloudinary.
 */
export function validateUpload(file: {name: string;type: string;sizeMb: number;} | null) {
  if (!file) throw new ApiError(422, 'Attach a document to continue.');
  if (!ALLOWED_TYPES.includes(file.type))
  throw new ApiError(422, 'Only JPG, PNG or PDF files are accepted.');
  if (file.sizeMb > MAX_SIZE_MB)
  throw new ApiError(422, `File must be smaller than ${MAX_SIZE_MB} MB.`);
}

/** GET /api/students/me */
export function getStudentVerification(ctx: Ctx) {
  const auth = requireAuth(ctx);
  return (
    db().student_verifications.find((v) => v.user_id === auth.sub) ?? {
      id: '',
      user_id: auth.sub,
      college_name: '',
      enrollment_no: '',
      document_name: '',
      document_url: '',
      status: 'not_submitted' as const,
      remarks: null,
      submitted_at: null,
      reviewed_at: null
    });

}

/** POST /api/students/verify */
export function submitStudentVerification(ctx: Ctx) {
  const auth = requireRole(ctx, 'passenger');
  const { college_name, enrollment_no, file } = ctx.body ?? {};
  validate([
  [!!college_name, 'Enter your college or university name.'],
  [!!enrollment_no, 'Enter your enrolment number.']]
  );
  validateUpload(file);
  const existing = db().student_verifications.find((v) => v.user_id === auth.sub);
  const record: StudentVerification = {
    id: existing?.id ?? uid('sv'),
    user_id: auth.sub,
    college_name,
    enrollment_no,
    document_name: file.name,
    document_url: file.previewUrl ?? '',
    status: 'pending',
    remarks: null,
    submitted_at: nowIso(),
    reviewed_at: null
  };
  if (existing) Object.assign(existing, record);else
  db().student_verifications.push(record);
  persist();
  return record;
}

/** GET /api/drivers/me/verification */
export function getDriverVerification(ctx: Ctx) {
  const auth = requireAuth(ctx);
  return (
    db().driver_verifications.find((v) => v.user_id === auth.sub) ?? {
      id: '',
      user_id: auth.sub,
      licence_number: '',
      licence_doc: '',
      gov_id_type: '',
      gov_id_doc: '',
      status: 'not_submitted' as const,
      remarks: null,
      submitted_at: null,
      reviewed_at: null
    });

}

/** POST /api/drivers/verify */
export function submitDriverVerification(ctx: Ctx) {
  const auth = requireRole(ctx, 'driver');
  const { licence_number, gov_id_type, licence_file, gov_id_file } = ctx.body ?? {};
  validate([
  [!!licence_number && licence_number.length >= 6, 'Enter a valid driving licence number.'],
  [!!gov_id_type, 'Select the government ID type.']]
  );
  validateUpload(licence_file);
  validateUpload(gov_id_file);
  const existing = db().driver_verifications.find((v) => v.user_id === auth.sub);
  const record: DriverVerification = {
    id: existing?.id ?? uid('dv'),
    user_id: auth.sub,
    licence_number,
    licence_doc: licence_file.name,
    gov_id_type,
    gov_id_doc: gov_id_file.name,
    status: 'pending',
    remarks: null,
    submitted_at: nowIso(),
    reviewed_at: null
  };
  if (existing) Object.assign(existing, record);else
  db().driver_verifications.push(record);
  persist();
  return record;
}

/** GET /api/vehicles */
export function listVehicles(ctx: Ctx) {
  const auth = requireRole(ctx, 'driver');
  return db().vehicles.filter((v) => v.driver_id === auth.sub);
}

/** POST /api/vehicles */
export function createVehicle(ctx: Ctx) {
  const auth = requireRole(ctx, 'driver');
  const { make, model, number, color, seats, registration_file } = ctx.body ?? {};
  validate([
  [!!make, 'Enter the vehicle make.'],
  [!!model, 'Enter the vehicle model.'],
  [/^[A-Za-z0-9 -]{6,15}$/.test(number ?? ''), 'Enter a valid vehicle number.'],
  [!!color, 'Enter the vehicle colour.'],
  [Number(seats) >= 1 && Number(seats) <= 7, 'Seating capacity must be 1–7.']]
  );
  validateUpload(registration_file);
  const vehicle: Vehicle = {
    id: uid('v'),
    driver_id: auth.sub,
    make,
    model,
    number: number.toUpperCase(),
    color,
    seats: Number(seats),
    registration_doc: registration_file.name,
    created_at: nowIso()
  };
  db().vehicles.push(vehicle);
  persist();
  return vehicle;
}

/** PATCH /api/vehicles/:id */
export function updateVehicle(ctx: Ctx) {
  const auth = requireRole(ctx, 'driver');
  const vehicle = db().vehicles.find((v) => v.id === ctx.params.id);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found.');
  if (vehicle.driver_id !== auth.sub)
  throw new ApiError(403, 'You can only edit your own vehicles.');
  const { make, model, number, color, seats } = ctx.body ?? {};
  Object.assign(vehicle, {
    make: make ?? vehicle.make,
    model: model ?? vehicle.model,
    number: (number ?? vehicle.number).toUpperCase(),
    color: color ?? vehicle.color,
    seats: seats ? Number(seats) : vehicle.seats
  });
  persist();
  return vehicle;
}

/** DELETE /api/vehicles/:id */
export function deleteVehicle(ctx: Ctx) {
  const auth = requireRole(ctx, 'driver');
  const vehicle = db().vehicles.find((v) => v.id === ctx.params.id);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found.');
  if (vehicle.driver_id !== auth.sub)
  throw new ApiError(403, 'You can only remove your own vehicles.');
  const inUse = db().rides.some(
    (r) => r.vehicle_id === vehicle.id && ['scheduled', 'active'].includes(r.status)
  );
  if (inUse) throw new ApiError(409, 'This vehicle is assigned to an upcoming ride.');
  db().vehicles = db().vehicles.filter((v) => v.id !== vehicle.id);
  persist();
  return { ok: true };
}