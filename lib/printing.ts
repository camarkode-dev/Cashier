// Thermal cashier printer utilities.
// Arabic receipts are rendered as raster images before being sent to ESC/POS printers.

import type { PrinterConfig } from '@/stores/settings.store';

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
  printerType?: 'browser' | 'usb' | 'network' | 'bridge' | 'bluetooth';
  printerIp?: string;
  port?: number;
  paperSize?: '58mm' | '80mm';
  retryAttempts?: number;
}

export interface PrintResult {
  ok: boolean;
  status: 'printed' | 'skipped' | 'failed';
  message: string;
}

const ESC = 0x1b;
const GS = 0x1d;

const DEFAULT_PRINTER: PrinterConfig = {
  isEnabled: true,
  connectionType: 'usb',
  deviceName: '',
  deviceId: '',
  deviceAddress: '',
  ip: '',
  port: 3002,
  paperWidth: '80mm',
  fontScale: 1,
  retryAttempts: 2,
};

function paymentLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: 'نقدي',
    CARD: 'Card',
    MOBILE: 'Vodafone Cash',
    QR: 'InstaPay',
    VODAFONE_CASH: 'Vodafone Cash',
    INSTAPAY: 'InstaPay',
    SPLIT: 'دفع مقسم',
    CREDIT: 'آجل',
  };
  return labels[method] || method;
}

function money(value: number, currency = 'EGP') {
  return `${value.toFixed(2)} ${currency}`;
}

function normalizePrinter(config?: Partial<PrinterConfig> | PrinterPreferences): PrinterConfig {
  const prefs = config as PrinterPreferences | undefined;
  const printer = config as Partial<PrinterConfig> | undefined;
  const connectionType =
    printer?.connectionType ||
    (prefs?.printerType === 'bluetooth' ? 'bluetooth' : prefs?.printerType === 'network' ? 'network' : prefs?.printerType === 'usb' ? 'usb' : undefined);

  return {
    ...DEFAULT_PRINTER,
    ...printer,
    isEnabled: printer?.isEnabled ?? true,
    connectionType: connectionType || DEFAULT_PRINTER.connectionType,
    ip: printer?.ip || prefs?.printerIp || '',
    port: Number(printer?.port || prefs?.port || DEFAULT_PRINTER.port),
    paperWidth: printer?.paperWidth || prefs?.paperSize || DEFAULT_PRINTER.paperWidth,
    retryAttempts: Math.max(0, Number(printer?.retryAttempts ?? prefs?.retryAttempts ?? DEFAULT_PRINTER.retryAttempts)),
  };
}

function isUserCancel(error: unknown) {
  const err = error as { name?: string; message?: string };
  return err?.name === 'NotFoundError' || /cancel|user cancelled|no device selected/i.test(err?.message || '');
}

function friendlyError(error: unknown, connectionType: PrinterConfig['connectionType']) {
  const err = error as { message?: string; name?: string };
  if (isUserCancel(error)) return 'تم إلغاء اختيار الجهاز.';
  if (connectionType === 'bluetooth' && err?.message?.includes('not supported')) return 'المتصفح لا يدعم Bluetooth.';
  if (connectionType === 'usb' && err?.message?.includes('not supported')) return 'المتصفح لا يدعم USB.';
  if (connectionType === 'network') return 'فشل bridge الشبكي. تأكد من IP/Port وتشغيل خدمة الطباعة.';
  return err?.message || 'فشلت الطباعة.';
}

function encodeAscii(text: string) {
  return Array.from(text).map((char) => char.charCodeAt(0) & 0xff);
}

function appendQr(bytes: number[], text: string) {
  const data = encodeAscii(text);
  const storeLength = data.length + 3;
  bytes.push(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
  bytes.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06);
  bytes.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
  bytes.push(GS, 0x28, 0x6b, storeLength & 0xff, (storeLength >> 8) & 0xff, 0x31, 0x50, 0x30, ...data);
  bytes.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export class ThermalPrinter {
  private usbDevice: any = null;
  private usbEndpoint: any = null;
  private bluetoothDevice: any = null;
  private bluetoothCharacteristic: any = null;
  private queue = Promise.resolve();

  async connectUSB(): Promise<boolean> {
    try {
      await this.ensureUSB();
      return true;
    } catch {
      return false;
    }
  }

  async printReceipt(data: ReceiptData, config?: Partial<PrinterConfig> | PrinterPreferences): Promise<PrintResult> {
    const printer = normalizePrinter(config);
    return this.enqueue(() => this.printCashierReceipt(data, printer));
  }

  async printReceiptWithPreferences(data: ReceiptData, preferences?: PrinterPreferences): Promise<PrintResult> {
    return this.printReceipt(data, preferences);
  }

  async testConnection(config?: Partial<PrinterConfig>): Promise<PrintResult> {
    const printer = normalizePrinter(config);
    if (!printer.isEnabled) return { ok: false, status: 'skipped', message: 'الطابعة غير مفعلة.' };
    if (printer.connectionType === 'network' && (!printer.ip || !printer.port)) {
      return { ok: false, status: 'failed', message: 'IP أو Port غير مكتمل.' };
    }

    try {
      if (printer.connectionType === 'usb') await this.ensureUSB();
      if (printer.connectionType === 'bluetooth') await this.ensureBluetooth();
      if (printer.connectionType === 'network') {
        const res = await fetch(`http://${printer.ip}:${printer.port}/print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'ping' }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
      return { ok: true, status: 'printed', message: 'تم الاتصال بالطابعة بنجاح.' };
    } catch (error) {
      return { ok: false, status: 'failed', message: friendlyError(error, printer.connectionType) };
    }
  }

  async printArabicTest(config?: Partial<PrinterConfig>): Promise<PrintResult> {
    return this.printReceipt(this.sampleReceipt('اختبار عربي'), config);
  }

  async printQrTest(config?: Partial<PrinterConfig>): Promise<PrintResult> {
    return this.printReceipt({ ...this.sampleReceipt('اختبار QR'), qrData: 'https://markode.co' }, config);
  }

  private enqueue(task: () => Promise<PrintResult>): Promise<PrintResult> {
    const next = this.queue.then(task, task);
    this.queue = next.then(() => undefined, () => undefined);
    return next;
  }

  private async printCashierReceipt(data: ReceiptData, printer: PrinterConfig): Promise<PrintResult> {
    if (!printer.isEnabled) return { ok: false, status: 'skipped', message: 'الطابعة غير مفعلة.' };
    if (printer.connectionType === 'network' && (!printer.ip || !printer.port)) {
      return { ok: false, status: 'failed', message: 'IP أو Port غير مكتمل.' };
    }

    const attempts = printer.retryAttempts + 1;
    let lastMessage = 'فشلت الطباعة.';

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const bytes = await this.buildRasterReceipt(data, printer);
        await this.writeBytes(bytes, printer);
        return { ok: true, status: 'printed', message: 'تمت طباعة فاتورة الكاشير.' };
      } catch (error) {
        lastMessage = friendlyError(error, printer.connectionType);
        if (isUserCancel(error)) break;
        this.resetConnection(printer.connectionType);
      }
    }

    return { ok: false, status: 'failed', message: lastMessage };
  }

  private async writeBytes(bytes: Uint8Array, printer: PrinterConfig) {
    if (printer.connectionType === 'usb') {
      await this.ensureUSB();
      await this.usbDevice.transferOut(this.usbEndpoint.endpointNumber, bytes);
      return;
    }

    if (printer.connectionType === 'bluetooth') {
      await this.ensureBluetooth();
      const chunkSize = 180;
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        await this.bluetoothCharacteristic.writeValue(bytes.slice(offset, offset + chunkSize));
      }
      return;
    }

    const res = await fetch(`http://${printer.ip}:${printer.port}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'escpos', data: Array.from(bytes) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  private async ensureUSB() {
    if (!('usb' in navigator)) throw new Error('WebUSB not supported');
    if (!this.usbDevice) {
      this.usbDevice = await (navigator as any).usb.requestDevice({ filters: [{ classCode: 7 }] });
    }
    if (!this.usbDevice.opened) await this.usbDevice.open();
    if (!this.usbDevice.configuration) await this.usbDevice.selectConfiguration(1);
    try {
      await this.usbDevice.claimInterface(0);
    } catch {
      // Already claimed in the same browser session.
    }
    const iface = this.usbDevice.configuration.interfaces[0];
    this.usbEndpoint = iface.alternate.endpoints.find((endpoint: any) => endpoint.direction === 'out');
    if (!this.usbEndpoint) throw new Error('لم يتم العثور على USB endpoint للطابعة.');
  }

  private async ensureBluetooth() {
    if (!('bluetooth' in navigator)) throw new Error('Web Bluetooth not supported');
    if (!this.bluetoothDevice || !this.bluetoothDevice.gatt?.connected) {
      this.bluetoothDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [0x18f0, 0xffe0, 0xff00],
      });
      const server = await this.bluetoothDevice.gatt.connect();
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        const writable = characteristics.find((item: any) => item.properties.write || item.properties.writeWithoutResponse);
        if (writable) {
          this.bluetoothCharacteristic = writable;
          break;
        }
      }
    }
    if (!this.bluetoothCharacteristic) throw new Error('لم يتم العثور على قناة Bluetooth قابلة للكتابة.');
  }

  private resetConnection(connectionType: PrinterConfig['connectionType']) {
    if (connectionType === 'usb') {
      this.usbEndpoint = null;
    }
    if (connectionType === 'bluetooth') {
      this.bluetoothCharacteristic = null;
    }
  }

  private async buildRasterReceipt(data: ReceiptData, printer: PrinterConfig): Promise<Uint8Array> {
    if (typeof document === 'undefined') throw new Error('الطباعة الحرارية تحتاج متصفحًا يدعم Canvas.');

    const width = printer.paperWidth === '58mm' ? 384 : 576;
    const scale = Math.max(0.75, Math.min(1.4, printer.fontScale || 1));
    const padding = Math.round(width * 0.055);
    const lineHeight = Math.round(28 * scale);
    const smallLineHeight = Math.round(22 * scale);
    const rows: Array<{ text: string; size?: number; bold?: boolean; center?: boolean; ltr?: boolean }> = [];
    const cur = data.currency || 'EGP';

    rows.push({ text: data.storeNameAr || data.storeName, size: 30 * scale, bold: true, center: true });
    if (data.storeAddress) rows.push({ text: data.storeAddress, size: 20 * scale, center: true });
    if (data.storePhone) rows.push({ text: `هاتف: ${data.storePhone}`, size: 20 * scale, center: true });
    rows.push({ text: '--------------------------------', center: true });
    if (data.isRefund) rows.push({ text: 'فاتورة استرجاع', size: 28 * scale, bold: true, center: true });
    rows.push({ text: `رقم الفاتورة: ${data.invoiceNumber}` });
    rows.push({ text: `التاريخ: ${data.date}` });
    rows.push({ text: `الكاشير: ${data.cashierName}` });
    if (data.branchName) rows.push({ text: `الفرع: ${data.branchName}` });
    if (data.customerName) rows.push({ text: `العميل: ${data.customerName}` });
    if (data.customerPhone) rows.push({ text: `هاتف العميل: ${data.customerPhone}` });
    rows.push({ text: '--------------------------------', center: true });

    for (const item of data.items) {
      rows.push({ text: item.nameAr || item.name, bold: true });
      rows.push({ text: `${item.quantity} x ${item.unitPrice.toFixed(2)}    ${money(item.total, cur)}`, ltr: true });
      if (item.discountAmount && item.discountAmount > 0) rows.push({ text: `خصم: -${money(item.discountAmount, cur)}` });
    }

    rows.push({ text: '--------------------------------', center: true });
    if (data.subtotal !== data.total) rows.push({ text: `المجموع: ${money(data.subtotal, cur)}` });
    if (data.discountAmount > 0) rows.push({ text: `الخصم: -${money(data.discountAmount, cur)}` });
    if (data.taxAmount > 0) rows.push({ text: `الضريبة: ${money(data.taxAmount, cur)}` });
    rows.push({ text: `الإجمالي: ${money(data.total, cur)}`, size: 30 * scale, bold: true });
    rows.push({ text: `المدفوع: ${money(data.paidAmount, cur)}` });
    if (data.changeAmount > 0) rows.push({ text: `الباقي: ${money(data.changeAmount, cur)}` });
    rows.push({ text: `طريقة الدفع: ${paymentLabel(data.paymentMethod)}` });
    if (data.loyaltyPoints) rows.push({ text: `نقاط الولاء: ${data.loyaltyPoints}` });
    if (data.isRefund && data.refundReason) rows.push({ text: `سبب الاسترجاع: ${data.refundReason}` });
    rows.push({ text: '--------------------------------', center: true });
    rows.push({ text: data.footer || 'شكرا لتسوقكم معنا', center: true });
    rows.push({ text: 'markode.co', size: 18 * scale, center: true });

    const logo = data.logoUrl ? await loadImage(data.logoUrl) : null;
    const logoHeight = logo ? 88 : 0;
    const height =
      padding * 2 +
      logoHeight +
      rows.reduce((sum, row) => sum + (row.size ? Math.ceil(row.size * 1.35) : row.text.includes('--') ? smallLineHeight : lineHeight), 0) +
      20;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('تعذر تجهيز Canvas للطباعة.');

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'top';

    let y = padding;
    if (logo) {
      const ratio = Math.min(88 / logo.width, 88 / logo.height);
      const logoWidth = logo.width * ratio;
      const drawnHeight = logo.height * ratio;
      ctx.drawImage(logo, (width - logoWidth) / 2, y, logoWidth, drawnHeight);
      y += logoHeight;
    }

    for (const row of rows) {
      const size = row.size || (row.text.includes('--') ? 18 * scale : 22 * scale);
      ctx.font = `${row.bold ? 800 : 500} ${size}px Arial, Tahoma, sans-serif`;
      ctx.direction = row.ltr ? 'ltr' : 'rtl';
      ctx.textAlign = row.center ? 'center' : row.ltr ? 'left' : 'right';
      const x = row.center ? width / 2 : row.ltr ? padding : width - padding;
      ctx.fillText(row.text, x, y);
      y += row.size ? Math.ceil(row.size * 1.35) : row.text.includes('--') ? smallLineHeight : lineHeight;
    }

    return this.canvasToEscPos(canvas, data.qrData || 'https://markode.co');
  }

  private canvasToEscPos(canvas: HTMLCanvasElement, qrData: string): Uint8Array {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('تعذر قراءة Canvas للطباعة.');
    const widthBytes = Math.ceil(canvas.width / 8);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bytes: number[] = [ESC, 0x40, ESC, 0x33, 0x18];

    bytes.push(GS, 0x76, 0x30, 0x00, widthBytes & 0xff, (widthBytes >> 8) & 0xff, canvas.height & 0xff, (canvas.height >> 8) & 0xff);
    for (let y = 0; y < canvas.height; y += 1) {
      for (let xByte = 0; xByte < widthBytes; xByte += 1) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit += 1) {
          const x = xByte * 8 + bit;
          if (x >= canvas.width) continue;
          const offset = (y * canvas.width + x) * 4;
          const r = image.data[offset];
          const g = image.data[offset + 1];
          const b = image.data[offset + 2];
          const alpha = image.data[offset + 3];
          const luminance = (r * 0.299 + g * 0.587 + b * 0.114) * (alpha / 255) + 255 * (1 - alpha / 255);
          if (luminance < 180) byte |= 0x80 >> bit;
        }
        bytes.push(byte);
      }
    }

    bytes.push(ESC, 0x61, 0x01);
    appendQr(bytes, qrData);
    bytes.push(ESC, 0x64, 0x04, GS, 0x56, 0x41, 0x00);
    return new Uint8Array(bytes);
  }

  private sampleReceipt(title: string): ReceiptData {
    return {
      storeName: 'Baseeta POS',
      storeNameAr: title,
      invoiceNumber: `TEST-${Date.now()}`,
      date: new Date().toLocaleString('ar-EG'),
      cashierName: 'الكاشير',
      items: [
        { name: 'Arabic item', nameAr: 'منتج تجريبي عربي', quantity: 1, unitPrice: 10, total: 10 },
        { name: 'Second item', nameAr: 'منتج بدون تشويه', quantity: 2, unitPrice: 15, total: 30 },
      ],
      subtotal: 40,
      discountAmount: 0,
      taxAmount: 0,
      total: 40,
      paidAmount: 40,
      changeAmount: 0,
      paymentMethod: 'CASH',
      currency: 'EGP',
      qrData: 'https://markode.co',
    };
  }
}

export const thermalPrinter = new ThermalPrinter();
