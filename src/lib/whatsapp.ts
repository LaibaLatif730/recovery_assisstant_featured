import { createHmac, timingSafeEqual } from 'crypto'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'

export interface WhatsAppMessage {
  messaging_product: string
  to: string
  type: string
  text?: { body: string }
  image?: { id: string; caption?: string }
  template?: { name: string; language: { code: string }; components: any[] }
}

export interface WhatsAppWebhookEntry {
  id: string
  changes: {
    value: {
      messaging_product: string
      metadata: { display_phone_number: string; phone_number_id: string }
      contacts: { profile: { name: string }; wa_id: string }[]
      messages: {
        from: string
        id: string
        timestamp: string
        type: string
        text?: { body: string }
        image?: { id: string; mime_type: string; caption?: string }
      }[]
      statuses?: any[]
    }
    field: string
  }[]
}

export async function sendWhatsAppMessage(
  to: string,
  message: WhatsAppMessage
): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !token) {
    console.log('WhatsApp not configured, skipping message send')
    return false
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(message),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('WhatsApp API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return false
  }
}

export async function sendCheckInReminder(
  patientPhone: string,
  patientName: string,
  treatmentType: string,
  dayNumber: number
): Promise<boolean> {
  const message = `Hi ${patientName}! 👋

This is a reminder for your Day ${dayNumber} recovery check-in for your ${treatmentType.replace(/_/g, ' ').toLowerCase()} treatment.

📸 Please reply to this message with a photo of the treated area so we can monitor your recovery.

If you have any concerns, please reply with a description of your symptoms.

Thank you!
AI Clinic Assistant`

  return sendWhatsAppMessage(patientPhone, {
    messaging_product: 'whatsapp',
    to: patientPhone,
    type: 'text',
    text: { body: message },
  })
}

export async function sendRiskAlert(
  staffPhone: string,
  patientName: string,
  riskLevel: string,
  treatmentType: string
): Promise<boolean> {
  const emoji = riskLevel === 'RED' ? '🚨' : riskLevel === 'ORANGE' ? '⚠️' : '📋'
  const message = `${emoji} ${riskLevel} ALERT

Patient: ${patientName}
Treatment: ${treatmentType.replace(/_/g, ' ')}
Risk Level: ${riskLevel}

Please review this case in the dashboard immediately.`

  return sendWhatsAppMessage(staffPhone, {
    messaging_product: 'whatsapp',
    to: staffPhone,
    type: 'text',
    text: { body: message },
  })
}

export function parseWhatsAppWebhook(body: any): {
  messages: WhatsAppWebhookEntry['changes'][0]['value']['messages']
  phoneNumbers: string[]
} {
  const messages: WhatsAppWebhookEntry['changes'][0]['value']['messages'] = []
  const phoneNumbers: string[] = []

  if (!body?.entry) return { messages, phoneNumbers }

  for (const entry of body.entry) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue
      const value = change.value
      if (value.messages) {
        messages.push(...value.messages)
      }
      if (value.metadata?.display_phone_number) {
        phoneNumbers.push(value.metadata.display_phone_number)
      }
    }
  }

  return { messages, phoneNumbers }
}

export function verifyWhatsAppSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) {
    console.error('[SECURITY] WHATSAPP_APP_SECRET not configured — webhook signature cannot be verified')
    return false
  }

  if (!signatureHeader) {
    console.error('[SECURITY] Missing X-Hub-Signature-256 header')
    return false
  }

  const expectedPrefix = 'sha256='
  if (!signatureHeader.startsWith(expectedPrefix)) {
    console.error('[SECURITY] Invalid signature format — missing sha256= prefix')
    return false
  }

  const expectedSignature = signatureHeader.slice(expectedPrefix.length)
  const hmac = createHmac('sha256', appSecret)
  hmac.update(rawBody)
  const computedSignature = hmac.digest('hex')

  try {
    const sigBuffer = Buffer.from(expectedSignature, 'hex')
    const computedBuffer = Buffer.from(computedSignature, 'hex')

    if (sigBuffer.length !== computedBuffer.length) {
      console.error('[SECURITY] WhatsApp webhook signature mismatch — length differs')
      return false
    }

    return timingSafeEqual(sigBuffer, computedBuffer)
  } catch {
    console.error('[SECURITY] WhatsApp webhook signature verification failed')
    return false
  }
}
