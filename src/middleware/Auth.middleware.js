import jwt from "jsonwebtoken";
import { AppError } from "../middleware/ErrorHanlder.js";
import { generateTokens, setAuthCookies } from "../utils/helper.js";
import { User } from "../models/Auth/User.model.js";
import { isTokenBlacklisted } from "../config/redis.js";
import { securityLogger } from "./requestLogger.js";
import logger from "../config/logger.js";
import { configDotenv } from "dotenv";
configDotenv();

export const authenticate = async (req, res, next) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  if (!accessToken && !refreshToken) {
    securityLogger('Authentication attempt without tokens', req);
    throw new AppError("Authentication required", 401);
  }

  // 1️⃣ Try access token first
  if (accessToken) {
    try {
      // Check if token is blacklisted
      if (await isTokenBlacklisted(accessToken)) {
        securityLogger('Blacklisted token used', req, { token: accessToken.substring(0, 20) + '...' });
        throw new AppError("Token has been revoked", 401);
      }

      const decoded = jwt.verify(
        accessToken,
        process.env.JWT_SECRET,
        {
          issuer: "careernav",
          audience: "careernav-client"
        }
      );

      // Validate user status from token
      if (decoded.status === 'suspended') {
        securityLogger('Suspended user attempted access', req, { userId: decoded.sub });
        throw new AppError("Account suspended", 403);
      }

      if (!decoded.ev) {
        securityLogger('Unverified user attempted access', req, { userId: decoded.sub });
        throw new AppError("Email verification required", 403);
      }

      req.user = {
        id: decoded.sub,
        role: decoded.role,
        status: decoded.status,
        isEmailVerified: decoded.ev,
        twoFactorEnabled: decoded.tfa
      };

      return next();
    } catch (err) {
      // If token is expired → fall through to refresh
      if (err.name !== "TokenExpiredError") {
        securityLogger('Invalid access token', req, { error: err.message });
        throw new AppError("Invalid access token", 401);
      }
    }
  }

  // 2️⃣ Access expired → try refresh token
  if (!refreshToken) {
    securityLogger('Session expired - no refresh token', req);
    throw new AppError("Session expired. Please log in again.", 401);
  }

  // Check if refresh token is blacklisted
  if (await isTokenBlacklisted(refreshToken)) {
    securityLogger('Blacklisted refresh token used', req, { token: refreshToken.substring(0, 20) + '...' });
    throw new AppError("Session has been revoked", 401);
  }

  let decodedRefresh;
  try {
    decodedRefresh = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      {
        issuer: "careernav",
        audience: "careernav-client"
      }
    );
  } catch (err) {
    securityLogger('Invalid refresh token', req, { error: err.message });
    throw new AppError("Session expired. Please log in again.", 401);
  }

  // 3️⃣ Validate tokenVersion from DB
  const user = await User.findById(decodedRefresh.sub);
  if (!user) {
    securityLogger('Refresh token for non-existent user', req, { userId: decodedRefresh.sub });
    throw new AppError("User no longer exists", 401);
  }

  if (user.status === 'suspended') {
    securityLogger('Suspended user attempted token refresh', req, { userId: user._id });
    throw new AppError("Account suspended", 403);
  }

  if ((user.tokenVersion ?? 0) !== decodedRefresh.tokenVersion) {
    securityLogger('Token version mismatch', req, { 
      userId: user._id, 
      expectedVersion: user.tokenVersion, 
      receivedVersion: decodedRefresh.tokenVersion 
    });
    throw new AppError("Session revoked. Please log in again.", 401);
  }

  // 4️⃣ Issue new tokens
  const { accessToken: newAccess, refreshToken: newRefresh } =
    generateTokens(user);

  setAuthCookies(res, newAccess, newRefresh);

  // 5️⃣ Attach user to request
  req.user = {
    id: user._id.toString(),
    role: user.role,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    twoFactorEnabled: user.twoFactorEnabled
  };

  logger.info('Token refreshed successfully', { userId: user._id });
  next();
};
