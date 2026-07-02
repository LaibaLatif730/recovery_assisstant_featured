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
  medications: z.string().optional(),
  emergencyContact: z.string().optional(),
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
    'SKIN_BOOSTER',
    'MICRONEEDLING',
    'PDO_THREADS',
    'FAT_DISSOLVING',
    'OTHER',
  ]),
  productName: z.string().optional(),
  units: z.number().positive().optional(),
  volume: z.number().positive().optional(),
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
  type: z.enum(['CONSULTATION', 'TREATMENT', 'FOLLOW_UP', 'REVIEW', 'EMERGENCY', 'OTHER']).default('CONSULTATION'),
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

export const injectionMappingSchema = z.object({
  treatmentId: z.string().min(1, 'Treatment is required'),
  doctorId: z.string().optional(),
  area: z.string().min(1, 'Injection area is required'),
  subArea: z.string().optional(),
  units: z.number().positive().optional(),
  volume: z.number().positive().optional(),
  productId: z.string().optional(),
  batchId: z.string().optional(),
  technique: z.string().optional(),
  needleCannula: z.string().optional(),
  depth: z.enum(['INTRADERMAL', 'SUBDERMAL', 'DEEP_DERMAL', 'SUPRAPERIOSTEAL', 'OTHER']).optional(),
  aspiration: z.enum(['YES', 'NO', 'N/A']).optional(),
  notes: z.string().optional(),
})

export const complicationSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  treatmentId: z.string().optional(),
  complicationType: z.enum([
    'BRUISING',
    'SWELLING',
    'DELAYED_SWELLING',
    'INFECTION',
    'NODULES',
    'GRANULOMA',
    'TYNDALL_EFFECT',
    'PTOSIS',
    'SMILE_ASYMMETRY',
    'VASCULAR_OCCLUSION',
    'SKIN_NECROSIS',
    'HYPERSENSITIVITY',
    'MIGRATION',
    'INFLAMMATION',
    'OTHER',
  ]),
  description: z.string().optional(),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'CRITICAL']),
  onsetDate: z.string().min(1, 'Onset date is required'),
  resolutionDate: z.string().optional(),
  treatmentGiven: z.string().optional(),
  outcome: z.string().optional(),
  batchNumber: z.string().optional(),
  productUsed: z.string().optional(),
})

export const clinicalNoteSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().optional(),
  treatmentId: z.string().optional(),
  checkInId: z.string().optional(),
  noteType: z.enum(['SOAP', 'PROCEDURE', 'PROGRESS', 'RECOVERY_SUMMARY', 'COMMUNICATION', 'AUDIT']),
  content: z.string().min(1, 'Content is required'),
  isAiGenerated: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
})

export const clinicalQuerySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  clinicId: z.string().optional(),
})

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.enum([
    'NEUROMODULATOR',
    'HYALURONIC_ACID_FILLER',
    'CALCIUM_HYDROXYLAPATITE_FILLER',
    'POLY_L_LACTIC_FILLER',
    'BIOSTIMULATOR',
    'REGENERATIVE',
    'SKIN_BOOSTER',
    'THREAD',
    'FAT_DISSOLVING',
    'OTHER',
  ]),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  clinicId: z.string().optional(),
})

export const productBatchSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  quantity: z.number().int().positive().optional(),
})
