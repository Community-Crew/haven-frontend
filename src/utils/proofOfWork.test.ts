import {describe, expect, it} from 'vitest'
import {leadingZeroBits, solveProofOfWork} from '@/utils/proofOfWork'

describe('proof of work', () => {
    it('counts leading zero bits like the backend does', () => {
        expect(leadingZeroBits(new Uint8Array([0xff]))).toBe(0)
        expect(leadingZeroBits(new Uint8Array([0x01]))).toBe(7)
        expect(leadingZeroBits(new Uint8Array([0x00, 0x80]))).toBe(8)
        expect(leadingZeroBits(new Uint8Array([0x00, 0x00, 0x0f]))).toBe(20)
    })

    it('finds a counter whose hash meets the difficulty', async () => {
        const nonce = await solveProofOfWork('abc.def', 10)
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`abc.def:${nonce}`))

        expect(nonce).not.toBeNull()
        expect(leadingZeroBits(new Uint8Array(digest))).toBeGreaterThanOrEqual(10)
    })

    it('stops when asked to', async () => {
        expect(await solveProofOfWork('abc.def', 64, () => true)).toBeNull()
    })
})
