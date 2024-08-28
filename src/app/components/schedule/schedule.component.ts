import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebuntisService } from '../../services/webuntis.service';
import { Element, Period, ScheduleMatrix } from '../../interfaces/data.interfaces'; // Adjust path as necessary

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnChanges {
  @Input() scheduleData: any; // Accepting the combined schedule data from the parent component

  weekDays: string[] = [];
  timeSlots: string[] = [];
  scheduleMatrix: ScheduleMatrix = {};

  constructor(private webUntisService: WebuntisService) { }

  ngOnChanges(changes: SimpleChanges): void {
  if (changes['scheduleData']) {
    if (this.scheduleData) {
      // Clear previous schedule data
      this.scheduleMatrix = {};
      this.weekDays = [];
      this.timeSlots = [];

      console.log('Schedule data updated:', this.scheduleData);

      // Define colors for different schedules
      const colors = ['#ff9999', '#66b3ff', '#99ff99']; // Example colors

      // Iterate over the selected schedules
      for (let i = 0; i < this.scheduleData.length; i++) {
        const data = this.scheduleData[i].data.result.data;
        this.processData(i, data.elementPeriods, data.elements, colors[i % colors.length]);
      }
    }
  }
}

  /*processData(index: number, elementPeriods: { [key: number]: Period[] }, elements: Element[], color: string): void {
  const elementMap = new Map<number, Element>(elements.map(e => [e.id, e]));

  // Initialize or update weekDays and timeSlots
  this.weekDays = [...new Set([
    ...this.weekDays,
    ...Object.values(elementPeriods).flat().map(period => this.formatDate(period.date))
  ])];
  this.timeSlots = [...new Set([
    ...this.timeSlots,
    ...Object.values(elementPeriods).flat().map(period => this.formatTimeSlot(period.startTime, period.endTime))
  ])];

  this.weekDays.sort((a, b) => a.localeCompare(b));
  this.timeSlots.sort((a, b) => this.compareTimeSlots(a, b));

  // Initialize or update scheduleMatrix
  if (index == 0) {
    this.scheduleMatrix = this.weekDays.reduce((matrix: ScheduleMatrix, day: string) => {
      matrix[day] = this.timeSlots.reduce((slots: { [timeSlot: string]: any[] }, slot: string) => {
        if (!matrix[day]) matrix[day] = {};
        slots[slot] = slots[slot] || [];
        return slots;
      }, {});
      return matrix;
    }, this.scheduleMatrix || {});
  }

  // Process each period and populate scheduleMatrix
  Object.entries(elementPeriods).forEach(([elementId, periods]: [string, Period[]]) => {
    periods.forEach((period: Period) => {
      const day = this.formatDate(period.date);
      const startTimeSlot = this.formatTimeSlot(period.startTime, period.endTime);

      let type3Element: Element | undefined;
      let type4Element: Element | undefined;

      period.elements.forEach(element => {
        const elementData = elementMap.get(element.id);
        if (elementData) {
          if (elementData.type === 3) {
            type3Element = elementData;
          } else if (elementData.type === 4) {
            type4Element = elementData;
          }
        }
      });

      const combinedElement = {
        name: type3Element ? `${type3Element.longName} ${period.lessonText}` : period.lessonText,
        rowspan: this.calculateRowspan(period.startTime, period.endTime),
        color: color // Assign color for differentiation
      };

      if (type3Element && type4Element) {
        combinedElement.name += ` (${type4Element.longName})`;
      }

      if (this.scheduleMatrix[day]) {
        if (this.scheduleMatrix[day][startTimeSlot]) {
          this.scheduleMatrix[day][startTimeSlot].push(combinedElement);
        } else {
          this.scheduleMatrix[day][startTimeSlot] = [combinedElement];
        }
      }
    });
  });
  console.log("matrix", this.scheduleMatrix);
  // Group consecutive events
  this.groupConsecutiveEvents();
}


  groupConsecutiveEvents() {
    this.weekDays.forEach(day => {
      let previousEvent: any = null;
      let rowspan = 1;

      this.timeSlots.forEach((slot, index) => {
        const events = this.scheduleMatrix[day][slot];
        if (events.length > 0) {
          const currentEvent = events[0];

          if (previousEvent && previousEvent.name === currentEvent.name) {
            rowspan++;
            previousEvent.rowspan = rowspan;
            this.scheduleMatrix[day][slot] = []; // Empty the current cell
          } else {
            if (previousEvent) previousEvent.rowspan = rowspan;
            previousEvent = currentEvent;
            rowspan = 1;
          }
        }
      });

      if (previousEvent) previousEvent.rowspan = rowspan;
    });
  }*/

  processData(index: number, elementPeriods: { [key: number]: Period[] }, elements: Element[], color: string) {
  const elementMap = new Map<number, Element>(elements.map(e => [e.id, e]));

  this.weekDays = [...new Set([
    ...this.weekDays,
    ...Object.values(elementPeriods).flat().map(period => this.formatDate(period.date))
  ])];
  this.timeSlots = [...new Set([
    ...this.timeSlots,
    ...Object.values(elementPeriods).flat().map(period => this.formatTimeSlot(period.startTime, period.endTime))
  ])];
  this.weekDays.sort((a, b) => a.localeCompare(b));
  this.timeSlots.sort(this.compareTimeSlots);

  // Initialize the scheduleMatrix for all days and slots
  this.weekDays.forEach(day => {
    if (!this.scheduleMatrix[day]) {
      this.scheduleMatrix[day] = {};
    }

    this.timeSlots.forEach(slot => {
      if (!this.scheduleMatrix[day][slot]) {
        this.scheduleMatrix[day][slot] = [];
      }
    });
  });

  Object.values(elementPeriods).flat().forEach((period: Period) => {
    const day = this.formatDate(period.date);
    const startTimeSlot = this.formatTimeSlot(period.startTime, period.endTime);

    const elementDataMap = period.elements.map(element => elementMap.get(element.id));
    
    const combinedElement = {
      name: elementDataMap.map(e => e ? e.longName : '').join(' ') + ' ' + period.lessonText,
      rowspan: this.calculateRowspan(period.startTime, period.endTime),
      color
    };

    if (this.scheduleMatrix[day]) {
      if (this.scheduleMatrix[day][startTimeSlot]) {
        this.scheduleMatrix[day][startTimeSlot].push(combinedElement);
      }
    }
  });
    console.log(this.scheduleMatrix);
}


  isRowspanHandled(day: string, slot: string): boolean {
    const events = this.scheduleMatrix[day][slot];
    if (events.length > 0) {
      const eventIndex = this.timeSlots.indexOf(slot);
      for (let i = 1; i < events[0].rowspan; i++) {
        const nextSlot = this.timeSlots[eventIndex + i];
        if (this.scheduleMatrix[day][nextSlot] && this.scheduleMatrix[day][nextSlot].length > 0) {
          return true; // Skip rendering if rowspan is already handled
        }
      }
    }
    return false;
  }

  getRowspan(events: { name: string; rowspan: number; }[]): number {
    return Math.max(...events.map(event => event.rowspan));
  }

  calculateRowspan(startTime: number, endTime: number): number {
    const startHour = Math.floor(startTime / 100);
    const endHour = Math.floor(endTime / 100);
    return endHour - startHour;
  }

  formatDate(date: number): string {
    // Convert date from YYYYMMDD to a readable format (e.g., "2024-09-20")
    const year = Math.floor(date / 10000);
    const month = Math.floor((date % 10000) / 100);
    const day = date % 100;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  formatTimeSlot(startTime: number, endTime: number): string {
    // Convert start and end times to "HH:mm" format
    const start = `${Math.floor(startTime / 100).toString().padStart(2, '0')}:${(startTime % 100).toString().padStart(2, '0')}`;
    const end = `${Math.floor(endTime / 100).toString().padStart(2, '0')}:${(endTime % 100).toString().padStart(2, '0')}`;
    return `${start}-${end}`;
  }

  compareTimeSlots(a: string, b: string): number {
    // Compare time slots in "HH:mm-HH:mm" format
    const [startA] = a.split('-');
    const [startB] = b.split('-');
    return startA.localeCompare(startB);
  }

  getElementClass(event: any): string {
    const elementId = 39482;
    return `element-${elementId}`;
  }
}

