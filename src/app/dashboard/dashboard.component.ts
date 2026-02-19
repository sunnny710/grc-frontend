import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DamagedBoxService } from '../dashboard.service';
import { DamagedBox } from '../damaged-box.model';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private refreshInterval: any;
  damagedBoxes: DamagedBox[] = [];
  filteredBoxes: DamagedBox[] = [];
  
  editingId: number | null = null;
  editForm: any = {};
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
    this.refreshInterval = setInterval(() => {
      if (!this.editingId) {
        console.log('🔄 Auto Refreshing...');
        this.fetchData();
      }
    }, 60000); 
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      console.log('🛑 Auto Refresh Stopped');
    }
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

  applyFilter(): void {
    this.filteredBoxes = this.damagedBoxes.filter(item => {
      const matchAsn = item.asn_no?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchType = this.filterType ? item.issue_type === this.filterType : true;
      return matchAsn && matchType;
    });
    this.calculateSummary();
  }

  private calculateSummary(): void {
    this.totalIssues = this.filteredBoxes.length;
    this.totalQty = this.filteredBoxes.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }

  // --- ฟังก์ชันช่วย Format วันที่สำหรับ Excel ---
  private formatDateForExcel(dateString: any): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    // คืนค่าเป็นรูปแบบ: 18 Feb 2026, 15:30
   return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',   // '2-digit' จะได้เลขปีแค่ 2 หลัก เช่น 26 หรือ 69 (ตามปีพุทธศักราช/คริสต์ศักราชที่เครื่องใช้)
    hour: '2-digit',
    minute: '2-digit',
    hour12: false      // ใช้รูปแบบ 24 ชั่วโมง
    });
  }

  async exportToExcel(): Promise<void> {
    const dataToExport = this.filteredBoxes; 
    if (dataToExport.length === 0) {
      alert('ไม่มีข้อมูลให้ Export');
      return;
    }

    this.isLoading = true; 
    this.cdr.detectChanges();

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Damaged Report');

      worksheet.columns = [
        { header: 'NO', key: 'id', width: 10 },
        { header: 'DATE', key: 'date', width: 25 },
        { header: 'ASN NO.', key: 'asn', width: 15 },
        { header: 'REF.PO/DOC', key: 'ref_po_doc', width: 15 },
        { header: 'CARTON NO.', key: 'carton_no', width: 15 },
        { header: 'OF', key: 'of_no', width: 10 },
        { header: 'ISSUE TYPE', key: 'issue_type', width: 15 },
        { header: 'BARCODE', key: 'barcode', width: 20 },
        { header: 'ITEM/SKU', key: 'item_sku', width: 20 },
        { header: 'QTY', key: 'qty', width: 8 },
        { header: 'SCAN CARTON', key: 'scan_carton', width: 15 },
        { header: 'PIC CARTON', key: 'pic_carton', width: 25 },
        { header: 'PIC SKU', key: 'pic_sku', width: 25 },
        { header: 'PIC SKU 2', key: 'pic_sku_2', width: 25 }
      ];

      dataToExport.forEach((item) => {
        const row = worksheet.addRow({
          id: item.id,
          // ใช้ฟังก์ชัน format วันที่ที่นี่
          date: this.formatDateForExcel(item.created_at),
          asn: item.asn_no,
          ref_po_doc: item.ref_po_doc, 
          carton_no: item.carton_no,   
          of_no: item.of_no,           
          issue_type: item.issue_type, 
          barcode: item.barcode,
          item_sku: item.item_sku,
          qty: item.qty,
          scan_carton: item.scan_carton
        });

        const setupHyperlink = (colIndex: number, url: string | undefined, linkText: string) => {
          if (!url) return;
          const cell = row.getCell(colIndex);
          cell.value = { text: linkText, hyperlink: url };
          cell.font = { color: { argb: 'FF0000FF' }, underline: true };
        };

        // เรียกใช้ตามลำดับคอลัมน์ Excel (12, 13, 14 คือ L, M, N ตามลำดับ columns ที่ตั้งไว้)
        setupHyperlink(12, item.carton_image, 'คลิกดูรูป CARTON');
        setupHyperlink(13, item.sku1_image, 'คลิกดูรูป SKU 1');
        setupHyperlink(14, item.sku2_image, 'คลิกดูรูป SKU 2');
      });

      const excelBuffer = await workbook.xlsx.writeBuffer(); 
      const fileName = `Damaged_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(new Blob([excelBuffer]), fileName);

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
    if (type === 'กล่องบุบ') return base + 'bg-danger';
    if (type === 'กล่องเป็นรอย') return base + 'bg-warning text-dark';
    if (type === 'กล่องขาด') return base + 'bg-dark';
    if (type === 'เสื้อเปื้อน') return base + 'bg-info text-white';
    return base + 'bg-secondary';
  }

  selectFilterType(type: string): void {
    this.filterType = (this.filterType === type) ? '' : type;
    this.applyFilter();
  }

  getCountByType(type: string): number {
    return this.damagedBoxes.filter(item => item.issue_type === type).length;
  }

  startEdit(item: DamagedBox): void {
    this.editingId = item.id;
    this.editForm = { ...item };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editForm = {};
  }

  saveUpdate(): void {
    if (!this.editingId) return;
    this.isLoading = true;
    this.boxService.updateBox(this.editingId, this.editForm).subscribe({
      next: () => {
        this.editingId = null;
        this.fetchData();
      },
      error: (err) => {
        console.error('Update Error:', err);
        alert('บันทึกพลาด!');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}