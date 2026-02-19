import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: any, searchText: string): SafeHtml {
    if (!value) return '';
    if (!searchText) return value;

    // ค้นหาคำแบบไม่สนตัวเล็กตัวใหญ่ (gi)
    const re = new RegExp(searchText, 'gi');
    const result = value.toString().replace(re, (match: string) => 
      `<mark style="background-color: yellow; padding: 0;">${match}</mark>`
    );
    
    // บอก Angular ว่าโค้ด HTML นี้ปลอดภัยนะ ให้แสดงผลได้
    return this.sanitizer.bypassSecurityTrustHtml(result);
  }
}  