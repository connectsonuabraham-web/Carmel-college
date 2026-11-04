import { sarvamClient } from './sarvamClient'
import { Trace } from '../types'

export async function fetchTrace(interactionId: string): Promise<Trace> {
  const { data } = await sarvamClient.get(`/traces/${interactionId}`)
  return data
}
