import { PaymentStatus } from '../entities/Order';

let requestSequence = 0;

const FAIL_EVERY_NTH_REQUEST = 3;

export type PaymentRequest = {
    orderId: string;
    amount: number;
    cardNumber: string;
    cardHolderName: string;
};

export type PaymentResult = {
    sequence: number;
    result: PaymentStatus;
    message: string;
};

export const authorizePayment = (request: PaymentRequest): PaymentResult => {
    requestSequence += 1;

    const isDeclined = requestSequence % FAIL_EVERY_NTH_REQUEST === 0;

    if (isDeclined) {
        return {
            sequence: requestSequence,
            result: PaymentStatus.DENIED,
            message:
                'Payment authorization was declined by the payment provider. Please try again.',
        };
    }

    return {
        sequence: requestSequence,
        result: PaymentStatus.APPROVED,
        message: `Payment of $${request.amount.toFixed(2)} authorized`,
    };
};

export const maskCardNumber = (cardNumber: string): string => {
    return cardNumber.replace(/\D/g, '').slice(-4);
};

export const resetPaymentSequence = (): void => {
    requestSequence = 0;
};

export const getPaymentSequence = (): number => requestSequence;
