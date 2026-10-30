import React from 'react';
import { 
  PanelLeft, 
  PanelLeftClose, 
  ShieldCheck, 
  Palette, 
  Maximize2, 
  Minimize2,
  Calendar as CalendarIcon,
  CheckSquare,
  Bell,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenVault: () => void;
  onOpenCustomizer: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenVault,
  onOpenCustomizer,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const getTabTitle = () => {
    switch (settings.activeTab) {
      case 'calendar':
        return { label: 'Takvim & Akış', icon: CalendarIcon };
      case 'tasks':
        return { label: 'Görevler & Planlama', icon: CheckSquare };
      case 'reminders':
        return { label: 'Hatırlatıcılar', icon: Bell };
      case 'memory':
        return { label: 'Otonom Bilişsel Hafıza', icon: BrainCircuit };
      default:
        return { label: 'Mei', icon: MessageSquare };
    }
  };

  const currentTab = getTabTitle();
  const TabIcon = currentTab.icon;

  return (
    <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-30 bg-surface/90 transition-colors h-14 flex items-center justify-between px-3 sm:px-4 shrink-0">
      {/* Left: Sidebar Toggle & Active Section Name */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
          title={isSidebarOpen ? 'Yan Menüyü Gizle' : 'Yan Menüyü Göster'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 text-accent" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 text-accent font-serif font-bold text-xs flex items-center justify-center">
            M
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <span>{currentTab.label}</span>
          </div>
        </div>
      </div>

      {/* Right: Security Pill, Customizer, Zen Mode */}
      <div className="flex items-center gap-1.5">
        {/* AES-256-GCM Status */}
        <button
          onClick={onOpenVault}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-mono"
          title="Uçtan Uca Cihaz İçi Şifreleme (AES-256-GCM)"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[11px]">AES-256-GCM</span>
        </button>

        {/* Theme Customizer */}
        <button
          onClick={onOpenCustomizer}
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
          title="Arayüzü Özelleştir (ChatGPT Teması, Renkler)"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* Zen Mode Toggle */}
        <button
          onClick={() => onUpdateSettings({ zenMode: !settings.zenMode })}
          title={settings.zenMode ? 'Normal Görünüme Dön' : 'Minimalist Zen Modu'}
          className={`p-2 rounded-lg transition-colors ${
            settings.zenMode ? 'bg-accent/20 text-accent' : 'text-muted hover:text-foreground hover:bg-surface-muted'
          }`}
        >
          {settings.zenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
