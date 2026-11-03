import {onBeforeUnmount} from 'vue'
import {reservationService} from '@/services/reservationService'

export interface ProofOfWorkFields {
    pow_challenge?: string
    pow_nonce?: number
}

interface Solved {
    challenge: string
    nonce: number
    usableAt: number
}

/**
 * Keeps a solved reservation challenge ready (see App\Services\ProofOfWork
 * on the backend): fetched and solved in a Web Worker as soon as the booking
 * form is on screen, so by the time the resident has picked a slot and
 * typed a name it's long done. A challenge lasts `expires_in` seconds, so a
 * fresh one is fetched and solved shortly before that while the form stays
 * open; each one is used once, so taking it starts the next straight away.
 */
export function useProofOfWork() {
    let solved: Promise<Solved | null> | null = null
    let worker: Worker | null = null
    let rejectSolve: ((reason: Error) => void) | null = null
    let refreshTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    const cancel = () => {
        worker?.terminate()
        worker = null
        // Anyone still waiting on the cancelled solve moves on to the next.
        rejectSolve?.(new Error('cancelled'))
        rejectSolve = null

        if (refreshTimer) {
            clearTimeout(refreshTimer)
            refreshTimer = null
        }
    }

    const solveInWorker = (challenge: string, difficulty: number) => new Promise<number>((resolve, reject) => {
        rejectSolve = reject
        worker = new Worker(new URL('../workers/proofOfWork.worker.ts', import.meta.url), {type: 'module'})
        worker.onmessage = (event: MessageEvent<{ nonce: number }>) => resolve(event.data.nonce)
        worker.onerror = reject
        worker.postMessage({challenge, difficulty})
    })

    const prepare = () => {
        cancel()

        if (stopped) {
            return
        }

        const current = (async () => {
            const {challenge, difficulty, min_age, expires_in} = await reservationService.getChallenge()

            // Proof of work switched off on the backend.
            if (difficulty === 0) {
                return null
            }

            const issuedAt = Date.now()
            // A minute's margin, so a booking submitted right at the end
            // doesn't arrive just after the backend stopped accepting it.
            refreshTimer = setTimeout(prepare, Math.max(expires_in - 60, 30) * 1000)

            const nonce = await solveInWorker(challenge, difficulty)
            worker?.terminate()
            worker = null
            rejectSolve = null

            return {challenge, nonce, usableAt: issuedAt + min_age * 1000}
        })()

        solved = current

        // A failed fetch (offline, rate-limited) is retried by take().
        current.catch(() => {
            if (solved === current) {
                solved = null
            }
        })
    }

    /**
     * The fields to send along with the reservation. Waits if the solution
     * isn't ready yet - only possible when someone books within seconds of
     * opening the page.
     */
    const take = async (): Promise<ProofOfWorkFields> => {
        let result: Solved | null

        for (;;) {
            if (!solved) {
                prepare()
            }

            const current = solved

            try {
                result = await current
                break
            } catch (err) {
                // Replaced by a refresh while waiting: wait for that one instead.
                if (current !== solved) {
                    continue
                }

                throw err
            }
        }

        if (!result) {
            return {}
        }

        const wait = result.usableAt - Date.now()

        if (wait > 0) {
            await new Promise(resolve => setTimeout(resolve, wait))
        }

        // Single use - start on the next one for a following booking.
        prepare()

        return {pow_challenge: result.challenge, pow_nonce: result.nonce}
    }

    onBeforeUnmount(() => {
        stopped = true
        cancel()
    })

    return {prepare, take}
}

/**
 * Whether a failed reservation was refused over the proof of work (expired,
 * already used, ...) - worth one automatic retry with a fresh solution.
 */
export const isProofOfWorkError = (err: any): boolean =>
    Array.isArray(err?.response?.data?.errors?.pow_challenge)
