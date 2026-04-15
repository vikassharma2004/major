import express from "express";
const app = express();
import logger from "./src/config/logger.js";
import { errorHandler } from "./src/middleware/ErrorHanlder.js";
import { requestLogger } from "./src/middleware/requestLogger.js";
import { configureSecurityMiddleware, authLimiter, strictLimiter, generalLimiter } from "./src/config/security.js";
import cookieParser from "cookie-parser";
import AuthRouter from "./src/routes/auth.route.js";
import UserRouter from "./src/routes/user.route.js";
import RoadmapRouter from "./src/routes/roadmap.route.js";
import RoadmapModuleRouter from "./src/routes/roadmapmodule.router.js";
import RoadmapTaskRouter from "./src/routes/roadmaptaskroute.js";
import RoadmapModuleResourceRouter from "./src/routes/roadmapModuleResource.route.js";
import ResourceRouter from "./src/routes/resource.route.js";
import ProjectRouter from "./src/routes/project.route.js";
import EnrollmentRouter from "./src/routes/enrolment.route.js";
import CommunityRouter from "./src/routes/community.route.js";
import NotificationRouter from "./src/routes/notification.route.js";
import ProjectSubmissionRouter from "./src/routes/projectSubmission.route.js";
import TaskSubmissionRouter from "./src/routes/taskSubmission.route.js";
import ProgressRouter from "./src/routes/progress.route.js";
import PurchaseRouter from "./src/routes/purchase.route.js";
import RoleProfileRouter from "./src/routes/roleProfile.route.js";
import MentorProfileRouter from "./src/routes/mentorProfile.route.js";
import UserTaskRouter from "./src/routes/userTask.route.js";
import AiRouter from "./src/routes/ai.route.js";
import BillingRouter from "./src/routes/billing.route.js";
import MentorOnboardingRouter from "./src/routes/mentorOnboarding.route.js";
import AnalyticsRouter from "./src/routes/analytics.routes.js";
import ProjectResourceRouter from "./src/routes/projectResource.route.js";

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Configure security middleware first (skip general limiter for health/root)
configureSecurityMiddleware(app, { applyGeneralLimiter: false });

// Body parsing with size limits
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// Cookie parser
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Health check endpoint (before rate limiting)
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// Root endpoint
app.get("/", async (req, res) => {
    return res.json({ 
        message: "CareerNav API Server is running",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

// Apply general rate limiting after health/root
app.use(generalLimiter);

// API Routes with specific rate limiting
app.use(`${process.env.VERSION}/auth/login`, authLimiter);
app.use(`${process.env.VERSION}/auth/register`, authLimiter);
app.use(`${process.env.VERSION}/auth/2fa`, strictLimiter);

// Main API routes
app.use(`${process.env.VERSION}/auth`, AuthRouter);
app.use(`${process.env.VERSION}/user`, UserRouter);
app.use(`${process.env.VERSION}/roadmap`, RoadmapRouter);
app.use(`${process.env.VERSION}/roadmaps`, RoadmapRouter);
app.use(`${process.env.VERSION}/roadmap`, RoadmapModuleRouter);
app.use(`${process.env.VERSION}/roadmap`, ProjectRouter);
app.use(`${process.env.VERSION}/modules`, RoadmapTaskRouter);
app.use(`${process.env.VERSION}/modules`, RoadmapModuleResourceRouter);
app.use(`${process.env.VERSION}/tasks`, ResourceRouter);
app.use(`${process.env.VERSION}`, EnrollmentRouter);
app.use(`${process.env.VERSION}/communities`, CommunityRouter);
app.use(`${process.env.VERSION}/notifications`, NotificationRouter);
app.use(`${process.env.VERSION}/project-submissions`, ProjectSubmissionRouter);
app.use(`${process.env.VERSION}/task-submissions`, TaskSubmissionRouter);
app.use(`${process.env.VERSION}/my-tasks`, UserTaskRouter);
app.use(`${process.env.VERSION}/progress`, ProgressRouter);
app.use(`${process.env.VERSION}/purchases`, PurchaseRouter);
app.use(`${process.env.VERSION}/role-profiles`, RoleProfileRouter);
app.use(`${process.env.VERSION}/mentor-profiles`, MentorProfileRouter);
app.use(`${process.env.VERSION}/ai`, AiRouter);
app.use(`${process.env.VERSION}/billing`, BillingRouter);
app.use(`${process.env.VERSION}/mentor-onboarding`, MentorOnboardingRouter);
app.use(`${process.env.VERSION}/analytics`, AnalyticsRouter);
app.use(`${process.env.VERSION}/projects`, ProjectResourceRouter);

// 404 Handler (AFTER ROUTES)
app.use((req, res) => {
    logger.warn(`404 - ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    res.status(404).json({ 
        success: false,
        error: "Route not found",
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString()
    });
});

// Global error handler (LAST)
app.use(errorHandler);

export default app;
