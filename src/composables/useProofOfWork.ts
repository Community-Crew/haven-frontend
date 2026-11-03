import {onBeforeUnmount} from 'vue'
import {reservationService} from '@/services/reservationService'

export interface ProofOfWorkFields {
    pow_challenge?: string
    pow_nonce?: number
}

/**
 * Logs solve times to the console - always in the Vite dev server, and
 * anywhere else (test environment, production) after
 * localStorage.setItem('haven:debug-pow', '1') in the browser console.
 * Also exposes window.havenPowBenchmark(difficulty, runs) there.
 */
const debug = (() => {
    if (import.meta.env.DEV) {
        return true
    }

    try {
        return localStorage.getItem('haven:debug-pow') === '1'
    } catch {
        return false
    }
})()

const log = (...args: unknown[]) => {
    if (debug) {
        console.info('[PoW]', ...args)
    }
}

if (debug && typeof window !== 'undefined') {
    // Solve `runs` random challenges at `difficulty` in this browser, on the
    // main thread (the app itself uses a worker) - for picking a difficulty.
    (window as any).havenPowBenchmark = async (difficulty = 16, runs = 5) => {
        const {solveProofOfWork} = await import('@/utils/proofOfWork')
        const times: number[] = []

        for (let i = 0; i < runs; i++) {
            const start = performance.now()
            await solveProofOfWork(`benchmark-${i}-${Math.random()}`, difficulty)
            times.push(Math.round(performance.now() - start))
        }

        times.sort((a, b) => a - b)
        log(`benchmark difficulty ${difficulty}: ${times.join(', ')} ms (median ${times[Math.floor(times.length / 2)]} ms)`)

        return times
    }
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
            // 404: a backend from before the proof of work - book without it.
            const issued = await reservationService.getChallenge()
                .catch(err => err?.response?.status === 404 ? null : Promise.reject(err))

            // Proof of work switched off on the backend.
            if (!issued || issued.difficulty === 0) {
                log(issued ? 'switched off on the backend (difficulty 0)' : 'backend has no challenge endpoint yet - booking without')

                return null
            }

            const {challenge, difficulty, min_age, expires_in} = issued

            const issuedAt = Date.now()
            // A minute's margin, so a booking submitted right at the end
            // doesn't arrive just after the backend stopped accepting it.
            refreshTimer = setTimeout(prepare, Math.max(expires_in - 60, 30) * 1000)

            const started = performance.now()
            const nonce = await solveInWorker(challenge, difficulty)
            const took = performance.now() - started
            log(`difficulty ${difficulty}: solved after ${nonce + 1} hashes in ${Math.round(took)} ms (~${Math.round((nonce + 1) / (took / 1000))} hashes/s)`)
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
            log(`waiting ${wait} ms for the minimum age before submitting`)
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
