import { SelectedCustomization } from './customization';

export type ShippingInput = {
    fullName: string;
    street: string;
    city: string;
    province: string;
    country: string;
    postalCode: string;
    phone?: string;
};

export type PaymentInput = {
    cardNumber: string;
    cardHolderName: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
};

export type CheckoutInput = {
    shipping: ShippingInput;
    payment: PaymentInput;
    notes?: string;
};

export type OrderItemResponse = {
    id: string;
    vehicleId: string;
    name: string;
    brand: string;
    model: string;
    quantity: number;
    unitPrice: number;
    customizationOptions: SelectedCustomization[];
    customizationTotal: number;
    lineTotal: number;
};

export type OrderResponse = {
    id: string;
    userId: string;
    status: string;
    paymentStatus: string;
    subtotal: number;
    tax: number;
    total: number;
    cardLastFour: string | null;
    shipping: {
        fullName: string | null;
        street: string | null;
        city: string | null;
        province: string | null;
        country: string | null;
        postalCode: string | null;
        phone: string | null;
    };
    items: OrderItemResponse[];
    createdAt: Date;
};
