import { In } from 'typeorm';
import { AppDataSource } from '../config/datasource';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { Vehicle, VehicleStatus } from '../entities/Vehicle';

export const getCartRepository = () => AppDataSource.getRepository(Cart);

export const getCartItemRepository = () =>
    AppDataSource.getRepository(CartItem);

/**
 * Only an active, available vehicle may be added to a cart.
 */
export const findAvailableVehicle = async (
    vehicleId: string
): Promise<Vehicle | null> => {
    return AppDataSource.getRepository(Vehicle).findOne({
        where: {
            id: vehicleId,
            isActive: true,
            status: VehicleStatus.AVAILABLE,
        },
    });
};

export const findVehiclesByIds = async (
    vehicleIds: string[]
): Promise<Vehicle[]> => {
    if (vehicleIds.length === 0) {
        return [];
    }

    return AppDataSource.getRepository(Vehicle).find({
        where: { id: In(vehicleIds) },
    });
};

export const findCartByUser = async (
    userId: string
): Promise<Cart | null> => {
    return getCartRepository().findOne({ where: { userId } });
};

export const createCart = async (userId: string): Promise<Cart> => {
    const repository = getCartRepository();

    return repository.save(repository.create({ userId }));
};

export const findCartItems = async (
    cartId: string
): Promise<CartItem[]> => {
    return getCartItemRepository().find({
        where: { cartId },
        order: { addedAt: 'ASC' },
    });
};

export const findCartItem = async (
    cartId: string,
    vehicleId: string
): Promise<CartItem | null> => {
    return getCartItemRepository().findOne({
        where: { cartId, vehicleId },
    });
};

export const saveCartItem = async (
    item: Partial<CartItem>
): Promise<CartItem> => {
    const repository = getCartItemRepository();

    return repository.save(repository.create(item));
};

export const deleteCartItem = async (itemId: string): Promise<void> => {
    await getCartItemRepository().delete({ id: itemId });
};