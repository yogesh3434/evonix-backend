import { In } from 'typeorm';
import { AppDataSource } from '../config/datasource';
import { Order, PaymentStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { PaymentAttempt } from '../entities/PaymentAttempt';
import { Vehicle, VehicleStatus } from '../entities/Vehicle';

export const getOrderRepository = () => AppDataSource.getRepository(Order);

export const getOrderItemRepository = () =>
    AppDataSource.getRepository(OrderItem);

export const getPaymentAttemptRepository = () =>
    AppDataSource.getRepository(PaymentAttempt);

export const saveOrder = async (order: Partial<Order>): Promise<Order> => {
    const repository = getOrderRepository();

    return repository.save(repository.create(order));
};

export const saveOrderItems = async (
    items: Partial<OrderItem>[]
): Promise<OrderItem[]> => {
    const repository = getOrderItemRepository();

    return repository.save(items.map((item) => repository.create(item)));
};

export const findOrderById = async (orderId: string): Promise<Order | null> => {
    return getOrderRepository().findOne({ where: { id: orderId } });
};

export const findOrdersByUser = async (userId: string): Promise<Order[]> => {
    return getOrderRepository().find({
        where: { userId },
        order: { createdAt: 'DESC' },
    });
};

export const findOrderItems = async (orderId: string): Promise<OrderItem[]> => {
    return getOrderItemRepository().find({ where: { orderId } });
};

export const updateOrderPayment = async (
    orderId: string,
    changes: Partial<Order>
): Promise<void> => {
    await getOrderRepository().update({ id: orderId }, changes);
};

export const savePaymentAttempt = async (
    attempt: Partial<PaymentAttempt>
): Promise<PaymentAttempt> => {
    const repository = getPaymentAttemptRepository();

    return repository.save(repository.create(attempt));
};

export const countPaymentAttempts = async (
    orderId: string
): Promise<number> => {
    return getPaymentAttemptRepository().count({ where: { orderId } });
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

export const decrementVehicleQuantity = async (
    vehicleId: string,
    quantity: number
): Promise<boolean> => {
    const result = await AppDataSource.getRepository(Vehicle)
        .createQueryBuilder()
        .update(Vehicle)
        .set({
            quantity: () => `quantity - ${quantity}`,
        })
        .where('id = :vehicleId', { vehicleId })
        .andWhere('quantity >= :quantity', { quantity })
        .execute();

    const updated = (result.affected ?? 0) > 0;

    if (updated) {
        await AppDataSource.getRepository(Vehicle)
            .createQueryBuilder()
            .update(Vehicle)
            .set({
                status: VehicleStatus.SOLD,
                soldAt: () => 'NOW()',
            })
            .where('id = :vehicleId', { vehicleId })
            .andWhere('quantity = 0')
            .execute();
    }

    return updated;
};

export const findApprovedOrderTotals = async (
    userId: string
): Promise<{ orderCount: number; lifetimeSpend: number }> => {
    const row = await getOrderRepository()
        .createQueryBuilder('o')
        .select('COUNT(*)', 'order_count')
        .addSelect('COALESCE(SUM(o.total), 0)', 'lifetime_spend')
        .where('o.user_id = :userId', { userId })
        .andWhere('o.payment_status = :status', {
            status: PaymentStatus.APPROVED,
        })
        .getRawOne();

    return {
        orderCount: Number(row?.order_count ?? 0),
        lifetimeSpend: Number(row?.lifetime_spend ?? 0),
    };
};
