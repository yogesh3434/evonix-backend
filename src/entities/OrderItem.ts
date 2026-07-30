import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type OrderItemCustomization = {
    optionId: string;
    name: string;
    category: string;
    priceDelta: number;
};

@Entity({ name: 'order_items' })
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'order_id', type: 'uuid' })
    orderId!: string;

    @Column({ name: 'vehicle_id', type: 'uuid' })
    vehicleId!: string;

    @Column({ type: 'int', default: 1 })
    quantity!: number;

    @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
    unitPrice!: string;

    @Column({
        name: 'customization_options',
        type: 'jsonb',
        default: () => "'[]'",
    })
    customizationOptions!: OrderItemCustomization[];

    @Column({
        name: 'customization_total',
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
    })
    customizationTotal!: string;
}
