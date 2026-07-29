import { estimateChargerInstallation } from '../src/services/chargerService';
import { AppError } from '../src/errors/AppError';

describe('Home Charger Estimator', () => {
    it('TC-046: estimates cost for a house with a level 2 charger', () => {
        const result = estimateChargerInstallation('house', 'level2', 10);

        
        expect(result.estimatedTotal).toBe(1450);
    });

    it('TC-047: adds the condo adjustment', () => {
        const result = estimateChargerInstallation('condo', 'level2', 10);

        
        expect(result.estimatedTotal).toBe(1950);
    });

    it('TC-048: uses the lower base cost for a level 1 charger', () => {
        const result = estimateChargerInstallation('house', 'level1', 0);

      
        expect(result.estimatedTotal).toBe(400);
    });

    it('TC-049: rejects a negative distance', () => {
        expect(() =>
            estimateChargerInstallation('house', 'level2', -5)
        ).toThrow(AppError);
    });
});