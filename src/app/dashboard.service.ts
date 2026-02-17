import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { DamagedBox } from './damaged-box.model';

@Injectable({
  providedIn: 'root'
})
export class DamagedBoxService {
  private apiUrl = 'http://localhost:3000/api/damaged-boxes';

  constructor(private http: HttpClient) {}

  getDamagedBoxes(): Observable<DamagedBox[]> {
    return this.http.get<DamagedBox[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('API Error:', error);
        return throwError(() => new Error('ไม่สามารถดึงข้อมูลจาก Server ได้'));
      })
    );
  }
}