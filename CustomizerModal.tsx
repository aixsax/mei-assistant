import React from 'react';
import { 
  Palette, 
  Sun, 
  Moon, 
  Layers, 
  Volume2, 
  Globe, 
  Cpu, 
  X, 
  Check, 
  Eye, 
  Sliders
} from 'lucide-react';
import { AppSettings, ThemeId, AccentColor } from '../types';
import { soundEngine } from '../services/audio';

interface CustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const themes: { id: ThemeId; name: string; desc: string; icon: string }[] = [
    { id: 'chatgpt-dark', name: 'ChatGPT Koyu', desc: 'Resmi ChatGPT antrasit arayüzü', icon: '🤖' },
    { id: 'chatgpt-light', name: 'ChatGPT Açık', desc: 'Sade ChatGPT beyaz arayüzü', icon: '☀️' },
    { id: 'oled', name: 'OLED Obsidyen', desc: 'Sonsuz siyah ve minimalist kontrast', icon: '⬛' },
    { id: 'slate', name: 'Zen Arduvaz', desc: 'Gözü yormayan kurşun grafit', icon: '🌑' },
    { id: 'snow', name: 'Minimalist Kar', desc: 'İskandinav berrak beyaz', icon: '⚪' },
    { id: 'paper', name: 'Sıcak Kağıt', desc: 'Doğal kütüphane dokusu', icon: '📜' },
    { id: 'midnight', name: 'Gece Mavisi', desc: 'Derin kozmik lacivert', icon: '🌌' },
  ];

  const accents: { id: AccentColor; name: string; hex: string }[] = [
    { id: 'violet', name: 'Mei Moru', hex: '#8b5cf6' },
    { id: 'emerald', name: 'Zümrüt', hex: '#10b981' },
    { id: 'sky', name: 'Okyanus', hex: '#0284c7' },
    { id: 'rose', name: 'Gül Pembesi', hex: '#f43f5e' },
    { id: 'amber', name: 'Kehribar', hex: '#f59e0b' },
    { id: 'silver', name: 'Platin Gümüş', hex: '#94a3b8' },
  ];

  const handleSelectTheme = (tId: ThemeId) => {
    onUpdateSettings({ theme: tId });
    soundEngine.playSuccessChime();
  };

  const handleSelectAccent = (aId: AccentColor) => {
    onUpdateSettings({ accent: aId });
    soundEngine.playSuccessChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-border/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Arayüz Özelleştirme</h2>
              <p className="text-[11px] text-muted">Minimalist tasarım dili ve performans tercihleri</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-foreground rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Themes */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
            Renk Teması (Minimalist Palet)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {themes.map((th) => {
              const isSelected = settings.theme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => handleSelectTheme(th.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-xs'
                      : 'border-border/50 bg-surface-muted/50 hover:border-border'
                  }`}
                >
                  <span className="text-sm">{th.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>{th.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                    </div>
                    <div className="text-[10px] text-muted truncate">{th.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Colors */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
            Vurgu Rengi
          </label>
          <div className="flex flex-wrap gap-2">
            {accents.map((acc) => {
              const isSelected = settings.accent === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => handleSelectAccent(acc.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/15 text-foreground'
                      : 'border-border/50 bg-surface hover:border-border text-muted'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: acc.hex }}
                  />
                  <span>{acc.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout Density */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
            Arayüz Yoğunluğu (Tipografi & Boşluklar)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['compact', 'normal', 'relaxed'] as const).map((density) => (
              <button
                key={density}
                onClick={() => onUpdateSettings({ fontSize: density })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center capitalize transition-all ${
                  settings.fontSize === density
                    ? 'border-accent bg-accent/10 text-foreground font-semibold shadow-xs'
                    : 'border-border/50 bg-surface text-muted hover:border-border'
                }`}
              >
                {density === 'compact' ? 'Sıkışık' : density === 'normal' ? 'Normal' : 'Rahat'}
              </button>
            ))}
          </div>
        </div>

        {/* Performance & Cognitive Preferences */}
        <div className="space-y-2.5 pt-2 border-t border-border/40">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
            Fonksiyonel Tercihler
          </label>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-muted border border-border/40 cursor-pointer">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="font-medium text-foreground block">Otomatik İnternet Araştırması</span>
                  <span className="text-[10px] text-muted">Güncel soruları doğrudan canlı web ile yanıtla</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoWebSearch}
                onChange={(e) => onUpdateSettings({ autoWebSearch: e.target.checked })}
                className="w-4 h-4 rounded text-accent accent-accent"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-muted border border-border/40 cursor-pointer">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="font-medium text-foreground block">Otonom Cihaz İçi Öğrenme</span>
                  <span className="text-[10px] text-muted">Alışkanlıkları ve rutinleri yerel olarak analiz et</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autonomousLearning}
                onChange={(e) => onUpdateSettings({ autonomousLearning: e.target.checked })}
                className="w-4 h-4 rounded text-accent accent-accent"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-muted border border-border/40 cursor-pointer">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-medium text-foreground block">Web Audio Kristal Ses Efektleri</span>
                  <span className="text-[10px] text-muted">Hafif saf sinüs bildirim sesleri</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableSound}
                onChange={(e) => {
                  onUpdateSettings({ enableSound: e.target.checked });
                  soundEngine.setEnabled(e.target.checked);
                }}
                className="w-4 h-4 rounded text-accent accent-accent"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
