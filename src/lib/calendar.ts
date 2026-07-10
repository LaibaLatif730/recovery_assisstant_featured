const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: { dateTime: string; timeZone?: string }
  end: { dateTime: string; timeZone?: string }
  attendees?: { email: string }[]
  reminders?: { useDefault: boolean; overrides?: { method: string; minutes: number }[] }
}

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    return null
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()
    return data.access_token || null
  } catch (error) {
    console.error('Failed to get Google access token:', error)
    return null
  }
}

export async function createCalendarEvent(
  calendarId: string,
  event: CalendarEvent
): Promise<string | null> {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    console.log('Google Calendar not configured')
    return null
  }

  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          reminders: event.reminders || {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 60 },
              { method: 'popup', minutes: 1440 },
            ],
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Google Calendar API error:', error)
      return null
    }

    const data = await response.json()
    return data.id || null
  } catch (error) {
    console.error('Failed to create calendar event:', error)
    return null
  }
}

export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<boolean> {
  const accessToken = await getAccessToken()
  if (!accessToken) return false

  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    )

    return response.ok
  } catch (error) {
    console.error('Failed to update calendar event:', error)
    return false
  }
}

export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string
): Promise<boolean> {
  const accessToken = await getAccessToken()
  if (!accessToken) return false

  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    return response.ok
  } catch (error) {
    console.error('Failed to delete calendar event:', error)
    return false
  }
}

export async function getCalendarEvents(
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const accessToken = await getAccessToken()
  if (!accessToken) return []

  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Failed to get calendar events:', error)
    return []
  }
}

export async function syncCheckInToCalendar(
  patientName: string,
  treatmentType: string,
  dayNumber: number,
  scheduledDate: Date,
  calendarId: string
): Promise<string | null> {
  const startTime = new Date(scheduledDate)
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000)

  return createCalendarEvent(calendarId, {
    summary: `Check-in: ${patientName} (Day ${dayNumber})`,
    description: `Day ${dayNumber} recovery check-in for ${patientName}\nTreatment: ${treatmentType.replace(/_/g, ' ')}\n\nPlease upload a photo via the clinic portal or reply to the WhatsApp reminder.`,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'America/New_York',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 1440 },
      ],
    },
  })
}
