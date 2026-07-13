import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import vehicleRoutes from './routes/vehicleRoutes';
import { notFoundMiddleware } from './middleware/notFoundMiddleware';
import { errorMiddleware } from './middleware/errorMiddleware';
import authRoutes from './routes/authRoutes';

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
app.use('/api/auth', authRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);


export default app;
