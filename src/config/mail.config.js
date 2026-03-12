
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { configDotenv } from "dotenv";
import logger from "./logger.js";
configDotenv();


export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  pool: true,
  maxConnections: 10,
  maxMessages: 100,
  rateDelta: 20000,
  rateLimit: 5
});

// Verify SMTP on startup (IMPORTANT)
transporter.verify((err) => {
  if (err) {
    logger.error("SMTP connection failed", err);
  } else {
    logger.info("SMTP server is ready");
  }
});

export async function sendEmail({ to, subject, html, text }) {
  if (!to) {
    logger.error("sendEmail called without recipient");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      text
    });

    logger.info(`Mail sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error("Mail error", error);
    return null;
  }
}