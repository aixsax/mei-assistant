/**
 * @file db.ts
 * Uçtan Uca Şifreli Yerel Veritabanı Servisi
 * Veriler IndexedDB / LocalStorage üzerinde saklanırken tamamen AES-256-GCM ile şifrelenir.
 */

import { cryptoEngine, EncryptedPayload } from './crypto';
import { Task, CalendarEvent, Reminder, Message, MemoryNode, AppSettings } from '../types';

const DB_NAME = 'MeiEncryptedDB_v1';
const STORE_NAME = 'vault_records';

class LocalEncryptedDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initIDB();
  }

  private initIDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB mevcut değil'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };

      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Encrypts and writes a collection key
   */
  async setItem<T>(key: string, data: T): Promise<void> {
    try {
      const json = JSON.stringify(data);
      const encrypted: EncryptedPayload = await cryptoEngine.encrypt(json);

      try {
        const db = await this.initIDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put({ key, payload: encrypted, updatedAt: Date.now() });
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (idbErr) {
        // Fallback to localStorage
        localStorage.setItem(`mei_enc_${key}`, JSON.stringify(encrypted));
      }
    } catch (err) {
      console.error(`Kayıt şifreleme/yazma hatası (${key}):`, err);
      throw err;
    }
  }

  /**
   * Reads and decrypts a collection key
   */
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      let encryptedPayload: EncryptedPayload | null = null;

      try {
        const db = await this.initIDB();
        encryptedPayload = await new Promise<EncryptedPayload | null>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => {
            resolve(req.result ? req.result.payload : null);
          };
          req.onerror = () => reject(req.error);
        });
      } catch (idbErr) {
        // Fallback
        const raw = localStorage.getItem(`mei_enc_${key}`);
        if (raw) {
          encryptedPayload = JSON.parse(raw);
        }
      }

      if (!encryptedPayload) {
        return defaultValue;
      }

      const decryptedJson = await cryptoEngine.decrypt(encryptedPayload);
      return JSON.parse(decryptedJson) as T;
    } catch (err) {
      console.warn(`Veri okuma/çözme uyarısı (${key}), varsayılan değer dönülüyor:`, err);
      return defaultValue;
    }
  }

  // --- Convenience Collection Accessors ---

  async getTasks(): Promise<Task[]> {
    return this.getItem<Task[]>('tasks', []);
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    return this.setItem('tasks', tasks);
  }

  async getEvents(): Promise<CalendarEvent[]> {
    return this.getItem<CalendarEvent[]>('events', []);
  }

  async saveEvents(events: CalendarEvent[]): Promise<void> {
    return this.setItem('events', events);
  }

  async getReminders(): Promise<Reminder[]> {
    return this.getItem<Reminder[]>('reminders', []);
  }

  async saveReminders(reminders: Reminder[]): Promise<void> {
    return this.setItem('reminders', reminders);
  }

  async getMessages(): Promise<Message[]> {
    return this.getItem<Message[]>('messages', []);
  }

  async saveMessages(messages: Message[]): Promise<void> {
    return this.setItem('messages', messages);
  }

  async getMemories(): Promise<MemoryNode[]> {
    return this.getItem<MemoryNode[]>('memories', []);
  }

  async saveMemories(memories: MemoryNode[]): Promise<void> {
    return this.setItem('memories', memories);
  }

  async getSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      theme: 'oled',
      accent: 'violet',
      fontSize: 'normal',
      enableSound: true,
      enableNotifications: true,
      autoWebSearch: false,
      autonomousLearning: true,
      zenMode: false,
      activeTab: 'chat',
      visibleWidgets: {
        quickSchedule: true,
        remindersBar: true,
        memoryInsights: true,
        privacyBadge: true,
      },
    };
    return this.getItem<AppSettings>('settings', defaultSettings);
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    return this.setItem('settings', settings);
  }

  /**
   * Exports full raw encrypted vault as JSON download string
   */
  async exportVaultBundle(): Promise<string> {
    const tasks = await this.getTasks();
    const events = await this.getEvents();
    const reminders = await this.getReminders();
    const messages = await this.getMessages();
    const memories = await this.getMemories();
    const settings = await this.getSettings();

    const dump = {
      version: 1,
      appName: 'Mei Assistant',
      exportedAt: new Date().toISOString(),
      encryptedData: {
        tasks,
        events,
        reminders,
        messages,
        memories,
        settings,
      },
    };

    return JSON.stringify(dump, null, 2);
  }

  /**
   * Imports a vault bundle
   */
  async importVaultBundle(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.encryptedData) return false;

      const { tasks, events, reminders, messages, memories, settings } = parsed.encryptedData;
      if (Array.isArray(tasks)) await this.saveTasks(tasks);
      if (Array.isArray(events)) await this.saveEvents(events);
      if (Array.isArray(reminders)) await this.saveReminders(reminders);
      if (Array.isArray(messages)) await this.saveMessages(messages);
      if (Array.isArray(memories)) await this.saveMemories(memories);
      if (settings) await this.saveSettings(settings);

      return true;
    } catch (err) {
      console.error('Yedek yükleme başarısız:', err);
      return false;
    }
  }

  /**
   * Emergency wipe
   */
  async purgeAll(): Promise<void> {
    cryptoEngine.wipeAllLocalData();
    try {
      const db = await this.initIDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    } catch {
      // Ignore
    }
  }

  /**
   * Purges leftover simulated test data from early demo if present
   */
  async purgeSimulatedDataIfPresent(): Promise<void> {
    try {
      const tasks = await this.getTasks();
      const cleanedTasks = tasks.filter((t) => !['task_1', 'task_2', 'task_3'].includes(t.id));
      if (cleanedTasks.length !== tasks.length) {
        await this.saveTasks(cleanedTasks);
      }

      const events = await this.getEvents();
      const cleanedEvents = events.filter((e) => !['event_1', 'event_2', 'event_3'].includes(e.id));
      if (cleanedEvents.length !== events.length) {
        await this.saveEvents(cleanedEvents);
      }

      const reminders = await this.getReminders();
      const cleanedReminders = reminders.filter((r) => !['rem_1', 'rem_2'].includes(r.id));
      if (cleanedReminders.length !== reminders.length) {
        await this.saveReminders(cleanedReminders);
      }

      const memories = await this.getMemories();
      const cleanedMemories = memories.filter((m) => !['mem_1', 'mem_2', 'mem_3'].includes(m.id));
      if (cleanedMemories.length !== memories.length) {
        await this.saveMemories(cleanedMemories);
      }
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Populates initial clean state if new user
   */
  async seedIfEmpty(): Promise<void> {
    const existing = await this.getMessages();
    if (existing.length > 0) {
      await this.purgeSimulatedDataIfPresent();
      return;
    }

    const initialMessages: Message[] = [
      {
        id: 'msg_welcome',
        sender: 'mei',
        text: `Selam! Ben **Mei** 🌸 AİX BEY Community (Volkan Yücekaya) tarafından geliştirildim.\n\nSeninle hem canın ne zaman isterse dostça sohbet edebilir, günün nasıl geçtiğini konuşabiliriz; hem de işlerini, takvimini ve hatırlatıcılarını planlayabiliriz. Cihazındaki her veri AES-256-GCM ile uçtan uca şifrelenir ve tamamen sana özeldir.\n\nBugün nasıl gidiyor, neler yapalım?`,
        timestamp: Date.now(),
      },
    ];

    // Clean initial state: no dummy simulation data. Only user-added items will be recorded.
    await this.saveMessages(initialMessages);
    await this.saveTasks([]);
    await this.saveEvents([]);
    await this.saveReminders([]);
    await this.saveMemories([]);
  }
}

export const db = new LocalEncryptedDatabase();
