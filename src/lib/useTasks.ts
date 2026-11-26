import { useCallback, useEffect, useState } from 'react'
import { decomposeTask, fakeResult, newId } from './taskEngine'
import type { Pipeline, StepStatus, Task } from './types'

const STORAGE_KEY = 'ai-factory-tasks-v1'

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as Task[]) : []
  } catch {
    return []
  }
}

/** Local prototype store: persisted tasks with a simulated step runner. */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) } catch { /* quota */ }
  }, [tasks])

  const addTask = useCallback((title: string): string => {
    const id = newId()
    const task: Task = {
      id,
      title,
      createdAt: Date.now(),
      status: 'draft',
      steps: decomposeTask(title),
    }
    setTasks((prev) => [task, ...prev])
    return id
  }, [])

  const removeTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }, [])

  const setStepStatus = useCallback((taskId: string, stepId: string, status: StepStatus) => {
    setTasks((prev) => prev.map((task) => task.id === taskId
      ? { ...task, steps: task.steps.map((step) =>
          step.id === stepId ? { ...step, status } : step) }
      : task))
  }, [])

  const completeStep = useCallback((taskId: string, stepId: string) => {
    setTasks((prev) => prev.map((task) => task.id === taskId
      ? {
          ...task,
          steps: task.steps.map((step) => step.id === stepId
            ? { ...step, status: 'done', result: fakeResult(step) }
            : step),
        }
      : task))
  }, [])

  const finishTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.map((task) =>
      task.id === taskId ? { ...task, status: 'review' } : task))
  }, [])

  // One effect drives every running task: start the next step, finish it, then
  // hand the task to review. Cleanup prevents duplicate timers in StrictMode.
  useEffect(() => {
    const cleanups: (() => void)[] = []
    const later = (fn: () => void, ms: number) => {
      const timer = window.setTimeout(fn, ms)
      cleanups.push(() => window.clearTimeout(timer))
    }
    for (const task of tasks) {
      if (task.status !== 'running') continue
      const active = task.steps.find((step) => step.status === 'running')
      if (active) { later(() => completeStep(task.id, active.id), 900); continue }
      const next = task.steps.find((step) =>
        step.status === 'pending' || step.status === 'failed')
      if (next) { later(() => setStepStatus(task.id, next.id, 'running'), 350); continue }
      later(() => finishTask(task.id), 250)
    }
    return () => cleanups.forEach((fn) => fn())
  }, [tasks, completeStep, setStepStatus, finishTask])

  const startTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.map((task) => task.id === taskId
      ? {
          ...task,
          status: 'running',
          steps: task.steps.map((step) => ({
            ...step, status: 'pending', approved: false, result: '',
          })),
        }
      : task))
  }, [])

  const approveStep = useCallback((taskId: string, stepId: string) => {
    setTasks((prev) => prev.map((task) => {
      if (task.id !== taskId) return task
      const steps = task.steps.map((step) =>
        step.id === stepId ? { ...step, approved: true } : step)
      const done = steps.every((step) => step.status === 'done' && step.approved)
      return { ...task, steps, status: done ? 'done' : task.status }
    }))
  }, [])

  const rejectStep = useCallback((taskId: string, stepId: string) => {
    setTasks((prev) => prev.map((task) => task.id === taskId
      ? {
          ...task,
          status: 'review',
          steps: task.steps.map((step) => step.id === stepId
            ? { ...step, status: 'failed', approved: false, result: '' }
            : step),
        }
      : task))
  }, [])

  const regenerateStep = useCallback((taskId: string, stepId: string) => {
    setTasks((prev) => prev.map((task) => task.id === taskId
      ? {
          ...task,
          status: 'running',
          steps: task.steps.map((step) => step.id === stepId
            ? { ...step, status: 'pending', approved: false, result: '' }
            : step),
        }
      : task))
  }, [])

  const setPipeline = useCallback((taskId: string, stepId: string, pipeline: Pipeline) => {
    setTasks((prev) => prev.map((task) => task.id === taskId
      ? {
          ...task,
          steps: task.steps.map((step) =>
            step.id === stepId ? { ...step, pipeline } : step),
        }
      : task))
  }, [])

  return {
    tasks, addTask, removeTask, startTask, approveStep, rejectStep,
    regenerateStep, setPipeline,
  }
}
