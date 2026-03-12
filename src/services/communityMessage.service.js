import { Community } from "../models/Community/Community.model.js";
import { CommunityMember } from "../models/Community/CommunityMember.model.js";
import { CommunityMessage } from "../models/Community/communityMessageSchema.model.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { createNotification } from "./notification.service.js";

const ensureActiveCommunity = async (communityId) => {
  const community = await Community.findById(communityId).select("isActive");
  if (!community || !community.isActive) {
    throw new AppError("Community not available", 404);
  }
  return community;
};

const getActiveMember = async (communityId, userId) => {
  const member = await CommunityMember.findOne({
    communityId,
    userId,
    isActive: true
  });
  if (!member) {
    throw new AppError("You are not a member of this community", 403);
  }
  return member;
};

const canModerate = (member) => {
  return ["mentor", "moderator"].includes(member.role);
};

export const listMessages = async (communityId, userId, query) => {
  await ensureActiveCommunity(communityId);
  await getActiveMember(communityId, userId);

  const {
    page,
    limit,
    before,
    after,
    includeDeleted,
    pinnedOnly
  } = query;

  const filter = { communityId };
  if (!includeDeleted) filter.isDeleted = false;
  if (before) filter.createdAt = { ...(filter.createdAt || {}), $lt: before };
  if (after) filter.createdAt = { ...(filter.createdAt || {}), $gt: after };
  if (pinnedOnly) filter.isPinned = true;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    CommunityMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "name email")
      .lean(),
    CommunityMessage.countDocuments(filter)
  ]);

  return { items, page, limit, total };
};

export const createMessage = async (communityId, userId, payload) => {
  await ensureActiveCommunity(communityId);
  const member = await getActiveMember(communityId, userId);

  if (member.isMuted) {
    throw new AppError("You are muted in this community", 403);
  }

  const messageType = payload.messageType || "general";
  if (["system", "announcement"].includes(messageType) && !canModerate(member)) {
    throw new AppError("Not authorized to send this message type", 403);
  }

  if (payload.replyTo) {
    const parent = await CommunityMessage.findOne({
      _id: payload.replyTo,
      communityId
    }).select("_id");
    if (!parent) {
      throw new AppError("Reply target not found", 404);
    }
  }

  const message = await CommunityMessage.create({
    communityId,
    senderId: userId,
    content: payload.content ? payload.content.trim() : "",
    attachments: payload.attachments || [],
    replyTo: payload.replyTo,
    mentions: payload.mentions || [],
    moduleId: payload.moduleId,
    taskId: payload.taskId,
    messageType
  });

  if (payload.mentions?.length) {
    const uniqueMentionIds = [
      ...new Set(payload.mentions.map((id) => id.toString()))
    ].filter((id) => id !== userId.toString());

    await Promise.all(
      uniqueMentionIds.map((mentionId) =>
        createNotification({
          userId: mentionId,
          message: "You were mentioned in a community message."
        })
      )
    );
  }

  return message;
};

export const editMessage = async (communityId, messageId, userId, payload) => {
  await ensureActiveCommunity(communityId);
  const member = await getActiveMember(communityId, userId);

  const message = await CommunityMessage.findOne({
    _id: messageId,
    communityId
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }
  if (message.isDeleted) {
    throw new AppError("Cannot react to deleted message", 400);
  }

  if (message.isDeleted) {
    throw new AppError("Cannot edit deleted message", 400);
  }

  const isOwner = message.senderId.toString() === userId.toString();
  if (!isOwner && !canModerate(member)) {
    throw new AppError("Not authorized to edit this message", 403);
  }

  if (payload.content) message.content = payload.content.trim();
  if (payload.attachments) message.attachments = payload.attachments;

  message.isEdited = true;
  message.editedAt = new Date();
  message.editedBy = userId;

  await message.save();
  return message;
};

export const deleteMessage = async (
  communityId,
  messageId,
  userId,
  reason
) => {
  await ensureActiveCommunity(communityId);
  const member = await getActiveMember(communityId, userId);

  const message = await CommunityMessage.findOne({
    _id: messageId,
    communityId
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }
  if (message.isDeleted) {
    throw new AppError("Cannot react to deleted message", 400);
  }

  const isOwner = message.senderId.toString() === userId.toString();
  if (!isOwner && !canModerate(member)) {
    throw new AppError("Not authorized to delete this message", 403);
  }

  if (!message.isDeleted) {
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;
    message.deleteReason = reason;
    message.content = "";
    message.attachments = [];
    await message.save();
  }

  return message;
};

export const pinMessage = async (communityId, messageId, userId, pinned) => {
  await ensureActiveCommunity(communityId);
  const member = await getActiveMember(communityId, userId);

  if (!canModerate(member)) {
    throw new AppError("Not authorized to pin messages", 403);
  }

  const message = await CommunityMessage.findOne({
    _id: messageId,
    communityId
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  message.isPinned = pinned;
  message.pinnedAt = pinned ? new Date() : null;
  message.pinnedBy = pinned ? userId : null;
  await message.save();

  return message;
};

export const addReaction = async (communityId, messageId, userId, emoji) => {
  await ensureActiveCommunity(communityId);
  const member = await getActiveMember(communityId, userId);

  if (member.isMuted) {
    throw new AppError("You are muted in this community", 403);
  }

  const message = await CommunityMessage.findOne({
    _id: messageId,
    communityId
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  const already = message.reactions.some(
    (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
  );

  if (!already) {
    message.reactions.push({ userId, emoji });
    await message.save();
  }

  return message;
};

export const removeReaction = async (communityId, messageId, userId, emoji) => {
  await ensureActiveCommunity(communityId);
  await getActiveMember(communityId, userId);

  const message = await CommunityMessage.findOne({
    _id: messageId,
    communityId
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  message.reactions = message.reactions.filter(
    (r) => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
  );
  await message.save();
  return message;
};

export const markCommunityRead = async (communityId, userId, messageId) => {
  await ensureActiveCommunity(communityId);
  const member = await getActiveMember(communityId, userId);

  member.lastReadAt = new Date();
  if (messageId) member.lastReadMessageId = messageId;
  await member.save();

  return {
    communityId,
    lastReadAt: member.lastReadAt,
    lastReadMessageId: member.lastReadMessageId
  };
};
