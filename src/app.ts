import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import vehicleRoutes from './routes/vehicleRoutes';
import loanRoutes from './routes/loanRoutes';
import chatbotRoutes from './routes/chatbotRoutes';
import { notFoundMiddleware } from './middleware/notFoundMiddleware';
import { errorMiddleware } from './middleware/errorMiddleware';
import authRoutes from './routes/authRoutes';
import reviewRoutes from './routes/reviewRoutes';
import cartRoutes from './routes/cartRoutes';

const app = express();


app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    })
);
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'public')));


app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'EVonix backend is running',
    });
});

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);


export default app;
