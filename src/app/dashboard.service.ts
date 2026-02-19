import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { DamagedBox } from './damaged-box.model';

@Injectable({
  providedIn: 'root'
})
export class DamagedBoxService {
 private apiUrl = 'http://10.26.4.110:3000/api/damaged-boxes';

  constructor(private http: HttpClient) {}

  getDamagedBoxes(): Observable<DamagedBox[]> {
    return this.http.get<DamagedBox[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('API Error:', error);
        return throwError(() => new Error('ไม่สามารถดึงข้อมูลจาก Server ได้'));
      })
    );
  } 
  updateBox(id: number, data: any): Observable<any> {
    // ส่งข้อมูลไปที่ URL: /api/damaged-boxes/:id
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }
}