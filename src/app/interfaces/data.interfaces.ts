export interface Element {
  type: number;
  id: number;
  name: string;
  longName: string;
  displayname: string;
  alternatename: string;
  color: string;
}

export interface PeriodElement {
  type: number;
  id: number;
  orgId: number;
  missing: boolean;
  state: string;
}

export interface ElementPeriods {
  [key: string]: Period[];
}

export interface Period {
  id: number;
  lessonId: number;
  lessonNumber: number;
  lessonCode: string;
  lessonText: string;
  periodText: string;
  periodInfo: string;
  periodAttachments: any[];
  substText: string;
  date: number;
  startTime: number;
  endTime: number;
  elements: PeriodElement[];
  studentGroup: string;
}

export interface DataResult {
  data: {
    result: {
      data: {
        noDetails: boolean;
        elementIds: number[];
        elementPeriods: {
          [key: number]: Period[];
        };
        elements: Element[];
      }
    }
  };
}

export interface ScheduleMatrix {
  [day: string]: {
    [timeSlot: string]: { name: string; id: string; rowspan: number; color: string}[];
  };
}
