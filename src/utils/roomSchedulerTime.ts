import type { Reservation } from '@/types/reservations'

/**
 * Pure time-math helpers for RoomScheduler. Extracted so the midnight-boundary
 * edge cases (a reservation starting or ending exactly at 00:00) can be unit
 * tested without mounting the component.
 */

export const timeToMinutes = (time: string): number => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export const parseTimeFromIso = (isoString: string): string => {
  const date = new Date(isoString)
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

// A same-day reservation's end time-of-day is only ever "00:00" when it
// actually runs to midnight (24:00) - a real end before its own start is
// impossible - so treat that as end-of-day rather than start-of-day.
export const reservationEndMinutes = (endAt: string): number => {
  const minutes = timeToMinutes(parseTimeFromIso(endAt))
  return minutes === 0 ? 1440 : minutes
}

export const formatBoundaryTime = (minutes: number): string => {
  if (minutes >= 1440) return '24:00'
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export const findOverlappingReservation = (
    reservations: Reservation[],
    slotStartMin: number,
): Reservation | null => {
  const slotEndMin = slotStartMin + 30

  return reservations.find(res => {
    const resStart = timeToMinutes(parseTimeFromIso(res.start_at))
    const resEnd = reservationEndMinutes(res.end_at)
    return resStart < slotEndMin && resEnd > slotStartMin
  }) || null
}

// Builds a "YYYY-MM-DD HH:mm:00" string for a given minutes-of-day offset
// from dateStr, rolling over to the next calendar day once minutesOfDay
// reaches 1440 (i.e. the last slot of the day, which ends at 24:00).
export const buildDateTimeString = (dateStr: string, minutesOfDay: number): string => {
  const dayOffset = Math.floor(minutesOfDay / 1440)
  const normalizedMinutes = minutesOfDay - (dayOffset * 1440)
  const hh = String(Math.floor(normalizedMinutes / 60)).padStart(2, '0')
  const mm = String(normalizedMinutes % 60).padStart(2, '0')

  if (dayOffset === 0) {
    return `${dateStr} ${hh}:${mm}:00`
  }

  const [year = 0, month = 0, day = 0] = dateStr.split('-').map(Number)
  const rolledDate = new Date(Date.UTC(year, month - 1, day + dayOffset))
  const rolledDateStr = rolledDate.toISOString().slice(0, 10)

  return `${rolledDateStr} ${hh}:${mm}:00`
}
