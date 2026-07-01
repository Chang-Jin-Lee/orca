import type { LinearIssue } from '../../../shared/types'
import type { LinkedWorkItemSummary } from '@/lib/new-workspace'
import { getLinearOrganizationUrlKeyFromIssueUrl } from '../../../shared/linear-links'
import { buildLinearIssueContextSnapshot } from '@/lib/linear-issue-context-snapshot'

export function isLinearLinkedWorkItem(
  item: Pick<LinkedWorkItemSummary, 'provider' | 'linearIdentifier'> | null | undefined
): boolean {
  return item?.provider === 'linear' || Boolean(item?.linearIdentifier?.trim())
}

export function buildLinearIssueLinkedWorkItem(issue: LinearIssue): LinkedWorkItemSummary {
  const organizationUrlKey = getLinearOrganizationUrlKeyFromIssueUrl(issue.url)
  return {
    type: 'issue',
    provider: 'linear',
    // Why: Linear issue prose must not enter prompt metadata; keep only the
    // string identifier/link and leave numeric issue metadata empty.
    number: 0,
    title: issue.title,
    url: issue.url,
    linearIdentifier: issue.identifier,
    // Why: launch drafts need source context, but persisted linked-task
    // adapters keep storing only stable Linear identity fields.
    linkedContext: {
      provider: 'linear',
      version: 1,
      renderedText: buildLinearIssueContextSnapshot(issue)
    },
    ...(issue.workspaceId ? { linearWorkspaceId: issue.workspaceId } : {}),
    ...(organizationUrlKey
      ? {
          linearOrganizationUrlKey: organizationUrlKey
        }
      : {})
  }
}
