import { AppDataSource } from '../config/datasource';
import { Vehicle, VehicleStatus } from '../entities/Vehicle';
import { PaginatedResult, VehicleQuery } from '../types/vehicle';

export const getVehicleRepository = () =>
    AppDataSource.getRepository(Vehicle);

export const findVehicles = async (
    filters: VehicleQuery
): Promise<PaginatedResult<Vehicle>> => {
    const repository = getVehicleRepository();

    const queryBuilder = repository
        .createQueryBuilder('vehicle')
        .where('vehicle.is_active = :isActive', {
            isActive: true,
        })
        .andWhere('vehicle.status = :status', {
            status: VehicleStatus.AVAILABLE,
        });

    if (filters.brand) {
        queryBuilder.andWhere(
            'LOWER(vehicle.brand) = LOWER(:brand)',
            {
                brand: filters.brand,
            }
        );
    }

    if (filters.bodyStyle) {
        queryBuilder.andWhere(
            'LOWER(vehicle.body_style) = LOWER(:bodyStyle)',
            {
                bodyStyle: filters.bodyStyle,
            }
        );
    }

    if (filters.modelYear !== undefined) {
        queryBuilder.andWhere(
            'vehicle.model_year = :modelYear',
            {
                modelYear: filters.modelYear,
            }
        );
    }

    if (filters.condition) {
        queryBuilder.andWhere(
            'vehicle.condition = :condition',
            {
                condition: filters.condition,
            }
        );
    }

    /**
     * When a vehicle has a valid hot-deal price, that is treated as its
     * effective catalogue price for filtering and sorting.
     */
    const effectivePriceExpression = `
    CASE
      WHEN vehicle.is_hot_deal = TRUE
        AND vehicle.hot_deal_price IS NOT NULL
      THEN vehicle.hot_deal_price
      ELSE vehicle.price
    END
  `;

    if (filters.minPrice !== undefined) {
        queryBuilder.andWhere(
            `${effectivePriceExpression} >= :minPrice`,
            {
                minPrice: filters.minPrice,
            }
        );
    }

    if (filters.maxPrice !== undefined) {
        queryBuilder.andWhere(
            `${effectivePriceExpression} <= :maxPrice`,
            {
                maxPrice: filters.maxPrice,
            }
        );
    }

    if (filters.search) {
        queryBuilder.andWhere(
            `(
        vehicle.name ILIKE :search
        OR vehicle.brand ILIKE :search
        OR vehicle.model ILIKE :search
        OR vehicle.description ILIKE :search
      )`,
            {
                search: `%${filters.search}%`,
            }
        );
    }

    const sortDirection =
        filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

    switch (filters.sortBy) {
        case 'price':
            queryBuilder.orderBy(
                effectivePriceExpression,
                sortDirection
            );
            break;

        case 'mileage':
            queryBuilder.orderBy(
                'vehicle.mileage_km',
                sortDirection
            );
            break;

        case 'modelYear':
        default:
            queryBuilder.orderBy(
                'vehicle.model_year',
                sortDirection
            );
            break;
    }

    // Stable secondary sort for vehicles with equal primary values.
    queryBuilder.addOrderBy('vehicle.created_at', 'DESC');

    const offset = (filters.page - 1) * filters.limit;

    queryBuilder.skip(offset).take(filters.limit);

    const [vehicles, total] =
        await queryBuilder.getManyAndCount();

    return {
        data: vehicles,
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages:
            total === 0 ? 0 : Math.ceil(total / filters.limit),
    };
};

export const findVehicleById = async (
    id: string
): Promise<Vehicle | null> => {
    return getVehicleRepository().findOne({
        where: {
            id,
            isActive: true,
        },
    });
};

export const findHotDealVehicles = async (): Promise<Vehicle[]> => {
    return getVehicleRepository().find({
        where: {
            isActive: true,
            isHotDeal: true,
            status: VehicleStatus.AVAILABLE,
        },
        order: {
            hotDealPrice: 'ASC',
        },
    });
};