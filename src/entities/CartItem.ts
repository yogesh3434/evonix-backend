import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'cart_items' })
export class CartItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'cart_id', type: 'uuid' })
    cartId!: string;

    @Column({ name: 'vehicle_id', type: 'uuid' })
    vehicleId!: string;

    @Column({ type: 'int', default: 1 })
    quantity!: number;

    @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
    unitPrice!: string;

    @Column({
        name: 'customization_total',
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
    })
    customizationTotal!: string;

    @CreateDateColumn({ name: 'added_at', type: 'timestamptz' })
    addedAt!: Date;
}