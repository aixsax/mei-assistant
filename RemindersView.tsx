import React, { useState } from 'react';
import { 
  Bell, 
  BellRing, 
  Clock, 
  Plus, 
  Trash2, 
  Check, 
  RotateCcw, 
  AlertTriangle,
  Volume2
} from 'lucide-react';
import { Reminder, Priority } from '../types';
import { soundEngine } from '../services/audio';

interface RemindersViewProps {
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'completed'>) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onSnoozeReminder: (id: string, minutes: number) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onSnoozeReminder,
}) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('15:00');
  const [priority, setPriority] = useState<Priority>('medium');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddReminder({
      title: title.trim(),
      note: note.trim() || undefined,
      datetime: `${date}T${time}`,
      priority,
    });

    setTitle('');
    setNote('');
    setIsFormOpen(false);
    soundEngine.playSuccessChime();
  };

  const handleTestChime = () => {
    soundEngine.playReminderChime();
  };

  const activeReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Top Banner */}
      <div className="bg-surface p-4 rounded-2xl border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Akıllı Hatırlatıcılar & Alarmlar</h2>
            <p className="text-xs text-muted">
              {activeReminders.length} Aktif Hatırlatıcı • Cihaz bildirimleri ve kristal ses uyarıları
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestChime}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-surface border border-border/50 text-xs text-muted hover:text-foreground transition-all"
            title="Ses Testi"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Ses Testi</span>
          </button>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Hatırlatıcı Kur</span>
          </button>
        </div>
      </div>

      {/* Add Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-surface p-4 rounded-2xl border border-border/70 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground">Yeni Hatırlatıcı Ayarla</h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-muted text-xs hover:text-foreground"
            >
              Vazgeç
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-muted mb-1 font-medium">Hatırlatılacak Konu</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Saat 16:30'da doktor randevusunu ara"
                className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-muted mb-1 font-medium">Tarih</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-muted mb-1 font-medium">Saat</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-muted mb-1 font-medium">Öncelik Derecesi</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
              >
                <option value="low">Düşük (Sakin)</option>
                <option value="medium">Normal</option>
                <option value="high">Yüksek (Önemli)</option>
                <option value="urgent">Acil</option>
              </select>
            </div>

            <div>
              <label className="block text-muted mb-1 font-medium">İsteğe Bağlı Not</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ek detaylar..."
                className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
            >
              Hatırlatıcıyı Kaydet
            </button>
          </div>
        </form>
      )}

      {/* Active List */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider px-1">
          Aktif Hatırlatıcılar ({activeReminders.length})
        </h3>

        {activeReminders.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border/40 p-6 text-center text-muted text-xs">
            Bekleyen aktif hatırlatıcı yok. Harika gidiyorsun!
          </div>
        ) : (
          activeReminders.map((rem) => {
            const remDate = new Date(rem.datetime);
            const dateStr = remDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
            const timeStr = remDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={rem.id}
                className="bg-surface border border-border/60 hover:border-border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleReminder(rem.id)}
                    className="mt-0.5 w-5 h-5 rounded-md border border-border/70 hover:border-accent flex items-center justify-center text-transparent hover:text-accent transition-all shrink-0"
                    title="Tamamlandı olarak işaretle"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <span>{rem.title}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-md uppercase font-semibold ${
                          rem.priority === 'urgent'
                            ? 'bg-rose-500/15 text-rose-400'
                            : rem.priority === 'high'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-surface-muted text-muted'
                        }`}
                      >
                        {rem.priority}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted flex items-center gap-2 mt-1">
                      <span className="font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-60" />
                        {dateStr} • {timeStr}
                      </span>
                      {rem.note && <span>— {rem.note}</span>}
                    </div>
                  </div>
                </div>

                {/* Snooze & Delete Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => onSnoozeReminder(rem.id, 15)}
                    className="px-2 py-1 rounded-lg bg-surface-muted hover:bg-surface border border-border/50 text-[11px] text-muted hover:text-foreground transition-all"
                    title="15 dakika ertele"
                  >
                    +15 dk
                  </button>
                  <button
                    onClick={() => onSnoozeReminder(rem.id, 60)}
                    className="px-2 py-1 rounded-lg bg-surface-muted hover:bg-surface border border-border/50 text-[11px] text-muted hover:text-foreground transition-all"
                    title="1 saat ertele"
                  >
                    +1 saat
                  </button>
                  <button
                    onClick={() => onDeleteReminder(rem.id)}
                    className="p-1.5 text-muted hover:text-rose-400 transition-colors rounded-lg"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completed List */}
      {completedReminders.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-border/30">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider px-1">
            Tamamlananlar ({completedReminders.length})
          </h3>

          <div className="space-y-1.5">
            {completedReminders.map((rem) => (
              <div
                key={rem.id}
                className="bg-surface/50 border border-border/30 rounded-xl p-2.5 flex items-center justify-between text-xs opacity-60"
              >
                <div className="flex items-center gap-2 line-through text-muted">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{rem.title}</span>
                </div>
                <button
                  onClick={() => onDeleteReminder(rem.id)}
                  className="p-1 text-muted hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
