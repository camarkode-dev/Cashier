// ESC/POS thermal printer library
// Supports: WebUSB, WebBluetooth, Network (via local bridge), and browser print

export interface ReceiptData {
  storeName: string;
  storeNameAr: string;
  storeAddress?: string;
  storePhone?: string;
  logoUrl?: string;
  invoiceNumber: string;
  date: string;
  cashierName: string;
  branchName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  customerName?: string;
  loyaltyPoints?: number;
  qrData?: string;
  footer?: string;
  paperSize?: '58mm' | '80mm';
  currency?: string;
}

export interface ReceiptItem {
  name: string;
  nameAr?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discountAmount?: number;
}

export interface PrinterPreferences {
  printerType?: 'browser' | 'usb' | 'network' | 'bridge';
  printerIp?: string;
}

// ESC/POS command bytes
const ESC = 0x1b;
const GS = 0x1d;

class EscPos {
  private buffer: number[] = [];

  init() { this.buffer.push(ESC, 0x40); return this; }
  cut() { this.buffer.push(GS, 0x56, 0x41, 0x00); return this; }
  feed(lines = 1) { this.buffer.push(ESC, 0x64, lines); return this; }
  align(a: 'left' | 'center' | 'right') {
    const v = { left: 0, center: 1, right: 2 };
    this.buffer.push(ESC, 0x61, v[a]);
    return this;
  }
  bold(on: boolean) { this.buffer.push(ESC, 0x45, on ? 1 : 0); return this; }
  size(w: 1 | 2, h: 1 | 2) {
    this.buffer.push(GS, 0x21, ((w - 1) << 4) | (h - 1));
    return this;
  }
  text(str: string) {
    const encoded = new TextEncoder().encode(str);
    this.buffer.push(...Array.from(encoded));
    return this;
  }
  line(str: string) { return this.text(str + '\n'); }
  divider(char = '-', width = 42) { return this.line(char.repeat(width)); }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

export class ThermalPrinter {
  private device: any = null;
  private endpoint: any = null;

  async connectUSB(): Promise<boolean> {
    try {
      if (!('usb' in navigator)) throw new Error('WebUSB not supported');
      this.device = await (navigator as any).usb.requestDevice({
        filters: [{ classCode: 7 }],
      });
      await this.device!.open();
      await this.device!.selectConfiguration(1);
      await this.device!.claimInterface(0);
      const iface = this.device!.configuration!.interfaces[0];
      this.endpoint = iface.alternate.endpoints.find((e: any) => e.direction === 'out') || null;
      return true;
    } catch (err) {
      // USB connection failure is non-fatal — caller checks return value
      return false;
    }
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    const receipt = this.buildReceipt(data);

    if (this.device && this.endpoint) {
      await this.printViaUSB(receipt);
    } else {
      this.printViaBrowser(data);
    }
  }

  async printReceiptWithPreferences(data: ReceiptData, preferences?: PrinterPreferences): Promise<void> {
    const printerType = preferences?.printerType || 'browser';

    if (printerType === 'network' && preferences?.printerIp) {
      const printed = await this.sendToNetworkPrinter(preferences.printerIp, 9100, data);
      if (printed) return;
    }

    if (printerType === 'usb' && !this.device) {
      await this.connectUSB();
    }

    await this.printReceipt(data);
  }

  private buildReceipt(data: ReceiptData): Uint8Array {
    const width = data.paperSize === '58mm' ? 32 : 42;
    const cur = data.currency || 'EGP';
    const pos = new EscPos();

    pos.init();

    // Header
    pos.align('center').bold(true).size(2, 2).line(data.storeNameAr || data.storeName);
    pos.bold(false).size(1, 1);
    if (data.storeAddress) pos.align('center').line(data.storeAddress);
    if (data.storePhone) pos.align('center').line('هاتف: ' + data.storePhone);
    pos.divider('=', width);

    // Invoice info
    pos.align('right').bold(false);
    pos.line('رقم الفاتورة: ' + data.invoiceNumber);
    pos.line('التاريخ: ' + data.date);
    pos.line('الكاشير: ' + data.cashierName);
    if (data.branchName) pos.line('الفرع: ' + data.branchName);
    if (data.customerName) pos.line('العميل: ' + data.customerName);
    pos.divider('-', width);

    // Items
    pos.align('right');
    for (const item of data.items) {
      const itemName = item.nameAr || item.name;
      pos.bold(false).line(itemName);
      const qtyPrice = `${item.quantity} × ${item.unitPrice.toFixed(2)}`;
      const total = item.total.toFixed(2) + ' ' + cur;
      const pad = width - qtyPrice.length - total.length;
      pos.line(qtyPrice + ' '.repeat(Math.max(1, pad)) + total);
      if (item.discountAmount && item.discountAmount > 0) {
        pos.line(`  خصم: -${item.discountAmount.toFixed(2)} ${cur}`);
      }
    }
    pos.divider('-', width);

    // Totals
    if (data.subtotal !== data.total) {
      pos.line(`المجموع: ${data.subtotal.toFixed(2)} ${cur}`);
    }
    if (data.discountAmount > 0) pos.line(`الخصم: -${data.discountAmount.toFixed(2)} ${cur}`);
    if (data.taxAmount > 0) pos.line(`الضريبة: ${data.taxAmount.toFixed(2)} ${cur}`);

    pos.bold(true).size(1, 2);
    pos.line(`الإجمالي: ${data.total.toFixed(2)} ${cur}`);
    pos.bold(false).size(1, 1);
    pos.line(`المدفوع: ${data.paidAmount.toFixed(2)} ${cur}`);
    if (data.changeAmount > 0) pos.line(`المتبقي: ${data.changeAmount.toFixed(2)} ${cur}`);

    // Loyalty
    if (data.loyaltyPoints) pos.line(`نقاط الولاء: ${data.loyaltyPoints} نقطة`);

    pos.divider('=', width);
    pos.align('center').line('شكراً لتسوقكم معنا');
    if (data.footer) pos.line(data.footer);

    pos.feed(4).cut();
    return pos.getBytes();
  }

  private async printViaUSB(data: Uint8Array) {
    if (!this.device || !this.endpoint) return;
    await this.device.transferOut(this.endpoint.endpointNumber, data);
  }

  private printViaBrowser(data: ReceiptData) {
    const width = data.paperSize === '80mm' ? '80mm' : '58mm';
    const cur = data.currency || 'EGP';
    const html = `
      <html dir="rtl"><head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cairo', Arial, sans-serif; width: ${width}; font-size: 12px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 16px; }
        .divider { border-top: 1px dashed #000; margin: 4px 0; }
        .row { display: flex; justify-content: space-between; }
        .item-name { font-size: 11px; }
      </style></head><body>
      <div class="center bold large">${data.storeNameAr || data.storeName}</div>
      ${data.storeAddress ? `<div class="center">${data.storeAddress}</div>` : ''}
      ${data.storePhone ? `<div class="center">هاتف: ${data.storePhone}</div>` : ''}
      <div class="divider"></div>
      <div>رقم الفاتورة: ${data.invoiceNumber}</div>
      <div>التاريخ: ${data.date}</div>
      <div>الكاشير: ${data.cashierName}</div>
      ${data.customerName ? `<div>العميل: ${data.customerName}</div>` : ''}
      <div class="divider"></div>
      ${data.items.map((i) => `
        <div class="item-name">${i.nameAr || i.name}</div>
        <div class="row"><span>${i.quantity} × ${i.unitPrice.toFixed(2)}</span><span>${i.total.toFixed(2)} ${cur}</span></div>
        ${i.discountAmount ? `<div>خصم: -${i.discountAmount.toFixed(2)}</div>` : ''}
      `).join('')}
      <div class="divider"></div>
      ${data.discountAmount > 0 ? `<div class="row"><span>الخصم</span><span>-${data.discountAmount.toFixed(2)}</span></div>` : ''}
      ${data.taxAmount > 0 ? `<div class="row"><span>الضريبة</span><span>${data.taxAmount.toFixed(2)}</span></div>` : ''}
      <div class="row bold large"><span>الإجمالي</span><span>${data.total.toFixed(2)} ${cur}</span></div>
      <div class="row"><span>المدفوع</span><span>${data.paidAmount.toFixed(2)} ${cur}</span></div>
      ${data.changeAmount > 0 ? `<div class="row"><span>المتبقي</span><span>${data.changeAmount.toFixed(2)} ${cur}</span></div>` : ''}
      <div class="divider"></div>
      <div class="center">شكراً لتسوقكم معنا</div>
      </body></html>
    `;
    const win = window.open('', '_blank', `width=350,height=600`);
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 500);
    }
  }

  async sendToNetworkPrinter(ip: string, port = 9100, data: ReceiptData) {
    const bytes = this.buildReceipt(data);
    // Via local bridge service (Node.js agent running on localhost)
    try {
      const res = await fetch('http://localhost:3002/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port, data: Array.from(bytes) }),
      });
      return res.ok;
    } catch {
      this.printViaBrowser(data);
      return false;
    }
  }
}

export const thermalPrinter = new ThermalPrinter();
