import app from "./app.js";
import { connectDB } from "./src/config/db.config.js";
import { initCache } from "./src/config/cache.js";
import logger from "./src/config/logger.js";
import { configDotenv } from "dotenv";
import { checkGeminiConnection } from "./src/config/Aiconfig.js";
import { createServer } from "http";
import { initSocket } from "./src/sockets/index.js";
import { startJobs } from "./src/jobs/index.js";

// Load environment variables first
configDotenv();

// Validate required environment variables
const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'PORT'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const PORT = process.env.PORT || 5000;

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err) => {
        if (err) {
            logger.error('Error during server shutdown:', err);
            process.exit(1);
        }
        
        logger.info('Server closed successfully');
        process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

// Start server
const httpServer = createServer(app);
initSocket(httpServer);

const server = httpServer.listen(PORT, async () => {
    try {
        // Connect to databases
        await connectDB();
        initCache();
        startJobs();
       const {status, model}= await checkGeminiConnection();
       logger.info(status, model)
        logger.info(`🚀 CareerNav API Server running on http://localhost:${PORT}`);
        logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
        logger.info(`🔧 API Version: ${process.env.VERSION}`);
        
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
});

// Handle crashes gracefully
process.on("uncaughtException", (err) => {
    logger.error("💥 Uncaught Exception:", err);
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    logger.error("💥 Unhandled Rejection:", err);
    server.close(() => process.exit(1));
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
