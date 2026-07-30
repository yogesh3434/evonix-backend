import { Entity, PrimaryColumn } from 'typeorm';

/**
 * Join table deciding which customization options a given vehicle offers.
 * An option that exists in the catalogue is not automatically offered on
 * every vehicle.
 */
@Entity({ name: 'vehicle_customizations' })
export class VehicleCustomization {
    @PrimaryColumn({ name: 'vehicle_id', type: 'uuid' })
    vehicleId!: string;

    @PrimaryColumn({ name: 'option_id', type: 'uuid' })
    optionId!: string;
}
