interface PaymentModalProps {
    total: number;
    currency: string;
    onConfirm: (paidAmount: number) => void;
    onClose: () => void;
    isProcessing: boolean;
}
export declare function PaymentModal({ total, currency, onConfirm, onClose, isProcessing }: PaymentModalProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=PaymentModal.d.ts.map