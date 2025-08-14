export interface PositionCurrent {
  type: 'SUBJECT' | 'ROOM' | 'INFO' | string;
  status: string;
  shortName: string;
  longName: string;
  displayName: string;
  displayNameLabel: string | null;
}

export interface PositionItem {
  current: PositionCurrent | null;
  removed: any; // Puede ser null o más complejo
}

export interface GridEntry {
  ids: number[];
  duration: {
    start: string; // ISO string
    end: string;   // ISO string
  };
  type: string;
  status: string;
  color: string; // Ej: "bfc8cf"
  position1: PositionItem[];
  position2: PositionItem[];
  position3: PositionItem[];
  position4: PositionItem | null;
  position5: PositionItem | null;
  position6: PositionItem[];
  position7: PositionItem[];
  lessonInfo: string | null;
  lessonText: string | null;
}

export interface Day {
  date: string; // "2025-09-15"
  resourceType: string;
  gridEntries: GridEntry[];
}

export interface RawScheduleData {
  format: number;
  courseType?: 'medicina1' | 'medicina2' | 'medicina3';
  days: Day[];
  errors?: any[];
}

// Para el componente Schedule
export interface ScheduleEvent {
  name: string;
  room?: string;
  lessonInfo?: string;
  color: string;
}

export interface ScheduleMatrix {
  [day: string]: {
    [timeSlot: string]: ScheduleEvent[];
  };
}