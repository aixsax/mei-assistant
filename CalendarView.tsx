import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download, 
  Upload, 
  Clock, 
  MapPin, 
  Trash2, 
  Sparkles, 
  ListFilter,
  CheckCircle2
} from 'lucide-react';
import { CalendarEvent, Task } from '../types';
import { CalendarSyncService } from '../services/calendarSync';
import { selfLearningEngine } from '../services/selfLearning';
import { soundEngine } from '../services/audio';

interface CalendarViewProps {
  events: CalendarEvent[];
  tasks: Task[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
  onBatchAddEvents: (events: CalendarEvent[]) => void;
}

type ViewMode = 'day' | 'week' | 'month' | 'agenda';

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  tasks,
  onAddEvent,
  onDeleteEvent,
  onBatchAddEvents,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('11:00');
  const [category, setCategory] = useState<CalendarEvent['category']>('work');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  // Navigate dates
  const handlePrev = () => {
    const next = new Date(selectedDate);
    if (viewMode === 'day') next.setDate(next.getDate() - 1);
    else if (viewMode === 'week') next.setDate(next.getDate() - 7);
    else if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
    setSelectedDate(next);
  };

  const handleNext = () => {
    const next = new Date(selectedDate);
    if (viewMode === 'day') next.setDate(next.getDate() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Export to .ics
  const handleExportICS = () => {
    CalendarSyncService.downloadICS(events, `mei_takvim_${selectedDateStr}.ics`);
    soundEngine.playSuccessChime();
  };

  // Import .ics
  const handleImportICS = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const imported = CalendarSyncService.parseICS(content);
        if (imported.length > 0) {
          onBatchAddEvents(imported);
          soundEngine.playSuccessChime();
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Auto Schedule Day with Mei
  const handleAutoSchedule = async () => {
    setIsAutoScheduling(true);
    try {
      const scheduledEvents = await selfLearningEngine.autoScheduleDay(tasks, events, selectedDateStr);
      if (scheduledEvents.length > 0) {
        onBatchAddEvents(scheduledEvents);
        soundEngine.playSuccessChime();
      }
    } finally {
      setIsAutoScheduling(false);
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const categoryColors: Record<CalendarEvent['category'], string> = {
      work: '#8b5cf6',
      personal: '#3b82f6',
      health: '#10b981',
      learning: '#f59e0b',
      other: '#6b7280',
    };

    onAddEvent({
      title: title.trim(),
      description: description.trim() || undefined,
      startDate,
      startTime,
      endDate: endDate || startDate,
      endTime,
      category,
      color: categoryColors[category],
      location: location.trim() || undefined,
    });

    setTitle('');
    setLocation('');
    setDescription('');
    setIsAddModalOpen(false);
    soundEngine.playSuccessChime();
  };

  // Hours array for Day view (07:00 to 22:00)
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);

  // Filter events for selected day
  const dayEvents = events.filter((e) => e.startDate === selectedDateStr);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-2xl border border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-xl border border-border/40">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-medium rounded-lg text-foreground hover:bg-surface transition-colors"
            >
              Bugün
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-sm font-semibold text-foreground tracking-wide">
            {selectedDate.toLocaleDateString('tr-TR', {
              month: 'long',
              year: 'numeric',
              day: viewMode === 'day' ? 'numeric' : undefined,
              weekday: viewMode === 'day' ? 'long' : undefined,
            })}
          </h2>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-surface-muted p-1 rounded-xl border border-border/40 text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'day' ? 'bg-surface font-semibold text-foreground shadow-xs' : 'text-muted'}`}
            >
              Gün
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'week' ? 'bg-surface font-semibold text-foreground shadow-xs' : 'text-muted'}`}
            >
              Hafta
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'month' ? 'bg-surface font-semibold text-foreground shadow-xs' : 'text-muted'}`}
            >
              Ay
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'agenda' ? 'bg-surface font-semibold text-foreground shadow-xs' : 'text-muted'}`}
            >
              Ajanda
            </button>
          </div>

          {/* Auto Schedule with Mei */}
          <button
            onClick={handleAutoSchedule}
            disabled={isAutoScheduling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 text-xs font-medium transition-all"
            title="Yapılacaklar listendeki görevleri boş saatlere yerleştirir"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAutoScheduling ? 'Planlanıyor...' : 'Mei ile Planla'}</span>
          </button>

          {/* Sync .ICS buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportICS}
              title="Google / Apple Takvim'e Aktar (.ics)"
              className="flex items-center gap-1 p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-muted border border-border/50 text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">.ICS İndir</span>
            </button>

            <label
              title="Google / Apple Takviminden .ics İçe Aktar"
              className="flex items-center gap-1 p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-muted border border-border/50 text-xs cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">İçe Aktar</span>
              <input type="file" accept=".ics" onChange={handleImportICS} className="hidden" />
            </label>
          </div>

          {/* Add Event */}
          <button
            onClick={() => {
              setStartDate(selectedDateStr);
              setEndDate(selectedDateStr);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Etkinlik Ekle</span>
          </button>
        </div>
      </div>

      {/* VIEW: DAY TIMELINE */}
      {viewMode === 'day' && (
        <div className="bg-surface rounded-2xl border border-border/50 p-4 space-y-2">
          <div className="flex items-center justify-between pb-3 border-b border-border/40 text-xs text-muted">
            <span>Saatlik Akış & Boş Zamanlar</span>
            <span>{dayEvents.length} Etkinlik Planlandı</span>
          </div>

          <div className="relative divide-y divide-border/30">
            {hours.map((hour) => {
              const hourStr = `${hour.toString().padStart(2, '0')}:00`;
              const matchedEvents = dayEvents.filter((ev) => {
                const evStartHour = parseInt(ev.startTime.split(':')[0], 10);
                return evStartHour === hour;
              });

              return (
                <div key={hour} className="min-h-[58px] py-2 flex items-start gap-4 group">
                  <div className="w-14 text-right text-xs font-mono text-muted/70 shrink-0 pt-0.5">
                    {hourStr}
                  </div>

                  <div className="flex-1 flex flex-wrap gap-2">
                    {matchedEvents.length > 0 ? (
                      matchedEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex-1 min-w-[240px] rounded-xl p-2.5 border text-xs transition-all relative group/card"
                          style={{
                            backgroundColor: `${ev.color || '#8b5cf6'}12`,
                            borderColor: `${ev.color || '#8b5cf6'}35`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: ev.color || '#8b5cf6' }}
                                />
                                <span>{ev.title}</span>
                              </div>
                              <div className="text-[11px] text-muted flex items-center gap-2 mt-1">
                                <span className="font-mono flex items-center gap-1">
                                  <Clock className="w-3 h-3 opacity-60" />
                                  {ev.startTime} - {ev.endTime}
                                </span>
                                {ev.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 opacity-60" />
                                    {ev.location}
                                  </span>
                                )}
                              </div>
                              {ev.description && (
                                <p className="text-[11px] text-muted/80 mt-1 line-clamp-1">{ev.description}</p>
                              )}
                            </div>

                            <button
                              onClick={() => onDeleteEvent(ev.id)}
                              className="opacity-0 group-hover/card:opacity-100 p-1 text-muted hover:text-rose-400 transition-all rounded-md"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        onClick={() => {
                          setStartDate(selectedDateStr);
                          setEndDate(selectedDateStr);
                          setStartTime(`${hour.toString().padStart(2, '0')}:00`);
                          setEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`);
                          setIsAddModalOpen(true);
                        }}
                        className="w-full h-8 rounded-lg border border-dashed border-transparent group-hover:border-border/40 hover:bg-surface-muted/30 cursor-pointer flex items-center pl-2 text-[11px] text-muted/50 transition-all"
                      >
                        <span className="opacity-0 group-hover:opacity-100">+ Saat {hourStr}'a ekle</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-surface rounded-2xl border border-border/50 p-4 overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(selectedDate);
              const dayOfWeek = d.getDay();
              const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + i;
              d.setDate(diff);
              const dateStr = d.toISOString().split('T')[0];
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isSelected = dateStr === selectedDateStr;
              const curDayEvents = events.filter((e) => e.startDate === dateStr);

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  className={`rounded-xl p-2.5 border transition-all cursor-pointer min-h-[280px] flex flex-col ${
                    isSelected
                      ? 'border-accent bg-accent/5'
                      : 'border-border/40 bg-surface hover:border-border'
                  }`}
                >
                  <div className="text-center pb-2 border-b border-border/30">
                    <span className="text-[10px] uppercase font-semibold text-muted block">
                      {d.toLocaleDateString('tr-TR', { weekday: 'short' })}
                    </span>
                    <span
                      className={`inline-block text-xs font-bold w-6 h-6 leading-6 rounded-full mt-0.5 ${
                        isToday ? 'bg-accent text-accent-foreground' : 'text-foreground'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1.5 pt-2 overflow-y-auto max-h-56 scrollbar-thin">
                    {curDayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-1.5 rounded-lg text-[10px] border border-border/40 font-medium truncate"
                        style={{ backgroundColor: `${ev.color || '#8b5cf6'}18` }}
                        title={`${ev.startTime} - ${ev.title}`}
                      >
                        <span className="font-mono text-muted/80 mr-1">{ev.startTime}</span>
                        <span className="text-foreground">{ev.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-surface rounded-2xl border border-border/50 p-4">
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] text-muted pb-2 border-b border-border/30">
            <span>Pzt</span>
            <span>Sal</span>
            <span>Çar</span>
            <span>Per</span>
            <span>Cum</span>
            <span>Cmt</span>
            <span>Paz</span>
          </div>

          <div className="grid grid-cols-7 gap-1 pt-2">
            {getMonthGrid(selectedDate).map((dayInfo, idx) => {
              const dateStr = dayInfo.date.toISOString().split('T')[0];
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isCurrentMonth = dayInfo.isCurrentMonth;
              const dayEventCount = events.filter((e) => e.startDate === dateStr).length;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDate(dayInfo.date);
                    setViewMode('day');
                  }}
                  className={`min-h-[64px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    dateStr === selectedDateStr
                      ? 'border-accent bg-accent/10'
                      : isCurrentMonth
                      ? 'border-border/30 hover:border-border bg-surface'
                      : 'border-transparent opacity-40 hover:opacity-80'
                  }`}
                >
                  <span
                    className={`text-xs font-mono font-medium self-end w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-accent text-accent-foreground font-bold' : 'text-foreground'
                    }`}
                  >
                    {dayInfo.date.getDate()}
                  </span>

                  {dayEventCount > 0 && (
                    <div className="flex items-center gap-1 self-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span className="text-[10px] text-muted font-medium">{dayEventCount}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: AGENDA */}
      {viewMode === 'agenda' && (
        <div className="bg-surface rounded-2xl border border-border/50 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Tüm Planlanan Etkinlikler ({events.length})
          </h3>

          {events.length === 0 ? (
            <div className="text-center py-10 text-muted text-xs">
              Henüz takvim etkinliği yok. Mei'ye yazabilir veya sağ üstten ekleyebilirsiniz.
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {events
                .slice()
                .sort((a, b) => `${a.startDate} ${a.startTime}`.localeCompare(`${b.startDate} ${b.startTime}`))
                .map((ev) => (
                  <div key={ev.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-10 rounded-full"
                        style={{ backgroundColor: ev.color || '#8b5cf6' }}
                      />
                      <div>
                        <div className="text-xs font-semibold text-foreground">{ev.title}</div>
                        <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                          <span>{ev.startDate}</span>
                          <span>•</span>
                          <span className="font-mono">{ev.startTime} - {ev.endTime}</span>
                          {ev.location && (
                            <>
                              <span>•</span>
                              <span>{ev.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteEvent(ev.id)}
                      className="p-1.5 text-muted hover:text-rose-400 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border/80 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Yeni Takvim Etkinliği</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted hover:text-foreground text-xs"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted font-medium mb-1">Başlık</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Proje Yol Haritası Değerlendirmesi"
                  className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted font-medium mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-muted font-medium mb-1">Saat</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted font-medium mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-muted font-medium mb-1">Bitiş Saati</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted font-medium mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  >
                    <option value="work">İş & Proje</option>
                    <option value="personal">Kişisel</option>
                    <option value="health">Sağlık & Spor</option>
                    <option value="learning">Öğrenme</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted font-medium mb-1">Konum / Bağlantı</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ofis veya Google Meet"
                    className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-2 text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Açıklama / Notlar</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="İlgili notlar..."
                  rows={2}
                  className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-1.5 text-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-muted hover:text-foreground"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all shadow-xs"
                >
                  Takvime Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to generate full month grid (with previous and next month buffer days)
function getMonthGrid(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Monday-based day of week (0: Mon, ..., 6: Sun)
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset === -1) startOffset = 6;

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = startOffset; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i);
    days.push({ date: d, isCurrentMonth: true });
  }

  // Next month leading days to complete grid (42 cells: 6 weeks)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({ date: d, isCurrentMonth: false });
  }

  return days;
}
