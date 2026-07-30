import { PaymentStatus } from '../entities/Order';

/**
 * Payment simulator.
 *
 * The project requirements state that every third consecutive payment request
 * must fail authorization, which is what TC-012 checks. The counter is therefore
 * global to the simulator and not per order: it counts requests reaching the
 * payment gateway, exactly as a flaky external gateway would behave.
 *
 * A real integration would replace this module and nothing else, because the
 * Ordering service only depends on the authorizePayment signature.
 */
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

/** The last four digits are the only part of a card number we ever keep. */
export const maskCardNumber = (cardNumber: string): string => {
    return cardNumber.replace(/\D/g, '').slice(-4);
};

/** Reset the simulator. Used by the tests so cases stay independent. */
export const resetPaymentSequence = (): void => {
    requestSequence = 0;
};

export const getPaymentSequence = (): number => requestSequence;
