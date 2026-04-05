import { google } from "googleapis"

export function hasGoogleCalendarConfig() {
  return Boolean(
    process.env.GOOGLE_CALENDAR_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  )
}

function getServiceAccountCredentials() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!clientEmail) throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL manquant")
  if (!privateKeyRaw) throw new Error("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY manquant")

  // Private keys are often stored with literal \n sequences in env vars.
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n")
  return { clientEmail, privateKey }
}

export function getCalendarId() {
  const id = process.env.GOOGLE_CALENDAR_ID
  if (!id) throw new Error("GOOGLE_CALENDAR_ID manquant")
  return id
}

export function getCalendarIdIfConfigured() {
  return hasGoogleCalendarConfig() ? getCalendarId() : null
}

export async function getGoogleCalendarClient() {
  const { clientEmail, privateKey } = getServiceAccountCredentials()

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  })

  await auth.authorize()
  return google.calendar({ version: "v3", auth })
}

export type BusyInterval = { start: string; end: string }

export async function getBusyIntervals({
  calendarId,
  timeMin,
  timeMax,
}: {
  calendarId: string
  timeMin: string
  timeMax: string
}): Promise<BusyInterval[]> {
  const calendar = await getGoogleCalendarClient()
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: calendarId }],
    },
  })

  const busy = res.data.calendars?.[calendarId]?.busy ?? []
  return busy
    .filter((b): b is BusyInterval => Boolean(b.start && b.end))
    .map((b) => ({ start: b.start!, end: b.end! }))
}

export async function createCalendarEvent({
  calendarId,
  summary,
  description,
  startAtIso,
  endAtIso,
  timeZone,
}: {
  calendarId: string
  summary: string
  description: string
  startAtIso: string
  endAtIso: string
  timeZone: string
}): Promise<{ eventId: string }> {
  const calendar = await getGoogleCalendarClient()
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: startAtIso, timeZone },
      end: { dateTime: endAtIso, timeZone },
    },
  })

  const eventId = res.data.id
  if (!eventId) throw new Error("Impossible de créer l’événement Google Calendar (id manquant).")
  return { eventId }
}

export async function deleteCalendarEvent({
  calendarId,
  eventId,
}: {
  calendarId: string
  eventId: string
}): Promise<void> {
  const calendar = await getGoogleCalendarClient()
  await calendar.events.delete({ calendarId, eventId })
}

