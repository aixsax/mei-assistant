import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { CalendarView } from './components/CalendarView';
import { TasksView } from './components/TasksView';
import { RemindersView } from './components/RemindersView';
import { MemoryGraphView } from './components/MemoryGraphView';
import { VaultModal } from './components/VaultModal';
import { CustomizerModal } from './components/CustomizerModal';
import { ResearchModal } from './components/ResearchModal';

import { 
  Task, 
  CalendarEvent, 
  Reminder, 
  Message, 
  MemoryNode, 
  AppSettings, 
  MessageAction 
} from './types';
import { db } from './services/db';
import { cryptoEngine } from './services/crypto';
import { selfLearningEngine } from './services/selfLearning';
import { soundEngine } from './services/audio';
import { Bell, Sparkles, X } from 'lucide-react';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'chatgpt-dark',
    accent: 'emerald',
    fontSize: 'normal',
    enableSound: true,
    enableNotifications: true,
    autoWebSearch: false,
    autonomousLearning: true,
    zenMode: false,
    activeTab: 'chat',
    visibleWidgets: {
      quickSchedule: true,
      remindersBar: true,
      memoryInsights: true,
      privacyBadge: true,
    },
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [memories, setMemories] = useState<MemoryNode[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Modals
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isCustomizerModalOpen, setIsCustomizerModalOpen] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);

  // Active Reminder Alert Toast
  const [activeAlertReminder, setActiveAlertReminder] = useState<Reminder | null>(null);

  // Initialize Encrypted Database and load state
  useEffect(() => {
    async function init() {
      try {
        await cryptoEngine.autoInit();
        await db.seedIfEmpty();
        await db.purgeSimulatedDataIfPresent();

        const [loadedSettings, loadedMessages, loadedTasks, loadedEvents, loadedReminders, loadedMemories] =
          await Promise.all([
            db.getSettings(),
            db.getMessages(),
            db.getTasks(),
            db.getEvents(),
            db.getReminders(),
            db.getMemories(),
          ]);

        setSettings(loadedSettings);
        setMessages(loadedMessages);
        setTasks(loadedTasks);
        setEvents(loadedEvents);
        setReminders(loadedReminders);
        setMemories(loadedMemories);
        soundEngine.setEnabled(loadedSettings.enableSound);
      } catch (err) {
        console.error('Başlatma hatası:', err);
      } finally {
        setIsReady(true);
      }
    }

    init();
  }, []);

  // Sync theme & accent attributes to body
  useEffect(() => {
    document.body.setAttribute('data-theme', settings.theme);
    document.body.setAttribute('data-accent', settings.accent);
    document.body.setAttribute('data-density', settings.fontSize);
  }, [settings.theme, settings.accent, settings.fontSize]);

  // Request browser notification permission if enabled
  useEffect(() => {
    if (settings.enableNotifications && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings.enableNotifications]);

  // Background reminder checker (runs every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentIso = now.toISOString();

      reminders.forEach(async (rem) => {
        if (!rem.completed && !rem.notified && rem.datetime <= currentIso) {
          // Trigger reminder
          setActiveAlertReminder(rem);
          soundEngine.playReminderChime();

          if (settings.enableNotifications && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Mei Hatırlatıcı', {
              body: rem.title,
              icon: '/favicon.ico',
            });
          }

          // Mark as notified in state & db
          const updated = reminders.map((r) => (r.id === rem.id ? { ...r, notified: true } : r));
          setReminders(updated);
          await db.saveReminders(updated);
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [reminders, settings.enableNotifications]);

  // Update Settings
  const handleUpdateSettings = useCallback(async (newPartial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newPartial };
      db.saveSettings(updated);
      if (newPartial.enableSound !== undefined) {
        soundEngine.setEnabled(newPartial.enableSound);
      }
      return updated;
    });
  }, []);

  // Send message to Mei
  const handleSendMessage = async (text: string, webSearch: boolean) => {
    setIsChatLoading(true);

    const userMessageId = `msg_${Date.now()}`;
    const userMsg: Message = {
      id: userMessageId,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    await db.saveMessages(updatedMessages);

    try {
      // 1. Analyze with Autonomous Self-Learning Engine locally
      const intent = await selfLearningEngine.analyzeUserInput(text);

      // If autonomous learning is enabled and intent found new facts, record them
      if (settings.autonomousLearning && intent.learnedMemories.length > 0) {
        for (const mem of intent.learnedMemories) {
          await selfLearningEngine.reinforceMemory(mem.key, mem.value, mem.category);
        }
        const freshMemories = await db.getMemories();
        setMemories(freshMemories);
      }

      // 2. Query Server (Gemini 3.8 Flash with Google Search Grounding)
      let replyText = '';
      let groundingSources: any[] = [];
      let isWebUsed = false;

      let searchNotice: string | undefined = undefined;

      try {
        const memoryContext = await selfLearningEngine.getSanitizedMemoryContext();
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            history: messages.slice(-5),
            webSearch,
            userContext: memoryContext,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          replyText = data.text || '';
          groundingSources = data.groundingSources || [];
          isWebUsed = data.webSearchUsed || false;
          searchNotice = data.notice || undefined;
        } else {
          throw new Error('Sunucu yanıt vermedi');
        }
      } catch (cloudErr) {
        // Fallback to Autonomous Local Heuristic Brain
        replyText =
          intent.localAutonomousReply ||
          `Tüm verileriniz cihazınızda şifrelenmiştir. Çevrimdışı/otonom modda isteğinizi işledim. İlgili görev veya hatırlatıcıları aşağıdaki butonlardan takviminize işleyebilirsiniz.`;
      }

      const assistantMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        sender: 'mei',
        text: replyText,
        timestamp: Date.now(),
        webSearchUsed: isWebUsed,
        groundingSources,
        actions: intent.actions,
        notice: searchNotice,
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      await db.saveMessages(finalMessages);
      soundEngine.playMessagePing();
    } catch (err) {
      console.error('Mesaj işleme hatası:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Execute Action from Message Chips
  const handleExecuteAction = async (action: MessageAction) => {
    if (action.type === 'create_event') {
      const newEv: CalendarEvent = {
        id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ...action.payload,
        color: '#8b5cf6',
      };
      const updated = [...events, newEv];
      setEvents(updated);
      await db.saveEvents(updated);
    } else if (action.type === 'create_task') {
      const newTask: Task = {
        id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        completed: false,
        createdAt: Date.now(),
        ...action.payload,
      };
      const updated = [...tasks, newTask];
      setTasks(updated);
      await db.saveTasks(updated);
    } else if (action.type === 'create_reminder') {
      const newRem: Reminder = {
        id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        completed: false,
        ...action.payload,
      };
      const updated = [...reminders, newRem];
      setReminders(updated);
      await db.saveReminders(updated);
    } else if (action.type === 'save_memory') {
      await selfLearningEngine.reinforceMemory(action.payload.key, action.payload.value);
      const fresh = await db.getMemories();
      setMemories(fresh);
    }
  };

  // Calendar Handlers
  const handleAddEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEv: CalendarEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...eventData,
    };
    const updated = [...events, newEv];
    setEvents(updated);
    await db.saveEvents(updated);
  };

  const handleBatchAddEvents = async (newEvents: CalendarEvent[]) => {
    const updated = [...events, ...newEvents];
    setEvents(updated);
    await db.saveEvents(updated);
  };

  const handleDeleteEvent = async (id: string) => {
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    await db.saveEvents(updated);
  };

  // Task Handlers
  const handleAddTask = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      completed: false,
      createdAt: Date.now(),
      ...taskData,
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    await db.saveTasks(updated);
  };

  const handleToggleTask = async (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined } : t
    );
    setTasks(updated);
    await db.saveTasks(updated);
  };

  const handleDeleteTask = async (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    await db.saveTasks(updated);
  };

  const handleScheduleAllDueTasks = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const scheduled = await selfLearningEngine.autoScheduleDay(tasks, events, todayStr);
    if (scheduled.length > 0) {
      await handleBatchAddEvents(scheduled);
      handleUpdateSettings({ activeTab: 'calendar' });
      soundEngine.playSuccessChime();
    }
  };

  // Reminder Handlers
  const handleAddReminder = async (remData: Omit<Reminder, 'id' | 'completed'>) => {
    const newRem: Reminder = {
      id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      completed: false,
      ...remData,
    };
    const updated = [newRem, ...reminders];
    setReminders(updated);
    await db.saveReminders(updated);
  };

  const handleToggleReminder = async (id: string) => {
    const updated = reminders.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r));
    setReminders(updated);
    await db.saveReminders(updated);
    if (activeAlertReminder?.id === id) {
      setActiveAlertReminder(null);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    await db.saveReminders(updated);
    if (activeAlertReminder?.id === id) {
      setActiveAlertReminder(null);
    }
  };

  const handleSnoozeReminder = async (id: string, minutes: number) => {
    const snoozedDate = new Date(Date.now() + minutes * 60000);
    const snoozedIso = snoozedDate.toISOString();

    const updated = reminders.map((r) =>
      r.id === id ? { ...r, datetime: snoozedIso, notified: false } : r
    );
    setReminders(updated);
    await db.saveReminders(updated);
    if (activeAlertReminder?.id === id) {
      setActiveAlertReminder(null);
    }
    soundEngine.playSuccessChime();
  };

  // Memory Handlers
  const handleAddMemory = async (memData: Omit<MemoryNode, 'id' | 'learnedAt'>) => {
    await selfLearningEngine.reinforceMemory(memData.key, memData.value, memData.category);
    const fresh = await db.getMemories();
    setMemories(fresh);
  };

  const handleDeleteMemory = async (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    await db.saveMemories(updated);
  };

  const handleClearChatHistory = async () => {
    setMessages([]);
    await db.saveMessages([]);
    soundEngine.playSuccessChime();
  };

  const handleNewChat = async () => {
    handleUpdateSettings({ activeTab: 'chat' });
    const welcomeMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'mei',
      text: 'Selam! Ben **Mei** 🌸 Yeni bir sohbete başladık. Bugün aklında ne var, nasıl yardımcı olabilirim?',
      timestamp: Date.now(),
    };
    setMessages([welcomeMsg]);
    await db.saveMessages([welcomeMsg]);
    soundEngine.playSuccessChime();
  };

  // Keyboard shortcut: Cmd+K / Ctrl+K for new chat
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-serif text-lg font-bold animate-pulse">
          M
        </div>
        <p className="text-xs font-mono text-zinc-400">AES-256-GCM Kriptografik Kasa Yükleniyor...</p>
      </div>
    );
  }

  const activeRemindersCount = reminders.filter((r) => !r.completed).length;
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors selection:bg-accent/30 selection:text-foreground font-sans">
      {/* ChatGPT-style Collapsible Sidebar */}
      {!settings.zenMode && (
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          activeTab={settings.activeTab}
          onSelectTab={(tab) => handleUpdateSettings({ activeTab: tab })}
          onNewChat={handleNewChat}
          onOpenResearchModal={() => setIsResearchModalOpen(true)}
          onOpenVault={() => setIsVaultModalOpen(true)}
          onOpenCustomizer={() => setIsCustomizerModalOpen(true)}
          enableSound={settings.enableSound}
          onToggleSound={() => handleUpdateSettings({ enableSound: !settings.enableSound })}
          pendingTasksCount={pendingTasksCount}
          activeRemindersCount={activeRemindersCount}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Header
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onOpenVault={() => setIsVaultModalOpen(true)}
          onOpenCustomizer={() => setIsCustomizerModalOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Floating Active Reminder Toast */}
        {activeAlertReminder && (
          <div className="fixed top-16 right-4 z-50 max-w-sm w-full bg-surface border border-accent rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-4 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-accent text-accent-foreground shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="font-bold text-foreground">Hatırlatıcı Vakti!</div>
              <div className="text-foreground/90 mt-0.5 font-medium">{activeAlertReminder.title}</div>
              {activeAlertReminder.note && (
                <div className="text-muted text-[11px] mt-0.5">{activeAlertReminder.note}</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleToggleReminder(activeAlertReminder.id)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-semibold text-[11px] hover:bg-emerald-600 transition-colors"
                >
                  Tamamlandı
                </button>
                <button
                  onClick={() => handleSnoozeReminder(activeAlertReminder.id, 15)}
                  className="px-2.5 py-1 rounded-lg bg-surface-muted border border-border/60 text-muted hover:text-foreground text-[11px] transition-colors"
                >
                  15 dk Ertele
                </button>
              </div>
            </div>
            <button
              onClick={() => setActiveAlertReminder(null)}
              className="text-muted hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Tab Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {settings.activeTab === 'chat' && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
            onExecuteAction={handleExecuteAction}
            onClearHistory={handleClearChatHistory}
            settings={settings}
            onOpenResearchModal={() => setIsResearchModalOpen(true)}
          />
        )}

        {settings.activeTab === 'calendar' && (
          <CalendarView
            events={events}
            tasks={tasks}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
            onBatchAddEvents={handleBatchAddEvents}
          />
        )}

        {settings.activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onScheduleAllDueTasks={handleScheduleAllDueTasks}
          />
        )}

        {settings.activeTab === 'reminders' && (
          <RemindersView
            reminders={reminders}
            onAddReminder={handleAddReminder}
            onToggleReminder={handleToggleReminder}
            onDeleteReminder={handleDeleteReminder}
            onSnoozeReminder={handleSnoozeReminder}
          />
        )}

        {settings.activeTab === 'memory' && (
          <MemoryGraphView
            memories={memories}
            tasks={tasks}
            events={events}
            onAddMemory={handleAddMemory}
            onDeleteMemory={handleDeleteMemory}
          />
        )}
      </main>
      </div>

      {/* Modals */}
      <VaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        onDataReset={() => {
          setMessages([]);
          setTasks([]);
          setEvents([]);
          setReminders([]);
          setMemories([]);
        }}
      />

      <CustomizerModal
        isOpen={isCustomizerModalOpen}
        onClose={() => setIsCustomizerModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <ResearchModal
        isOpen={isResearchModalOpen}
        onClose={() => setIsResearchModalOpen(false)}
        onAddTasksFromResearch={(newTasks) => {
          newTasks.forEach((t) => handleAddTask(t));
        }}
      />
    </div>
  );
}
