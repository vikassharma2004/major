import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "../config/logger.js";
import { CommunityMember } from "../models/Community/CommunityMember.model.js";
import {
  createMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  pinMessage,
  markCommunityRead
} from "../services/communityMessage.service.js";
import {
  createMessageSchema,
  editMessageSchema,
  reactionSchema
} from "../validators/communityMessage.validation.js";

let io;

const getAllowedOrigins = () => {
  return [
    process.env.CORS_ORIGIN,
    "http://localhost:3000",
    "http://localhost:3001",
    "https://your-frontend-domain.com"
  ].filter(Boolean);
};

const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((acc, part) => {
    const trimmed = part.trim();
    if (!trimmed) return acc;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) return acc;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
};

const extractToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const cookieHeader = socket.handshake.headers?.cookie;
  if (!cookieHeader) return null;
  const cookies = parseCookies(cookieHeader);
  return cookies.accessToken || null;
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = extractToken(socket);
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "careernav",
        audience: "careernav-client"
      });

      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      return next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userRoom = `user:${socket.userId}`;
    socket.join(userRoom);

    socket.emit("notification:ready", { userId: socket.userId });

    socket.on("community:join", async ({ communityId }, ack) => {
      try {
        const member = await CommunityMember.findOne({
          communityId,
          userId: socket.userId,
          isActive: true
        });

        if (!member) {
          throw new Error("Not a community member");
        }

        socket.join(`community:${communityId}`);
        ack?.({ ok: true, communityId });
        socket.emit("community:joined", { communityId });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("community:leave", ({ communityId }) => {
      socket.leave(`community:${communityId}`);
      socket.emit("community:left", { communityId });
    });

    socket.on("community:typing", ({ communityId, isTyping }) => {
      socket
        .to(`community:${communityId}`)
        .emit("community:typing", {
          communityId,
          userId: socket.userId,
          isTyping: Boolean(isTyping)
        });
    });

    socket.on("community:message:send", async (payload, ack) => {
      try {
        if (!payload?.communityId) throw new Error("communityId is required");
        const { error, value } = createMessageSchema.validate(payload);
        if (error) throw new Error(error.details[0].message);

        const message = await createMessage(
          payload.communityId,
          socket.userId,
          value
        );

        io.to(`community:${payload.communityId}`).emit(
          "community:message:new",
          message
        );
        ack?.({ ok: true, message });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("community:message:edit", async (payload, ack) => {
      try {
        if (!payload?.communityId || !payload?.messageId) {
          throw new Error("communityId and messageId are required");
        }
        const { error, value } = editMessageSchema.validate(payload);
        if (error) throw new Error(error.details[0].message);

        const message = await editMessage(
          payload.communityId,
          payload.messageId,
          socket.userId,
          value
        );
        io.to(`community:${payload.communityId}`).emit(
          "community:message:updated",
          message
        );
        ack?.({ ok: true, message });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("community:message:delete", async (payload, ack) => {
      try {
        if (!payload?.communityId || !payload?.messageId) {
          throw new Error("communityId and messageId are required");
        }
        const message = await deleteMessage(
          payload.communityId,
          payload.messageId,
          socket.userId,
          payload.reason
        );
        io.to(`community:${payload.communityId}`).emit(
          "community:message:deleted",
          message
        );
        ack?.({ ok: true, message });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("community:message:pin", async (payload, ack) => {
      try {
        if (!payload?.communityId || !payload?.messageId) {
          throw new Error("communityId and messageId are required");
        }
        const message = await pinMessage(
          payload.communityId,
          payload.messageId,
          socket.userId,
          Boolean(payload.pinned)
        );
        io.to(`community:${payload.communityId}`).emit(
          "community:message:pinned",
          message
        );
        ack?.({ ok: true, message });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("community:message:react", async (payload, ack) => {
      try {
        if (!payload?.communityId || !payload?.messageId) {
          throw new Error("communityId and messageId are required");
        }
        const { error, value } = reactionSchema.validate({ emoji: payload.emoji });
        if (error) throw new Error(error.details[0].message);

        const message = await addReaction(
          payload.communityId,
          payload.messageId,
          socket.userId,
          value.emoji
        );
        io.to(`community:${payload.communityId}`).emit(
          "community:message:reaction",
          message
        );
        ack?.({ ok: true, message });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("community:message:unreact", async (payload, ack) => {
      try {
        if (!payload?.communityId || !payload?.messageId) {
          throw new Error("communityId and messageId are required");
        }
        const { error, value } = reactionSchema.validate({ emoji: payload.emoji });
        if (error) throw new Error(error.details[0].message);

        const message = await removeReaction(
          payload.communityId,
          payload.messageId,
          socket.userId,
          value.emoji
        );
        io.to(`community:${payload.communityId}`).emit(
          "community:message:reaction",
          message
        );
        ack?.({ ok: true, message });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("community:read", async (payload, ack) => {
      try {
        if (!payload?.communityId) throw new Error("communityId is required");
        const result = await markCommunityRead(
          payload.communityId,
          socket.userId,
          payload.messageId
        );
        ack?.({ ok: true, result });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("disconnect", () => {
      // no-op for now
    });
  });

  logger.info("Socket.io initialized");
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

export const emitToUser = (userId, event, payload) => {
  if (!io) {
    logger.warn("Socket.io not initialized. Emit skipped.", { event, userId });
    return;
  }

  io.to(`user:${userId}`).emit(event, payload);
};
