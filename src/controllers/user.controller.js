import {
  getProfile,
  updateProfile,
  changePassword,
  disable2FA,
  deactivateAccount
} from "../services/user.service.js";
import logger from "../config/logger.js";

/* ========================= GET PROFILE ========================= */
export const getMe = async (req, res, next) => {
  try {
    const user = await getProfile(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

/* ========================= UPDATE PROFILE ========================= */
export const updateMe = async (req, res, next) => {
  try {
    const user = await updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

/* ========================= CHANGE PASSWORD ========================= */
export const changeMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* ========================= DISABLE 2FA ========================= */
export const disableMy2FA = async (req, res, next) => {
  try {
    const result = await disable2FA(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* ========================= DEACTIVATE ACCOUNT ========================= */
export const deactivateMyAccount = async (req, res, next) => {
  try {
    const result = await deactivateAccount(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
