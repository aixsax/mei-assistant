export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: Priority;
  category: 'work' | 'personal' | 'health' | 'learning' | 'other';
  estimatedMinutes?: number;
  createdAt: number;
  completedAt?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  category: 'work' | 'personal' | 'health' | 'learning' | 'other';
  color?: string;
  location?: string;
  reminderMinutesBefore?: number;
  isAllDay?: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  note?: string;
  datetime: string; // ISO string or YYYY-MM-DDTHH:mm
  priority: Priority;
  completed: boolean;
  snoozedUntil?: string;
  notified?: boolean;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface MessageAction {
  type: 'create_event' | 'create_task' | 'create_reminder' | 'save_memory';
  label: string;
  payload: any;
}

export interface Message {
  id: string;
  sender: 'user' | 'mei';
  text: string;
  timestamp: number;
  webSearchUsed?: boolean;
  groundingSources?: GroundingChunk[];
  actions?: MessageAction[];
  isLocalAutonomous?: boolean;
  notice?: string;
}

export interface MemoryNode {
  id: string;
  category: 'preference' | 'habit' | 'personal_fact' | 'schedule_pattern' | 'instruction';
  key: string;
  value: string;
  confidence: number; // 0 to 1
  learnedAt: number;
  source: 'autonomous' | 'user_taught';
  timesReinforced: number;
}

export interface UserHabitStats {
  productiveHours: string[]; // e.g. ["09:00 - 12:00", "14:00 - 16:00"]
  averageTaskCompletionRate: number; // percentage
  mostActiveDay: string;
  focusSessionDuration: number; // minutes
}

export type ThemeId = 'chatgpt-dark' | 'chatgpt-light' | 'oled' | 'snow' | 'slate' | 'paper' | 'midnight';
export type AccentColor = 'violet' | 'emerald' | 'sky' | 'rose' | 'amber' | 'silver';

export interface AppSettings {
  theme: ThemeId;
  accent: AccentColor;
  fontSize: 'compact' | 'normal' | 'relaxed';
  enableSound: boolean;
  enableNotifications: boolean;
  autoWebSearch: boolean;
  autonomousLearning: boolean;
  zenMode: boolean;
  activeTab: 'chat' | 'calendar' | 'tasks' | 'reminders' | 'memory';
  visibleWidgets: {
    quickSchedule: boolean;
    remindersBar: boolean;
    memoryInsights: boolean;
    privacyBadge: boolean;
  };
}
