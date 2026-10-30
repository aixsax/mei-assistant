import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  ArrowUp,
  Globe, 
  Sparkles, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Bell, 
  BrainCircuit, 
  ExternalLink, 
  ShieldCheck, 
  RotateCcw,
  Check,
  Search,
  Cpu
} from 'lucide-react';
import { Message, MessageAction, CalendarEvent, Task, Reminder, AppSettings } from '../types';
import { soundEngine } from '../services/audio';

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (text: string, webSearch: boolean) => Promise<void>;
  isLoading: boolean;
  onExecuteAction: (action: MessageAction) => void;
  onClearHistory: () => void;
  settings: AppSettings;
  onOpenResearchModal: (initialTopic?: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onExecuteAction,
  onClearHistory,
  settings,
  onOpenResearchModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(settings.autoWebSearch);
  const [executedActionIds, setExecutedActionIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const query = inputText.trim();
    setInputText('');
    await onSendMessage(query, webSearchEnabled);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleActionClick = (action: MessageAction, idx: number, messageId: string) => {
    const key = `${messageId}_${idx}`;
    if (executedActionIds.has(key)) return;

    setExecutedActionIds((prev) => new Set(prev).add(key));
    onExecuteAction(action);
    soundEngine.playSuccessChime();
  };

  const quickPrompts = [
    { label: '🌸 Sohbet Edelim (Nasıl gidiyor?)', prompt: 'Selam Mei! Bugün nasılsın, biraz sohbet edelim mi?' },
    { label: '👑 Seni Kim Geliştirdi?', prompt: 'Seni kim geliştirdi, yapımcın kim?' },
    { label: '📅 Günümü Planla', prompt: 'Bugün için bana pratik ve hafif bir çalışma akışı öner.' },
    { label: '🌐 Canlı Web Araştırması', prompt: 'İnternetten en son teknoloji ve yapay zeka haberlerini özetle.', search: true },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 py-3">
      {/* Top Banner / Privacy Guarantee */}
      <div className="flex items-center justify-between py-2 px-3 mb-2 rounded-xl bg-surface-muted/60 border border-border/40 text-xs text-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Yerel Kripto Kasası Etkin: Konuşmalar cihazında AES-256-GCM ile şifrelenir.</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenResearchModal()}
            className="flex items-center gap-1 text-accent hover:underline font-medium"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Derin Web Araştırması</span>
          </button>
          <button
            onClick={onClearHistory}
            title="Sohbeti Temizle"
            className="hover:text-foreground transition-colors p-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Mei ile Sohbete Başla 🌸</h2>
            <p className="text-xs max-w-md text-muted mb-6">
              AİX BEY Community (Volkan Yücekaya) tarafından geliştirildim. Hem dostça sohbet edebilir hem de gününü, takvimini ve hatırlatıcılarını planlayabiliriz.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(qp.prompt);
                    if (qp.search) setWebSearchEnabled(true);
                  }}
                  className="text-left p-3 rounded-xl bg-surface hover:bg-surface-muted border border-border/50 hover:border-accent/40 transition-all text-xs text-foreground group"
                >
                  <span className="font-medium group-hover:text-accent transition-colors">{qp.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMei = msg.sender === 'mei';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isMei ? 'justify-start' : 'justify-end'} animate-in fade-in duration-200`}
              >
                {isMei && (
                  <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shrink-0 text-xs font-serif font-bold mt-1">
                    M
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                    isMei
                      ? 'bg-surface border border-border/60 text-foreground shadow-sm'
                      : 'bg-accent text-accent-foreground ml-auto'
                  }`}
                >
                  {/* Web search indicator badge */}
                  {msg.webSearchUsed && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-medium mb-1">
                      <Globe className="w-3 h-3" />
                      <span>Canlı İnternet Araştırması Doğrulandı</span>
                    </div>
                  )}

                  {msg.isLocalAutonomous && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[10px] font-medium mb-1">
                      <Cpu className="w-3 h-3" />
                      <span>Otonom Yerel Zeka Yanıtı</span>
                    </div>
                  )}

                  {msg.notice && (
                    <div className="text-[10px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                      {msg.notice}
                    </div>
                  )}

                  {/* Message body (formats simple bold and lists) */}
                  <div className="whitespace-pre-wrap font-sans">
                    {renderFormattedText(msg.text)}
                  </div>

                  {/* Grounding web citation sources if present */}
                  {msg.groundingSources && msg.groundingSources.length > 0 && (
                    <div className="pt-2 border-t border-border/40 mt-2 space-y-1">
                      <div className="text-[10px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
                        <Globe className="w-3 h-3 text-accent" />
                        <span>Doğrulanmış Web Kaynakları:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.groundingSources.map((source, sIdx) => {
                          const url = source.web?.uri;
                          const title = source.web?.title || url;
                          if (!url) return null;
                          return (
                            <a
                              key={sIdx}
                              href={url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-muted hover:bg-accent/15 border border-border/50 text-[11px] text-accent hover:text-foreground transition-all max-w-[260px] truncate"
                              title={title}
                            >
                              <span className="truncate">{title}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Action Chips (Add to Calendar, Set Reminder, etc.) */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="pt-2 border-t border-border/40 mt-2 flex flex-wrap gap-2">
                      {msg.actions.map((act, actIdx) => {
                        const key = `${msg.id}_${actIdx}`;
                        const isDone = executedActionIds.has(key);
                        return (
                          <button
                            key={actIdx}
                            disabled={isDone}
                            onClick={() => handleActionClick(act, actIdx, msg.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                                : 'bg-accent/10 hover:bg-accent text-accent hover:text-accent-foreground border border-accent/30 shadow-xs'
                            }`}
                          >
                            {isDone ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Eklendi</span>
                              </>
                            ) : (
                              <>
                                {act.type === 'create_event' && <CalendarIcon className="w-3.5 h-3.5" />}
                                {act.type === 'create_task' && <CheckSquare className="w-3.5 h-3.5" />}
                                {act.type === 'create_reminder' && <Bell className="w-3.5 h-3.5" />}
                                {act.type === 'save_memory' && <BrainCircuit className="w-3.5 h-3.5" />}
                                <span>{act.label}</span>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="text-[9px] opacity-40 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center text-xs font-serif font-bold">
              M
            </div>
            <div className="p-3 rounded-2xl bg-surface border border-border/50 flex items-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span>{webSearchEnabled ? 'İnternet taranıyor ve güncel bilgiler sentezleniyor...' : 'Mei düşünüyor...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar - ChatGPT Style Capsule */}
      <div className="pt-2 pb-3 w-full max-w-3xl mx-auto shrink-0">
        <form
          onSubmit={handleSubmit}
          className="relative bg-surface-muted/90 hover:bg-surface-muted border border-border/80 focus-within:border-accent/80 rounded-3xl p-2 px-3 flex flex-col gap-1.5 shadow-sm transition-all"
        >
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mei ile sohbet et, görev ekle veya gününü planla..."
            rows={1}
            className="w-full bg-transparent resize-none border-none focus:outline-none text-xs sm:text-sm text-foreground placeholder:text-muted/60 px-2 py-1 max-h-36 min-h-[38px] leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1 px-1">
            {/* Left Controls: Web Search Grounding Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  webSearchEnabled
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-xs'
                    : 'text-muted hover:text-foreground hover:bg-surface border border-transparent'
                }`}
                title={webSearchEnabled ? 'Canlı Web Açık' : 'Canlı Web Kapalı'}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[11px]">Canlı Web</span>
              </button>
            </div>

            {/* Circular Send Button (ChatGPT style) */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xs shrink-0"
              title="Gönder"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
        <div className="text-[10px] text-center text-muted/60 pt-1.5 font-sans">
          Mei hata yapabilir. Tüm verileriniz bu cihazda AES-256-GCM ile şifrelenir.
        </div>
      </div>
    </div>
  );
};

// Simple text formatter for clean rendering of markdown bold, bullet points, headers
function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Bold parser
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const formattedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (line.startsWith('### ')) {
      return <div key={idx} className="font-semibold text-foreground text-xs pt-1">{line.slice(4)}</div>;
    }
    if (line.startsWith('## ')) {
      return <div key={idx} className="font-bold text-foreground text-sm pt-1.5">{line.slice(3)}</div>;
    }
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return (
        <div key={idx} className="flex gap-2 items-start pl-1 py-0.5">
          <span className="text-accent">•</span>
          <span className="flex-1">{formattedLine.slice(1)}</span>
        </div>
      );
    }

    return (
      <div key={idx} className={line.trim() === '' ? 'h-2' : ''}>
        {formattedLine}
      </div>
    );
  });
}
