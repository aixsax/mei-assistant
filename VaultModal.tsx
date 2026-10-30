import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Download, 
  Upload, 
  AlertOctagon, 
  X, 
  Check, 
  Copy,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { db } from '../services/db';
import { cryptoEngine } from '../services/crypto';
import { soundEngine } from '../services/audio';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({ isOpen, onClose, onDataReset }) => {
  const [customPin, setCustomPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const cryptoStatus = cryptoEngine.getStatus();

  const handleExportBackup = async () => {
    try {
      const bundle = await db.exportVaultBundle();
      const blob = new Blob([bundle], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mei_sifreli_kasa_yedek_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      soundEngine.playSuccessChime();
    } catch (err) {
      console.error('Yedek dışa aktarma hatası:', err);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = await db.importVaultBundle(content);
        if (success) {
          setImportStatus('Yedek başarıyla geri yüklendi!');
          soundEngine.playSuccessChime();
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          setImportStatus('Yedek dosyası okunamadı veya biçimi geçersiz.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSetCustomPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPin.trim() || customPin.length < 4) return;

    const success = await cryptoEngine.unlock(customPin.trim());
    if (success) {
      localStorage.setItem('mei_custom_vault_pin', 'true');
      setPinSuccess(true);
      setCustomPin('');
      soundEngine.playSuccessChime();
      setTimeout(() => setPinSuccess(false), 3000);
    }
  };

  const handlePurge = async () => {
    await db.purgeAll();
    soundEngine.playSuccessChime();
    onDataReset();
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface border border-border/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Kriptografik Yerel Kasa</h2>
              <p className="text-[11px] text-muted">Sıfır Bulut İzi • %100 Cihaz İçi Şifreleme</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-foreground rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-surface-muted p-3 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted block">Algoritma</span>
            <span className="font-mono font-semibold text-emerald-400">AES-256-GCM</span>
          </div>

          <div className="bg-surface-muted p-3 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted block">Anahtar Türetimi</span>
            <span className="font-mono font-semibold text-foreground">PBKDF2 (100k döngü)</span>
          </div>

          <div className="bg-surface-muted p-3 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted block">Veri Saklama Yeri</span>
            <span className="font-mono font-semibold text-foreground">Cihazınız (IndexedDB)</span>
          </div>

          <div className="bg-surface-muted p-3 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted block">Sunucuya Veri Gönderimi</span>
            <span className="font-mono font-semibold text-emerald-400">SIFIR (0 byte)</span>
          </div>
        </div>

        {/* Set Custom Password / PIN */}
        <div className="bg-surface-muted/50 p-4 rounded-xl border border-border/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Lock className="w-4 h-4 text-accent" />
            <span>Kişisel Kasa Şifresi / PIN Belirle</span>
          </div>
          <p className="text-[11px] text-muted">
            Kasanızı isteğe bağlı olarak kendi belirleyeceğiniz bir parola veya PIN ile koruyabilirsiniz.
          </p>

          <form onSubmit={handleSetCustomPin} className="flex gap-2 pt-1">
            <input
              type="password"
              value={customPin}
              onChange={(e) => setCustomPin(e.target.value)}
              placeholder="Yeni parola veya PIN (en az 4 karakter)"
              className="flex-1 bg-surface border border-border/70 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={customPin.length < 4}
              className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
            >
              Uygula
            </button>
          </form>

          {pinSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs pt-1">
              <Check className="w-3.5 h-3.5" />
              <span>Kasa şifresi başarıyla güncellendi!</span>
            </div>
          )}
        </div>

        {/* Backup and Restore */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Yedekleme ve Aktarma
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-surface hover:bg-surface-muted border border-border/60 hover:border-accent/40 text-foreground transition-all font-medium"
            >
              <Download className="w-4 h-4 text-accent" />
              <span>Şifreli Yedeği İndir</span>
            </button>

            <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-surface hover:bg-surface-muted border border-border/60 hover:border-accent/40 text-foreground transition-all font-medium cursor-pointer">
              <Upload className="w-4 h-4 text-accent" />
              <span>Yedekten Geri Yükle</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>

          {importStatus && (
            <p className="text-[11px] text-emerald-400 font-medium pt-1 text-center">{importStatus}</p>
          )}
        </div>

        {/* Emergency Purge */}
        <div className="pt-3 border-t border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
              <AlertOctagon className="w-4 h-4" />
              <span>Kriptografik İmha (Panik Butonu)</span>
            </div>
          </div>
          <p className="text-[11px] text-muted">
            Tüm konuşmalar, takvim etkinlikleri, hatırlatıcılar ve şifreleme anahtarları bu cihazdan kalıcı olarak silinir.
          </p>

          {confirmPurge ? (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handlePurge}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
              >
                Evet, Tüm Verileri Kalıcı Olarak Sil
              </button>
              <button
                onClick={() => setConfirmPurge(false)}
                className="px-3 py-2 rounded-xl bg-surface-muted text-muted text-xs hover:text-foreground"
              >
                Vazgeç
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmPurge(true)}
              className="w-full py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
            >
              Kasadaki Tüm Verileri Temizle
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
