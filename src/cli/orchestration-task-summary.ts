const TASK_SPEC_BRIEF_LENGTH = 160

export function abbreviateOrchestrationTasks<T extends { spec: string }>(
  tasks: readonly T[]
): (T & { spec_truncated: boolean })[] {
  return tasks.map((task) => {
    const spec = task.spec.replace(/\s+/g, ' ').trim()
    const abbreviated =
      spec.length > TASK_SPEC_BRIEF_LENGTH
        ? `${spec.slice(0, TASK_SPEC_BRIEF_LENGTH - 1).trimEnd()}…`
        : spec
    return {
      ...task,
      spec: abbreviated,
      spec_truncated: abbreviated !== task.spec
    }
  })
}
