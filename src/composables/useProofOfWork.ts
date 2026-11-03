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
    expiresAt: number
}

/**
 * Keeps a solved reservation challenge ready (see App\Services\ProofOfWork
 * on the backend): fetched and solved in a Web Worker as soon as the booking
 * form is on screen, so by the time the resident has picked a slot and
 * typed a name it's long done.
 *
 * A challenge lasts `expires_in` seconds. A minute before that, the next one
 * is fetched and solved alongside - the current one stays usable until it
 * really expires, so there's no gap in which a booking has to wait. Each is
 * used once, so taking one starts on the next straight away.
 */
export function useProofOfWork() {
    // The solution to hand out next, and the one being worked on (if any).
    let ready: Solved | null = null
    let pending: Promise<Solved | null> | null = null
    let worker: Worker | null = null
    let refreshTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    // Leave this much of a solution's lifetime for the request to arrive.
    const MARGIN_MS = 15_000

    const isUsable = (solved: Solved | null): solved is Solved => solved !== null && solved.expiresAt - MARGIN_MS > Date.now()

    const solveInWorker = (challenge: string, difficulty: number) => new Promise<number>((resolve, reject) => {
        worker = new Worker(new URL('../workers/proofOfWork.worker.ts', import.meta.url), {type: 'module'})
        worker.onmessage = (event: MessageEvent<{ nonce: number }>) => resolve(event.data.nonce)
        worker.onerror = reject
        worker.postMessage({challenge, difficulty})
    })

    /**
     * Start on the next solution, unless one is already being worked on.
     */
    const prepare = () => {
        if (stopped || pending) {
            return
        }

        const current = (async (): Promise<Solved | null> => {
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

            const started = performance.now()
            const nonce = await solveInWorker(challenge, difficulty)
            const took = performance.now() - started
            log(`difficulty ${difficulty}: solved after ${nonce + 1} hashes in ${Math.round(took)} ms (~${Math.round((nonce + 1) / (took / 1000))} hashes/s)`)
            worker?.terminate()
            worker = null

            const solved = {challenge, nonce, usableAt: issuedAt + min_age * 1000, expiresAt: issuedAt + expires_in * 1000}

            // The overlap: start on the successor a minute before this one runs out.
            if (refreshTimer) {
                clearTimeout(refreshTimer)
            }
            refreshTimer = setTimeout(prepare, Math.max(expires_in - 60, 30) * 1000)

            return solved
        })()

        pending = current

        current
            .then(solved => {
                // Newer than whatever was ready, so it lives longer.
                if (solved) {
                    ready = solved
                }
            })
            // A failed fetch (offline, rate-limited) is retried by take().
            .catch(() => undefined)
            .finally(() => {
                if (pending === current) {
                    pending = null
                }
            })
    }

    /**
     * The fields to send along with the reservation: the ready solution if
     * it's still valid, otherwise the one being worked on. Only waits when
     * someone books within seconds of opening the page.
     */
    const take = async (): Promise<ProofOfWorkFields> => {
        let solved: Solved | null = isUsable(ready) ? ready : null

        if (!solved) {
            prepare()
            solved = await pending

            // Off on the backend (or no endpoint yet): book without.
            if (!solved) {
                return {}
            }
        }

        // Single use - hand it out and start on the next.
        ready = null
        prepare()

        const wait = solved.usableAt - Date.now()

        if (wait > 0) {
            log(`waiting ${wait} ms for the minimum age before submitting`)
            await new Promise(resolve => setTimeout(resolve, wait))
        }

        return {pow_challenge: solved.challenge, pow_nonce: solved.nonce}
    }

    onBeforeUnmount(() => {
        stopped = true
        worker?.terminate()

        if (refreshTimer) {
            clearTimeout(refreshTimer)
        }
    })

    return {prepare, take}
}

/**
 * Whether a failed reservation was refused over the proof of work (expired,
 * already used, ...) - worth one automatic retry with a fresh solution.
 */
export const isProofOfWorkError = (err: any): boolean =>
    Array.isArray(err?.response?.data?.errors?.pow_challenge)
