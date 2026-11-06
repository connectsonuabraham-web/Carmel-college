import React from 'react'
import { CallSummary as CallSummaryType } from '../types'
import { formatDuration } from '../utils/dateUtils'

interface Props {
  summary: CallSummaryType
}

export function CallSummary({ summary }: Props) {
  const isSuccess = summary.outcome === 'success' || summary.outcome === 'completed'
  const isFailure = summary.outcome === 'failed' || summary.outcome === 'incomplete'

  const outcomeBadge = isSuccess
    ? 'bg-\[#d8f58f\]/60 text-\[#1f6b47\] rounded-md px-2 py-0.5 text-xs'
    : isFailure
    ? 'bg-red-50 text-\[#d9534f\] rounded-md px-2 py-0.5 text-xs'
    : 'bg-yellow-500/10 text-yellow-400 rounded-md px-2 py-0.5 text-xs'

  return (
    <div className="bg-\[#f5f6f4\] border border-\[#e8ebe8\] rounded-\[16px\] p-4 mb-4">
      <h3 className="text-\[#0f1a14\] font-semibold text-sm mb-3">📋 Call Summary</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-\[#7b857f\] text-xs">Outcome</span>
          <p className="mt-0.5">
            <span className={`${outcomeBadge} capitalize`}>{summary.outcome || 'Unknown'}</span>
          </p>
        </div>
        <div>
          <span className="text-\[#7b857f\] text-xs">Duration</span>
          <p className="text-\[#0f1a14\] font-semibold text-sm mt-0.5">{formatDuration(summary.duration)}</p>
        </div>
        <div>
          <span className="text-\[#7b857f\] text-xs">Language</span>
          <p className="text-\[#0f1a14\] font-semibold text-sm mt-0.5">{summary.language}</p>
        </div>
        <div>
          <span className="text-\[#7b857f\] text-xs">Ended By</span>
          <p className="text-\[#0f1a14\] font-semibold text-sm mt-0.5 capitalize">{summary.endedBy}</p>
        </div>
        <div>
          <span className="text-\[#7b857f\] text-xs">Speaker Turns</span>
          <p className="text-\[#7b857f\] text-sm mt-0.5">
            User: {summary.speakerTurns.user} · Agent: {summary.speakerTurns.assistant}
          </p>
        </div>
        {summary.estimatedTopics.length > 0 && (
          <div>
            <span className="text-\[#7b857f\] text-xs">Key Words</span>
            <p className="text-\[#7b857f\] text-sm mt-0.5">{summary.estimatedTopics.join(', ')}</p>
          </div>
        )}
      </div>
      {Object.keys(summary.agentVariables).length > 0 && (
        <div className="mt-3 pt-3 border-t border-\[#e8ebe8\]">
          <p className="text-\[#7b857f\] text-xs mb-1">Agent Variables</p>
          <pre className="text-xs text-\[#7b857f\] bg-white border border-\[#e8ebe8\] rounded-lg p-2 overflow-auto max-h-24">
            {JSON.stringify(summary.agentVariables, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
