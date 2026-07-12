export type VehicleSortField = 'price' | 'mileage' | 'modelYear';
export type SortOrder = 'asc' | 'desc';

export interface VehicleQuery {
    brand?: string;
    bodyStyle?: string;
    modelYear?: number;
    condition?: 'new' | 'used';
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy: VehicleSortField;
    sortOrder: SortOrder;
    page: number;
    limit: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}