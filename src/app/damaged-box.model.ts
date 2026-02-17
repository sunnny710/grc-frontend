export interface DamagedBox {
  id: number;
  asn_no: string;
  ref_po_doc: string;
  carton_no: string;
  of_no: string;
  issue_type: 'Damaged' | 'Shortage' | 'Wrong Item' | string; // ใส่ literal type ช่วยให้อ่านง่าย
  scan_carton: string;
  barcode: string;
  item_sku: string;
  qty: number;
  saved_by: string;
  created_at: string | Date;
  carton_image?: string; 
  sku1_image?: string;
  sku2_image?: string;
}