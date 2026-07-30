/**
 * A customization option as it is frozen onto a cart line or an order line.
 * The name, category and price are copied at selection time so the record stays
 * readable even if the option is later renamed, repriced or withdrawn.
 */
export type SelectedCustomization = {
    optionId: string;
    name: string;
    category: string;
    priceDelta: number;
};

export type CustomizationOptionResponse = {
    id: string;
    name: string;
    priceDelta: number;
    isAvailable: boolean;
};

export type CustomizationCategoryResponse = {
    id: string;
    name: string;
    options: CustomizationOptionResponse[];
};

export type VehicleCustomizationsResponse = {
    vehicleId: string;
    basePrice: number;
    categories: CustomizationCategoryResponse[];
};

export type PricedCustomizations = {
    options: SelectedCustomization[];
    total: number;
};
