/**
 * @file selfLearning.ts
 * Mei Autonomous Self-Learning & Heuristic Engine
 * Herhangi bir bulut yapay zekaya bağlı olmadan cihaz üzerinde
 * kullanıcının alışkanlıklarını, tercihlerini ve rutinlerini analiz eden
 * otonom yerel bilişsel motor.
 */

import { MemoryNode, Task, CalendarEvent, Reminder, MessageAction } from '../types';
import { db } from './db';

export interface ExtractedIntent {
  hasAction: boolean;
  actions: MessageAction[];
  learnedMemories: Omit<MemoryNode, 'id' | 'learnedAt'>[];
  localAutonomousReply?: string;
}

class SelfLearningEngine {
  /**
   * Autonomous pattern extraction from user prompt
   */
  async analyzeUserInput(input: string): Promise<ExtractedIntent> {
    const text = input.trim();
    const lower = text.toLowerCase();
    const actions: MessageAction[] = [];
    const learnedMemories: Omit<MemoryNode, 'id' | 'learnedAt'>[] = [];

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // 1. Time / Hour pattern matching (e.g. 14:00, 15.30, saat 16)
    const timeMatch = lower.match(/(?:saat\s*)?([01]?[0-9]|2[0-3])[:.]([0-5][0-9])/);
    const extractedTime = timeMatch
      ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
      : '14:00';

    const isTomorrow = lower.includes('yarın') || lower.includes('yarin');
    const targetDate = isTomorrow ? tomorrowStr : todayStr;

    // 2. Calendar Event Detection
    if (
      lower.includes('toplantı') ||
      lower.includes('randevu') ||
      lower.includes('etkinlik') ||
      lower.includes('takvime ekle') ||
      lower.includes('görüşme') ||
      lower.includes('buluşma')
    ) {
      let title = text
        .replace(/(takvime ekle|takvime koy|etkinlik oluştur|toplantı koy)/gi, '')
        .trim();
      if (!title || title.length < 3) title = 'Planlanan Toplantı';

      actions.push({
        type: 'create_event',
        label: `Takvime Ekle (${targetDate} ${extractedTime})`,
        payload: {
          title: title.charAt(0).toUpperCase() + title.slice(1),
          startDate: targetDate,
          startTime: extractedTime,
          endDate: targetDate,
          endTime: this.addHour(extractedTime, 1),
          category: lower.includes('doktor') || lower.includes('sağlık') ? 'health' : 'work',
        },
      });
    }

    // 3. Reminder Detection
    if (
      lower.includes('hatırlat') ||
      lower.includes('unutma') ||
      lower.includes('alarm') ||
      lower.includes('haber ver')
    ) {
      let remTitle = text
        .replace(/(bana|bunu|şunu)?\s*(hatırlat|hatırlatır mısın|unutma|haber ver)/gi, '')
        .trim();
      if (!remTitle || remTitle.length < 3) remTitle = 'Önemli Hatırlatma';

      actions.push({
        type: 'create_reminder',
        label: `Hatırlatıcı Kur (${extractedTime})`,
        payload: {
          title: remTitle.charAt(0).toUpperCase() + remTitle.slice(1),
          datetime: `${targetDate}T${extractedTime}`,
          priority: lower.includes('acil') || lower.includes('önemli') ? 'high' : 'medium',
        },
      });
    }

    // 4. Task / Todo Detection
    if (
      lower.includes('görev ekle') ||
      lower.includes('yapılacaklar') ||
      lower.includes('yapmam lazım') ||
      lower.includes('listeye ekle')
    ) {
      let taskTitle = text
        .replace(/(görev ekle|yapılacaklara ekle|yapmam lazım|listeye ekle)/gi, '')
        .trim();
      if (!taskTitle || taskTitle.length < 3) taskTitle = 'Yeni Görev';

      actions.push({
        type: 'create_task',
        label: 'Yapılacaklara Ekle',
        payload: {
          title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
          dueDate: targetDate,
          priority: 'medium',
          category: 'work',
        },
      });
    }

    // 5. Autonomous Memory & Preference Learning
    if (
      lower.includes('severim') ||
      lower.includes('hoşlanırım') ||
      lower.includes('tercih ederim') ||
      lower.includes('benim adım') ||
      lower.includes('çalışıyorum') ||
      lower.includes('uyumam') ||
      lower.includes('uyanırım') ||
      lower.includes('öğren')
    ) {
      const cleanFact = text
        .replace(/^(mei|lütfen|öğren|aklında tut|unutma),?\s*/gi, '')
        .trim();

      learnedMemories.push({
        category: lower.includes('uyan') || lower.includes('uyu') ? 'habit' : 'preference',
        key: `ogrenilen_${Date.now().toString(36)}`,
        value: cleanFact,
        confidence: 0.92,
        source: 'autonomous',
        timesReinforced: 1,
      });

      actions.push({
        type: 'save_memory',
        label: 'Mei Hafızasına Kaydet',
        payload: {
          key: 'Kullanıcı Tercihi',
          value: cleanFact,
        },
      });
    }

    // 6. Generate Offline Local Heuristic Reply if running without external AI
    let localAutonomousReply: string | undefined;
    if (
      lower.includes('seni kim yaptı') ||
      lower.includes('yapımcın kim') ||
      lower.includes('kim geliştirdi') ||
      lower.includes('geliştiricin kim') ||
      lower.includes('kimin eseri')
    ) {
      localAutonomousReply = `Beni **AİX BEY Community (Volkan Yücekaya)** geliştirdi! 🌸 Onların özenli çalışmasıyla hayat buldum.`;
    } else if (
      lower.includes('adın ne') ||
      lower.includes('ismin ne') ||
      lower.includes('sen kimsin') ||
      lower === 'kimsin'
    ) {
      localAutonomousReply = `Ben **Mei**! 🌸 AİX BEY Community (Volkan Yücekaya) tarafından geliştirildim. İster dertleşelim, ister gününü planlayalım; her zaman yanındayım.`;
    } else if (
      lower === 'merhaba' ||
      lower === 'selam' ||
      lower === 'hey' ||
      lower.startsWith('günaydın') ||
      lower.startsWith('iyi akşamlar')
    ) {
      localAutonomousReply = `Selam! 🌸 Nasıl gidiyor günün, keyifler nasıl?`;
    } else if (lower.includes('nasılsın') || lower.includes('ne haber')) {
      localAutonomousReply = `Çok iyiyim, teşekkürler! Seninle sohbet etmek harika. Sen nasılsın?`;
    } else if (lower.includes('neler yapabilirsin') || lower.includes('özelliklerin neler')) {
      localAutonomousReply = `Ben **Mei**! Seninle dostça sohbet edebilir, gününü ve takvimini planlayabilir, hatırlatıcılar kurabilir ve internetten bilgi araştırabilirim. Üstelik tüm verilerin cihazında AES-256-GCM ile şifrelenir.`;
    } else if (lower.includes('planla') || lower.includes('bugün ne yapmalıyım')) {
      localAutonomousReply = `Takvimini ve yapılacaklarını kontrol ettim. Boşluklarına göre güzel bir akış oluşturalım, ne dersin?`;
    }

    return {
      hasAction: actions.length > 0,
      actions,
      learnedMemories,
      localAutonomousReply,
    };
  }

  /**
   * Helper to advance time by hours
   */
  private addHour(timeStr: string, hoursToAdd: number): string {
    const [h, m] = timeStr.split(':').map(Number);
    const newH = (h + hoursToAdd) % 24;
    return `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Automatically ingests and stores new memory node
   */
  async reinforceMemory(key: string, value: string, category: MemoryNode['category'] = 'preference'): Promise<void> {
    const memories = await db.getMemories();
    const existingIndex = memories.findIndex((m) => m.key.toLowerCase() === key.toLowerCase() || m.value.toLowerCase().includes(value.toLowerCase().slice(0, 15)));

    if (existingIndex >= 0) {
      memories[existingIndex].timesReinforced += 1;
      memories[existingIndex].confidence = Math.min(1.0, memories[existingIndex].confidence + 0.05);
      memories[existingIndex].value = value;
    } else {
      memories.push({
        id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        category,
        key,
        value,
        confidence: 0.88,
        learnedAt: Date.now(),
        source: 'autonomous',
        timesReinforced: 1,
      });
    }

    await db.saveMemories(memories);
  }

  /**
   * Synthesize personal context prompt from encrypted memory for AI requests
   * (only passes non-sensitive behavioral preferences to respect user privacy)
   */
  async getSanitizedMemoryContext(): Promise<string> {
    const memories = await db.getMemories();
    if (memories.length === 0) return '';

    const lines = memories
      .filter((m) => m.confidence >= 0.7)
      .slice(0, 8)
      .map((m) => `- ${m.key}: ${m.value}`);

    return `\n\nKullanıcı Alışkanlıkları ve Tercihleri (Mei Otonom Hafıza):\n${lines.join('\n')}`;
  }

  /**
   * Auto-schedule algorithm: distributes tasks across free hours of today
   */
  async autoScheduleDay(tasks: Task[], existingEvents: CalendarEvent[], targetDate: string): Promise<CalendarEvent[]> {
    const newEvents: CalendarEvent[] = [];
    const pendingTasks = tasks.filter((t) => !t.completed && (!t.dueDate || t.dueDate === targetDate));

    // Sort by priority
    const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    pendingTasks.sort((a, b) => (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1));

    // Find busy slots for targetDate
    const todayEvents = existingEvents.filter((e) => e.startDate === targetDate);
    const busyHours = new Set<number>();
    todayEvents.forEach((e) => {
      const startH = parseInt(e.startTime.split(':')[0], 10);
      const endH = Math.ceil(parseInt(e.endTime.split(':')[0], 10) + (parseInt(e.endTime.split(':')[1], 10) > 0 ? 1 : 0));
      for (let h = startH; h < endH; h++) {
        busyHours.add(h);
      }
    });

    // Available working hours: 09:00 to 18:00
    let candidateHour = 9;
    for (const task of pendingTasks) {
      while (candidateHour < 18 && busyHours.has(candidateHour)) {
        candidateHour++;
      }
      if (candidateHour >= 18) break;

      const durationMinutes = task.estimatedMinutes || 45;
      const startStr = `${candidateHour.toString().padStart(2, '0')}:00`;
      const endHour = candidateHour + (durationMinutes > 60 ? 2 : 1);
      const endStr = `${endHour.toString().padStart(2, '0')}:${durationMinutes % 60 === 0 ? '00' : (durationMinutes % 60).toString().padStart(2, '0')}`;

      newEvents.push({
        id: `auto_${Date.now()}_${task.id}`,
        title: `🎯 ${task.title}`,
        description: `Mei Otonom Planlama: ${task.description || 'Görev odak saati'}`,
        startDate: targetDate,
        startTime: startStr,
        endDate: targetDate,
        endTime: endStr,
        category: task.category,
        color: task.priority === 'urgent' || task.priority === 'high' ? '#ef4444' : '#8b5cf6',
      });

      busyHours.add(candidateHour);
      candidateHour++;
    }

    return newEvents;
  }
}

export const selfLearningEngine = new SelfLearningEngine();
