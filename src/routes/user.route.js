import express from "express";
import {
  getMe,
  updateMe,
  changeMyPassword,
  disableMy2FA,
  deactivateMyAccount
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";

const UserRouter = express.Router();

/* ========================= AUTHENTICATED USER ========================= */

// Profile
UserRouter
  .route("/me")
  .get(authenticate, getMe)
  .patch(authenticate, updateMe);

// Password
UserRouter
  .route("/me/password")
  .patch(authenticate, changeMyPassword);

// Two-Factor Authentication
UserRouter
  .route("/me/2fa")
  .delete(authenticate, disableMy2FA);

// Account lifecycle
UserRouter
  .route("/me/account")
  .patch(authenticate, deactivateMyAccount);

export default UserRouter;
