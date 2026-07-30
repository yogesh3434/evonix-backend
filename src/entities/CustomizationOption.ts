import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'customization_options' })
export class CustomizationOption {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'category_id', type: 'uuid' })
    categoryId!: string;

    @Column({ type: 'varchar', length: 80 })
    name!: string;

    @Column({
        name: 'price_delta',
        type: 'numeric',
        precision: 10,
        scale: 2,
        default: 0,
    })
    priceDelta!: string;

    @Column({ name: 'is_available', type: 'boolean', default: true })
    isAvailable!: boolean;
}
