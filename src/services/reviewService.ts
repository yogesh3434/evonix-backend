import { Review, ReviewStatus } from '../entities/Review';
import {
    findAverageRating,
    findReviewByUserAndVehicle,
    findReviewsByVehicle,
    saveReview,
    vehicleExists,
} from '../repositories/reviewRepository';
import { AppError } from '../errors/AppError';
import {
    CreateReviewInput,
    ReviewResponse,
    VehicleReviewsResult,
} from '../types/review';

const mapReviewResponse = (review: Review): ReviewResponse => ({
    id: review.id,
    vehicleId: review.vehicleId,
    userId: review.userId,
    rating: review.rating,
    title: review.title,
    body: review.body,
    status: review.status,
    createdAt: review.createdAt,
});

export const submitReview = async (
    userId: string,
    input: CreateReviewInput
): Promise<ReviewResponse> => {
    const exists = await vehicleExists(input.vehicleId);

    if (!exists) {
        throw new AppError(404, 'Vehicle not found');
    }

    const existingReview = await findReviewByUserAndVehicle(
        userId,
        input.vehicleId
    );

    if (existingReview) {
        throw new AppError(409, 'You have already reviewed this vehicle');
    }

    const review = await saveReview({
        userId,
        vehicleId: input.vehicleId,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body ?? null,
        status: ReviewStatus.APPROVED,
    });

    return mapReviewResponse(review);
};

export const getVehicleReviews = async (
    vehicleId: string
): Promise<VehicleReviewsResult> => {
    const exists = await vehicleExists(vehicleId);

    if (!exists) {
        throw new AppError(404, 'Vehicle not found');
    }

    const reviews = await findReviewsByVehicle(vehicleId);
    const averageRating = await findAverageRating(vehicleId);

    return {
        data: reviews.map(mapReviewResponse),
        total: reviews.length,
        averageRating: Number(averageRating.toFixed(2)),
    };
};