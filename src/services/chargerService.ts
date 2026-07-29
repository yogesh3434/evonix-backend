import { AppError } from '../errors/AppError';

export type PropertyType = 'house' | 'condo';
export type ChargerLevel = 'level1' | 'level2';

export type ChargerEstimate = {
    baseCost: number;
    wiringCost: number;
    propertyAdjustment: number;
    estimatedTotal: number;
    breakdown: string[];
};


const BASE_COST: Record<ChargerLevel, number> = {
    level1: 400,
    level2: 1200,
};


const WIRING_COST_PER_METRE = 25;


const PROPERTY_ADJUSTMENT: Record<PropertyType, number> = {
    house: 0,
    condo: 500,
};

export const estimateChargerInstallation = (
    propertyType: PropertyType,
    chargerLevel: ChargerLevel,
    distanceToPanel: number
): ChargerEstimate => {
    if (distanceToPanel < 0) {
        throw new AppError(400, 'Distance to panel cannot be negative');
    }

    const baseCost = BASE_COST[chargerLevel];
    const wiringCost = Number(
        (distanceToPanel * WIRING_COST_PER_METRE).toFixed(2)
    );
    const propertyAdjustment = PROPERTY_ADJUSTMENT[propertyType];

    const estimatedTotal = baseCost + wiringCost + propertyAdjustment;

    const breakdown = [
        `Base ${chargerLevel} charger and installation: $${baseCost}`,
        `Wiring for ${distanceToPanel} m at $${WIRING_COST_PER_METRE}/m: $${wiringCost}`,
        `Property adjustment (${propertyType}): $${propertyAdjustment}`,
    ];

    return {
        baseCost,
        wiringCost,
        propertyAdjustment,
        estimatedTotal,
        breakdown,
    };
};