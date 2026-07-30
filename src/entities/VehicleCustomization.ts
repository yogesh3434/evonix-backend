import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'vehicle_customizations' })
export class VehicleCustomization {
    @PrimaryColumn({ name: 'vehicle_id', type: 'uuid' })
    vehicleId!: string;

    @PrimaryColumn({ name: 'option_id', type: 'uuid' })
    optionId!: string;
}
