import { loginSchema, registerSchema, patientSchema, treatmentSchema, appointmentSchema } from '@/lib/validators'

describe('Validators', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '12345',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'PATIENT',
      })
      expect(result.success).toBe(true)
    })

    it('should reject short name', () => {
      const result = registerSchema.safeParse({
        name: 'J',
        email: 'john@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('should default role to PATIENT', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('PATIENT')
      }
    })
  })

  describe('patientSchema', () => {
    it('should validate correct patient data', () => {
      const result = patientSchema.safeParse({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        phone: '+1-555-0100',
        gender: 'FEMALE',
      })
      expect(result.success).toBe(true)
    })

    it('should require first name', () => {
      const result = patientSchema.safeParse({
        lastName: 'Smith',
      })
      expect(result.success).toBe(false)
    })

    it('should require last name', () => {
      const result = patientSchema.safeParse({
        firstName: 'Alice',
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional fields', () => {
      const result = patientSchema.safeParse({
        firstName: 'Alice',
        lastName: 'Smith',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('treatmentSchema', () => {
    it('should validate correct treatment data', () => {
      const result = treatmentSchema.safeParse({
        patientId: 'patient-123',
        type: 'BOTOX',
        treatmentDate: '2024-01-15',
      })
      expect(result.success).toBe(true)
    })

    it('should require patientId', () => {
      const result = treatmentSchema.safeParse({
        type: 'BOTOX',
        treatmentDate: '2024-01-15',
      })
      expect(result.success).toBe(false)
    })

    it('should require treatment type', () => {
      const result = treatmentSchema.safeParse({
        patientId: 'patient-123',
        treatmentDate: '2024-01-15',
      })
      expect(result.success).toBe(false)
    })

    it('should require treatment date', () => {
      const result = treatmentSchema.safeParse({
        patientId: 'patient-123',
        type: 'BOTOX',
      })
      expect(result.success).toBe(false)
    })

    it('should accept all valid treatment types', () => {
      const types = [
        'BOTOX', 'FILLER_HYALURONIC', 'FILLER_CALCIUM_HYDROXYLAPATITE',
        'FILLER_POLY_L_LACTIC', 'FILLER_POLYALKYLIMIDE', 'FILLER_POLYMETHYLMETHACRYLATE',
        'MESOTHERAPY', 'PRP', 'OTHER',
      ]
      types.forEach((type) => {
        const result = treatmentSchema.safeParse({
          patientId: 'patient-123',
          type,
          treatmentDate: '2024-01-15',
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('appointmentSchema', () => {
    it('should validate correct appointment data', () => {
      const result = appointmentSchema.safeParse({
        patientId: 'patient-123',
        appointmentDate: '2024-01-15T10:00:00',
      })
      expect(result.success).toBe(true)
    })

    it('should default duration to 30', () => {
      const result = appointmentSchema.safeParse({
        patientId: 'patient-123',
        appointmentDate: '2024-01-15T10:00:00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.duration).toBe(30)
      }
    })

    it('should default type to CONSULTATION', () => {
      const result = appointmentSchema.safeParse({
        patientId: 'patient-123',
        appointmentDate: '2024-01-15T10:00:00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('CONSULTATION')
      }
    })

    it('should reject duration less than 15', () => {
      const result = appointmentSchema.safeParse({
        patientId: 'patient-123',
        appointmentDate: '2024-01-15T10:00:00',
        duration: 10,
      })
      expect(result.success).toBe(false)
    })

    it('should reject duration greater than 180', () => {
      const result = appointmentSchema.safeParse({
        patientId: 'patient-123',
        appointmentDate: '2024-01-15T10:00:00',
        duration: 200,
      })
      expect(result.success).toBe(false)
    })
  })
})
