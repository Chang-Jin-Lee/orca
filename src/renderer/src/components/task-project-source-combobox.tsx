import React, { useCallback, useMemo, useState } from 'react'
import { Check, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandInput, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import RepoBadgeLabel from '@/components/repo/RepoBadgeLabel'
import { searchRepos } from '@/lib/repo-search'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import type { Repo } from '../../../shared/types'
import type { TaskProjectPickerGroup } from './task-page-default-repo-selection'

type TaskProjectSourceStatus = {
  label: string
  title?: string
  disabled?: boolean
}

type TaskProjectSourceComboboxProps = {
  groups: TaskProjectPickerGroup[]
  selected: ReadonlySet<string>
  onChange: (next: ReadonlySet<string>) => void
  onSelectAll: () => void
  getRepoHostLabel?: (repo: Repo) => string | null | undefined
  getRepoSourceStatus?: (repo: Repo) => TaskProjectSourceStatus | null | undefined
  triggerClassName?: string
}

function selectedGroups(
  groups: readonly TaskProjectPickerGroup[],
  selected: ReadonlySet<string>
): TaskProjectPickerGroup[] {
  return groups.filter((group) => group.sources.some((source) => selected.has(source.id)))
}

function isGroupSelected(group: TaskProjectPickerGroup, selected: ReadonlySet<string>): boolean {
  return group.sources.some((source) => selected.has(source.id))
}

function getSelectedSource(group: TaskProjectPickerGroup, selected: ReadonlySet<string>): Repo {
  return group.sources.find((source) => selected.has(source.id)) ?? group.repo
}

function renderTriggerLabel(
  groups: readonly TaskProjectPickerGroup[],
  selected: ReadonlySet<string>
): React.JSX.Element {
  if (groups.length === 0) {
    return (
      <span className="text-muted-foreground">
        {translate('auto.components.task.project.source.combobox.noProjects', 'No projects')}
      </span>
    )
  }
  const selectedProjectGroups = selectedGroups(groups, selected)
  if (selectedProjectGroups.length === groups.length) {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5">
        {translate('auto.components.task.project.source.combobox.allProjects', 'All projects')}
      </span>
    )
  }
  const [first, second, ...rest] = selectedProjectGroups
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
      {first ? (
        <RepoBadgeLabel
          name={first.repo.displayName}
          color={first.repo.badgeColor}
          badgeClassName="size-1.5"
        />
      ) : null}
      {second ? <span className="text-muted-foreground">, {second.repo.displayName}</span> : null}
      {rest.length > 0 ? <span className="text-muted-foreground">+{rest.length}</span> : null}
    </span>
  )
}

function getProjectDetail(
  group: TaskProjectPickerGroup,
  selected: ReadonlySet<string>,
  getRepoHostLabel?: (repo: Repo) => string | null | undefined
): string {
  const selectedSource = getSelectedSource(group, selected)
  const hostLabel = getRepoHostLabel?.(selectedSource)?.trim()
  if (group.sources.length > 1) {
    // Why: the checked nested row already names the active source host; the
    // project row should stay a project summary, not repeat the same label.
    return translate('auto.components.task.project.source.combobox.hostCount', '{{value0}} hosts', {
      value0: String(group.sources.length)
    })
  }
  return hostLabel ? `${hostLabel} · ${selectedSource.path}` : selectedSource.path
}

function getSourceDetail(repo: Repo, status?: TaskProjectSourceStatus | null): string {
  return status?.label ? `${repo.path} · ${status.label}` : repo.path
}

export default function TaskProjectSourceCombobox({
  groups,
  selected,
  onChange,
  onSelectAll,
  getRepoHostLabel,
  getRepoSourceStatus,
  triggerClassName
}: TaskProjectSourceComboboxProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [sourceMenuProjectKey, setSourceMenuProjectKey] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [commandValue, setCommandValue] = useState('')

  const filteredGroups = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      return groups
    }
    return groups.filter((group) => searchRepos(group.sources, trimmed).length > 0)
  }, [groups, query])
  const allSelected = groups.length > 0 && selectedGroups(groups, selected).length === groups.length

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setQuery('')
      setSourceMenuProjectKey(null)
    }
  }, [])

  const toggleProject = useCallback(
    (group: TaskProjectPickerGroup) => {
      const next = new Set(selected)
      const selectedSource = group.sources.find((source) => next.has(source.id))
      if (selectedSource) {
        if (selectedGroups(groups, selected).length <= 1) {
          return
        }
        for (const source of group.sources) {
          next.delete(source.id)
        }
      } else {
        next.add(group.repo.id)
      }
      onChange(next)
    },
    [groups, onChange, selected]
  )

  const selectProjectSource = useCallback(
    (group: TaskProjectPickerGroup, source: Repo) => {
      const status = getRepoSourceStatus?.(source)
      if (status?.disabled) {
        return
      }
      const next = new Set(selected)
      for (const candidate of group.sources) {
        next.delete(candidate.id)
      }
      next.add(source.id)
      onChange(next)
      setSourceMenuProjectKey(null)
    },
    [getRepoSourceStatus, onChange, selected]
  )

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      const first = groups[0]
      if (!first) {
        return
      }
      onChange(new Set([first.repo.id]))
      return
    }
    onSelectAll()
  }, [allSelected, groups, onChange, onSelectAll])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('h-8 w-full justify-between px-3 text-xs font-normal', triggerClassName)}
        >
          {renderTriggerLabel(groups, selected)}
          <ChevronsUpDown className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(360px,calc(100vw-1rem))] min-w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command shouldFilter={false} value={commandValue} onValueChange={setCommandValue}>
          <CommandInput
            autoFocus
            placeholder={translate(
              'auto.components.task.project.source.combobox.searchProjects',
              'Search projects...'
            )}
            value={query}
            onValueChange={setQuery}
            className="text-xs"
          />
          <div className="border-b border-border">
            <button
              type="button"
              onClick={handleSelectAll}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setCommandValue('')}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                allSelected && 'opacity-80'
              )}
            >
              <Check
                className={cn(
                  'size-3 text-muted-foreground',
                  allSelected ? 'opacity-70' : 'opacity-0'
                )}
              />
              <span>
                {translate(
                  'auto.components.task.project.source.combobox.allProjects',
                  'All projects'
                )}
              </span>
            </button>
          </div>
          <CommandList>
            {filteredGroups.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                {translate(
                  'auto.components.task.project.source.combobox.noMatches',
                  'No projects match your search.'
                )}
              </div>
            ) : null}
            {filteredGroups.map((group) => {
              const selectedProject = isGroupSelected(group, selected)
              const selectedSource = getSelectedSource(group, selected)
              const detail = getProjectDetail(group, selected, getRepoHostLabel)
              return (
                <div
                  key={group.projectKey}
                  onMouseEnter={() => setCommandValue(group.repo.id)}
                  className={cn(
                    'group/source-row flex items-stretch transition-colors hover:bg-accent hover:text-accent-foreground',
                    commandValue === group.repo.id && 'bg-accent text-accent-foreground'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleProject(group)}
                    onMouseDown={(event) => event.preventDefault()}
                    className="flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 text-left text-xs"
                  >
                    <Check
                      className={cn(
                        'size-3 text-muted-foreground',
                        selectedProject ? 'opacity-70' : 'opacity-0'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <RepoBadgeLabel
                          name={group.repo.displayName}
                          color={group.repo.badgeColor}
                          className="max-w-full"
                        />
                      </span>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{detail}</p>
                    </div>
                  </button>
                  {group.sources.length > 1 ? (
                    <Popover
                      open={sourceMenuProjectKey === group.projectKey}
                      onOpenChange={(nextOpen) =>
                        setSourceMenuProjectKey(nextOpen ? group.projectKey : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          title={translate(
                            'auto.components.task.project.source.combobox.chooseSource',
                            'Choose task source'
                          )}
                          onMouseDown={(event) => event.preventDefault()}
                          className="flex w-8 shrink-0 items-center justify-center text-muted-foreground opacity-0 transition-opacity group-hover/source-row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                        >
                          <ChevronRight className="size-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="right"
                        align="start"
                        sideOffset={6}
                        className="w-[min(300px,calc(100vw-1rem))] p-1"
                      >
                        <div className="border-b border-border px-2 py-1.5">
                          <div className="truncate text-xs font-medium text-foreground">
                            {group.repo.displayName}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {translate(
                              'auto.components.task.project.source.combobox.taskSource',
                              'Task source'
                            )}
                          </div>
                        </div>
                        <div className="py-1">
                          {group.sources.map((source) => {
                            const status = getRepoSourceStatus?.(source)
                            const sourceSelected = source.id === selectedSource.id
                            const sourceDetail = getSourceDetail(source, status)
                            return (
                              <button
                                key={source.id}
                                type="button"
                                disabled={status?.disabled}
                                title={status?.title}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => selectProjectSource(group, source)}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground',
                                  status?.disabled && 'cursor-not-allowed opacity-50'
                                )}
                              >
                                <Check
                                  className={cn(
                                    'size-3 text-muted-foreground',
                                    sourceSelected ? 'opacity-70' : 'opacity-0'
                                  )}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs">
                                    {getRepoHostLabel?.(source) ?? source.displayName}
                                  </div>
                                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                    {sourceDetail}
                                  </p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : null}
                </div>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
