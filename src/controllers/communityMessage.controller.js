import {
  listMessages,
  createMessage,
  editMessage,
  deleteMessage,
  pinMessage,
  addReaction,
  removeReaction,
  markCommunityRead
} from "../services/communityMessage.service.js";

import {
  createMessageSchema,
  editMessageSchema,
  listMessageQuerySchema,
  reactionSchema,
  markReadSchema
} from "../validators/communityMessage.validation.js";

import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= LIST ========================= */
export const listCommunityMessagesController = catchAsyncError(async (req, res) => {
  const { error, value } = listMessageQuerySchema.validate(req.query);
  if (error) throw new AppError(error.details[0].message, 400);

  const result = await listMessages(req.params.communityId, req.user.id, value);
  res.json(result);
});

/* ========================= CREATE ========================= */
export const createCommunityMessageController = catchAsyncError(async (req, res) => {
  const { error, value } = createMessageSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const message = await createMessage(
    req.params.communityId,
    req.user.id,
    value
  );
  res.status(201).json(message);
});

/* ========================= EDIT ========================= */
export const editCommunityMessageController = catchAsyncError(async (req, res) => {
  const { error, value } = editMessageSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const message = await editMessage(
    req.params.communityId,
    req.params.messageId,
    req.user.id,
    value
  );
  res.json(message);
});

/* ========================= DELETE ========================= */
export const deleteCommunityMessageController = catchAsyncError(async (req, res) => {
  const message = await deleteMessage(
    req.params.communityId,
    req.params.messageId,
    req.user.id,
    req.body?.reason || req.query?.reason
  );
  res.json(message);
});

/* ========================= PIN ========================= */
export const pinCommunityMessageController = catchAsyncError(async (req, res) => {
  const message = await pinMessage(
    req.params.communityId,
    req.params.messageId,
    req.user.id,
    true
  );
  res.json(message);
});

export const unpinCommunityMessageController = catchAsyncError(async (req, res) => {
  const message = await pinMessage(
    req.params.communityId,
    req.params.messageId,
    req.user.id,
    false
  );
  res.json(message);
});

/* ========================= REACTIONS ========================= */
export const addReactionController = catchAsyncError(async (req, res) => {
  const { error, value } = reactionSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const message = await addReaction(
    req.params.communityId,
    req.params.messageId,
    req.user.id,
    value.emoji
  );
  res.json(message);
});

export const removeReactionController = catchAsyncError(async (req, res) => {
  const { error, value } = reactionSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const message = await removeReaction(
    req.params.communityId,
    req.params.messageId,
    req.user.id,
    value.emoji
  );
  res.json(message);
});

/* ========================= MARK READ ========================= */
export const markCommunityReadController = catchAsyncError(async (req, res) => {
  const { error, value } = markReadSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const result = await markCommunityRead(
    req.params.communityId,
    req.user.id,
    value.messageId
  );
  res.json(result);
});
