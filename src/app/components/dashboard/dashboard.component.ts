import { Component, OnInit } from '@angular/core';
import { WebuntisService } from '../../services/webuntis.service';
import { addDays, format, startOfWeek } from 'date-fns';
import { NgbDate, NgbCalendar, NgbDateStruct, NgbAlertModule, NgbDatepickerModule, NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { ScheduleComponent } from '../schedule/schedule.component';
import { FormsModule } from '@angular/forms'; 
import { JsonPipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ScheduleComponent, FormsModule, NgbDatepickerModule, NgbAlertModule, JsonPipe, NgbCollapseModule, NgClass],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  elementIds = {
    medicina1: 39462,
    medicina2: 39482,
    medicina3: 39377
  };

  isCollapsed = false; 

  currentDate = "2024-09-16";
  //currentDate = new Date();
  currentWeekStart: Date;

  medicina1Schedule: any = null;
  medicina2Schedule: any = null;
  medicina3Schedule: any = null;

  selectedMedicina: string[] = ['medicina1']; // Default to showing "1 Medicina"
  filterType4 = false;
  selectedLongName: string | null = null;

  combinedScheduleData: any = null; // To store the combined schedule data based on selected options

  calendarVisible = false; // For showing/hiding the calendar
  model: any = null; // Model for NgbDate

  constructor(private webuntisService: WebuntisService, private calendar: NgbCalendar) {
    this.currentWeekStart = startOfWeek(new Date(this.currentDate), { weekStartsOn: 1 }); // Monday
  }

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    this.webuntisService.getData(this.elementIds.medicina1, this.formatDate(this.currentWeekStart)).subscribe(response => {
      this.medicina1Schedule = response;
      this.updateSchedule();
    });

    this.webuntisService.getData(this.elementIds.medicina2, this.formatDate(this.currentWeekStart)).subscribe(response => {
      this.medicina2Schedule = response;
      this.updateSchedule();
    });

    this.webuntisService.getData(this.elementIds.medicina3, this.formatDate(this.currentWeekStart)).subscribe(response => {
      this.medicina3Schedule = response;
      this.updateSchedule();
    });
  }

  formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  updateSchedule(): void {
    let combinedData: any[] = [];

    if (this.selectedMedicina.includes('medicina1') && this.medicina1Schedule) {
      combinedData = combinedData.concat(this.filterSchedule(this.medicina1Schedule));
    }

    if (this.selectedMedicina.includes('medicina2') && this.medicina2Schedule) {
      combinedData = combinedData.concat(this.filterSchedule(this.medicina2Schedule));
    }

    if (this.selectedMedicina.includes('medicina3') && this.medicina3Schedule) {
      combinedData = combinedData.concat(this.filterSchedule(this.medicina3Schedule));
    }

    this.combinedScheduleData = combinedData;
  }

  filterSchedule(schedule: any): any {
    if (this.filterType4 && this.selectedLongName) {
      schedule.data.result.data.elementPeriods = this.filterByType4AndLongName(schedule.data.result.data.elementPeriods);
    }
    return schedule;
  }

  filterByType4AndLongName(elementPeriods: { [key: string]: any[] }): { [key: string]: any[] } {
    const filteredElementPeriods: { [key: string]: any[] } = {};

    Object.keys(elementPeriods).forEach((key: string) => {
      filteredElementPeriods[key] = elementPeriods[key].filter(period => {
        return period.elements.some((element: any) => element.type === 4 && element.longName === this.selectedLongName);
      });
    });

    return filteredElementPeriods;
  }

  previousWeek(): void {
    this.currentWeekStart = addDays(this.currentWeekStart, -7);
    this.updateInputValue();
    this.loadSchedules();
  }

  nextWeek(): void {
    this.currentWeekStart = addDays(this.currentWeekStart, 7);
    this.updateInputValue();
    this.loadSchedules();
  }

  onDateSelect(date: NgbDate): void {
    this.calendarVisible = false;

    // Convert NgbDate to JavaScript Date
    const jsDate = new Date(date.year, date.month - 1, date.day);

    // Calculate the start of the selected week (assuming week starts on Monday)
    this.currentWeekStart = startOfWeek(jsDate, { weekStartsOn: 1 });

    // Load schedules for the selected week
    this.loadSchedules();
  }

  onMedicinaSelectionChange(event: Event, medicina: string): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      if (!this.selectedMedicina.includes(medicina)) {
        this.selectedMedicina.push(medicina);
      }
    } else {
      this.selectedMedicina = this.selectedMedicina.filter(item => item !== medicina);
    }

    this.updateSchedule();
  }

  onLongNameFilterChange(longName: string | null): void {
    this.selectedLongName = longName;
    this.updateSchedule();
  }

  onInputChange(date: NgbDateStruct): void {
    debugger;
    const jsDate = new Date(date.year, date.month - 1, date.day);
    this.currentWeekStart = startOfWeek(jsDate, { weekStartsOn: 1 });
    this.updateInputValue();
    this.loadSchedules();
  }

  private updateInputValue(): void {
    const input = document.querySelector('input[name="dp"]') as HTMLInputElement;
    if (input) {
      input.value = this.formatDate(this.currentWeekStart);
    }
  }
}
