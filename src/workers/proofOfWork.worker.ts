import {solveProofOfWork} from '@/utils/proofOfWork'

// One solve per worker - the composable terminates it to cancel.
self.onmessage = async (event: MessageEvent<{ challenge: string; difficulty: number }>) => {
    const nonce = await solveProofOfWork(event.data.challenge, event.data.difficulty)

    self.postMessage({nonce})
}
