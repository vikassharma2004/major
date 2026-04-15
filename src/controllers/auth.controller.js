import {
    registerService,
    loginService,
    logoutService,
    refreshTokenService,
    generate2FA as generate2FAService,
    verify2FA as verify2FAService,
    twoFactorLogin as twoFactorLoginService,
    verifyEmailService,
    resendOtpService
} from "../services/auth.service.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { setAuthCookies } from "../utils/helper.js";
import { 
    registerValidation, 
    loginValidation, 
    twoFactorTokenValidation 
} from "../config/validation.js";
import { auditLogger } from "../middleware/requestLogger.js";

export const register = [
    ...registerValidation,
    catchAsyncError(async (req, res,next) => {
        const { name, email, password } = req.body;

        const result = await registerService(name, email, password, req);
        
        res.status(201).json({
            success: true,
            message: result.message,
            data: {
                userId: result.userId
            }
        });
    })
];

export const login = [
    ...loginValidation,
    catchAsyncError(async (req, res,next) => {
        const { email, password } = req.body;
        
        const result = await loginService(email, password, req);
        
        // 🔐 2FA required
        if (result.requires2FA) {
            return res.status(200).json({
                success: true,
                message: "Two-factor authentication required",
                requires2FA: true,
                userId: result.userId
            });
        }
        
        // ✅ Normal login
        setAuthCookies(
            res,
            result.tokens.accessToken,
            result.tokens.refreshToken
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: result.user
        });
    })
];

export const logoutController = catchAsyncError(async (req, res) => {
    const result = await logoutService(req, res);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

export const refreshToken = catchAsyncError(async (req, res) => {
    const { accessToken, refreshToken } =
        await refreshTokenService(req.cookies?.refreshToken, req);

    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
        success: true,
        message: "Session refreshed"
    });
});

export const generate2FA = catchAsyncError(async (req, res) => {
    const result = await generate2FAService(req.user.id, req);
    
    res.status(200).json({
        success: true,
        message: "2FA QR code generated",
        data: {
            qrCode: result.qrCode,
            manualEntryKey: result.manualEntryKey
        }
    });
});

export const verify2FA = [
    ...twoFactorTokenValidation,
    catchAsyncError(async (req, res) => {
        const { token } = req.body;
        
        await verify2FAService(req.user.id, token, req);
        
        res.status(200).json({
            success: true,
            message: "2FA enabled successfully"
        });
    })
];

export const twoFactorLogin = [
    ...twoFactorTokenValidation,
    catchAsyncError(async (req, res) => {
        const { userId, token } = req.body;

        if (!userId) {
            throw new AppError("User ID is required", 400);
        }

        const { user,accessToken,refreshToken} = await twoFactorLoginService({ userId, token }, req);

        setAuthCookies(res, accessToken, refreshToken);

        res.status(200).json({
            message: "2FA login successful",
            success: true,
            user
        });
    })
];

/* ========================= VERIFY EMAIL ========================= */
export const verifyEmailController = catchAsyncError(async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        throw new AppError("userId and otp are required", 400);
    }

    const result = await verifyEmailService(userId, otp, req);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

/* ========================= RESEND OTP ========================= */
export const resendOtpController = catchAsyncError(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        throw new AppError("userId is required", 400);
    }

    const result = await resendOtpService(userId, req);

    res.status(200).json({
        success: true,
        message: result.message
    });
});
