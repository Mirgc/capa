import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RawScheduleData, ScheduleEvent, ScheduleMatrix } from '../../interfaces/data.interfaces';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnChanges {
  @Input() scheduleData: RawScheduleData[] = [];

  weekDays: string[] = [];
  timeSlots: string[] = [];
  scheduleMatrix: ScheduleMatrix = {};

  ngOnChanges(): void {
    if (this.scheduleData) {
      this.buildScheduleMatrix();
    }
  }

  buildScheduleMatrix(): void {
    this.weekDays = [];
    this.timeSlots = [];
    this.scheduleMatrix = {};

    const colors: Record<string, string> = {
      'medicina1': '#ff0c3c',
      'medicina2': '#3c0cff',
      'medicina3': '#9cfa0c'
    };

    this.scheduleData.forEach((schedule) => {
      const color = colors[schedule.courseType || 'medicina1'];

      schedule.days.forEach(day => {
        const formattedDate = this.formatDate(day.date);
        if (!this.weekDays.includes(formattedDate)) {
          this.weekDays.push(formattedDate);
        }

        if (!this.scheduleMatrix[formattedDate]) {
          this.scheduleMatrix[formattedDate] = {};
        }

        day.gridEntries.forEach(entry => {
          const start = this.formatTime(entry.duration.start);
          const end = this.formatTime(entry.duration.end);
          const slot = `${start}-${end}`;

          if (!this.timeSlots.includes(slot)) {
            this.timeSlots.push(slot);
          }

          if (!this.scheduleMatrix[formattedDate][slot]) {
            this.scheduleMatrix[formattedDate][slot] = [];
          }

          const subject = entry.position1.find(p => p.current?.type === 'SUBJECT')?.current;
          const room = entry.position2.find(p => p.current?.type === 'ROOM')?.current;
          let lessonInfo = '';
          if (entry.lessonInfo) {
            lessonInfo = entry.lessonInfo;
          }

          if (subject) {
            const courseType = schedule.courseType || 'medicina1';
            const baseColor = colors[courseType];
            const brightnessAmount = this.getBrightnessForLesson(courseType, subject.shortName);

            this.scheduleMatrix[formattedDate][slot].push({
              name: subject.displayName || subject.longName,
              room: room?.displayName || room?.shortName || '',
              lessonInfo: lessonInfo,
              color: this.adjustColorBrightness(baseColor, brightnessAmount)
            });
          }
        });
      });
    });

    // Ordenar días y franjas
    this.weekDays.sort((a, b) => this.parseDate(a).getTime() - this.parseDate(b).getTime());
    this.timeSlots.sort();
  }

  formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  }

  formatTime(isoStr: string): string {
    return isoStr.split('T')[1].substring(0, 5); // HH:mm
  }

  parseDate(dateStr: string): Date {
    const [d, m, y] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private lessonBrightness: Record<string, Record<string, number>> = {};
  private brightnessSteps = [25, 50, 75, 100, 130, 160, 190, 225];

  private getBrightnessForLesson(courseType: string, shortName: string): number {
    // Inicializar el mapa del curso si no existe
    if (!this.lessonBrightness[courseType]) {
      this.lessonBrightness[courseType] = {};
    }

    // Si ya tiene brillo asignado, devolverlo
    if (this.lessonBrightness[courseType][shortName] !== undefined) {
      return this.lessonBrightness[courseType][shortName];
    }

    // Si no, asignar el primer brillo disponible que no esté usado en este curso
    const usedBrightness = new Set(Object.values(this.lessonBrightness[courseType]));
    const available = this.brightnessSteps.find(b => !usedBrightness.has(b)) || 30;

    this.lessonBrightness[courseType][shortName] = available;
    return available;
  }

  adjustColorBrightness(hex: string, amount: number): string {
    const rgb = this.hexToRgb(hex);
    const adjusted = {
      r: Math.min(rgb.r + amount, 255),
      g: Math.min(rgb.g + amount, 255),
      b: Math.min(rgb.b + amount, 255)
    };
    return this.rgbToHex(adjusted.r, adjusted.g, adjusted.b);
  }

  hexToRgb(hex: string): { r: number; g: number; b: number } {
    const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthand, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  rgbToHex(r: number, g: number, b: number): string {
    const c = (n: number) => n.toString(16).padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
  }
}

