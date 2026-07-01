import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['PATIENT', 'RECEPTIONIST', 'DOCTOR', 'ADMIN']).default('PATIENT'),
  phone: z.string().optional(),
  clinicId: z.string().optional(),
})

export const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  address: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  clinicId: z.string().optional(),
})

export const treatmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().optional(),
  clinicId: z.string().optional(),
  type: z.enum([
    'BOTOX',
    'FILLER_HYALURONIC',
    'FILLER_CALCIUM_HYDROXYLAPATITE',
    'FILLER_POLY_L_LACTIC',
    'FILLER_POLYALKYLIMIDE',
    'FILLER_POLYMETHYLMETHACRYLATE',
    'MESOTHERAPY',
    'PRP',
    'OTHER',
  ]),
  productName: z.string().optional(),
  units: z.number().positive().optional(),
  injectionAreas: z.string().optional(),
  treatmentDate: z.string().min(1, 'Treatment date is required'),
  notes: z.string().optional(),
  aftercareNotes: z.string().optional(),
})

export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().optional(),
  clinicId: z.string().optional(),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  duration: z.number().min(15).max(180).default(30),
  type: z.enum(['CONSULTATION', 'TREATMENT', 'FOLLOW_UP', 'REVIEW', 'OTHER']).default('CONSULTATION'),
  notes: z.string().optional(),
})

export const checkInResponseSchema = z.object({
  checkInId: z.string().min(1),
  message: z.string().min(1, 'Please provide a response'),
  symptoms: z.array(z.string()).optional(),
})

export const doctorNoteSchema = z.object({
  doctorId: z.string().min(1),
  treatmentId: z.string().optional(),
  checkInId: z.string().optional(),
  content: z.string().min(1, 'Note content is required'),
  isPrivate: z.boolean().default(false),
})
