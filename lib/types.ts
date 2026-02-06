export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: string;
  extension?: string;
}

export interface FileSystemState {
  tree: Record<string, FileEntry[]>;
  currentPath: string | null;
  expandedFolders: Set<string>;
  loading: Set<string>;
  error: string | null;
}

export interface EditorState {
  content: string;
  originalContent: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  viewMode: 'edit' | 'preview' | 'split';
  filePath: string | null;
  fileName: string | null;
}

export type FileSystemAction =
  | { type: 'SET_TREE'; path: string; entries: FileEntry[] }
  | { type: 'SET_CURRENT_PATH'; path: string | null }
  | { type: 'TOGGLE_FOLDER'; path: string }
  | { type: 'EXPAND_FOLDER'; path: string }
  | { type: 'SET_LOADING'; path: string; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'REMOVE_ENTRY'; path: string; parentPath: string }
  | { type: 'ADD_ENTRY'; parentPath: string; entry: FileEntry }
  | { type: 'RENAME_ENTRY'; oldPath: string; newPath: string; newName: string; parentPath: string };

export type EditorAction =
  | { type: 'SET_CONTENT'; content: string }
  | { type: 'SET_FILE'; path: string; name: string; content: string }
  | { type: 'SET_SAVING'; isSaving: boolean }
  | { type: 'SET_SAVED'; content: string }
  | { type: 'SET_VIEW_MODE'; mode: 'edit' | 'preview' | 'split' }
  | { type: 'CLOSE_FILE' };

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
}

// --- Kanban Task Types ---

export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_name: string | null;
  assignee_id: string | null;
  due: string | null;
  notes_path: string | null;
  last_activity: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  comment_count?: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author: string;
  body: string;
  created_at: string;
}

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export type TaskAction =
  | { type: 'SET_TASKS'; tasks: Task[] }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; task: Task }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'MOVE_TASK'; id: string; status: TaskStatus };

// --- Pipeline Types ---

export type PipelineStatus = 'prospect' | 'outreach' | 'follow_up' | 'booked' | 'completed' | 'declined';
export type PipelineSource = 'inbound' | 'outbound';

export interface PodcastGuest {
  id: string;
  host_name: string;
  podcast_name: string;
  podcast_url: string | null;
  audience_estimate: string | null;
  why_fit: string | null;
  status: PipelineStatus;
  source: PipelineSource | null;
  channel: string | null;
  outreach_date: string | null;
  follow_up_count: number;
  last_contact_date: string | null;
  next_action_date: string | null;
  recording_date: string | null;
  recording_time: string | null;
  recording_platform: string | null;
  episode_url: string | null;
  air_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineState {
  guests: PodcastGuest[];
  loading: boolean;
  error: string | null;
}

export type PipelineAction =
  | { type: 'SET_GUESTS'; guests: PodcastGuest[] }
  | { type: 'ADD_GUEST'; guest: PodcastGuest }
  | { type: 'UPDATE_GUEST'; guest: PodcastGuest }
  | { type: 'DELETE_GUEST'; id: string }
  | { type: 'MOVE_GUEST'; id: string; status: PipelineStatus }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null };

// --- Workflow Types ---

export type WorkflowNodeType = 'cron' | 'skill' | 'manual' | 'external';
export type StepType = 'trigger' | 'process' | 'decision' | 'output' | 'delivery';

export interface Lane {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

export interface WorkflowNode {
  id: string;
  lane_id: string | null;
  label: string;
  schedule: string | null;
  description: string | null;
  node_type: WorkflowNodeType;
  position_x: number | null;
  position_y: number | null;
}

export interface WorkflowEdge {
  id: string;
  source_id: string;
  target_id: string;
  label: string | null;
}

export interface WorkflowStep {
  id: string;
  workflow_node_id: string;
  step_order: number;
  label: string;
  description: string | null;
  actor: string | null;
  step_type: StepType;
}

export interface WorkflowState {
  lanes: Lane[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  steps: WorkflowStep[];
  stepsByNode: Record<string, WorkflowStep[]>;
  loading: boolean;
  error: string | null;
}

export type WorkflowAction =
  | { type: 'SET_DATA'; lanes: Lane[]; nodes: WorkflowNode[]; edges: WorkflowEdge[]; steps: WorkflowStep[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null };
