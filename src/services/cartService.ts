import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { Vehicle } from '../entities/Vehicle';
import {
    createCart,
    deleteCartItem,
    findAvailableVehicle,
    findCartByUser,
    findCartItem,
    findCartItems,
    findVehiclesByIds,
    saveCartItem,
} from '../repositories/cartRepository';
import { AppError } from '../errors/AppError';
import {
    AddCartItemInput,
    CartItemResponse,
    CartResponse,
    UpdateCartItemInput,
} from '../types/cart';

/**
 * A vehicle on a hot deal is charged at its hot-deal price. This mirrors the
 * effective-price rule the catalogue uses when it filters and sorts.
 */
const effectivePrice = (vehicle: Vehicle): number => {
    if (vehicle.isHotDeal && vehicle.hotDealPrice !== null) {
        return Number(vehicle.hotDealPrice);
    }

    return Number(vehicle.price);
};

const mapCartResponse = (
    cart: Cart,
    items: CartItem[],
    vehicles: Vehicle[]
): CartResponse => {
    const vehiclesById = new Map(
        vehicles.map((vehicle) => [vehicle.id, vehicle])
    );

    const mappedItems: CartItemResponse[] = items.map((item) => {
        const vehicle = vehiclesById.get(item.vehicleId);
        const unitPrice = Number(item.unitPrice);

        return {
            id: item.id,
            vehicleId: item.vehicleId,
            name: vehicle?.name ?? '',
            brand: vehicle?.brand ?? '',
            model: vehicle?.model ?? '',
            unitPrice,
            quantity: item.quantity,
            lineTotal: Number((unitPrice * item.quantity).toFixed(2)),
        };
    });

    const subtotal = mappedItems.reduce(
        (running, item) => running + item.lineTotal,
        0
    );

    const itemCount = mappedItems.reduce(
        (running, item) => running + item.quantity,
        0
    );

    return {
        id: cart.id,
        userId: cart.userId,
        items: mappedItems,
        itemCount,
        subtotal: Number(subtotal.toFixed(2)),
    };
};

const getOrCreateCart = async (userId: string): Promise<Cart> => {
    const existingCart = await findCartByUser(userId);

    if (existingCart) {
        return existingCart;
    }

    return createCart(userId);
};

const buildCartResponse = async (cart: Cart): Promise<CartResponse> => {
    const items = await findCartItems(cart.id);
    const vehicles = await findVehiclesByIds(
        items.map((item) => item.vehicleId)
    );

    return mapCartResponse(cart, items, vehicles);
};

// UC10: view the shopping cart and its running total.
export const getCart = async (userId: string): Promise<CartResponse> => {
    const cart = await getOrCreateCart(userId);

    return buildCartResponse(cart);
};

// UC10 / UC-M5: add a vehicle to the shopping cart.
export const addItemToCart = async (
    userId: string,
    input: AddCartItemInput
): Promise<CartResponse> => {
    const vehicle = await findAvailableVehicle(input.vehicleId);

    if (!vehicle) {
        throw new AppError(404, 'Vehicle not found');
    }

    const cart = await getOrCreateCart(userId);
    const existingItem = await findCartItem(cart.id, input.vehicleId);

    // Adding a vehicle already in the cart tops up the existing line
    // rather than creating a duplicate one.
    const requestedQuantity = existingItem
        ? existingItem.quantity + input.quantity
        : input.quantity;

    if (requestedQuantity > vehicle.quantity) {
        throw new AppError(
            409,
            `Only ${vehicle.quantity} of this vehicle are in stock`
        );
    }

    await saveCartItem({
        ...(existingItem ? { id: existingItem.id } : {}),
        cartId: cart.id,
        vehicleId: vehicle.id,
        quantity: requestedQuantity,
        unitPrice: effectivePrice(vehicle).toFixed(2),
    });

    return buildCartResponse(cart);
};

// UC10 / UC-C2: change the quantity of a vehicle already in the cart.
export const updateCartItem = async (
    userId: string,
    vehicleId: string,
    input: UpdateCartItemInput
): Promise<CartResponse> => {
    const cart = await getOrCreateCart(userId);
    const existingItem = await findCartItem(cart.id, vehicleId);

    if (!existingItem) {
        throw new AppError(404, 'Vehicle is not in the cart');
    }

    const vehicle = await findAvailableVehicle(vehicleId);

    if (!vehicle) {
        throw new AppError(404, 'Vehicle not found');
    }

    if (input.quantity > vehicle.quantity) {
        throw new AppError(
            409,
            `Only ${vehicle.quantity} of this vehicle are in stock`
        );
    }

    await saveCartItem({
        id: existingItem.id,
        cartId: cart.id,
        vehicleId,
        quantity: input.quantity,
        unitPrice: effectivePrice(vehicle).toFixed(2),
    });

    return buildCartResponse(cart);
};

// UC10 / UC-C2: remove a vehicle from the cart.
export const removeCartItem = async (
    userId: string,
    vehicleId: string
): Promise<CartResponse> => {
    const cart = await getOrCreateCart(userId);
    const existingItem = await findCartItem(cart.id, vehicleId);

    if (!existingItem) {
        throw new AppError(404, 'Vehicle is not in the cart');
    }

    await deleteCartItem(existingItem.id);

    return buildCartResponse(cart);
};