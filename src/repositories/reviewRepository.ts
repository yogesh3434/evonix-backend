import { AppDataSource } from '../config/datasource';
import { Review, ReviewStatus } from '../entities/Review';
import { Vehicle } from '../entities/Vehicle';

export const getReviewRepository = () => AppDataSource.getRepository(Review);

export const vehicleExists = async (vehicleId: string): Promise<boolean> => {
    const count = await AppDataSource.getRepository(Vehicle).count({
        where: {
            id: vehicleId,
            isActive: true,
        },
    });

    return count > 0;
};

export const findReviewByUserAndVehicle = async (
    userId: string,
    vehicleId: string
): Promise<Review | null> => {
    return getReviewRepository().findOne({
        where: {
            userId,
            vehicleId,
        },
    });
};

export const saveReview = async (
    review: Partial<Review>
): Promise<Review> => {
    const repository = getReviewRepository();

    return repository.save(repository.create(review));
};

export const findReviewsByVehicle = async (
    vehicleId: string
): Promise<Review[]> => {
    return getReviewRepository().find({
        where: {
            vehicleId,
            status: ReviewStatus.APPROVED,
        },
        order: {
            createdAt: 'DESC',
        },
    });
};


export const findAverageRating = async (
    vehicleId: string
): Promise<number> => {
    const result = await getReviewRepository()
        .createQueryBuilder('review')
        .select('AVG(review.rating)', 'average')
        .where('review.vehicle_id = :vehicleId', { vehicleId })
        .andWhere('review.status = :status', {
            status: ReviewStatus.APPROVED,
        })
        .getRawOne<{ average: string | null }>();

    return result?.average ? Number(result.average) : 0;
};