import { supabase, supabaseAdmin } from '../config/supabase';
import { AppError } from '../errors/AppError';

export type AddressInput = {
    street: string;
    city: string;
    province: string;
    country?: string;
    postalCode: string;
};

export type CompleteProfileInput = {
    userId: string;
    phone?: string;
    address?: AddressInput;
};

// UC1: Register
export const completeProfile = async (
    input: CompleteProfileInput
): Promise<{ userId: string }> => {
    const { userId, phone, address } = input;

    if (!supabaseAdmin) {
        throw new AppError(
            500,
            'SUPABASE_SERVICE_ROLE_KEY is not configured on the server'
        );
    }

    if (phone) {
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ phone })
            .eq('id', userId);

        if (error) {
            throw new AppError(400, error.message);
        }
    }

    if (address) {
        const { error } = await supabaseAdmin.from('addresses').insert({
            user_id: userId,
            street: address.street,
            city: address.city,
            province: address.province,
            country: address.country ?? 'Canada',
            postal_code: address.postalCode,
            is_default: true,
        });

        if (error) {
            throw new AppError(400, error.message);
        }
    }

    return { userId };
};

export type CurrentUserResult = {
    id: string;
    email: string | undefined;
    profile: Record<string, unknown> | null;
};

// UC2: Sign in. OAuth handshake - redirect to Google/Facebook, Supabase
// issuing a session - happens entirely on frontend via supabase-js.
export const getCurrentUser = async (
    accessToken: string
): Promise<CurrentUserResult> => {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
        throw new AppError(401, 'Invalid or expired session');
    }

    let profile: Record<string, unknown> | null = null;

    if (supabaseAdmin) {
        const { data: profileRow } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

        if (profileRow) {
            // Address lives in a separate table, so surface whether one
            // exists alongside the profile row - the frontend uses this
            // (phone OR address) to decide whether the profile is complete.
            const { count } = await supabaseAdmin
                .from('addresses')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', data.user.id);

            profile = { ...profileRow, hasAddress: Boolean(count && count > 0) };
        }
    }

    return { id: data.user.id, email: data.user.email, profile };
};

// UC3: Sign out
export const signOutUser = async (accessToken: string): Promise<void> => {
    if (!supabaseAdmin) {
        return;
    }

    const { error } = await supabaseAdmin.auth.admin.signOut(accessToken);

    if (error) {
        throw new AppError(400, error.message);
    }
};
