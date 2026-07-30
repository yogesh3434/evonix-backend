import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

export enum UsageEventType {
    VIEW = 'view',
    CART = 'cart',
    PURCHASE = 'purchase',
    SEARCH = 'search',
    COMPARE = 'compare',
    WISHLIST = 'wishlist',
    CHATBOT = 'chatbot',
}

@Entity({ name: 'usage_events' })
export class UsageEvent {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId!: string | null;

    @Column({ name: 'ip_address', type: 'inet', nullable: true })
    ipAddress!: string | null;

    @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
    vehicleId!: string | null;

    @Column({
        name: 'event_type',
        type: 'enum',
        enum: UsageEventType,
        enumName: 'usage_event_type',
    })
    eventType!: UsageEventType;

    @Column({ name: 'session_id', type: 'varchar', length: 120, nullable: true })
    sessionId!: string | null;

    @Column({ name: 'search_term', type: 'varchar', length: 120, nullable: true })
    searchTerm!: string | null;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent!: string | null;

    @CreateDateColumn({ name: 'occurred_at', type: 'timestamptz' })
    occurredAt!: Date;
}
