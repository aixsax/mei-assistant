/**
 * @file calendarSync.ts
 * RFC 5545 uyumlu iCalendar (.ics) dışa ve içe aktarma servisi
 * Google Calendar, Apple Calendar, Outlook ile doğrudan uyumludur.
 */

import { CalendarEvent } from '../types';

export class CalendarSyncService {
  /**
   * Generates standard RFC 5545 .ics text from events
   */
  static generateICS(events: CalendarEvent[], calName: string = 'Mei Assistant Calendar'): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mei Assistant//Autonomous Calendar Engine//TR',
      `X-WR-CALNAME:${calName}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    events.forEach((ev) => {
      const dtStart = this.formatICSDate(ev.startDate, ev.startTime);
      const dtEnd = this.formatICSDate(ev.endDate, ev.endTime);
      const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${ev.id}@mei.assistant.local`);
      lines.push(`DTSTAMP:${now}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(`SUMMARY:${this.escapeICS(ev.title)}`);
      if (ev.description) {
        lines.push(`DESCRIPTION:${this.escapeICS(ev.description)}`);
      }
      if (ev.location) {
        lines.push(`LOCATION:${this.escapeICS(ev.location)}`);
      }
      lines.push(`CATEGORIES:${ev.category.toUpperCase()}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Formats YYYY-MM-DD and HH:mm into ICS local or UTC string (YYYYMMDDTHHmm00)
   */
  private static formatICSDate(dateStr: string, timeStr: string): string {
    const cleanDate = dateStr.replace(/-/g, '');
    const cleanTime = (timeStr || '09:00').replace(/:/g, '') + '00';
    return `${cleanDate}T${cleanTime}`;
  }

  private static escapeICS(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Triggers download of .ics file
   */
  static downloadICS(events: CalendarEvent[], filename: string = 'mei_calendar.ics'): void {
    const icsContent = this.generateICS(events);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Parses .ics file content into CalendarEvent objects
   */
  static parseICS(icsText: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const eventBlocks = icsText.split(/BEGIN:VEVENT/i).slice(1);

    eventBlocks.forEach((block, idx) => {
      const getField = (fieldName: string): string | undefined => {
        const regex = new RegExp(`^${fieldName}(?:;[^:]*)?:(.*)$`, 'im');
        const match = block.match(regex);
        return match ? match[1].trim() : undefined;
      };

      const summary = getField('SUMMARY') || 'İçe Aktarılan Etkinlik';
      const description = getField('DESCRIPTION');
      const location = getField('LOCATION');
      const dtStartRaw = getField('DTSTART');
      const dtEndRaw = getField('DTEND');

      const { date: startDate, time: startTime } = this.parseICSDateTime(dtStartRaw);
      const { date: endDate, time: endTime } = this.parseICSDateTime(dtEndRaw, startDate, startTime);

      events.push({
        id: `import_${Date.now()}_${idx}`,
        title: summary.replace(/\\,/g, ',').replace(/\\;/g, ';'),
        description: description?.replace(/\\n/g, '\n').replace(/\\,/g, ','),
        location: location?.replace(/\\,/g, ','),
        startDate: startDate || new Date().toISOString().split('T')[0],
        startTime: startTime || '09:00',
        endDate: endDate || startDate || new Date().toISOString().split('T')[0],
        endTime: endTime || '10:00',
        category: 'work',
        color: '#6366f1',
      });
    });

    return events;
  }

  private static parseICSDateTime(raw?: string, fallbackDate?: string, fallbackTime?: string): { date: string; time: string } {
    if (!raw) {
      return {
        date: fallbackDate || new Date().toISOString().split('T')[0],
        time: fallbackTime || '09:00',
      };
    }

    const clean = raw.replace(/Z$/, '');
    if (clean.includes('T')) {
      const [dPart, tPart] = clean.split('T');
      const year = dPart.substring(0, 4);
      const month = dPart.substring(4, 6);
      const day = dPart.substring(6, 8);
      const hour = tPart.substring(0, 2);
      const min = tPart.substring(2, 4);

      return {
        date: `${year}-${month}-${day}`,
        time: `${hour}:${min}`,
      };
    } else if (clean.length === 8) {
      // Date only
      const year = clean.substring(0, 4);
      const month = clean.substring(4, 6);
      const day = clean.substring(6, 8);
      return {
        date: `${year}-${month}-${day}`,
        time: '09:00',
      };
    }

    return {
      date: fallbackDate || new Date().toISOString().split('T')[0],
      time: fallbackTime || '09:00',
    };
  }
}
