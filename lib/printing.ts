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
  customerPhone?: string;
  loyaltyPoints?: number;
  qrData?: string;
  footer?: string;
  paperSize?: '58mm' | '80mm';
  currency?: string;
  isRefund?: boolean;
  refundReason?: string;
  remainingAmount?: number;
}

export interface ReceiptItem {
  name: string;
  nameAr?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discountAmount?: number;
  returnDays?: number;
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

function paymentLabel(method: string): string {
  const m: Record<string, string> = {
    CASH: 'نقدي', CARD: 'بطاقة', MOBILE: 'محفظة إلكترونية',
    QR: 'رمز QR', SPLIT: 'دفع مقسم', CREDIT: 'آجل',
  };
  return m[method] || method;
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

    // Refund banner
    if (data.isRefund) {
      pos.align('center').bold(true).size(2, 1).line('*** فاتورة استرجاع ***');
      pos.bold(false).size(1, 1);
      pos.divider('=', width);
    }

    // Invoice info
    pos.align('right').bold(false);
    pos.line('رقم الفاتورة: ' + data.invoiceNumber);
    pos.line('التاريخ: ' + data.date);
    pos.line('الكاشير: ' + data.cashierName);
    if (data.branchName) pos.line('الفرع: ' + data.branchName);
    if (data.customerName) pos.line('العميل: ' + data.customerName);
    if (data.customerPhone) pos.line('هاتف العميل: ' + data.customerPhone);
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
    pos.line(`طريقة الدفع: ${paymentLabel(data.paymentMethod)}`);

    // Loyalty
    if (data.loyaltyPoints) pos.line(`نقاط الولاء: ${data.loyaltyPoints} نقطة`);

    // Refund reason
    if (data.isRefund && data.refundReason) {
      pos.divider('-', width);
      pos.align('right').bold(true).line('سبب الاسترجاع:');
      pos.bold(false).line(data.refundReason);
    }

    // Return policy (skip for refund receipts)
    if (!data.isRefund) {
      const groups = new Map<number, string[]>();
      for (const item of data.items) {
        const days = item.returnDays ?? 7;
        if (!groups.has(days)) groups.set(days, []);
        groups.get(days)!.push(item.nameAr || item.name);
      }
      if (groups.size > 0) {
        pos.divider('-', width);
        pos.align('right').bold(true).line('سياسة الاسترجاع:');
        pos.bold(false);
        for (const [days, names] of Array.from(groups.entries()).sort((a, b) => a[0] - b[0])) {
          pos.line(`${days} أيام: ${names.join('، ')}`);
        }
      }
    }

    pos.divider('=', width);
    pos.align('center').line(data.isRefund ? 'تم الاسترجاع بنجاح' : 'شكراً لتسوقكم معنا');
    if (data.footer) pos.line(data.footer);

    // Barcode (invoice number as text barcode representation)
    pos.feed(1).divider('-', width);
    pos.align('center').line('* ' + data.invoiceNumber + ' *');
    pos.divider('-', width);

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

    // Build return policy block — group items by returnDays, skip for refund receipts
    const toAr = (n: number) => n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);
    const returnPolicyHtml = (() => {
      if (data.isRefund) return '';
      const groups = new Map<number, string[]>();
      for (const item of data.items) {
        const days = item.returnDays ?? 7;
        if (!groups.has(days)) groups.set(days, []);
        groups.get(days)!.push(item.nameAr || item.name);
      }
      if (groups.size === 0) return '';
      const sorted = Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
      const rows = sorted.map(([days, names]) =>
        `<div class="rp-row"><span class="rp-badge rp-d${days}">${toAr(days)} يوم</span><span class="rp-names">${names.join(' · ')}</span></div>`
      ).join('');
      return `<div class="return-policy"><div class="rp-title">↩ سياسة الاسترجاع</div>${rows}</div>`;
    })();

    const headerLogoSvg = `<svg width="52" height="52" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="160" cy="160" r="160" fill="#000"/>
      <g stroke="#fff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M67 258V117L161 41L253 121"/>
        <path d="M69 259H223"/>
      </g>
      <g fill="#fff">
        <text x="90" y="219" font-family="Impact,Arial Black,sans-serif" font-size="126" font-weight="900" transform="skewX(-11)">A</text>
        <text x="171" y="220" font-family="Impact,Arial Black,sans-serif" font-size="128" font-weight="900" transform="skewX(-6)">H</text>
      </g>
    </svg>`;

    // Small logo for QR center overlay (28×28, white bg for contrast)
    const qrLogoSvg = `<svg width="28" height="28" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="160" cy="160" r="160" fill="#000"/>
      <g stroke="#fff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M67 258V117L161 41L253 121"/>
        <path d="M69 259H223"/>
      </g>
      <g fill="#fff">
        <text x="90" y="219" font-family="Impact,Arial Black,sans-serif" font-size="126" font-weight="900" transform="skewX(-11)">A</text>
        <text x="171" y="220" font-family="Impact,Arial Black,sans-serif" font-size="128" font-weight="900" transform="skewX(-6)">H</text>
      </g>
    </svg>`;

    const html = `<!DOCTYPE html>
      <html dir="rtl"><head>
      <meta charset="utf-8">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128+Text&display=swap" rel="stylesheet">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cairo', Arial, sans-serif; width: ${width}; font-size: 12px; color: #000; background: #fff; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 16px; }
        .divider { border-top: 1px dashed #000; margin: 5px 0; }
        .divider-solid { border-top: 1px solid #000; margin: 5px 0; }
        .row { display: flex; justify-content: space-between; padding: 1px 0; }
        .item-name { font-size: 11px; font-weight: 600; }
        .logo-wrap { display: flex; flex-direction: column; align-items: center; gap: 3px; margin-bottom: 4px; }
        .store-name { font-size: 17px; font-weight: 900; letter-spacing: -0.3px; }
        .store-sub { font-size: 11px; color: #333; }
        .payment-badge { display: inline-block; border: 1px solid #000; border-radius: 4px; padding: 1px 8px; font-size: 11px; font-weight: 700; margin-top: 3px; }
        .refund-banner { background: #000; color: #fff; text-align: center; font-size: 14px; font-weight: 900; padding: 5px 0; margin: 6px 0; letter-spacing: 1px; }
        .refund-reason { border: 1px dashed #000; border-radius: 4px; padding: 5px 8px; margin-top: 6px; font-size: 11px; }
        .refund-reason-label { font-weight: 700; font-size: 11px; margin-bottom: 2px; }
        .return-policy { border: 1px solid #ddd; border-radius: 6px; padding: 6px 8px; margin: 8px 0 4px; }
        .rp-title { font-size: 10px; font-weight: 700; color: #444; margin-bottom: 5px; text-align: center; letter-spacing: 0.5px; }
        .rp-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 3px; font-size: 10px; }
        .rp-badge { display: inline-block; padding: 1px 6px; border-radius: 10px; font-weight: 700; font-size: 10px; white-space: nowrap; flex-shrink: 0; }
        .rp-d7 { background: #e0f2fe; color: #0369a1; }
        .rp-d14 { background: #dcfce7; color: #15803d; }
        .rp-names { color: #555; line-height: 1.4; }
        .barcode-font { font-family: 'Libre Barcode 128 Text', cursive; font-size: 52px; letter-spacing: 2px; line-height: 1; }
        .barcode-num { font-size: 10px; letter-spacing: 2px; color: #333; margin-top: 2px; }
        .qr-section { display: flex; flex-direction: column; align-items: center; margin-top: 12px; gap: 4px; }
        .qr-wrap { position: relative; display: inline-block; }
        .qr-logo { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background: #fff; padding: 3px; border-radius: 5px; line-height: 0; }
        .qr-hint { font-size: 10px; color: #444; letter-spacing: 0.3px; }
        .qr-url { font-size: 11px; font-weight: 700; color: #000; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <div class="logo-wrap">
        ${headerLogoSvg}
        <div class="store-name">${data.storeNameAr || data.storeName}</div>
        ${data.storeAddress ? `<div class="store-sub">${data.storeAddress}</div>` : ''}
        ${data.storePhone ? `<div class="store-sub">هاتف: ${data.storePhone}</div>` : ''}
      </div>
      <div class="divider-solid"></div>
      ${data.isRefund ? `<div class="refund-banner">★ فاتورة استرجاع ★</div>` : ''}
      <div class="row"><span>رقم الفاتورة</span><span style="font-family:monospace;font-weight:700">${data.invoiceNumber}</span></div>
      <div class="row"><span>التاريخ</span><span>${data.date}</span></div>
      <div class="row"><span>الكاشير</span><span>${data.cashierName}</span></div>
      ${data.branchName ? `<div class="row"><span>الفرع</span><span>${data.branchName}</span></div>` : ''}
      ${data.customerName ? `<div class="row"><span>العميل</span><span>${data.customerName}</span></div>` : ''}
      ${data.customerPhone ? `<div class="row"><span>هاتف العميل</span><span style="direction:ltr;font-weight:700">${data.customerPhone}</span></div>` : ''}
      <div class="divider"></div>
      ${data.items.map((i) => `
        <div class="item-name">${i.nameAr || i.name}</div>
        <div class="row"><span style="color:#555">${i.quantity} × ${i.unitPrice.toFixed(2)}</span><span class="bold">${i.total.toFixed(2)} ${cur}</span></div>
        ${i.discountAmount && i.discountAmount > 0 ? `<div style="color:#555;font-size:11px">خصم: -${i.discountAmount.toFixed(2)}</div>` : ''}
      `).join('')}
      <div class="divider"></div>
      ${data.discountAmount > 0 ? `<div class="row" style="color:#555"><span>الخصم</span><span>-${data.discountAmount.toFixed(2)} ${cur}</span></div>` : ''}
      ${data.taxAmount > 0 ? `<div class="row" style="color:#555"><span>الضريبة</span><span>${data.taxAmount.toFixed(2)} ${cur}</span></div>` : ''}
      <div class="row bold large" style="border-top:2px solid #000;margin-top:4px;padding-top:4px"><span>الإجمالي</span><span>${data.total.toFixed(2)} ${cur}</span></div>
      <div class="row"><span>المدفوع</span><span>${data.paidAmount.toFixed(2)} ${cur}</span></div>
      ${data.changeAmount > 0 ? `<div class="row"><span>المتبقي</span><span>${data.changeAmount.toFixed(2)} ${cur}</span></div>` : ''}
      <div class="center" style="margin-top:4px"><span class="payment-badge">${paymentLabel(data.paymentMethod)}</span></div>
      <div class="divider" style="margin-top:8px"></div>
      ${returnPolicyHtml}
      ${data.isRefund && data.refundReason ? `
      <div class="refund-reason">
        <div class="refund-reason-label">سبب الاسترجاع:</div>
        <div>${data.refundReason}</div>
      </div>` : ''}
      <div class="center" style="margin:6px 0 2px">${data.isRefund ? 'تم الاسترجاع بنجاح' : 'شكراً لتسوقكم معنا'}</div>
      <div class="divider"></div>
      <div class="center" style="margin-top:6px">
        <div class="barcode-font">${data.invoiceNumber}</div>
        <div class="barcode-num">${data.invoiceNumber}</div>
      </div>
      <div class="divider" style="margin-top:10px"></div>
      <div class="qr-section">
        <div class="qr-hint">امسح لزيارة موقعنا</div>
        <div class="qr-wrap">
          <div id="qr-canvas"></div>
          <div class="qr-logo">${qrLogoSvg}</div>
        </div>
        <div class="qr-url">Awlad-Ayman.com</div>
      </div>
      <script>
        (function() {
          function generate() {
            if (typeof QRCode === 'undefined') { setTimeout(generate, 100); return; }
            new QRCode(document.getElementById('qr-canvas'), {
              text: 'https://Awlad-Ayman.com',
              width: 150,
              height: 150,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.H
            });
          }
          generate();
        })();
      <\/script>
      </body></html>`;

    const win = window.open('', '_blank', `width=400,height=750`);
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      // Wait for QRCode.js + barcode font to load before printing
      setTimeout(() => { win.print(); win.close(); }, 1800);
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
