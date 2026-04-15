import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { User } from "../models/Auth/User.model.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { clearAuthCookies, generateTokens, blacklistUserTokens, validatePasswordStrength } from "../utils/helper.js";
import { OtpToken } from "../models/Auth/otp.model.js";
import { emailVerificationTemplate } from "../templates/email.js";
import { sendEmail } from "../config/mail.config.js";
import { securityLogger, auditLogger } from "../middleware/requestLogger.js";
import logger from "../config/logger.js";
import { Usage } from "../models/monetization/Usage.model.js";
import { initializeUserUsage } from "./usage.service.js";
import { configDotenv } from "dotenv";
configDotenv({path: '../.env'});

/* ========================= REGISTER ========================= */
export const registerService = async (name, email, password, req) => {
  // Check password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    throw new AppError(passwordValidation.message, 400);
  }
  

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    securityLogger('Registration attempt with existing email', req, { email });
    throw new AppError("User already exists", 409);
  }

  
  // 🔐 Hash password with higher salt rounds
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: hashedPassword
  });


  // Initialize default usage/billing plan for the user
  await initializeUserUsage(user._id);

  const { otp, token } = await OtpToken.createOtp(user._id, "email_verification");

  // Send verification email
  try {
    await sendEmail({
      to: email,
      subject: "CareerNav – Email Verification (Valid for 10 Minutes)",
      html: `
      <html>
        <body style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">
          <div style="max-width:600px; margin:auto; background:#ffffff; padding:24px; border-radius:6px;">
            
            <h2 style="color:#111827;">Email Verification</h2>

            <p>Hello, ${user.name}</p>

            <p>
              Thank you for signing up on <strong>CareerNav</strong>.
              Please use the following OTP to verify your email address.
            </p>

            <div style="text-align:center; margin:24px 0;">
              <h1 style="letter-spacing:6px; margin:0; background:#f3f4f6; padding:16px; border-radius:4px;">${otp}</h1>
            </div>

            <p>
              This OTP is valid for <strong>10 minutes</strong>.
              If you did not request this, you can safely ignore this email.
            </p>

            <hr style="margin:24px 0;" />

            <p style="font-size:12px; color:gray;">
              © ${new Date().getFullYear()} CareerNav. All rights reserved.
            </p>

          </div>
        </body>
      </html>
    `,
    });

    auditLogger('User registered', req, 'User', { userId: user._id, email });
    logger.info(`User registered successfully: ${email}`);

    return {
      message: "Registration successful. Please verify your email.",
      userId: user._id
    };
  } catch (emailError) {
    // If email fails, delete the user to maintain consistency
    await User.findByIdAndDelete(user._id);
    await Usage.findOneAndDelete({ userId: user._id });
    logger.error('Failed to send verification email, user deleted', { email, error: emailError.message });
    throw new AppError("Registration failed. Please try again.", 500);
  }
};

/* ========================= LOGIN ========================= */
export const loginService = async (email, password, req) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
  if (!user) {
    securityLogger('Login attempt with non-existent email', req, { email });
    throw new AppError("account not found", 401);
  }

  if (user.status === "suspended") {
    securityLogger('Suspended user login attempt', req, { userId: user._id });
    throw new AppError("Your account has been suspended. Please contact support.", 403);
  }

  if (user.status === "deleted") {
    user.status = "active";
    await user.save();
  }

  if (!user.isEmailVerified) {
    securityLogger('Unverified user login attempt', req, { userId: user._id });
    throw new AppError("Email verification required to continue", 403);
  }

  // const isValid = await user.comparePassword(password);
  // if (!isValid) {
  //   securityLogger('Invalid password attempt', req, { userId: user._id });
  //   throw new AppError("Invalid credentials", 401);
  // }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // 🔐 2FA flow
  if (user.twoFactorEnabled) {
    auditLogger('2FA login initiated', req, 'Auth', { userId: user._id });
    return {
      requires2FA: true,
      userId: user._id
    };
  }

  // 🔑 Normal login
  const { accessToken, refreshToken } = generateTokens(user);

  auditLogger('User logged in', req, 'Auth', { userId: user._id });
  logger.info(`User logged in successfully: ${user.email}`);

  return {
    requires2FA: false,
    tokens: {
      accessToken,
      refreshToken
    },
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      status: user.status
    }
  };
};

/* ========================= LOGOUT ========================= */
export const logoutService = async (req, res) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  // Blacklist tokens if they exist
  if (accessToken || refreshToken) {
    await blacklistUserTokens(accessToken, refreshToken);
  }

  clearAuthCookies(res);
  
  if (req.user?.id) {
    auditLogger('User logged out', req, 'Auth', { userId: req.user.id });
  }

  return {
    message: "Logged out successfully"
  };
};

/* ========================= REFRESH TOKEN ========================= */
export const refreshTokenService = async (refreshTokenValue, req) => {
  if (!refreshTokenValue) {
    throw new AppError("Authentication required", 401);
  }

  let payload;
  try {
    payload = jwt.verify(
      refreshTokenValue,
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

  const user = await User.findById(payload.sub);
  if (!user || user.status === "suspended") {
    securityLogger('Refresh token for invalid user', req, { userId: payload.sub });
    throw new AppError("User not authorized", 403);
  }

  // 🔐 CRITICAL CHECK
  if ((user.tokenVersion ?? 0) !== payload.tokenVersion) {
    securityLogger('Token version mismatch on refresh', req, { 
      userId: user._id, 
      expectedVersion: user.tokenVersion, 
      receivedVersion: payload.tokenVersion 
    });
    throw new AppError("Session revoked. Please log in again.", 401);
  }

  return generateTokens(user);
};

/* ========================= GENERATE 2FA ========================= */
export const generate2FA = async (userId, req) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const secret = speakeasy.generateSecret({ 
    length: 20,
    name: `CareerNav (${user.email})`,
    issuer: 'CareerNav'
  });

  user.twoFactorSecret = secret.base32;
  await user.save();

  const qrCode = await qrcode.toDataURL(secret.otpauth_url);
  
  auditLogger('2FA setup initiated', req, 'Security', { userId });
  
  return { 
    qrCode,
    secret: secret.base32,
    manualEntryKey: secret.base32
  };
};

/* ========================= VERIFY 2FA ========================= */
export const verify2FA = async (userId, token, req) => {
  const user = await User.findById(userId).select("+twoFactorSecret");
  if (!user || !user.twoFactorSecret) {
    throw new AppError("2FA setup not initiated", 400);
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
    window: 2 // Allow 2 time steps (60 seconds) tolerance
  });

  if (!verified) {
    securityLogger('Invalid 2FA token', req, { userId });
    throw new AppError("Invalid 2FA token", 401);
  }

  user.twoFactorEnabled = true;
  await user.save();

  auditLogger('2FA enabled', req, 'Security', { userId });

  return { message: "2FA enabled successfully" };
};

/* ========================= 2FA LOGIN ========================= */
export const twoFactorLogin = async ({ userId, token }, req) => {
  const user = await User.findById(userId).select("+twoFactorSecret");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError("2FA not enabled for this account", 400);
  }

  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
    window: 2
  });

  if (!isValid) {
    securityLogger('Invalid 2FA login token', req, { userId });
    throw new AppError("Invalid 2FA token", 401);
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  auditLogger('2FA login successful', req, 'Auth', { userId });

 const { accessToken, refreshToken }= generateTokens(user); // This will also check tokenVersion and other security checks
  return {
    message: "2FA login successful",
     user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      status: user.status
    },
    accessToken,
    refreshToken


  }
};

/* ========================= DISABLE 2FA ========================= */
export const disable2FA = async (userId, currentPassword, req) => {
  const user = await User.findById(userId).select("+passwordHash +twoFactorSecret");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Verify current password
  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    securityLogger('Invalid password for 2FA disable', req, { userId });
    throw new AppError("Invalid current password", 401);
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  await user.save();

  auditLogger('2FA disabled', req, 'Security', { userId });

  return { message: "2FA disabled successfully" };
};

/* ========================= CHANGE PASSWORD ========================= */
export const changePassword = async (userId, currentPassword, newPassword, req) => {
  // Validate new password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    throw new AppError(passwordValidation.message, 400);
  }

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Verify current password
  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    securityLogger('Invalid current password for password change', req, { userId });
    throw new AppError("Invalid current password", 401);
  }

  // Check if new password is different from current
  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw new AppError("New password must be different from current password", 400);
  }

  // Hash new password
  const saltRounds = 12;
  user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
  
  // Increment token version to invalidate all existing tokens
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  
  await user.save();

  auditLogger('Password changed', req, 'Security', { userId });

  return { message: "Password changed successfully. Please log in again." };
};

/* ========================= VERIFY EMAIL OTP ========================= */
export const verifyEmailService = async (userId, otp, req) => {
  const otpRecord = await OtpToken.findOne({
    userId,
    purpose: "email_verification",
    used: false
  }).select("+otpHash");

  if (!otpRecord) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  const isValid = await otpRecord.verifyOtp(otp);
  if (!isValid) {
    securityLogger("Invalid email verification OTP", req, { userId });
    throw new AppError("Invalid or expired OTP", 400);
  }

  await User.findByIdAndUpdate(userId, { isEmailVerified: true });

  auditLogger("Email verified", req, "Auth", { userId });
  logger.info(`Email verified for userId: ${userId}`);

  return { message: "Email verified successfully. You can now sign in." };
};

/* ========================= RESEND OTP ========================= */
export const resendOtpService = async (userId, req) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isEmailVerified) {
    throw new AppError("Email is already verified", 400);
  }

  // Delete any existing unused OTPs for this user
  await OtpToken.deleteMany({ userId, purpose: "email_verification", used: false });

  const { otp } = await OtpToken.createOtp(userId, "email_verification");

  await sendEmail({
    to: user.email,
    subject: "CareerNav – Resend: Email Verification OTP",
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">
          <div style="max-width:600px; margin:auto; background:#ffffff; padding:24px; border-radius:6px;">
            <h2 style="color:#111827;">Email Verification</h2>
            <p>Hello, ${user.name}</p>
            <p>Here is your new verification OTP:</p>
            <div style="text-align:center; margin:24px 0;">
              <h1 style="letter-spacing:6px; margin:0; background:#f3f4f6; padding:16px; border-radius:4px;">${otp}</h1>
            </div>
            <p>This OTP is valid for <strong>10 minutes</strong>.</p>
            <hr style="margin:24px 0;" />
            <p style="font-size:12px; color:gray;">© ${new Date().getFullYear()} CareerNav. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  });

  auditLogger("OTP resent", req, "Auth", { userId });

  return { message: "A new OTP has been sent to your email." };
};



