import { AppDataSource } from '../config/datasource';
import { Profile } from '../entities/Profile';

export const getProfileRepository = () => AppDataSource.getRepository(Profile);

export const findProfileById = async (
    userId: string
): Promise<Profile | null> => {
    return getProfileRepository().findOne({ where: { id: userId } });
};
