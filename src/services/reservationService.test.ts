import {describe, expect, it, vi} from 'vitest'
import {reservationService} from './reservationService'
import {privateApi} from './api'

// privateApi hardcodes a "Content-Type: application/json" default header.
// Posting a FormData body without overriding that per-request makes axios
// JSON.stringify the FormData (throwing away the actual file) instead of
// sending it as multipart - see reservationService.ts's checkIn/checkOut.
// This pins down that the override stays in place.
vi.mock('./api', () => ({
  privateApi: {
    post: vi.fn().mockResolvedValue({data: {message: 'ok', data: {}}}),
  },
}))

describe('reservationService photo uploads', () => {
  it('checkIn clears the default JSON Content-Type and sends every photo as multipart', async () => {
    const photos = [
      new File(['bytes'], 'front.jpg', {type: 'image/jpeg'}),
      new File(['bytes'], 'back.jpg', {type: 'image/jpeg'}),
    ]

    await reservationService.checkIn(1, photos)

    expect(privateApi.post).toHaveBeenCalledTimes(1)
    const [url, body, config] = vi.mocked(privateApi.post).mock.calls[0]!
    expect(url).toBe('/reservations/1/check-in')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).getAll('photos[]')).toEqual(photos)
    expect(config?.headers).toEqual({'Content-Type': undefined})
  })

  it('checkOut clears the default JSON Content-Type and sends every photo as multipart', async () => {
    const photos = [new File(['bytes'], 'photo.jpg', {type: 'image/jpeg'})]

    await reservationService.checkOut(2, photos)

    const [url, body, config] = vi.mocked(privateApi.post).mock.calls.at(-1)!
    expect(url).toBe('/reservations/2/check-out')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).getAll('photos[]')).toEqual(photos)
    expect(config?.headers).toEqual({'Content-Type': undefined})
  })
})
