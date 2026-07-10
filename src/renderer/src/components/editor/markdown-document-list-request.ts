import type { MarkdownDocument } from '../../../../shared/types'
import {
  listRuntimeMarkdownDocuments,
  type RuntimeFileOperationArgs
} from '@/runtime/runtime-file-client'

type MarkdownDocumentListLoader = (
  context: RuntimeFileOperationArgs,
  rootPath: string
) => Promise<MarkdownDocument[]>

const inFlightMarkdownDocumentLists = new Map<string, Promise<MarkdownDocument[]>>()

export function getMarkdownDocumentListRequestKey(
  context: RuntimeFileOperationArgs,
  rootPath: string
): string {
  return JSON.stringify([
    context.settings?.activeRuntimeEnvironmentId?.trim() ?? '',
    context.connectionId ?? '',
    context.worktreeId ?? '',
    context.worktreePath ?? '',
    rootPath
  ])
}

export function requestSharedMarkdownDocumentList(
  context: RuntimeFileOperationArgs,
  rootPath: string,
  load: MarkdownDocumentListLoader = listRuntimeMarkdownDocuments
): Promise<MarkdownDocument[]> {
  const key = getMarkdownDocumentListRequestKey(context, rootPath)
  const existing = inFlightMarkdownDocumentLists.get(key)
  if (existing) {
    return existing
  }

  // Why: split Markdown panes mount together and otherwise launch identical
  // whole-worktree local/SSH scans; share only concurrent work so freshness is unchanged.
  const request = load(context, rootPath).finally(() => {
    if (inFlightMarkdownDocumentLists.get(key) === request) {
      inFlightMarkdownDocumentLists.delete(key)
    }
  })
  inFlightMarkdownDocumentLists.set(key, request)
  return request
}
