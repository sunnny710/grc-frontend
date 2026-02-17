import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 1. เพิ่ม FormsModule
import { DamagedBoxService } from '../dashboard.service';
import { DamagedBox } from '../damaged-box.model';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule], // 2. เพิ่ม FormsModule ที่นี่
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  damagedBoxes: DamagedBox[] = []; // ข้อมูลต้นฉบับจาก API
  filteredBoxes: DamagedBox[] = []; // ข้อมูลที่ผ่านการกรองแล้ว (ใช้โชว์ในตาราง)
  
  // ตัวแปรสำหรับ Filter
  searchTerm: string = '';
  filterType: string = '';

  totalQty = 0;
  totalIssues = 0;
  isLoading = true;

  constructor(
    private boxService: DamagedBoxService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    console.log('1. เริ่มเรียก fetchData');
    this.isLoading = true;

    this.boxService.getDamagedBoxes().subscribe({
      next: (data) => {
        console.log('2. ข้อมูลมาถึงแล้ว:', data);
        this.damagedBoxes = data || [];
        
        // เมื่อโหลดเสร็จ ให้ข้อมูลที่กรอง = ข้อมูลทั้งหมดก่อน
        this.applyFilter(); 
        
        this.isLoading = false;
        console.log('4. สถานะ isLoading ตอนนี้:', this.isLoading);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ API พัง:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ฟังก์ชันสำหรับกรองข้อมูล
  applyFilter(): void {
    this.filteredBoxes = this.damagedBoxes.filter(item => {
      // กรองด้วย ASN No. (ไม่สนพิมพ์เล็ก-ใหญ่)
      const matchAsn = item.asn_no?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // กรองด้วย Issue Type (ถ้าไม่เลือกให้ผ่านหมด)
      const matchType = this.filterType ? item.issue_type === this.filterType : true;
      
      return matchAsn && matchType;
    });

    // คำนวณยอดสรุปใหม่ตามข้อมูลที่ถูกกรอง
    this.calculateSummary();
  }

  private calculateSummary(): void {
    // ใช้ filteredBoxes ในการคำนวณ เพื่อให้ตัวเลข Dashboard ขยับตาม Filter
    if (!this.filteredBoxes) {
      this.totalIssues = 0;
      this.totalQty = 0;
      return;
    }
    this.totalIssues = this.filteredBoxes.length;
    this.totalQty = this.filteredBoxes.reduce((sum, item) => {
      const qty = Number(item.qty) || 0;
      return sum + qty;
    }, 0);
  }

  // แก้ไขให้ Export เฉพาะข้อมูลที่ถูกกรองอยู่ ณ ขณะนั้น (เลือกได้ว่าเอาหมดหรือเอาแค่ที่กรอง)
  async exportToExcel(): Promise<void> {
    const dataToExport = this.filteredBoxes; // ใช้ข้อมูลที่กรองอยู่มา Export

    if (dataToExport.length === 0) {
      alert('ไม่มีข้อมูลให้ Export');
      return;
    }

    this.isLoading = true; 
    this.cdr.detectChanges();

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Damaged Boxes');

      worksheet.columns = [
        { header: 'ID', key: 'id',  },
        { header: 'Date', key: 'date', width: 20 },
        { header: 'ASN No.', key: 'asn', width: 15 },
        { header: 'SKU', key: 'sku', width: 20 },
        { header: 'Qty', key: 'qty', width: 8 },
        { header: 'Issue Type', key: 'type', width: 15 },
        { header: 'Ref PO', key: 'ref_po', width: 15 },
        { header: 'Reporter', key: 'user', width: 15 },
        { header: 'Carton Image', key: 'img', width: 25 }
      ];

      for (const item of dataToExport) {
        const row = worksheet.addRow({
          id: item.id,
          date: item.created_at,
          asn: item.asn_no,
          sku: item.item_sku,
          qty: item.qty,
          ref_po: item.ref_po_doc,
          type: item.issue_type,
          user: item.saved_by
        });

        row.height = 90;

        if (item.carton_image) {
          try {
            const response = await fetch(item.carton_image);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const imageId = workbook.addImage({
                buffer: buffer,
                extension: 'jpeg',
              });
              worksheet.addImage(imageId, {
                tl: { col: 8, row: row.number - 1 },
                ext: { width: 100, height: 100 }
              });
            }
          } catch (e) {
            console.error('ไม่สามารถโหลดรูปภาพได้:', item.carton_image);
          }
        }
      }

      worksheet.getRow(1).font = { bold: true };
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `Damaged_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(new Blob([buffer]), fileName);

    } catch (error) {
      console.error('Export Error:', error);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

 getIssueClass(type: string): string {
  const base = 'badge rounded-pill ';
  if (!type) return base + 'bg-secondary';

  // ใช้คำภาษาไทยในการเช็กเงื่อนไข
  if (type === 'กล่องบุบ') return base + 'bg-danger';
  if (type === 'กล่องเป็นรอย') return base + 'bg-warning text-dark';
  if (type === 'กล่องขาด') return base + 'bg-dark';
  if (type === 'เสื้อเปื้อน') return base + 'bg-info text-white';
  
  return base + 'bg-primary'; // สีสำรองถ้าไม่ตรงกับเงื่อนไขข้างบน
}
}