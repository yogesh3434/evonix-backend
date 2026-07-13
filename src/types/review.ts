export type CreateReviewInput = {
    vehicleId: string;
    rating: number;
    title?: string;
    body?: string;
};

export type ReviewResponse = {
    id: string;
    vehicleId: string;
    userId: string;
    rating: number;
    title: string | null;
    body: string | null;
    status: string;
    createdAt: Date;
};

export type VehicleReviewsResult = {
    data: ReviewResponse[];
    total: number;
    averageRating: number;
};