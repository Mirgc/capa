import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebuntisService {
  private apiUrl = '/WebUntis/api/public/timetable/weekly/data';

  constructor(private http: HttpClient) {}

  getData(elementId: number, date: string): Observable<any> {
    const url = `${this.apiUrl}?elementType=1&elementId=${elementId}&date=${date}&formatId=70&filter.departmentId=239`;
    return this.http.get<any>(url);
  }
}

