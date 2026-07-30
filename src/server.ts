import 'reflect-metadata';
import dotenv from 'dotenv';
import app from './app';
import { AppDataSource } from './config/datasource';
import { registerOrderSubscribers } from './events/orderSubscribers';

dotenv.config();

const PORT = process.env.PORT || 5050;

async function startServer() {
    try {
        await AppDataSource.initialize();

        console.log('Database connected successfully');
        registerOrderSubscribers();
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
