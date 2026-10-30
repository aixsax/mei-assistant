import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Copy, 
  Calendar as CalendarIcon, 
  CheckSquare
} from 'lucide-react';
import { GroundingChunk, Task } from '../types';
import { soundEngine } from '../services/audio';

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTasksFromResearch: (tasks: Omit<Task, 'id' | 'completed' | 'createdAt'>[]) => void;
}

export const ResearchModal: React.FC<ResearchModalProps> = ({
  isOpen,
  onClose,
  onAddTasksFromResearch,
}) => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    summary: string;
    sources: GroundingChunk[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleResearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!res.ok) throw new Error('Araştırma isteği başarısız oldu');
      const data = await res.json();
      setResult({
        summary: data.summary,
        sources: data.groundingSources || [],
      });
      soundEngine.playSuccessChime();
    } catch (err) {
      console.error('Araştırma hatası:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExtractTasks = () => {
    if (!result) return;
    const todayStr = new Date().toISOString().split('T')[0];
    onAddTasksFromResearch([
      {
        title: `Araştırma incelemesi: ${topic.slice(0, 30)}`,
        description: `Mei Web Araştırması özet bulgularını incele ve aksiyon al`,
        dueDate: todayStr,
        priority: 'high',
        category: 'learning',
        estimatedMinutes: 30,
      },
    ]);
    soundEngine.playSuccessChime();
    onClose();
  };

  const suggestedTopics = [
    '2025-2026 yılı yapay zeka ajanları ve otonom sistemlerdeki yenilikler',
    'Derin çalışma (Deep Work) ve bilişsel odaklanma teknikleri',
    'Yüksek performanslı günlük zaman bloklama (Time Blocking) metodolojisi',
    'Sağlıklı uyku ritmi ve sirkadiyen saat optimizasyonu',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-border/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Canlı İnternet & Web Araştırması</h2>
              <p className="text-[11px] text-muted">Google Search Grounding ile doğrulanmış güncel kaynaklar</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-foreground rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input form */}
        <form onSubmit={handleResearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Araştırmak istediğiniz konuyu yazın... (Örn: Son yapay zeka gelişmeleri)"
              className="w-full bg-surface-muted border border-border/70 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent"
            />
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          </div>

          <button
            type="submit"
            disabled={!topic.trim() || isLoading}
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Taranıyor...' : 'Araştır'}</span>
          </button>
        </form>

        {/* Suggestion Chips */}
        {!result && !isLoading && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-semibold text-muted block">Önerilen Konular:</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTopics.map((st, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTopic(st);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface-muted hover:bg-surface border border-border/50 text-[11px] text-muted hover:text-foreground transition-all text-left"
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-muted">
              İnternet genelinde en güncel kaynaklar taranıyor, bilgiler karşılaştırılıyor ve sentezleniyor...
            </p>
          </div>
        )}

        {/* Result Container */}
        {result && !isLoading && (
          <div className="space-y-4 animate-in fade-in">
            {/* Top action bar */}
            <div className="flex items-center justify-between text-xs bg-surface-muted p-2 rounded-xl border border-border/40">
              <span className="font-medium text-foreground">Araştırma Raporu</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
                <button
                  onClick={handleExtractTasks}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-all shadow-xs"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Göreve Dönüştür</span>
                </button>
              </div>
            </div>

            {/* Summary Text */}
            <div className="bg-surface rounded-xl p-4 border border-border/50 text-xs leading-relaxed space-y-2 whitespace-pre-wrap">
              {result.summary}
            </div>

            {/* Sources */}
            {result.sources.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <span className="text-[10px] uppercase font-semibold text-muted block">
                  Doğrulanmış Web Kaynakları ({result.sources.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.sources.map((s, idx) => {
                    const uri = s.web?.uri;
                    const title = s.web?.title || uri;
                    if (!uri) return null;
                    return (
                      <a
                        key={idx}
                        href={uri}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center justify-between p-2 rounded-lg bg-surface-muted hover:bg-accent/15 border border-border/50 text-[11px] text-accent hover:text-foreground transition-all group"
                      >
                        <span className="truncate pr-2">{title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
