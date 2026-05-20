
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import modularRoutes from './routes/index';
import { logger } from './utils/logger';

dotenv.config();

import http from 'http';
import { initSocket } from './utils/socket';

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Modular Routes
app.use('/api/v1', modularRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Resource not found' });
});

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', err);
    res.status(500).json({ message: 'Internal server error' });
});

server.listen(port, () => {
    logger.info(`OptikPro Backend (Modular) listening at http://localhost:${port}`);
});

export default app;
