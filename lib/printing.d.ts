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
export declare class ThermalPrinter {
    private device;
    private endpoint;
    connectUSB(): Promise<boolean>;
    printReceipt(data: ReceiptData): Promise<void>;
    private buildReceipt;
    private printViaUSB;
    private printViaBrowser;
    sendToNetworkPrinter(ip: string, port: number | undefined, data: ReceiptData): Promise<boolean>;
}
export declare const thermalPrinter: ThermalPrinter;
//# sourceMappingURL=printing.d.ts.map