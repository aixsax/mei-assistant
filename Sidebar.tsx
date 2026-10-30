import React from 'react';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Bell, 
  BrainCircuit, 
  Plus, 
  Search, 
  ShieldCheck, 
  Palette, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  X,
  MessageSquare,
  Lock,
  Cpu
} from 'lucide-react';
import { AppSettings } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: AppSettings['activeTab'];
  onSelectTab: (tab: AppSettings['activeTab']) => void;
  onNewChat: () => void;
  onOpenResearchModal: () => void;
  onOpenVault: () => void;
  onOpenCustomizer: () => void;
  enableSound: boolean;
  onToggleSound: () => void;
  pendingTasksCount: number;
  activeRemindersCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  activeTab,
  onSelectTab,
  onNewChat,
  onOpenResearchModal,
  onOpenVault,
  onOpenCustomizer,
  enableSound,
  onToggleSound,
  pendingTasksCount,
  activeRemindersCount,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-[260px] bg-surface-muted/95 border-r border-border/40 text-foreground transition-all duration-200 ease-in-out shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
        }`}
      >
        {/* Top Header / Branding & Collapse */}
        <div className="flex items-center justify-between p-3.5 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 text-accent font-serif font-bold text-sm flex items-center justify-center shadow-xs">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-foreground">Mei</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-accent/15 text-accent font-mono font-medium">
                  AİX BEY
                </span>
              </div>
              <p className="text-[10px] text-muted truncate">Volkan Yücekaya</p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
            title="Yan Menüyü Gizle"
          >
            <ChevronLeft className="w-4 h-4 hidden md:block" />
            <X className="w-4 h-4 md:hidden" />
          </button>
        </div>

        {/* New Chat Button (ChatGPT style) */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onSelectTab('chat');
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface hover:bg-surface/80 border border-border/60 hover:border-accent/40 text-xs font-semibold text-foreground transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-accent group-hover:rotate-90 transition-transform duration-200" />
              <span>Yeni Sohbet</span>
            </div>
            <span className="text-[10px] text-muted font-mono opacity-50">⌘K</span>
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4 scrollbar-thin">
          {/* Main Navigation */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider px-2 block">
              Asistan & Planlama
            </span>

            <button
              onClick={() => onSelectTab('chat')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Sohbet & Mei</span>
            </button>

            <button
              onClick={() => onSelectTab('calendar')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'calendar'
                  ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface/60'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Takvim & Akış</span>
            </button>

            <button
              onClick={() => onSelectTab('tasks')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'tasks'
                  ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4" />
                <span>Görevler</span>
              </div>
              {pendingTasksCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface text-foreground font-bold">
                  {pendingTasksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('reminders')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'reminders'
                  ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4" />
                <span>Hatırlatıcılar</span>
              </div>
              {activeRemindersCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                  {activeRemindersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('memory')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'memory'
                  ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface/60'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Otonom Bilişsel Hafıza</span>
            </button>
          </div>

          {/* Quick Tools */}
          <div className="space-y-1 pt-2 border-t border-border/30">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider px-2 block">
              Araştırma & İstihbarat
            </span>

            <button
              onClick={onOpenResearchModal}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface/60 transition-all text-left"
            >
              <Search className="w-4 h-4 text-blue-400" />
              <span>Derin Web Araştırması</span>
            </button>
          </div>
        </div>

        {/* Bottom Settings & User Identity */}
        <div className="p-3 border-t border-border/30 space-y-2">
          {/* AES-256-GCM Vault Status */}
          <button
            onClick={onOpenVault}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-surface hover:bg-surface/80 border border-border/50 text-[11px] text-muted hover:text-foreground transition-all"
            title="Kripto Kasa Durumu & Yedekleme"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-emerald-400 font-medium">AES-256-GCM</span>
            </div>
            <span className="text-[10px] text-muted">Kasa</span>
          </button>

          {/* Customizer & Sound Bar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenCustomizer}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-surface hover:bg-surface/80 border border-border/50 text-xs text-muted hover:text-foreground transition-all"
              title="Arayüzü & Temayı Özelleştir"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="text-[11px]">Tema</span>
            </button>

            <button
              onClick={onToggleSound}
              className="p-1.5 rounded-xl bg-surface hover:bg-surface/80 border border-border/50 text-muted hover:text-foreground transition-all"
              title={enableSound ? 'Sesleri Kapat' : 'Sesleri Aç'}
            >
              {enableSound ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 opacity-50" />}
            </button>
          </div>

          {/* Creator Attribution */}
          <div className="px-2 pt-1 text-[10px] text-muted/60 flex items-center justify-between">
            <span>AİX BEY Community</span>
            <span>Volkan Yücekaya</span>
          </div>
        </div>
      </aside>
    </>
  );
};
