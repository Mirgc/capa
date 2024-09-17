import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebuntisService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getData(elementId: number, date: string): Observable<any> {
    if (environment.production){
      this.apiUrl = '/WebUntis';
    }
    const url = `${this.apiUrl}?elementType=1&elementId=${elementId}&date=${date}&formatId=70&filter.departmentId=239`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'La web de Webuntis no está funcionando correctamente, disculpen las molestias.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de error: ${error.status}. Mensaje: ${error.message}`;
    }
    return throwError(errorMessage);
  }
}

