import { z } from 'zod'

const nameRegex = /^[A-Za-zÀ-ÿ\s'-]+$/
const phoneRegex = /^\+?[\d\s\-()]{7,15}$/
const strictPhoneRegex = /^\d{7,15}$/

// Converts empty strings to undefined so optional FK fields don't fail Prisma
const optionalStr = z.string().optional().transform(v => v === '' ? undefined : v)

const nameField = (fieldName: string) =>
  z.string()
    .min(1, `${fieldName} is required`)
    .max(50, `${fieldName} must be 50 characters or less`)
    .regex(nameRegex, `${fieldName} must contain only letters, spaces, hyphens, or apostrophes`)

const phoneField = z.string()
  .optional()
  .refine((val) => {
    if (!val || val.trim() === '') return true
    return strictPhoneRegex.test(val.replace(/[\s\-()+\s]/g, ''))
  }, 'Phone must contain only digits (7-15 characters)')

const emailField = z.string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(100, 'Email must be 100 characters or less')

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: nameField('Name'),
  email: emailField,
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  role: z.enum(['PATIENT', 'RECEPTIONIST', 'DOCTOR', 'ADMIN']).default('PATIENT'),
  phone: z.string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true
      return strictPhoneRegex.test(val.replace(/[\s\-()+\s]/g, ''))
    }, 'Phone must contain only digits (7-15 characters)'),
  clinicId: optionalStr,
})

export const patientSchema = z.object({
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  email: z.string().email().optional().or(z.literal('')),
  phone: phoneField,
  dateOfBirth: z.string().optional().refine((val) => {
    if (!val) return true
    const date = new Date(val)
    const now = new Date()
    return date <= now
  }, 'Date of birth cannot be in the future'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  address: z.string().max(200, 'Address must be 200 characters or less').optional(),
  medicalHistory: z.string().max(1000, 'Medical history must be 1000 characters or less').optional(),
  allergies: z.string().max(500, 'Allergies must be 500 characters or less').optional(),
  medications: z.string().max(500, 'Medications must be 500 characters or less').optional(),
  emergencyContact: z.string().max(100, 'Emergency contact must be 100 characters or less').optional(),
  clinicId: optionalStr,
})

export const treatmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: optionalStr,
  clinicId: optionalStr,
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
  productName: z.string().max(100, 'Product name must be 100 characters or less').optional(),
  units: z.number().positive('Units must be a positive number').max(100, 'Units cannot exceed 100').optional(),
  volume: z.number().positive('Volume must be a positive number').max(50, 'Volume cannot exceed 50').optional(),
  injectionAreas: z.string().max(200, 'Injection areas must be 200 characters or less').optional(),
  treatmentDate: z.string().min(1, 'Treatment date is required').refine((val) => {
    const date = new Date(val)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    return date >= oneYearAgo
  }, 'Treatment date cannot be more than 1 year in the past'),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
  aftercareNotes: z.string().max(1000, 'Aftercare notes must be 1000 characters or less').optional(),
})

export const appointmentSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required').max(200, 'Patient name must be 200 characters or less'),
  doctorId: optionalStr,
  clinicId: optionalStr,
  appointmentDate: z.string().min(1, 'Appointment date is required').refine((val) => {
    const date = new Date(val)
    const now = new Date()
    return date > now
  }, 'Appointment date must be in the future'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(180, 'Duration cannot exceed 180 minutes').default(30),
  type: z.enum(['CONSULTATION', 'TREATMENT', 'FOLLOW_UP', 'REVIEW', 'EMERGENCY', 'OTHER']).default('CONSULTATION'),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
})

export const checkInResponseSchema = z.object({
  checkInId: z.string().min(1),
  message: z.string().min(1, 'Please provide a response').max(2000, 'Response must be 2000 characters or less'),
  symptoms: z.array(z.string()).optional(),
})

export const doctorNoteSchema = z.object({
  doctorId: z.string().min(1),
  treatmentId: optionalStr,
  checkInId: optionalStr,
  content: z.string().min(1, 'Note content is required').max(5000, 'Note content must be 5000 characters or less'),
  isPrivate: z.boolean().default(false),
})

export const injectionMappingSchema = z.object({
  treatmentId: z.string().min(1, 'Treatment is required'),
  doctorId: optionalStr,
  area: z.string().min(1, 'Injection area is required'),
  subArea: z.string().max(100, 'Sub-area must be 100 characters or less').optional(),
  units: z.number().positive('Units must be a positive number').max(100, 'Units cannot exceed 100').optional(),
  volume: z.number().positive('Volume must be a positive number').max(50, 'Volume cannot exceed 50').optional(),
  productId: optionalStr,
  batchId: optionalStr,
  technique: z.string().max(100, 'Technique must be 100 characters or less').optional(),
  needleCannula: z.string().max(50, 'Needle/Cannula must be 50 characters or less').optional(),
  depth: z.enum(['INTRADERMAL', 'SUBDERMAL', 'DEEP_DERMAL', 'SUPRAPERIOSTEAL', 'OTHER']).optional(),
  aspiration: z.enum(['YES', 'NO', 'N/A']).optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
})

export const complicationSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  treatmentId: optionalStr,
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
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'CRITICAL']),
  onsetDate: z.string().min(1, 'Onset date is required').refine((val) => {
    const date = new Date(val)
    const now = new Date()
    return date <= now
  }, 'Onset date cannot be in the future'),
  resolutionDate: z.string().optional(),
  treatmentGiven: z.string().max(1000, 'Treatment given must be 1000 characters or less').optional(),
  outcome: z.string().max(1000, 'Outcome must be 1000 characters or less').optional(),
  batchNumber: z.string().max(50, 'Batch number must be 50 characters or less').optional(),
  productUsed: z.string().max(100, 'Product used must be 100 characters or less').optional(),
})

export const clinicalNoteSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: optionalStr,
  treatmentId: optionalStr,
  checkInId: optionalStr,
  noteType: z.enum(['SOAP', 'PROCEDURE', 'PROGRESS', 'RECOVERY_SUMMARY', 'COMMUNICATION', 'AUDIT']),
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be 5000 characters or less'),
  isAiGenerated: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
})

export const clinicalQuerySchema = z.object({
  query: z.string().min(1, 'Query is required').max(2000, 'Query must be 2000 characters or less'),
  clinicId: z.string().optional(),
})

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Product name must be 100 characters or less'),
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
  manufacturer: z.string().max(100, 'Manufacturer must be 100 characters or less').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  clinicId: optionalStr,
})

export const productBatchSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  batchNumber: z.string().min(1, 'Batch number is required').max(50, 'Batch number must be 50 characters or less'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  quantity: z.number().int('Quantity must be a whole number').positive('Quantity must be positive').optional(),
})
