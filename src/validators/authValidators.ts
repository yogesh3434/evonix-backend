import { AppError } from '../errors/AppError';
import { AddressInput } from '../services/authService';

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

// UC1: validates phone/default-address collected after user signs in with Google for the first time
export const validateCompleteProfileInput = (
    body: unknown
): { phone?: string; address?: AddressInput } => {
    if (typeof body !== 'object' || body === null) {
        throw new AppError(400, 'Invalid request body');
    }

    const { phone, address } = body as Record<string, unknown>;

    let parsedAddress: AddressInput | undefined;

    if (address !== undefined) {
        if (typeof address !== 'object' || address === null) {
            throw new AppError(400, 'address must be an object');
        }

        const { street, city, province, country, postalCode } =
            address as Record<string, unknown>;

        if (
            !isNonEmptyString(street) ||
            !isNonEmptyString(city) ||
            !isNonEmptyString(province) ||
            !isNonEmptyString(postalCode)
        ) {
            throw new AppError(
                400,
                'address requires street, city, province, and postalCode'
            );
        }

        parsedAddress = {
            street,
            city,
            province,
            postalCode,
            country: isNonEmptyString(country) ? country : undefined,
        };
    }

    if (phone !== undefined && !isNonEmptyString(phone)) {
        throw new AppError(400, 'phone must be a non-empty string');
    }

    if (phone === undefined && parsedAddress === undefined) {
        throw new AppError(
            400,
            'Provide at least a phone number or an address to update'
        );
    }

    return {
        phone: isNonEmptyString(phone) ? phone : undefined,
        address: parsedAddress,
    };
};
