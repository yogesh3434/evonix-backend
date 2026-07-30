import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { SelectedCustomization } from '../types/customization';

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

    /**
     * The customization options chosen for this line, stored as JSON so the
     * cart keeps showing the option names and prices the customer selected.
     */
    @Column({
        name: 'customization_options',
        type: 'jsonb',
        default: () => "'[]'",
    })
    customizationOptions!: SelectedCustomization[];

    /**
     * Cost of the selected options for ONE unit of this vehicle. The line total
     * is (unitPrice + customizationTotal) * quantity.
     */
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