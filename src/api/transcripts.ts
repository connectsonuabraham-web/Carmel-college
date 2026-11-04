import { sarvamClient } from './sarvamClient'
import { Transcript } from '../types'

export async function fetchTranscript(interactionId: string): Promise<Transcript> {
  const { data } = await sarvamClient.get(`/transcripts/${interactionId}`)
  return data
}
