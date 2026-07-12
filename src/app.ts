import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import vehicleRoutes from './routes/vehicleRoutes';
import { notFoundMiddleware } from './middleware/notFoundMiddleware';
import { errorMiddleware } from './middleware/errorMiddleware';

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'EVonix backend is running',
    });
});

app.use('/api/vehicles', vehicleRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.use(
    (
        error: unknown,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
);
export default app;