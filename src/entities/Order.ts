import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum OrderStatus {
    PENDING = 'pending',
    PROCESSED = 'processed',
    DENIED = 'denied',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

export enum PaymentStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    DENIED = 'denied',
}

@Entity({ name: 'orders' })
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId!: string;

    @Column({ name: 'shipping_address_id', type: 'uuid', nullable: true })
    shippingAddressId!: string | null;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        enumName: 'order_status',
        default: OrderStatus.PENDING,
    })
    status!: OrderStatus;

    @Column({ type: 'numeric', precision: 12, scale: 2 })
    subtotal!: string;

    @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
    tax!: string;

    @Column({ type: 'numeric', precision: 12, scale: 2 })
    total!: string;

    @Column({ name: 'shipping_name', type: 'varchar', length: 120, nullable: true })
    shippingName!: string | null;

    @Column({ name: 'shipping_street', type: 'varchar', length: 120, nullable: true })
    shippingStreet!: string | null;

    @Column({ name: 'shipping_city', type: 'varchar', length: 60, nullable: true })
    shippingCity!: string | null;

    @Column({ name: 'shipping_province', type: 'varchar', length: 60, nullable: true })
    shippingProvince!: string | null;

    @Column({ name: 'shipping_country', type: 'varchar', length: 60, nullable: true })
    shippingCountry!: string | null;

    @Column({
        name: 'shipping_postal_code',
        type: 'varchar',
        length: 20,
        nullable: true,
    })
    shippingPostalCode!: string | null;

    @Column({ name: 'shipping_phone', type: 'varchar', length: 20, nullable: true })
    shippingPhone!: string | null;

    @Column({ name: 'card_last_four', type: 'char', length: 4, nullable: true })
    cardLastFour!: string | null;

    @Column({
        name: 'card_holder_name',
        type: 'varchar',
        length: 120,
        nullable: true,
    })
    cardHolderName!: string | null;

    @Column({
        name: 'payment_status',
        type: 'enum',
        enum: PaymentStatus,
        enumName: 'payment_status',
        default: PaymentStatus.PENDING,
    })
    paymentStatus!: PaymentStatus;

    @Column({ name: 'payment_attempt_seq', type: 'int', default: 0 })
    paymentAttemptSeq!: number;

    @Column({ type: 'text', nullable: true })
    notes!: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;
}
