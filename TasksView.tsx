import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Task, Priority } from '../types';
import { soundEngine } from '../services/audio';

interface TasksViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onScheduleAllDueTasks: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onScheduleAllDueTasks,
}) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'completed'>('today');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');
  const [quickMinutes, setQuickMinutes] = useState(30);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    onAddTask({
      title: quickTitle.trim(),
      dueDate: todayStr,
      priority: quickPriority,
      category: 'work',
      estimatedMinutes: quickMinutes,
    });

    setQuickTitle('');
    soundEngine.playSuccessChime();
  };

  const handleToggle = (id: string) => {
    onToggleTask(id);
    soundEngine.playSuccessChime();
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'today' && t.dueDate !== todayStr) return false;
    if (filter === 'pending' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Top Banner / Progress & AI Planner */}
      <div className="bg-surface p-4 rounded-2xl border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Günlük Görev & Hedef Havuzu</h2>
          <div className="text-xs text-muted flex items-center gap-2 mt-1">
            <span>{tasks.length} Görev</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">{completedCount} Tamamlandı</span>
            <span>•</span>
            <span>%{progressPercent} İlerleme</span>
          </div>

          {/* Progress Bar */}
          <div className="w-48 sm:w-64 h-1.5 rounded-full bg-surface-muted overflow-hidden mt-2">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          onClick={onScheduleAllDueTasks}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-xs shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Görevleri Takvime Yerleştir</span>
        </button>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="bg-surface p-2.5 rounded-2xl border border-border/50 flex flex-wrap items-center gap-2"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Yeni görev ekleyin... (Örn: Raporu hazırla, Sunumu incele)"
          className="flex-1 min-w-[200px] bg-transparent text-xs text-foreground placeholder:text-muted/60 px-2 py-1.5 focus:outline-none"
        />

        <div className="flex items-center gap-1.5">
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as Priority)}
            className="bg-surface-muted text-[11px] text-foreground border border-border/60 rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="low">Düşük</option>
            <option value="medium">Normal</option>
            <option value="high">Yüksek</option>
            <option value="urgent">Acil</option>
          </select>

          <select
            value={quickMinutes}
            onChange={(e) => setQuickMinutes(Number(e.target.value))}
            className="bg-surface-muted text-[11px] text-foreground border border-border/60 rounded-lg px-2 py-1.5 focus:outline-none font-mono"
          >
            <option value={15}>15 dk</option>
            <option value={30}>30 dk</option>
            <option value={45}>45 dk</option>
            <option value={60}>60 dk</option>
            <option value={90}>90 dk</option>
          </select>

          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ekle</span>
          </button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-xl border border-border/40">
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1 rounded-lg transition-all ${filter === 'today' ? 'bg-surface font-semibold text-foreground shadow-xs' : 'text-muted'}`}
          >
            Bugün
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-lg transition-all ${filter === 'pending' ? 'bg-surface font-semibold text-foreground shadow-xs' : 'text-muted'}`}
          >
            Bekleyenler
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-lg transition-all ${filter === 'completed' ? 'bg-surface font-semibold text-foreground shadow-xs' : 'text-muted'}`}
          >
            Tamamlanan
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all ${filter === 'all' ? 'bg-surface font-semibold text-foreground shadow-xs' : 'text-muted'}`}
          >
            Tümü
          </button>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-surface text-[11px] text-muted border border-border/50 rounded-lg px-2.5 py-1 focus:outline-none"
        >
          <option value="all">Tüm Kategoriler</option>
          <option value="work">İş</option>
          <option value="personal">Kişisel</option>
          <option value="health">Sağlık</option>
          <option value="learning">Öğrenme</option>
        </select>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border/40 p-8 text-center text-muted text-xs">
            Bu görünümde görev bulunmuyor. Yeni bir görev ekleyerek başlayabilirsiniz.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                task.completed
                  ? 'bg-surface/50 border-border/30 opacity-60'
                  : 'bg-surface border-border/60 hover:border-border'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => handleToggle(task.id)}
                  className="text-muted hover:text-accent transition-colors shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Square className="w-5 h-5 opacity-40 hover:opacity-100" />
                  )}
                </button>

                <div className="min-w-0">
                  <div
                    className={`text-xs font-medium text-foreground truncate ${
                      task.completed ? 'line-through text-muted' : ''
                    }`}
                  >
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
                    {task.dueDate && (
                      <span className="flex items-center gap-1 font-mono">
                        <CalendarIcon className="w-3 h-3 opacity-60" />
                        {task.dueDate} {task.dueTime || ''}
                      </span>
                    )}
                    {task.estimatedMinutes && (
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 opacity-60" />
                        {task.estimatedMinutes} dk
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.2 rounded-md font-medium text-[9px] uppercase ${
                        task.priority === 'urgent'
                          ? 'bg-rose-500/15 text-rose-400'
                          : task.priority === 'high'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-surface-muted text-muted'
                      }`}
                    >
                      {task.priority === 'urgent' ? 'Acil' : task.priority === 'high' ? 'Yüksek' : 'Normal'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-rose-400 transition-all rounded-lg"
                title="Görevi Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
