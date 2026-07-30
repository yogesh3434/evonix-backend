import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentStatus } from './Order';

@Entity({ name: 'payment_attempts' })
export class PaymentAttempt {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'order_id', type: 'uuid' })
    orderId!: string;

    @Column({ name: 'attempt_number', type: 'int' })
    attemptNumber!: number;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        enumName: 'payment_status',
    })
    result!: PaymentStatus;

    @CreateDateColumn({ name: 'attempted_at', type: 'timestamptz' })
    attemptedAt!: Date;
}
