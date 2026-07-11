import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';

export enum VehicleCondition {
    NEW = 'new',
    USED = 'used',
}

export enum VehicleStatus {
    AVAILABLE = 'available',
    SOLD = 'sold',
    RESERVED = 'reserved',
    INACTIVE = 'inactive',
}

@Entity({ name: 'vehicles' })
export class Vehicle {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 17, unique: true, nullable: true })
    vin!: string | null;

    @Column({ type: 'varchar', length: 120, nullable: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'varchar', length: 60 })
    brand!: string;

    @Column({ type: 'varchar', length: 60 })
    model!: string;

    @Column({ name: 'model_year', type: 'smallint' })
    modelYear!: number;

    @Column({
        type: 'enum',
        enum: VehicleCondition,
        enumName: 'vehicle_condition',
        default: VehicleCondition.NEW,
    })
    condition!: VehicleCondition;

    @Column({
        type: 'enum',
        enum: VehicleStatus,
        enumName: 'vehicle_status',
        default: VehicleStatus.AVAILABLE,
    })
    status!: VehicleStatus;

    @Column({
        name: 'body_style',
        type: 'varchar',
        length: 40,
        nullable: true,
    })
    bodyStyle!: string | null;

    @Column({
        name: 'colour_exterior',
        type: 'varchar',
        length: 40,
        nullable: true,
    })
    colourExterior!: string | null;

    @Column({
        name: 'colour_interior',
        type: 'varchar',
        length: 40,
        nullable: true,
    })
    colourInterior!: string | null;

    @Column({
        name: 'interior_fabric',
        type: 'varchar',
        length: 40,
        nullable: true,
    })
    interiorFabric!: string | null;

    @Column({ name: 'range_km', type: 'int', nullable: true })
    rangeKm!: number | null;

    @Column({
        name: 'battery_kwh',
        type: 'numeric',
        precision: 6,
        scale: 2,
        nullable: true,
    })
    batteryKwh!: string | null;

    @Column({
        name: 'charge_time_hrs',
        type: 'numeric',
        precision: 4,
        scale: 1,
        nullable: true,
    })
    chargeTimeHrs!: string | null;

    @Column({ type: 'int', nullable: true })
    horsepower!: number | null;

    @Column({
        name: 'seating_capacity',
        type: 'smallint',
        nullable: true,
    })
    seatingCapacity!: number | null;

    @Column({ type: 'numeric', precision: 12, scale: 2 })
    price!: string;

    @Column({ name: 'mileage_km', type: 'int', default: 0 })
    mileageKm!: number;

    @Column({ type: 'int', default: 1 })
    quantity!: number;

    @Column({ name: 'is_hot_deal', type: 'boolean', default: false })
    isHotDeal!: boolean;

    @Column({
        name: 'hot_deal_price',
        type: 'numeric',
        precision: 12,
        scale: 2,
        nullable: true,
    })
    hotDealPrice!: string | null;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ name: 'sold_at', type: 'timestamptz', nullable: true })
    soldAt!: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;
}