import { In } from 'typeorm';
import { AppDataSource } from '../config/datasource';
import { CustomizationCategory } from '../entities/CustomizationCategory';
import { CustomizationOption } from '../entities/CustomizationOption';
import { VehicleCustomization } from '../entities/VehicleCustomization';

export const getCategoryRepository = () =>
    AppDataSource.getRepository(CustomizationCategory);

export const getOptionRepository = () =>
    AppDataSource.getRepository(CustomizationOption);

export const getVehicleCustomizationRepository = () =>
    AppDataSource.getRepository(VehicleCustomization);

export const findCategories = async (): Promise<CustomizationCategory[]> => {
    return getCategoryRepository().find({ order: { name: 'ASC' } });
};

export const findOptionIdsForVehicle = async (
    vehicleId: string
): Promise<string[]> => {
    const links = await getVehicleCustomizationRepository().find({
        where: { vehicleId },
    });

    return links.map((link) => link.optionId);
};

export const findOptionsByIds = async (
    optionIds: string[]
): Promise<CustomizationOption[]> => {
    if (optionIds.length === 0) {
        return [];
    }

    return getOptionRepository().find({
        where: { id: In(optionIds) },
        order: { name: 'ASC' },
    });
};

export const findOptionsForVehicle = async (
    vehicleId: string
): Promise<(CustomizationOption & { categoryName: string })[]> => {
    const rows = await getOptionRepository()
        .createQueryBuilder('option')
        .innerJoin(
            'vehicle_customizations',
            'link',
            'link.option_id = option.id'
        )
        .innerJoin(
            'customization_categories',
            'category',
            'category.id = option.category_id'
        )
        .where('link.vehicle_id = :vehicleId', { vehicleId })
        .orderBy('category.name', 'ASC')
        .addOrderBy('option.price_delta', 'ASC')
        .select([
            'option.id AS id',
            'option.category_id AS category_id',
            'option.name AS name',
            'option.price_delta AS price_delta',
            'option.is_available AS is_available',
            'category.name AS category_name',
        ])
        .getRawMany();

    return rows.map((row) => ({
        id: row.id,
        categoryId: row.category_id,
        name: row.name,
        priceDelta: row.price_delta,
        isAvailable: row.is_available,
        categoryName: row.category_name,
    })) as (CustomizationOption & { categoryName: string })[];
};
