import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router'; // ถ้ามีการใช้ Routing
// 1. Import DashboardComponent เข้ามา
import { DashboardComponent } from './dashboard/dashboard.component'; 

@Component({
  selector: 'app-root',
  standalone: true,
  // 2. เพิ่ม DashboardComponent ลงในช่อง imports
  imports: [
    CommonModule, 
    DashboardComponent // <--- เพิ่มตัวนี้เข้าไปครับ
  ],
  templateUrl: './app.html', // หรือ './app.component.html' ตามที่คุณตั้งชื่อไว้
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'grc-frontend';
}