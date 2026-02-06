'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Task, TaskState, TaskAction, TaskStatus, TaskPriority } from '@/lib/types';
import * as api from '@/lib/task-client';

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.tasks, loading: false };
    case 'ADD_TASK':
      return { ...state, tasks: [action.task, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => (t.id === action.task.id ? action.task : t)),
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) };
    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id ? { ...t, status: action.status } : t
        ),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}

interface TaskContextType {
  state: TaskState;
  loadTasks: () => Promise<void>;
  addTask: (task: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_name?: string;
    due?: string;
  }) => Promise<Task>;
  editTask: (id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>) => Promise<Task>;
  removeTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const loadTasks = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const tasks = await api.listTasks();
      dispatch({ type: 'SET_TASKS', tasks });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to load tasks' });
    }
  }, []);

  const addTask = useCallback(async (task: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_name?: string;
    due?: string;
  }) => {
    const created = await api.createTask(task);
    dispatch({ type: 'ADD_TASK', task: created });
    return created;
  }, []);

  const editTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>) => {
    const updated = await api.updateTask(id, updates);
    dispatch({ type: 'UPDATE_TASK', task: updated });
    return updated;
  }, []);

  const removeTask = useCallback(async (id: string) => {
    await api.deleteTask(id);
    dispatch({ type: 'DELETE_TASK', id });
  }, []);

  const moveTask = useCallback(async (id: string, status: TaskStatus) => {
    // Optimistic update
    dispatch({ type: 'MOVE_TASK', id, status });
    try {
      const updated = await api.updateTask(id, { status });
      dispatch({ type: 'UPDATE_TASK', task: updated });
    } catch {
      // Revert on failure — reload all
      loadTasks();
    }
  }, [loadTasks]);

  // Load on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <TaskContext.Provider value={{ state, loadTasks, addTask, editTask, removeTask, moveTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTask must be used within TaskProvider');
  return context;
}
