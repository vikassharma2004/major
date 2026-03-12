import jwt from "jsonwebtoken";
import { blacklistToken } from "../config/redis.js";
import { configDotenv } from "dotenv";
configDotenv();

/* ========================= TOKEN GENERATOR ========================= */
export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      sub: user._id.toString(),          // subject (standard)
      role: user.role,
      status: user.status,
      ev: user.isEmailVerified,
      tfa: user.twoFactorEnabled
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
      issuer: "careernav",
      audience: "careernav-client"
    }
  );

  const refreshToken = jwt.sign(
    {
      sub: user._id.toString(),
      tokenVersion: user.tokenVersion ?? 0
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
      issuer: "careernav",
      audience: "careernav-client"
    }
  );

  return { accessToken, refreshToken };
};

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/"
};

/* ========================= SET AUTH COOKIES ========================= */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

/* ========================= CLEAR AUTH COOKIES ========================= */
export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
};

/* ========================= BLACKLIST TOKENS ========================= */
export const blacklistUserTokens = async (accessToken, refreshToken) => {
  const promises = [];
  
  if (accessToken) {
    // Blacklist access token for remaining time (15 minutes max)
    promises.push(blacklistToken(accessToken, 15 * 60));
  }
  
  if (refreshToken) {
    // Blacklist refresh token for remaining time (7 days max)
    promises.push(blacklistToken(refreshToken, 7 * 24 * 60 * 60));
  }
  
  await Promise.all(promises);
};

/* ========================= EXTRACT TOKEN FROM HEADER ========================= */
export const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

/* ========================= VALIDATE PASSWORD STRENGTH ========================= */
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const maxLength = 128;
  
  if (password.length < minLength || password.length > maxLength) {
    return {
      valid: false,
      message: `Password must be between ${minLength} and ${maxLength} characters`
    };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  const requirements = [];
  if (!hasUpperCase) requirements.push('one uppercase letter');
  if (!hasLowerCase) requirements.push('one lowercase letter');
  if (!hasNumbers) requirements.push('one number');
  if (!hasSpecialChar) requirements.push('one special character (@$!%*?&)');
  
  if (requirements.length > 0) {
    return {
      valid: false,
      message: `Password must contain at least ${requirements.join(', ')}`
    };
  }
  
  return { valid: true };
};

/* ========================= GENERATE SECURE RANDOM STRING ========================= */
export const generateSecureRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/* ========================= SANITIZE USER DATA ========================= */
export const sanitizeUserData = (user) => {
  const sanitized = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  
  // Remove sensitive fields
  delete sanitized.passwordHash;
  delete sanitized.twoFactorSecret;
  delete sanitized.tokenVersion;
  
  return sanitized;
};