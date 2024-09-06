import { Component, OnInit } from '@angular/core';
import { WebuntisService } from '../../services/webuntis.service';
import { addDays, format, parse, startOfWeek } from 'date-fns';
import { NgbCalendar, NgbDateStruct, NgbAlertModule, NgbDatepickerModule, NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { ScheduleComponent } from '../schedule/schedule.component';
import { FormsModule } from '@angular/forms'; 
import { CommonModule, JsonPipe, NgClass } from '@angular/common';
import { Element } from '../../interfaces/data.interfaces';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ScheduleComponent, FormsModule, NgbDatepickerModule, NgbAlertModule, JsonPipe, NgbCollapseModule, NgClass, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  elementIds = {
    grupo1: {
      medicina1: 39457,
      medicina2: 39477,
      medicina3: 39372
    },
    grupo2: {
      medicina1: 39462,
      medicina2: 39482,
      medicina3: 39377
    }
  };

  selElementId: any;

  isCollapsed = false; 

  currentDate = new Date();
  currentWeekStart: Date;

  medicina1Schedule: any = null;
  medicina2Schedule: any = null;
  medicina3Schedule: any = null;

  selectedMedicina: string[] = ['medicina1']; // Default to showing "1 Medicina"
  selectedGroup: string = 'grupo2'; // Default to showing "1 Medicina"
  filterType4 = false;
  selectedLessons: Set<number> = new Set<number>();
  selectedLessonsMap: { [key: number]: boolean } = {};

  combinedScheduleData: any = null; // To store the combined schedule data based on selected options
  copyData: any = null; // To store the combined schedule data based on selected options
  filterData: any = null; // To store the combined schedule data based on selected options

  calendarVisible = false; // For showing/hiding the calendar
  model: any = null; // Model for NgbDate

  constructor(private webuntisService: WebuntisService, private calendar: NgbCalendar, private metaService: Meta, private titleService: Title) {
    this.currentWeekStart = startOfWeek(new Date(this.currentDate), { weekStartsOn: 1 }); // Monday
  }

  ngOnInit(): void {
    this.titleService.setTitle('Horario de clases de Medicina UPV/EHU');
    this.metaService.updateTag({ name: 'description', content: 'Consulta tus horarios de medicina de la UPV/EHU con el mejor sistema.' });
    this.metaService.updateTag({ name: 'keywords', content: 'medicina, horarios, clases, organización, estudiantes' });
    this.loadSchedules();
  }

  loadSchedules(Lessons: Set<number> = new Set()): void {
    if (this.selectedGroup === "grupo1"){
        this.selElementId = this.elementIds.grupo1;
    } else if (this.selectedGroup === "grupo2") {
      this.selElementId = this.elementIds.grupo2;
    }

    this.webuntisService.getData(this.selElementId.medicina1, this.formatDate(this.currentWeekStart)).subscribe(response => {
      if (response?.data?.result?.data) {
        response.data.result.data.noDetails = '0';
      }
      this.medicina1Schedule = response;
      this.updateSchedule(Lessons);
    });

    this.webuntisService.getData(this.selElementId.medicina2, this.formatDate(this.currentWeekStart)).subscribe(response => {
      if (response?.data?.result?.data) {
        response.data.result.data.noDetails = '1';
      }
      this.medicina2Schedule = response;
      this.updateSchedule(Lessons);
    });

    this.webuntisService.getData(this.selElementId.medicina3, this.formatDate(this.currentWeekStart)).subscribe(response => {
      if (response?.data?.result?.data) {
        response.data.result.data.noDetails = '2';
      }
      this.medicina3Schedule = response;
      this.updateSchedule(Lessons);
    });
  }

  formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  formatDateToShow(date:Date): string {
    return format(date, 'dd-MM-yyyy');
  }

  updateSchedule(previousSelectedLessons: Set<number> = new Set()): void {
    let combinedData: any[] = [];

    this.copyData = null;
    this.selectedLessons = previousSelectedLessons;

    if (this.selectedMedicina.includes('medicina1') && this.medicina1Schedule) {
      if (this.selectedLessons.size == 0){
        this.populateSelectedLessons(this.medicina1Schedule);
      }
      combinedData = combinedData.concat(this.medicina1Schedule);
    }

    if (this.selectedMedicina.includes('medicina2') && this.medicina2Schedule) {
      this.populateSelectedLessons(this.medicina2Schedule);
      combinedData = combinedData.concat(this.medicina2Schedule);
    }

    if (this.selectedMedicina.includes('medicina3') && this.medicina3Schedule) {
      this.populateSelectedLessons(this.medicina3Schedule);
      combinedData = combinedData.concat(this.medicina3Schedule);
    }
    
    this.copyData = JSON.parse(JSON.stringify(combinedData));
    this.combinedScheduleData = combinedData;
    console.log(this.combinedScheduleData);
    this.applyLessonFilter();
  }

  applyLessonFilter(): void {
    // Filtrar datos con el nuevo selectedLessons
    this.filterData = JSON.parse(JSON.stringify(this.copyData));
    let combinedData = this.filterData.map((schedule: any) => {
      const filteredPeriods: { [key: string]: any[] } = {};
      
      for (const key in schedule.data.result.data.elementPeriods as { [key: string]: any[] }) {
        const periods = schedule.data.result.data.elementPeriods[key];

        filteredPeriods[key] = periods.map((period: any) => {
          // Filtrar los elementos dentro del periodo
          const filteredElements = period.elements.filter((element: any) => {
            if (element.type === 3){
              return this.selectedLessons.has(element.id) ? element : null;
            } else if (period.elements[0].type === 3 && this.selectedLessons.has(period.elements[0].id)){
              return element.type === 4 ? element : null;
            } else {
              return null;
            }
          }).filter((element: any) => element !== null);

          // Retornar el periodo solo si contiene elementos filtrados
          return {
            ...period,
            elements: filteredElements
          };
        })
      }

      schedule.data.result.data.elementPeriods = filteredPeriods;
      return schedule;
    });
    
    this.combinedScheduleData = combinedData;
  }

  previousWeek(): void {
    this.currentWeekStart = addDays(this.currentWeekStart, -7);
    this.updateInputValue();
    this.loadSchedules(this.selectedLessons);
  }

  nextWeek(): void {
    this.currentWeekStart = addDays(this.currentWeekStart, 7);
    this.updateInputValue();
    this.loadSchedules(this.selectedLessons);
  }

  onGroupSelectionChange(event: Event, grupo: string): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      if (!this.selectedGroup.includes(grupo)) {
        this.selectedGroup = grupo;
      }
    } else {
      this.selectedMedicina = this.selectedMedicina.filter(item => item !== grupo);
    }

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

  populateSelectedLessons(schedule: any): void {
    const elements = schedule.data.result.data.elements;
    elements.forEach((element: Element) => {
      if (element.type === 3 && !this.selectedLessons.has(element.id)) {
        this.selectedLessons.add(element.id);
      }
    });
  }
  

  onLessonSelectionChange(event: Event, lessonId: number): void {
    const checkbox = event.target as HTMLInputElement;
    
    if (checkbox.checked) {
      this.selectedLessons.add(lessonId);
    } else {
      this.selectedLessons.delete(lessonId);
    }
  }

  onInputChange(date: NgbDateStruct): void {
    const dateString = `${date.day}-${date.month}-${date.year}`;
    const jsDate = parse(dateString, 'dd-MM-yyyy', new Date());
    this.currentWeekStart = startOfWeek(jsDate, { weekStartsOn: 1 });
    this.updateInputValue();
    this.loadSchedules(this.selectedLessons);
  }

  private updateInputValue(): void {
    const input = document.querySelector('input[name="dp"]') as HTMLInputElement;
    if (input) {
      input.value = format(this.currentWeekStart, 'dd-MM-yyyy');
    }
  }
}
