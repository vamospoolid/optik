import { Server } from 'socket.io';

let io: Server;

export const initSocket = (server: any) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected to Socket.IO:', socket.id);
        
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        console.warn('Socket.IO not initialized yet');
    }
    return io;
};
