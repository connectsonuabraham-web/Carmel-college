import { TranscriptMessage, CallSummary } from '../types'

export function generateCallSummary(
  messages: TranscriptMessage[],
  interaction: {
    goal_overall_status: string
    duration_in_seconds: number
    language_name: string
    ended_by: string
    agent_variables?: Record<string, unknown>
  }
): CallSummary {
  const userMessages = messages.filter((m) => m.role === 'user')
  const assistantMessages = messages.filter((m) => m.role === 'assistant')

  // Extract rough topics from first 3 user messages
  const topicWords = userMessages
    .slice(0, 3)
    .map((m) => m.content)
    .join(' ')
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 8)

  // Deduplicate and pick top 3
  const unique = [...new Set(topicWords.map((w) => w.toLowerCase()))].slice(0, 3)

  return {
    speakerTurns: {
      user: userMessages.length,
      assistant: assistantMessages.length,
    },
    estimatedTopics: unique,
    outcome: interaction.goal_overall_status,
    duration: interaction.duration_in_seconds,
    language: interaction.language_name,
    endedBy: interaction.ended_by,
    agentVariables: interaction.agent_variables ?? {},
  }
}
