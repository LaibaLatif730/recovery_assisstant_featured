'use client'

import { useState, useCallback } from 'react'
import { ZodSchema, ZodError } from 'zod'

export interface FieldErrors {
  [key: string]: string
}

export function useZodForm<T extends Record<string, any>>(schema: ZodSchema<T>) {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validate = useCallback((data: any): data is T => {
    try {
      schema.parse(data)
      setErrors({})
      return true
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: FieldErrors = {}
        err.issues.forEach((error) => {
          const field = error.path.join('.')
          if (!fieldErrors[field]) {
            fieldErrors[field] = error.message
          }
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }, [schema])

  const validateField = useCallback((name: string, data: any) => {
    try {
      const fieldSchema = (schema as any).shape?.[name]
      if (fieldSchema) {
        fieldSchema.parse(data[name])
        setErrors((prev) => {
          const next = { ...prev }
          delete next[name]
          return next
        })
      }
    } catch (err) {
      if (err instanceof ZodError) {
        setErrors((prev) => ({
          ...prev,
          [name]: err.issues[0]?.message || 'Invalid value',
        }))
      }
    }
  }, [schema])

  const handleBlur = useCallback((name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
  }, [])

  const getFieldProps = useCallback((name: string) => ({
    name,
    onBlur: () => handleBlur(name),
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  }), [errors, handleBlur])

  const getFieldError = useCallback((name: string): string | undefined => {
    if (touched[name] || Object.keys(errors).length > 0) {
      return errors[name]
    }
    return undefined
  }, [errors, touched])

  const clearErrors = useCallback(() => {
    setErrors({})
    setTouched({})
  }, [])

  return {
    errors,
    touched,
    validate,
    validateField,
    handleBlur,
    getFieldProps,
    getFieldError,
    clearErrors,
    setErrors,
  }
}
