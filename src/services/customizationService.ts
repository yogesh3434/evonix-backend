import { AppError } from '../errors/AppError';
import {
    findOptionsForVehicle,
    findOptionIdsForVehicle,
    findOptionsByIds,
} from '../repositories/customizationRepository';
import { findVehicleById } from '../repositories/vehicleRepository';
import {
    CustomizationCategoryResponse,
    PricedCustomizations,
    SelectedCustomization,
    VehicleCustomizationsResponse,
} from '../types/customization';

/**
 * UC11: the options a customer may choose for one vehicle, grouped by category
 * so the configurator can render one control per category.
 */
export const getVehicleCustomizations = async (
    vehicleId: string
): Promise<VehicleCustomizationsResponse> => {
    const vehicle = await findVehicleById(vehicleId);

    if (!vehicle) {
        throw new AppError(404, 'Vehicle not found');
    }

    const options = await findOptionsForVehicle(vehicleId);

    const categories = options.reduce<CustomizationCategoryResponse[]>(
        (grouped, option) => {
            const existing = grouped.find(
                (candidate) => candidate.name === option.categoryName
            );

            const mapped = {
                id: option.id,
                name: option.name,
                priceDelta: Number(option.priceDelta),
                isAvailable: option.isAvailable,
            };

            if (existing) {
                existing.options.push(mapped);
                return grouped;
            }

            grouped.push({
                id: option.categoryId,
                name: option.categoryName,
                options: [mapped],
            });

            return grouped;
        },
        []
    );

    return {
        vehicleId: vehicle.id,
        basePrice: Number(vehicle.price),
        categories,
    };
};

/**
 * UC11: validate a customer's selection and price it.
 *
 * A selection is only accepted when every option is offered on that specific
 * vehicle and is still available. The names and prices are copied into the
 * result so the cart and the order can store a snapshot rather than a set of
 * IDs that may be repriced later.
 */
export const priceCustomizations = async (
    vehicleId: string,
    optionIds: string[]
): Promise<PricedCustomizations> => {
    if (optionIds.length === 0) {
        return { options: [], total: 0 };
    }

    const uniqueIds = Array.from(new Set(optionIds));
    const offeredIds = await findOptionIdsForVehicle(vehicleId);

    const notOffered = uniqueIds.filter((id) => !offeredIds.includes(id));

    if (notOffered.length > 0) {
        throw new AppError(
            400,
            'One or more customization options are not offered on this vehicle',
            { optionIds: notOffered }
        );
    }

    const options = await findOptionsByIds(uniqueIds);

    if (options.length !== uniqueIds.length) {
        throw new AppError(404, 'One or more customization options do not exist');
    }

    const unavailable = options.filter((option) => !option.isAvailable);

    if (unavailable.length > 0) {
        throw new AppError(
            409,
            'One or more customization options are no longer available',
            { optionIds: unavailable.map((option) => option.id) }
        );
    }

    // The category name is fetched alongside the offered options so the snapshot
    // records what kind of choice each option was.
    const offeredWithCategory = await findOptionsForVehicle(vehicleId);

    const selected: SelectedCustomization[] = options.map((option) => {
        const match = offeredWithCategory.find(
            (candidate) => candidate.id === option.id
        );

        return {
            optionId: option.id,
            name: option.name,
            category: match?.categoryName ?? '',
            priceDelta: Number(option.priceDelta),
        };
    });

    const total = selected.reduce(
        (running, option) => running + option.priceDelta,
        0
    );

    return { options: selected, total: Number(total.toFixed(2)) };
};
