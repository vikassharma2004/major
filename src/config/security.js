import helmet from 'helmet';
import cors from 'cors';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import compression from 'compression';

// Rate limiting configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 3 attempts per window for sensitive operations
  message: {
    error: 'Too many sensitive operation attempts',
    message: 'Please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const getRateLimitKey = (req) => {
  const userId = req.user?.id;
  const ip = ipKeyGenerator(req.ip);
  return userId ? `user:${userId}` : `ip:${ip}`;
};

export const createRateLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    message: message || {
      error: "Too many requests",
      message: "Please try again later"
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateLimitKey
  });

// Targeted limiters
export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: "AI rate limit exceeded",
    message: "Please wait before sending more AI requests"
  }
});

export const communityMessageLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    error: "Message rate limit exceeded",
    message: "Please slow down and try again"
  }
});

export const writeLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  message: {
    error: "Write rate limit exceeded",
    message: "Too many write operations. Please try again shortly."
  }
});

// Security middleware configuration
export const configureSecurityMiddleware = (app, options = {}) => {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  const envOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        ...envOrigins,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://your-frontend-domain.com'
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Compression
  app.use(compression());

  // Sanitize data
  // app.use(mongoSanitize()


  // XSS protection
  // app.use(xss());

  // General rate limiting
  if (options.applyGeneralLimiter !== false) {
    app.use(generalLimiter);
  }
};
