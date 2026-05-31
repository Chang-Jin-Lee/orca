import type React from 'react'
import { Braces } from 'lucide-react'
import {
  SOURCE_CONTROL_ACTION_VARIABLE_INFO,
  SOURCE_CONTROL_ACTION_VARIABLES,
  type SourceControlActionId
} from '../../../../shared/source-control-ai-actions'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

type SourceControlActionVariableChipsProps = {
  actionId: SourceControlActionId
  disabled?: boolean
  onInsert: (variable: string) => void
}

export function SourceControlActionVariableChips({
  actionId,
  disabled = false,
  onInsert
}: SourceControlActionVariableChipsProps): React.JSX.Element {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Braces className="size-3" />
          Variables
        </span>
        {SOURCE_CONTROL_ACTION_VARIABLES[actionId].map((variable) => {
          const info = SOURCE_CONTROL_ACTION_VARIABLE_INFO[variable]
          return (
            <Tooltip key={variable}>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={disabled}
                    className="h-5 rounded px-1.5 font-mono text-[10px]"
                    onClick={() => onInsert(variable)}
                  >
                    {`{${variable}}`}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6} className="max-w-80 text-left">
                <div className="space-y-1">
                  <div className="font-mono text-[11px]">{`{${variable}}`}</div>
                  <div>{info.description}</div>
                  <div className="font-mono text-[11px] opacity-80 whitespace-pre-wrap">
                    {info.example}
                  </div>
                  <div className="text-[11px] opacity-70">Click to insert this variable.</div>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
