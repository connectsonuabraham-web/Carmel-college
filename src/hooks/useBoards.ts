import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchBoards, fetchBoard, runBoardTab } from '../api/boards'

export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: fetchBoards,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBoard(boardId: string | null) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: () => fetchBoard(boardId!),
    enabled: !!boardId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRunTab() {
  return useMutation({
    mutationFn: ({ boardId, tabId, filterValues }: { boardId: string; tabId: string; filterValues?: Record<string, string> }) =>
      runBoardTab(boardId, tabId, filterValues ?? {}),
  })
}
