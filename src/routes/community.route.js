import express from "express";
import { authenticate } from "../middleware/Auth.middleware.js";

import {
  getMyCommunitiesController,
  getCommunityByIdController,
  leaveCommunityController,
  getCommunityMembersController,
  removeMemberController,
  muteMemberController,
  unmuteMemberController,
  muteMyselfController,
  unmuteMyselfController
} from "../controllers/community.controller.js";
import {
  listCommunityMessagesController,
  createCommunityMessageController,
  editCommunityMessageController,
  deleteCommunityMessageController,
  pinCommunityMessageController,
  unpinCommunityMessageController,
  addReactionController,
  removeReactionController,
  markCommunityReadController
} from "../controllers/communityMessage.controller.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { communityMessageLimiter } from "../config/security.js";

const CommunityRouter = express.Router();

/* ========================= USER ========================= */

// GET /api/v1/communities/me
CommunityRouter.get("/me", authenticate, getMyCommunitiesController);

// POST /api/v1/communities/:communityId/leave
CommunityRouter.post("/:communityId/leave", authenticate, authorizeRoles("learner"), leaveCommunityController);

// PATCH /api/v1/communities/:communityId/mute
CommunityRouter.patch("/:communityId/mute", authenticate, muteMyselfController);

// PATCH /api/v1/communities/:communityId/unmute
CommunityRouter.patch("/:communityId/unmute", authenticate, unmuteMyselfController);

/* ========================= MODERATION ========================= */

// GET /api/v1/communities/:communityId/members
CommunityRouter.get(
  "/:communityId/members",
  authenticate,
  authorizeRoles("mentor", "moderator"),
  getCommunityMembersController
);

// DELETE /api/v1/communities/:communityId/members/:userId
CommunityRouter.delete(
  "/:communityId/members/:userId",
  authenticate,
  authorizeRoles("mentor", "moderator"),
  removeMemberController
);

// PATCH /api/v1/communities/:communityId/members/:userId/mute
CommunityRouter.patch(
  "/:communityId/members/:userId/mute",
  authenticate,
  authorizeRoles("mentor", "moderator"),
  muteMemberController
);

// PATCH /api/v1/communities/:communityId/members/:userId/unmute
CommunityRouter.patch(
  "/:communityId/members/:userId/unmute",
  authenticate,
  authorizeRoles("mentor", "moderator"),
  unmuteMemberController
);

/* ========================= MESSAGES ========================= */

// GET /api/v1/communities/:communityId/messages
CommunityRouter.get(
  "/:communityId/messages",
  authenticate,
  listCommunityMessagesController
);

// POST /api/v1/communities/:communityId/messages
CommunityRouter.post(
  "/:communityId/messages",
  authenticate,
  communityMessageLimiter,
  createCommunityMessageController
);

// PATCH /api/v1/communities/:communityId/messages/:messageId
CommunityRouter.patch(
  "/:communityId/messages/:messageId",
  authenticate,
  communityMessageLimiter,
  editCommunityMessageController
);

// DELETE /api/v1/communities/:communityId/messages/:messageId
CommunityRouter.delete(
  "/:communityId/messages/:messageId",
  authenticate,
  communityMessageLimiter,
  deleteCommunityMessageController
);

// PATCH /api/v1/communities/:communityId/messages/:messageId/pin
CommunityRouter.patch(
  "/:communityId/messages/:messageId/pin",
  authenticate,
  authorizeRoles("mentor", "moderator"),
  pinCommunityMessageController
);

// PATCH /api/v1/communities/:communityId/messages/:messageId/unpin
CommunityRouter.patch(
  "/:communityId/messages/:messageId/unpin",
  authenticate,
  authorizeRoles("mentor", "moderator"),
  unpinCommunityMessageController
);

// POST /api/v1/communities/:communityId/messages/:messageId/reactions
CommunityRouter.post(
  "/:communityId/messages/:messageId/reactions",
  authenticate,
  communityMessageLimiter,
  addReactionController
);

// DELETE /api/v1/communities/:communityId/messages/:messageId/reactions
CommunityRouter.delete(
  "/:communityId/messages/:messageId/reactions",
  authenticate,
  communityMessageLimiter,
  removeReactionController
);

// PATCH /api/v1/communities/:communityId/read
CommunityRouter.patch(
  "/:communityId/read",
  authenticate,
  markCommunityReadController
);

// GET /api/v1/communities/:communityId
CommunityRouter.get("/:communityId", authenticate, getCommunityByIdController);

export default CommunityRouter;
