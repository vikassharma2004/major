import {
  getMyCommunities,
  getCommunityById,
  leaveCommunity,
  getCommunityMembers,
  removeMember,
  muteMember,
  unmuteMember,
  muteMyself,
  unmuteMyself
} from "../services/community.service.js";

import { catchAsyncError } from "../middleware/CatchAsyncError.js";

/* ========================= MY COMMUNITIES ========================= */
export const getMyCommunitiesController = catchAsyncError(
  async (req, res) => {
    const communities = await getMyCommunities(req.user.id);
    res.json({ count: communities.length, communities });
  }
);

/* ========================= COMMUNITY BY ID ========================= */
export const getCommunityByIdController = catchAsyncError(
  async (req, res) => {
    const community = await getCommunityById(
      req.params.communityId,
      req.user.id
    );
    res.status(200).json(community);
  }
);

/* ========================= LEAVE COMMUNITY ========================= */
export const leaveCommunityController = catchAsyncError(
  async (req, res) => {
    await leaveCommunity(req.params.communityId, req.user.id);
    res.json({ message: "Left community successfully" });
  }
);

/* ========================= GET MEMBERS ========================= */
export const getCommunityMembersController = catchAsyncError(
  async (req, res) => {

    const members = await getCommunityMembers(
      req.params.communityId,
      req.user.id
    );
    res.json(members);
  }
);

/* ========================= REMOVE MEMBER ========================= */
export const removeMemberController = catchAsyncError(
  async (req, res) => {
    await removeMember(
      req.params.communityId,
      req.params.userId,
      req.user.id
    );
    res.json({ message: "Member removed successfully" });
  }
);

/* ========================= MUTE MEMBER ========================= */
export const muteMemberController = catchAsyncError(
  async (req, res) => {
    await muteMember(
      req.params.communityId,
      req.params.userId,
      req.user.id
    );
    res.json({ message: "Member muted successfully" });
  }
);

/* ========================= UNMUTE MEMBER ========================= */
export const unmuteMemberController = catchAsyncError(
  async (req, res) => {
    await unmuteMember(
      req.params.communityId,
      req.params.userId,
      req.user.id
    );
    res.json({ message: "Member unmuted successfully" });
  }
);

/* ========================= SELF MUTE ========================= */
export const muteMyselfController = catchAsyncError(
  async (req, res) => {
    await muteMyself(req.params.communityId, req.user.id);
    res.json({ message: "Community muted" });
  }
);

/* ========================= SELF UNMUTE ========================= */
export const unmuteMyselfController = catchAsyncError(
  async (req, res) => {
    await unmuteMyself(req.params.communityId, req.user.id);
    res.json({ message: "Community unmuted" });
  }
);
