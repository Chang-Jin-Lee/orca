import { useCallback } from 'react'
import type React from 'react'
import { Copy, FileJson, FolderOpen, LocateFixed, PanelTopOpen, Play } from 'lucide-react'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
import {
  AI_VAULT_SESSION_DRAG_END_EVENT,
  AI_VAULT_SESSION_DRAG_START_EVENT,
  writeAiVaultSessionDragData
} from '@/lib/ai-vault-session-drag'
import type { AiVaultScope, AiVaultSession } from '../../../../shared/ai-vault-types'
import type { AiVaultResumeStartup } from '@/lib/ai-vault-resume-command'
import { translate } from '@/i18n/i18n'
import { SessionInlineDetails } from './AiVaultSessionDetails'
import { latestSessionConversationTurn } from './ai-vault-session-display'
import { SessionRowTrailingActions } from './SessionRowTrailingActions'
import type { AiVaultSessionResumeActions } from './ai-vault-session-resume'
import {
  shouldShowAiVaultSessionWorktreeLine,
  type AiVaultSessionWorktreeInfo
} from './ai-vault-session-worktree'
import {
  conversationRoleLabel,
  getSessionDetailsId,
  SessionMetadata,
  SessionWorktreeLine
} from './ai-vault-session-row-display'

export function VaultSessionRow({
  session,
  resumeStartup,
  worktreeInfo,
  vaultScope,
  detailsExpanded,
  resumeDisabled,
  onToggleDetails,
  onJumpToOriginalPane,
  showJumpToWorktree,
  onJumpToWorktree,
  onResume,
  resumeLabel,
  resumeActions,
  onResumeInWorktree,
  onResumeInNewTab,
  onCopyResume,
  onCopyId,
  onCopyPath,
  onOpenLog,
  onRevealLog,
  onOpenCwd
}: {
  session: AiVaultSession
  resumeStartup: AiVaultResumeStartup
  worktreeInfo: AiVaultSessionWorktreeInfo | null
  vaultScope: AiVaultScope
  detailsExpanded: boolean
  resumeDisabled: boolean
  onToggleDetails: () => void
  onJumpToOriginalPane?: () => void
  showJumpToWorktree: boolean
  onJumpToWorktree?: () => void
  onResume: () => void
  resumeLabel: string
  resumeActions: AiVaultSessionResumeActions
  onResumeInWorktree: () => void
  onResumeInNewTab: () => void
  onCopyResume: () => void
  onCopyId: () => void
  onCopyPath: () => void
  onOpenLog: () => void
  onRevealLog: () => void
  onOpenCwd?: () => void
}) {
  const updatedAt = session.updatedAt ?? session.modifiedAt
  const detailsId = getSessionDetailsId(session.id)
  const latestTurn = latestSessionConversationTurn(session)
  const detailsTooltip = detailsExpanded
    ? translate('auto.components.right.sidebar.AiVaultSessionRow.hideDetails', 'Hide Details')
    : translate('auto.components.right.sidebar.AiVaultSessionRow.showDetails', 'Show Details')
  const startResumeDrag = useCallback(
    (event: React.DragEvent<HTMLElement>): void => {
      event.stopPropagation()
      const target = event.target
      if (target instanceof Element && target.closest('[data-ai-vault-session-actions]')) {
        event.preventDefault()
        return
      }
      if (resumeDisabled) {
        event.preventDefault()
        return
      }
      writeAiVaultSessionDragData(event.dataTransfer, {
        agent: session.agent,
        sessionId: session.sessionId,
        title: session.title,
        command: resumeStartup.command,
        sessionFilePath: session.filePath,
        ...(resumeStartup.env ? { env: resumeStartup.env } : {}),
        ...(resumeStartup.launchConfig ? { launchConfig: resumeStartup.launchConfig } : {})
      })
      window.dispatchEvent(new Event(AI_VAULT_SESSION_DRAG_START_EVENT))
    },
    [resumeDisabled, session, resumeStartup]
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild className="block w-full min-w-0">
        <div
          className={cn(
            'group/session-row flex w-full min-w-0 flex-col border-b border-sidebar-border px-3 py-2 text-left transition-colors hover:bg-sidebar-accent/55',
            resumeDisabled ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
            !detailsExpanded && 'min-h-[98px]'
          )}
          // Why: users naturally drag the session row itself; matching that
          // gesture avoids hidden affordances and text-selection false starts.
          draggable={!resumeDisabled}
          onClick={() => {
            onToggleDetails()
          }}
          onDragStart={startResumeDrag}
          onDragEnd={() => {
            window.dispatchEvent(new Event(AI_VAULT_SESSION_DRAG_END_EVENT))
          }}
        >
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-1">
            <div
              className={cn(
                'min-w-0 text-[13px] font-medium leading-5 text-foreground',
                detailsExpanded ? 'line-clamp-2 [overflow-wrap:anywhere]' : 'line-clamp-1'
              )}
            >
              {session.title}
            </div>
            <SessionRowTrailingActions
              session={session}
              detailsExpanded={detailsExpanded}
              detailsId={detailsId}
              detailsTooltip={detailsTooltip}
              resumeDisabled={resumeDisabled}
              resumeLabel={resumeLabel}
              worktreeInfo={worktreeInfo}
              onToggleDetails={onToggleDetails}
              onJumpToOriginalPane={onJumpToOriginalPane}
              showJumpToWorktree={showJumpToWorktree}
              onJumpToWorktree={onJumpToWorktree}
              onResume={onResume}
              onCopyResume={onCopyResume}
              onCopyId={onCopyId}
              onCopyPath={onCopyPath}
              onOpenLog={onOpenLog}
              onRevealLog={onRevealLog}
              onOpenCwd={onOpenCwd}
            />
          </div>
          {detailsExpanded && shouldShowAiVaultSessionWorktreeLine(worktreeInfo, { vaultScope }) ? (
            <div className="mt-1">
              <SessionWorktreeLine worktreeInfo={worktreeInfo} vaultScope={vaultScope} />
            </div>
          ) : null}
          {!detailsExpanded ? (
            <>
              <div className="mt-0.5 min-w-0 line-clamp-2 text-[12px] leading-4 text-muted-foreground">
                {latestTurn ? (
                  <>
                    <span className="font-medium text-foreground/80">
                      {conversationRoleLabel(latestTurn.role)}
                    </span>
                    <span>: {latestTurn.text}</span>
                  </>
                ) : (
                  translate(
                    'auto.components.right.sidebar.AiVaultSessionRow.noPreviewAvailable',
                    'No conversation preview available'
                  )
                )}
              </div>
              <SessionMetadata
                session={session}
                updatedAt={updatedAt}
                worktreeInfo={worktreeInfo}
                vaultScope={vaultScope}
              />
            </>
          ) : null}
          {detailsExpanded ? (
            <SessionInlineDetails
              id={detailsId}
              session={session}
              worktreeInfo={worktreeInfo}
              vaultScope={vaultScope}
              resumeActions={resumeActions}
              onResumeInWorktree={onResumeInWorktree}
              onResumeInNewTab={onResumeInNewTab}
              onOpenLog={onOpenLog}
            />
          ) : null}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <SessionActionMenuItems
          menuKind="context"
          resumeDisabled={resumeDisabled}
          resumeLabel={resumeLabel}
          onJumpToOriginalPane={onJumpToOriginalPane}
          showJumpToWorktree={showJumpToWorktree}
          onJumpToWorktree={onJumpToWorktree}
          onResume={onResume}
          onCopyResume={onCopyResume}
          onCopyId={onCopyId}
          onCopyPath={onCopyPath}
          onOpenLog={onOpenLog}
          onRevealLog={onRevealLog}
          onOpenCwd={onOpenCwd}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}

export function SessionActionMenuItems({
  menuKind = 'dropdown',
  resumeDisabled,
  resumeLabel,
  onResume,
  onJumpToOriginalPane,
  showJumpToWorktree,
  onJumpToWorktree,
  onCopyResume,
  onCopyId,
  onCopyPath,
  onOpenLog,
  onRevealLog,
  onOpenCwd
}: {
  menuKind?: 'dropdown' | 'context'
  resumeDisabled: boolean
  resumeLabel: string
  onResume: () => void
  onJumpToOriginalPane?: () => void
  showJumpToWorktree: boolean
  onJumpToWorktree?: () => void
  onCopyResume: () => void
  onCopyId: () => void
  onCopyPath: () => void
  onOpenLog: () => void
  onRevealLog: () => void
  onOpenCwd?: () => void
}) {
  const Item = menuKind === 'context' ? ContextMenuItem : DropdownMenuItem
  const Separator = menuKind === 'context' ? ContextMenuSeparator : DropdownMenuSeparator

  return (
    <>
      {onJumpToOriginalPane ? (
        <Item onSelect={onJumpToOriginalPane}>
          <LocateFixed className="size-3.5" />
          {translate(
            'auto.components.right.sidebar.AiVaultSessionRow.jumpToOriginalPane',
            'Jump to Original Pane'
          )}
        </Item>
      ) : null}
      {showJumpToWorktree ? (
        <Item disabled={!onJumpToWorktree} onSelect={onJumpToWorktree}>
          <PanelTopOpen className="size-3.5" />
          {translate(
            'auto.components.right.sidebar.AiVaultSessionRow.jumpToWorktree',
            'Jump to Worktree'
          )}
        </Item>
      ) : null}
      <Item disabled={resumeDisabled} onSelect={onResume}>
        <Play className="size-3.5" />
        {resumeLabel}
      </Item>
      <Item onSelect={onCopyResume}>
        <Copy className="size-3.5" />
        {translate(
          'auto.components.right.sidebar.AiVaultSessionRow.copyResumeCommand',
          'Copy Resume Command'
        )}
      </Item>
      <Separator />
      <Item onSelect={onOpenLog}>
        <FileJson className="size-3.5" />
        {translate('auto.components.right.sidebar.AiVaultSessionRow.openLog', 'Open Log')}
      </Item>
      <Item onSelect={onRevealLog}>
        <FolderOpen className="size-3.5" />
        {translate('auto.components.right.sidebar.AiVaultSessionRow.revealLog', 'Reveal Log')}
      </Item>
      {onOpenCwd ? (
        <Item onSelect={onOpenCwd}>
          <FolderOpen className="size-3.5" />
          {translate(
            'auto.components.right.sidebar.AiVaultSessionRow.openWorkingDirectory',
            'Open Working Directory'
          )}
        </Item>
      ) : null}
      <Separator />
      <Item onSelect={onCopyId}>
        {translate(
          'auto.components.right.sidebar.AiVaultSessionRow.copySessionId',
          'Copy Session ID'
        )}
      </Item>
      <Item onSelect={onCopyPath}>
        {translate('auto.components.right.sidebar.AiVaultSessionRow.copyLogPath', 'Copy Log Path')}
      </Item>
    </>
  )
}
