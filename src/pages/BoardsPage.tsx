import React, { useState, useEffect } from 'react'
import { LayoutGrid, Play, AlertTriangle, Loader2, ChevronRight } from 'lucide-react'
import { useBoards, useBoard, useRunTab } from '../hooks/useBoards'
import { BoardTab, WidgetResult } from '../types'

export function BoardsPage() {
  const { data: boards, isFetching: boardsLoading, error: boardsError } = useBoards()
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null)
  const [tabResults, setTabResults] = useState<Record<string, WidgetResult[]>>({})

  const { data: board } = useBoard(selectedBoardId)
  const runTab = useRunTab()

  useEffect(() => {
    if (board && board.tabs.length > 0 && !selectedTabId) {
      setSelectedTabId(board.tabs[0].id)
    }
  }, [board, selectedTabId])

  useEffect(() => {
    if (boards && boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id)
    }
  }, [boards, selectedBoardId])

  function handleSelectBoard(id: string) {
    setSelectedBoardId(id)
    setSelectedTabId(null)
    setTabResults({})
  }

  async function handleRunTab(tab: BoardTab) {
    if (!selectedBoardId) return
    try {
      const result = await runTab.mutateAsync({ boardId: selectedBoardId, tabId: tab.id })
      setTabResults((prev) => ({ ...prev, [tab.id]: result.results }))
    } catch {
      // error shown inline
    }
  }

  const currentTab = board?.tabs.find((t) => t.id === selectedTabId)
  const currentResults = selectedTabId ? tabResults[selectedTabId] : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Boards</h1>
        <p className="text-sm text-gray-500 mt-0.5">Analytics boards and widget dashboards</p>
      </div>

      {boardsError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Failed to load boards. The boards API may not be available for this workspace.
        </div>
      )}

      <div className="flex gap-4 min-h-[500px]">
        {/* Board list sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Boards</p>
            </div>
            {boardsLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-green-500" size={20} />
              </div>
            )}
            <div className="divide-y divide-gray-100">
              {(boards ?? []).map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSelectBoard(b.id)}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                    selectedBoardId === b.id
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-700 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <LayoutGrid size={14} className="flex-shrink-0" />
                    <span className="truncate">{b.name}</span>
                  </div>
                  {selectedBoardId === b.id && <ChevronRight size={14} />}
                </button>
              ))}
              {!boardsLoading && (boards ?? []).length === 0 && !boardsError && (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">No boards found</p>
              )}
            </div>
          </div>
        </div>

        {/* Board content */}
        <div className="flex-1 min-w-0">
          {!selectedBoardId && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 flex items-center justify-center">
              <p className="text-sm text-gray-400">Select a board to view its tabs and widgets</p>
            </div>
          )}

          {board && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-2 flex-wrap">
                {board.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTabId(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTabId === tab.id
                        ? 'bg-green-500 text-white'
                        : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200 shadow-card'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Selected tab content */}
              {currentTab && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{currentTab.name}</h3>
                    <button
                      onClick={() => handleRunTab(currentTab)}
                      disabled={runTab.isPending}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      {runTab.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      Run Tab
                    </button>
                  </div>

                  {/* Widgets list */}
                  {!currentResults && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 mb-3">Widgets in this tab ({currentTab.widgets.length}):</p>
                      {currentTab.widgets.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600"
                        >
                          <LayoutGrid size={14} className="text-gray-400" />
                          {w.name}
                        </div>
                      ))}
                      {currentTab.widgets.length === 0 && (
                        <p className="text-sm text-gray-400">No widgets in this tab</p>
                      )}
                    </div>
                  )}

                  {/* Widget results */}
                  {currentResults && (
                    <div className="space-y-6">
                      {currentResults.map((result) => {
                        const widget = currentTab.widgets.find((w) => w.id === result.widget_id)
                        return (
                          <div key={result.widget_id}>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-sm font-semibold text-gray-700">
                                {widget?.name ?? result.widget_id}
                              </h4>
                              {result.truncated && (
                                <span className="flex items-center gap-1 text-xs text-yellow-600">
                                  <AlertTriangle size={12} /> Truncated
                                </span>
                              )}
                              {result.status === 'error' && (
                                <span className="text-xs text-red-500">
                                  Error: {result.error?.message ?? 'Unknown error'}
                                </span>
                              )}
                            </div>
                            {result.rows && result.columns && result.rows.length > 0 && (
                              <div className="overflow-x-auto rounded-lg border border-gray-100">
                                <table className="min-w-full text-xs">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      {result.columns.map((col) => (
                                        <th
                                          key={col.name}
                                          className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                        >
                                          {col.name}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {result.rows.map((row, ri) => (
                                      <tr key={ri} className="hover:bg-green-50">
                                        {result.columns!.map((col) => (
                                          <td key={col.name} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                            {String(row[col.name] ?? '—')}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {result.status === 'ok' && (!result.rows || result.rows.length === 0) && (
                              <p className="text-xs text-gray-400">No rows returned</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
