import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
    CUSTOMER = 'customer',
    ADMIN = 'admin',
}

@Entity({ name: 'profiles' })
export class Profile {
    // The primary key mirrors auth.users(id), so it is never generated here.
    @PrimaryColumn({ type: 'uuid' })
    id!: string;

    @Column({ name: 'first_name', type: 'varchar', length: 60, nullable: true })
    firstName!: string | null;

    @Column({ name: 'last_name', type: 'varchar', length: 60, nullable: true })
    lastName!: string | null;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        enumName: 'user_role',
        default: UserRole.CUSTOMER,
    })
    role!: UserRole;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone!: string | null;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive!: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;
}
