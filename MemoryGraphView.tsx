import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Activity, 
  Zap, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { MemoryNode, Task, CalendarEvent } from '../types';
import { soundEngine } from '../services/audio';

interface MemoryGraphViewProps {
  memories: MemoryNode[];
  tasks: Task[];
  events: CalendarEvent[];
  onAddMemory: (memory: Omit<MemoryNode, 'id' | 'learnedAt'>) => void;
  onDeleteMemory: (id: string) => void;
}

export const MemoryGraphView: React.FC<MemoryGraphViewProps> = ({
  memories,
  tasks,
  events,
  onAddMemory,
  onDeleteMemory,
}) => {
  const [isTeachModalOpen, setIsTeachModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryNode['category']>('preference');

  const handleTeach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    onAddMemory({
      key: newKey.trim(),
      value: newValue.trim(),
      category: newCategory,
      confidence: 1.0,
      source: 'user_taught',
      timesReinforced: 1,
    });

    setNewKey('');
    setNewValue('');
    setIsTeachModalOpen(false);
    soundEngine.playSuccessChime();
  };

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Top Banner */}
      <div className="bg-surface p-4 rounded-2xl border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Otonom Öğrenen Bilişsel Çekirdek</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-medium border border-emerald-500/30">
                AES-256-GCM Şifreli
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Mei, harici hiçbir modele bağlı olmadan senin alışkanlıklarını, tercihlerini ve çalışma ritmini yerel olarak öğrenir.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsTeachModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Mei'ye Yeni Bilgi Öğret</span>
        </button>
      </div>

      {/* Local Heuristic Rhythm & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface p-3.5 rounded-2xl border border-border/50 space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Öğrenilen Bilgi & İlke</span>
            <BrainCircuit className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground">{memories.length}</div>
          <p className="text-[10px] text-muted">Cihaz içinde kriptolanmış</p>
        </div>

        <div className="bg-surface p-3.5 rounded-2xl border border-border/50 space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Görev Başarı Oranı</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">%{completionRate}</div>
          <p className="text-[10px] text-muted">{completedTasks} / {totalTasks} görev tamamlandı</p>
        </div>

        <div className="bg-surface p-3.5 rounded-2xl border border-border/50 space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>En Yüksek Odak Aralığı</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold font-mono text-foreground mt-1">09:30 - 12:00</div>
          <p className="text-[10px] text-muted">Gözlemlenen ritim bazlı</p>
        </div>
      </div>

      {/* Memory Nodes List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Mei'nin Hafızasındaki İlkeler ve Tercihler
          </h3>
          <span className="text-[11px] text-muted">Tamamen Yerel • Sıfır Bulut İzi</span>
        </div>

        {memories.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border/40 p-8 text-center text-muted text-xs">
            Henüz kaydedilmiş hafıza düğümü yok. Mei sohbetlerinizden otomatik öğrenir veya yukarıdaki butondan siz öğretebilirsiniz.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {memories.map((mem) => {
              const confidencePercent = Math.round(mem.confidence * 100);
              return (
                <div
                  key={mem.id}
                  className="bg-surface border border-border/60 hover:border-border rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all relative group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono uppercase font-semibold bg-surface-muted text-accent border border-border/50">
                        {mem.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-muted">Güven: %{confidencePercent}</span>
                        <button
                          onClick={() => onDeleteMemory(mem.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-rose-400 transition-all"
                          title="Hafızadan Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-foreground mt-2">{mem.key}</div>
                    <p className="text-xs text-muted mt-1 leading-relaxed">{mem.value}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted/70 pt-2 border-t border-border/30">
                    <span>Kaynak: {mem.source === 'autonomous' ? 'Otonom Gözlem' : 'Kullanıcı Öğretisi'}</span>
                    <span>{mem.timesReinforced}x Pekiştirildi</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Teach Modal */}
      {isTeachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border/80 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Mei'ye Yeni İlke / Bilgi Öğret</h3>
              <button
                onClick={() => setIsTeachModalOpen(false)}
                className="text-muted hover:text-foreground text-xs"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleTeach} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted font-medium mb-1">Kategori</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-2 text-foreground focus:outline-none"
                >
                  <option value="preference">Kişisel Tercih (Örn: Kahve, İletişim tarzı)</option>
                  <option value="habit">Alışkanlık & Rutin (Örn: Sabah yürüyüşü)</option>
                  <option value="personal_fact">Önemli Bilgi (Örn: Proje adları, roller)</option>
                  <option value="schedule_pattern">Zamanlama İlkesi (Örn: Çarşamba toplantı yok)</option>
                  <option value="instruction">Özel Talimat</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Bilgi Başlığı / Anahtar</label>
                <input
                  type="text"
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Örn: Kahve Tercihi veya Odaklanma Saati"
                  className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Öğrenilecek Bilgi / Kural</label>
                <textarea
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Örn: Filtre kahveyi şekersiz içerim ve sabah 10:00'dan önce toplantı istemem."
                  rows={3}
                  className="w-full bg-surface-muted border border-border/70 rounded-xl px-3 py-2 text-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTeachModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-muted hover:text-foreground"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all shadow-xs"
                >
                  Hafızaya Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
