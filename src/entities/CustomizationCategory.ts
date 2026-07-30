import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'customization_categories' })
export class CustomizationCategory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 60, unique: true })
    name!: string;
}
