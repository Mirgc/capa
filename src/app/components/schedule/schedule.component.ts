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
  color: string | undefined;

  constructor(private webUntisService: WebuntisService) { }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('schedule: ', changes);
    if (changes['scheduleData']) {
      if (this.scheduleData) {
        // Clear previous schedule data
        this.scheduleMatrix = {};
        this.weekDays = [];
        this.timeSlots = [];

        // Define colors for different schedules
        const colors = ['#ff3c3c', '#3c3cff', '#3cff3c']; // Example colors

        // Iterate over the selected schedules
        for (let i = 0; i < this.scheduleData.length; i++) {
          const data = this.scheduleData[i].data.result.data;
          this.processData(i, data.elementPeriods, data.elements, colors[data.noDetails]);
        }
      }
    }
  }

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
    console.log('weekDays: ', this.weekDays);
    console.log('timeSlots: ', this.timeSlots);
    
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
    
    Object.values(elements).forEach(element => {
      //debugger;
      if (element.type === 3) {
        element.color = this.adjustColorBrightness(color);
        color = element.color;
      }
    });

    Object.values(elementPeriods).flat().forEach((period: Period) => {
      const day = this.formatDate(period.date);
      const startTimeSlot = this.formatTimeSlot(period.startTime, period.endTime);
      
      const elementDataMap = period.elements.map(element => elementMap.get(element.id));

      
      const nameParts = elementDataMap
      .map(e => e ? e.longName : '');

      const combinedElement = {
        name: nameParts.length > 0 ? nameParts.join(' ') + ' ' + period.lessonText : '',
        id: elementDataMap.map(e => e? e.id : '').join(''),
        rowspan: 1,
        color: nameParts.length > 0 ? elementDataMap.map(e => e ? e.color : '').join('') : "#ffffff"
      };

      if (this.scheduleMatrix[day]) {
        if (this.scheduleMatrix[day][startTimeSlot]) {
          this.scheduleMatrix[day][startTimeSlot].push(combinedElement);
        }
      }
      console.log('scheduleMatrix: ', this.scheduleMatrix);
    });
  }

  getRowspan(events: { name: string; rowspan: number; }[]): number {
    return Math.max(...events.map(event => event.rowspan));
  }

  /*calculateRowspan() {
    // Primero, calculamos el rowspan y marcamos los elementos a eliminar
    for (const day in this.scheduleMatrix) {
      if (this.scheduleMatrix.hasOwnProperty(day)) {
        const slots = this.scheduleMatrix[day];
        const timeSlots = Object.keys(slots);

        for (let i = 0; i < timeSlots.length; i++) {
          const currentSlot = timeSlots[i];
          const currentElements = slots[currentSlot];

          currentElements.forEach((currentElement) => { // Quitamos el índice porque no es necesario ahora
            let rowspan = 1;

            for (let j = i + 1; j < timeSlots.length; j++) {
              const nextSlot = timeSlots[j];
              const nextElements = slots[nextSlot];
              let foundMatch = false; // Para saber si encontramos una coincidencia en el siguiente slot

              if (nextElements && nextElements.length > 0) {
                // Recorrer todos los elementos del siguiente slot
                for (let k = 0; k < nextElements.length; k++) {
                  const nextElement = nextElements[k];

                  if (currentElement.name === nextElement.name) {
                    rowspan++;
                    nextElement.del = true; // Marcamos el elemento para eliminarlo
                    foundMatch = true; // Indicar que hemos encontrado una coincidencia
                    break; // Detener la búsqueda una vez que encontramos una coincidencia
                  }
                }
              }

              if (!foundMatch) {
                break; // Detener si no encontramos una coincidencia en el siguiente slot
              }
            }

            currentElement.rowspan = rowspan;
          });
        }
      }
    }

    // Luego, eliminamos los elementos marcados con del: true
    for (const day in this.scheduleMatrix) {
      if (this.scheduleMatrix.hasOwnProperty(day)) {
        const slots = this.scheduleMatrix[day];
        const timeSlots = Object.keys(slots);

        timeSlots.forEach(slot => {
          const elements = slots[slot];
          slots[slot] = elements.filter(element => !element.del); // Filtramos los elementos que no tienen del: true
        });
      }
    }
  }*/
 

  formatDate(date: number): string {
    // Convert date from YYYYMMDD to a readable format (e.g., "2024-09-20")
    const year = Math.floor(date / 10000);
    const month = Math.floor((date % 10000) / 100);
    const day = date % 100;
    return `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
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

  adjustColorBrightness(hexColor: string): string {
    // Convert hex to RGB
    const rgb = this.hexToRgb(hexColor);

    // Add 20 to each RGB component, ensuring it doesn't exceed 255
    const adjustedRgb = {
      r: Math.min(rgb.r + 30, 255),
      g: Math.min(rgb.g + 30, 255),
      b: Math.min(rgb.b + 30, 255)
    };

    // Convert back to hex and return
    return this.rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
  }

  // Helper function to convert hex to RGB
  hexToRgb(hex: string): { r: number, g: number, b: number } {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  // Helper function to convert RGB to hex
  rgbToHex(r: number, g: number, b: number): string {
    const componentToHex = (c: number) => {
      const hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    };

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
}

