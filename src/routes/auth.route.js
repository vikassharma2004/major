import express from "express";
import {
  register,
  login,
  refreshToken,
  generate2FA,
  verify2FA,
  twoFactorLogin,
  logoutController
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";


const AuthRouter = express.Router();

/* ========================= AUTH ========================= */
AuthRouter.route("/register").post(register);
AuthRouter.route("/login").post(login);
AuthRouter.route("/logout").post(logoutController);
AuthRouter.route("/login/2fa").post(twoFactorLogin);
AuthRouter.route("/refresh").post(authenticate,refreshToken);

/* ========================= 2FA ========================= */
AuthRouter.route("/2fa/generate").post(authenticate,generate2FA);
AuthRouter.route("/2fa/verify").post( verify2FA);

export default AuthRouter;
