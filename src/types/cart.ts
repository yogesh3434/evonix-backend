export type AddCartItemInput = {
    vehicleId: string;
    quantity: number;
};

export type UpdateCartItemInput = {
    quantity: number;
};

export type CartItemResponse = {
    id: string;
    vehicleId: string;
    name: string;
    brand: string;
    model: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
};

export type CartResponse = {
    id: string;
    userId: string;
    items: CartItemResponse[];
    itemCount: number;
    subtotal: number;
};