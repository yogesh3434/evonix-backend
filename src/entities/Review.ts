import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum ReviewStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity({ name: 'reviews' })
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'vehicle_id', type: 'uuid' })
    vehicleId!: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId!: string;

    @Column({ type: 'smallint' })
    rating!: number;

    @Column({ type: 'varchar', length: 120, nullable: true })
    title!: string | null;

    @Column({ type: 'text', nullable: true })
    body!: string | null;

    @Column({
        type: 'enum',
        enum: ReviewStatus,
        enumName: 'review_status',
        default: ReviewStatus.PENDING,
    })
    status!: ReviewStatus;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;
}