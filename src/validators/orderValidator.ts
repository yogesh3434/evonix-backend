import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { CheckoutInput } from '../types/order';

const currentYear = new Date().getFullYear();

const shippingSchema = z.object({
    fullName: z.string().trim().min(2).max(120),
    street: z.string().trim().min(3).max(120),
    city: z.string().trim().min(2).max(60),
    province: z.string().trim().min(2).max(60),
    country: z.string().trim().min(2).max(60).default('Canada'),
    // Accepts Canadian postal codes (A1A 1A1) and US ZIP codes.
    postalCode: z
        .string()
        .trim()
        .min(5)
        .max(20)
        .regex(
            /^([A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d|\d{5}(-\d{4})?)$/,
            'Enter a valid postal or ZIP code'
        ),
    phone: z.string().trim().min(7).max(20).optional(),
});

const paymentSchema = z.object({
    // Digits and separators only. The full number is validated, used once and
    // never stored: only the last four digits reach the database.
    cardNumber: z
        .string()
        .trim()
        .regex(/^[\d\s-]{13,23}$/, 'Enter a valid card number')
        .transform((value) => value.replace(/\D/g, ''))
        .refine(
            (value) => value.length >= 13 && value.length <= 19,
            'Enter a valid card number'
        ),
    cardHolderName: z.string().trim().min(2).max(120),
    expiryMonth: z.coerce.number().int().min(1).max(12),
    expiryYear: z.coerce.number().int().min(currentYear).max(currentYear + 20),
    cvv: z.string().trim().regex(/^\d{3,4}$/, 'Enter a valid CVV'),
});

const checkoutSchema = z.object({
    shipping: shippingSchema,
    payment: paymentSchema,
    notes: z.string().trim().max(500).optional(),
});

const retryPaymentSchema = z.object({
    cardNumber: paymentSchema.shape.cardNumber,
    cardHolderName: paymentSchema.shape.cardHolderName,
});

const orderIdParamSchema = z.object({
    orderId: z.string().uuid(),
});

export const parseCheckout = (body: unknown): CheckoutInput => {
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
        throw new AppError(
            400,
            'Invalid checkout details',
            result.error.flatten()
        );
    }

    const expiry = result.data.payment;
    const now = new Date();

    // A card that expires this year must not already be in a past month.
    if (
        expiry.expiryYear === now.getFullYear() &&
        expiry.expiryMonth < now.getMonth() + 1
    ) {
        throw new AppError(400, 'This card has expired');
    }

    return result.data;
};

export const parseRetryPayment = (
    body: unknown
): { cardNumber: string; cardHolderName: string } => {
    const result = retryPaymentSchema.safeParse(body);

    if (!result.success) {
        throw new AppError(
            400,
            'Invalid payment details',
            result.error.flatten()
        );
    }

    return result.data;
};

export const parseOrderIdParam = (params: unknown): string => {
    const result = orderIdParamSchema.safeParse(params);

    if (!result.success) {
        throw new AppError(400, 'Invalid order ID', result.error.flatten());
    }

    return result.data.orderId;
};
