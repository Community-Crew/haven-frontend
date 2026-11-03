/**
 * Solver for the backend's reservation proof of work (App\Services\ProofOfWork):
 * find a counter for which sha256("<challenge>:<counter>") starts with
 * `difficulty` zero bits. Pure so it can be unit-tested; in the app it runs
 * inside a Web Worker (see workers/proofOfWork.worker.ts).
 */

export const leadingZeroBits = (bytes: Uint8Array): number => {
    let bits = 0

    for (const byte of bytes) {
        if (byte === 0) {
            bits += 8
            continue
        }

        return bits + Math.clz32(byte) - 24
    }

    return bits
}

export const solveProofOfWork = async (
    challenge: string,
    difficulty: number,
    shouldStop: () => boolean = () => false,
): Promise<number | null> => {
    const encoder = new TextEncoder()

    for (let counter = 0; ; counter++) {
        // Checked every so often rather than every hash, so cancelling (a
        // fresh challenge replacing this one) is quick but nearly free.
        if (counter % 1024 === 0 && shouldStop()) {
            return null
        }

        const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${challenge}:${counter}`))

        if (leadingZeroBits(new Uint8Array(digest)) >= difficulty) {
            return counter
        }
    }
}
