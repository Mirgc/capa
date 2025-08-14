import { Component, OnInit } from '@angular/core';
import { WebuntisService } from '../../services/webuntis.service';
import { addDays, format, parse, startOfWeek } from 'date-fns';
import { NgbAlertModule, NgbCalendar, NgbCollapseModule, NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { ScheduleComponent } from '../schedule/schedule.component';
import { FormsModule } from '@angular/forms';
import { CommonModule, JsonPipe, NgClass } from '@angular/common';
import { RawScheduleData } from '../../interfaces/data.interfaces';
import { Title } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ScheduleComponent, FormsModule, NgbDatepickerModule, NgbAlertModule, JsonPipe, NgbCollapseModule, NgClass, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  elementIds: {
    [key: string]: {
      medicina1: number;
      medicina2: number;
      medicina3: number;
    }
  } = {
    grupo1: {
      medicina1: 46487,
      medicina2: 46499,
      medicina3: 46436
    },
    grupo2: {
      medicina1: 46490,
      medicina2: 46502,
      medicina3: 46439
    }
  };

  selElementId: any;
  isCollapsed = false;

  currentDate = new Date();
  currentWeekStart: Date;
  currentWeekFriday: Date;

  medicina1Schedule: RawScheduleData | null = null;
  medicina2Schedule: RawScheduleData | null = null;
  medicina3Schedule: RawScheduleData | null = null;

  selectedMedicina: string[] = ['medicina1'];
  selectedGroup: string = 'grupo2';
  selectedLessons: Set<string> = new Set<string>();
  allLessons: Array<{ shortName: string; longName: string }> = [];
  combinedScheduleData: RawScheduleData[] = [];
  copyData: RawScheduleData[] = [];
  loading: boolean = true;

  model: any = null;

  constructor(
    private webuntisService: WebuntisService,
    private calendar: NgbCalendar,
    private titleService: Title
  ) {
    this.currentWeekStart = startOfWeek(new Date(this.currentDate), { weekStartsOn: 1 });
    this.currentWeekFriday = addDays(this.currentWeekStart, 4);
  }

  ngOnInit(): void {
    this.titleService.setTitle('Horario de clases de Medicina UPV/EHU');
    this.loadSchedules();
  }

  /*trackBySchedule(index: number, schedule: RawScheduleData): any {
    return index; // o un ID único si lo tienes, como schedule.id
  }*/

  loadSchedules(): void {
    this.loading = true;

    this.selElementId = this.elementIds[this.selectedGroup];

    const requests = [
      this.webuntisService.getData(this.selElementId.medicina1, this.formatDate(this.currentWeekStart), this.formatDate(this.currentWeekFriday)),
      this.webuntisService.getData(this.selElementId.medicina2, this.formatDate(this.currentWeekStart), this.formatDate(this.currentWeekFriday)),
      this.webuntisService.getData(this.selElementId.medicina3, this.formatDate(this.currentWeekStart), this.formatDate(this.currentWeekFriday))
    ];

    forkJoin(requests).subscribe(
      responses => {
        [this.medicina1Schedule, this.medicina2Schedule, this.medicina3Schedule] = responses;
        this.medicina1Schedule = { ...responses[0], courseType: 'medicina1' };
        this.medicina2Schedule = { ...responses[1], courseType: 'medicina2' };
        this.medicina3Schedule = { ...responses[2], courseType: 'medicina3' };
        this.updateSchedule();
        this.loading = false;
      },
      error => {
        console.error('Error al cargar los horarios', error);
        this.loading = false;
      }
    );
  }

  formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  formatDateToShow(date: Date): string {
    return format(date, 'dd-MM-yyyy');
  }

  updateSchedule(): void {
    this.combinedScheduleData = [];

    if (this.selectedMedicina.includes('medicina1') && this.medicina1Schedule) {
      this.combinedScheduleData.push(this.medicina1Schedule);
    }
    if (this.selectedMedicina.includes('medicina2') && this.medicina2Schedule) {
      this.combinedScheduleData.push(this.medicina2Schedule);
    }
    if (this.selectedMedicina.includes('medicina3') && this.medicina3Schedule) {
      this.combinedScheduleData.push(this.medicina3Schedule);
    }

    this.copyData = JSON.parse(JSON.stringify(this.combinedScheduleData));
    this.updateAllLessons();
    this.applyLessonFilter();
  }

  updateAllLessons(): void {
    this.allLessons = [];
    const seen = new Set<string>();

    this.combinedScheduleData.forEach(schedule => {
      schedule.days.forEach(day => {
        day.gridEntries.forEach(entry => {
          entry.position1.forEach(pos => {
            const subject = pos.current;
            if (subject?.type === 'SUBJECT' && !seen.has(subject.shortName)) {
              seen.add(subject.shortName);
              this.allLessons.push({
                shortName: subject.shortName,
                longName: subject.longName
              });
            }
          });
        });
      });
    });
  }

  applyLessonFilter(): void {
    this.seenSubjects.clear();
    this.combinedScheduleData = JSON.parse(JSON.stringify(this.copyData));

    if (this.selectedLessons.size === 0) return;

    this.combinedScheduleData = this.combinedScheduleData.map(schedule => ({
      ...schedule,
      days: schedule.days.map(day => ({
        ...day,
        gridEntries: day.gridEntries.filter(entry => {
          const subject = entry.position1.find(p => p.current?.type === 'SUBJECT')?.current;
          return subject ? this.selectedLessons.has(subject.shortName) : false;
        })
      }))
    }));
  }

  previousWeek(): void {
    this.currentWeekStart = addDays(this.currentWeekStart, -7);
    this.currentWeekFriday = addDays(this.currentWeekFriday, -7);
    this.loadSchedules();
  }

  nextWeek(): void {
    this.currentWeekStart = addDays(this.currentWeekStart, 7);
    this.currentWeekFriday = addDays(this.currentWeekFriday, 7);
    this.loadSchedules();
  }

  onGroupSelectionChange(event: Event, grupo: string): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedGroup = grupo;
      this.loadSchedules();
    }
  }

  onMedicinaSelectionChange(event: Event, medicina: string): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.selectedMedicina.includes(medicina)) {
        this.selectedMedicina.push(medicina);
      }
    } else {
      this.selectedMedicina = this.selectedMedicina.filter(m => m !== medicina);
    }
    this.updateSchedule();
  }

  onLessonSelectionChange(event: Event, lessonShortName: string): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedLessons.add(lessonShortName);
    } else {
      this.selectedLessons.delete(lessonShortName);
    }
  }

  onInputChange(date: NgbDateStruct): void {
    const dateString = `${date.year}-${date.month}-${date.day}`;
    const jsDate = new Date(dateString);
    this.currentWeekStart = startOfWeek(jsDate, { weekStartsOn: 1 });
    this.currentWeekFriday = addDays(this.currentWeekStart, 4);
    this.loadSchedules();
  }

  private seenSubjects = new Set<string>();

  isUniqueSubject(shortName: string): boolean {
    if (this.seenSubjects.has(shortName)) {
      return false;
    }
    this.seenSubjects.add(shortName);
    return true;
  }

  hasPosition1(entry: any): boolean {
    return entry.position1 && entry.position1.length > 0;
  }

  ngOnDestroy() {
    this.seenSubjects.clear();
  }
}