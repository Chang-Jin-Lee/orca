import { describe, expect, it } from 'vitest'
import { abbreviateOrchestrationTasks } from './orchestration-task-summary'

describe('abbreviateOrchestrationTasks', () => {
  it('collapses whitespace and caps long task specs', () => {
    const [task] = abbreviateOrchestrationTasks([
      { id: 'task_1', spec: `First line\n\n${'detail '.repeat(40)}` }
    ])

    expect(task.id).toBe('task_1')
    expect(task.spec).not.toContain('\n')
    expect(task.spec).toHaveLength(160)
    expect(task.spec.endsWith('…')).toBe(true)
    expect(task.spec_truncated).toBe(true)
  })

  it('preserves a short one-line spec', () => {
    const [task] = abbreviateOrchestrationTasks([{ spec: 'Short task' }])

    expect(task).toEqual({ spec: 'Short task', spec_truncated: false })
  })
})
