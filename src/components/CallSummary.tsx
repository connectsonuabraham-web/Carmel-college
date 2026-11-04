import React from 'react'
import { CallSummary as CallSummaryType } from '../types'
import { formatDuration } from '../utils/dateUtils'

interface Props {
  summary: CallSummaryType
}

export function CallSummary({ summary }: Props) {
  const outcomeColor =
    summary.outcome === 'success' || summary.outcome === 'completed'
      ? 'text-green-600 dark:text-green-400'
      : summary.outcome === 'failed' || summary.outcome === 'incomplete'
      ? 'text-red-500 dark:text-red-400'
      : 'text-yellow-600 dark:text-yellow-400'

  return (
    <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 mb-4">
      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">📋 Call Summary</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Outcome</span>
          <p className={`font-medium capitalize ${outcomeColor}`}>{summary.outcome || 'Unknown'}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Duration</span>
          <p className="font-medium text-gray-900 dark:text-white">{formatDuration(summary.duration)}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Language</span>
          <p className="font-medium text-gray-900 dark:text-white">{summary.language}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Ended By</span>
          <p className="font-medium text-gray-900 dark:text-white capitalize">{summary.endedBy}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Speaker Turns</span>
          <p className="font-medium text-gray-900 dark:text-white">
            User: {summary.speakerTurns.user} · Agent: {summary.speakerTurns.assistant}
          </p>
        </div>
        {summary.estimatedTopics.length > 0 && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Key Words</span>
            <p className="font-medium text-gray-900 dark:text-white">{summary.estimatedTopics.join(', ')}</p>
          </div>
        )}
      </div>
      {Object.keys(summary.agentVariables).length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Agent Variables</p>
          <pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded p-2 overflow-auto max-h-24">
            {JSON.stringify(summary.agentVariables, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
