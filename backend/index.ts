import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from 'cors';
import { initializeRedis, closeRedis } from "./src/utils/game-state-redis";
import Route from "./src/routes";
import common from "./src/utils/common";
import io from "./src/utils/socket-io";

const app = express();

app.use(cors());
app.use(express.json());

// Initialize server
const startServer = async () => {
    // Initialize Valkey (all data is ephemeral with TTL)
    try {
        await initializeRedis();
        console.log('Valkey initialized successfully');
        console.log('All rooms and players will auto-expire after 5 hours of inactivity');
    } catch (error) {
        console.error('Failed to initialize Valkey:', error);
        process.exit(1);
    }

    // Start Socket.IO server
    io.listen(parseInt(process.env.SOCKET_PORT ?? "5000"));

    app.use('/', new Route().router);

    app.use(common.errorHandler);

    const PORT = process.env.PORT ?? 8000;
    const server = app.listen(PORT, () => {
        console.log(`Server is up and running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down gracefully...');
        server.close(async () => {
            await closeRedis();
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        console.log('\nShutting down gracefully...');
        server.close(async () => {
            await closeRedis();
            process.exit(0);
        });
    });
};

// Start the server
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});