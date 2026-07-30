
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
