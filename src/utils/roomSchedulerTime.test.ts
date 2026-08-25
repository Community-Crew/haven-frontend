import { describe, expect, it } from 'vitest'
import type { Reservation } from '@/types/reservations'
import {
  buildDateTimeString,
  findOverlappingReservation,
  formatBoundaryTime,
  parseTimeFromIso,
  reservationEndMinutes,
  timeToMinutes,
} from './roomSchedulerTime'

const makeReservation = (start_at: string, end_at: string): Reservation => ({
  id: 1,
  room_id: 1,
  name: 'Test booking',
  start_at,
  end_at,
})

describe('timeToMinutes', () => {
  it('converts a plain HH:mm time to minutes-of-day', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('08:30')).toBe(510)
    expect(timeToMinutes('23:30')).toBe(1410)
  })
})

describe('parseTimeFromIso', () => {
  it('extracts the local HH:mm from a datetime string', () => {
    expect(parseTimeFromIso('2026-08-25 09:15:00')).toBe('09:15')
    expect(parseTimeFromIso('2026-08-25 00:00:00')).toBe('00:00')
  })
})

describe('reservationEndMinutes', () => {
  it('reads a normal end time as-is', () => {
    expect(reservationEndMinutes('2026-08-25 10:00:00')).toBe(600)
  })

  it('treats an end time-of-day of 00:00 as end-of-day (1440), not start-of-day', () => {
    expect(reservationEndMinutes('2026-08-26 00:00:00')).toBe(1440)
  })
})

describe('formatBoundaryTime', () => {
  it('formats normal minutes-of-day as HH:mm', () => {
    expect(formatBoundaryTime(510)).toBe('08:30')
    expect(formatBoundaryTime(0)).toBe('00:00')
  })

  it('formats end-of-day as 24:00 instead of wrapping to 00:00', () => {
    expect(formatBoundaryTime(1440)).toBe('24:00')
    expect(formatBoundaryTime(1500)).toBe('24:00')
  })
})

describe('findOverlappingReservation', () => {
  it('finds a reservation that overlaps a normal slot', () => {
    const reservations = [makeReservation('2026-08-25 10:00:00', '2026-08-25 11:00:00')]
    expect(findOverlappingReservation(reservations, timeToMinutes('10:00'))).toBe(reservations[0])
    expect(findOverlappingReservation(reservations, timeToMinutes('10:30'))).toBe(reservations[0])
  })

  it('returns null when no reservation overlaps the slot', () => {
    const reservations = [makeReservation('2026-08-25 10:00:00', '2026-08-25 11:00:00')]
    expect(findOverlappingReservation(reservations, timeToMinutes('11:00'))).toBeNull()
  })

  it('detects a reservation starting at 00:00 as occupying slots later in the day', () => {
    // Regression: a reservation starting at midnight never equals any slot
    // label (slots start at 08:00), so a naive exact-match lookup misses it
    // entirely and the picker would show already-booked slots as available.
    const reservations = [makeReservation('2026-08-25 00:00:00', '2026-08-25 10:00:00')]
    expect(findOverlappingReservation(reservations, timeToMinutes('08:00'))).toBe(reservations[0])
    expect(findOverlappingReservation(reservations, timeToMinutes('09:30'))).toBe(reservations[0])
    expect(findOverlappingReservation(reservations, timeToMinutes('10:00'))).toBeNull()
  })

  it('detects a reservation ending at midnight as occupying every slot up to 23:30', () => {
    // Regression: a reservation ending at 24:00 is stored with an end
    // time-of-day of "00:00" (next day); comparing that as a plain string
    // against slot labels like "23:00" broke the has-ended check.
    const reservations = [makeReservation('2026-08-25 22:00:00', '2026-08-26 00:00:00')]
    expect(findOverlappingReservation(reservations, timeToMinutes('22:00'))).toBe(reservations[0])
    expect(findOverlappingReservation(reservations, timeToMinutes('23:00'))).toBe(reservations[0])
    expect(findOverlappingReservation(reservations, timeToMinutes('23:30'))).toBe(reservations[0])
  })
})

describe('buildDateTimeString', () => {
  it('builds a same-day datetime string for minutes within the day', () => {
    expect(buildDateTimeString('2026-08-25', timeToMinutes('08:00'))).toBe('2026-08-25 08:00:00')
  })

  it('rolls over to the next calendar day when minutes reach 1440 (24:00)', () => {
    // Regression: booking the last slot (23:30-24:00) used to produce the
    // literal, invalid time "2026-08-25 24:00:00" instead of rolling over.
    expect(buildDateTimeString('2026-08-25', 1440)).toBe('2026-08-26 00:00:00')
  })

  it('rolls over correctly across a month/year boundary', () => {
    expect(buildDateTimeString('2026-12-31', 1440)).toBe('2027-01-01 00:00:00')
  })
})
