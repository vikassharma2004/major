import { Community } from "../models/Community/Community.model.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { CommunityMember } from "../models/Community/CommunityMember.model.js";

/* ========================= GET MY COMMUNITIES ========================= */
export const getMyCommunities = async (userId) => {
  const memberships = await CommunityMember.find({
    userId,
    isActive: true
  })
    .populate({
      path: "communityId",
      match: { isActive: true },
      select: "name type roadmapId"
    })
    .select("role joinedAt isMuted")
    .lean();

  return memberships
    .filter(m => m.communityId)
    .map(m => ({
      communityId: m.communityId._id,
      name: m.communityId.name,
      type: m.communityId.type,
      roadmapId: m.communityId.roadmapId,
      role: m.role,
      joinedAt: m.joinedAt,
      isMuted: m.isMuted
    }));
};

/* ========================= GET COMMUNITY BY ID ========================= */
export const getCommunityById = async (communityId, userId) => {
  const membership = await CommunityMember.findOne({
    communityId,
    userId,
    isActive: true
  }).populate("communityId");

  if (!membership || !membership.communityId.isActive) {
    throw new AppError("Access denied to this community", 403);
  }

  return membership.communityId;
};

/* ========================= LEAVE COMMUNITY ========================= */
export const leaveCommunity = async (communityId, userId) => {
  const membership = await CommunityMember.findOne({
    communityId,
    userId,
    isActive: true
  });

  if (!membership) {
    throw new AppError("You are not a member of this community", 404);
  }

  if (membership.role === "mentor") {
    throw new AppError("Mentor cannot leave their own community", 403);
  }

  membership.isActive = false;
  await membership.save();
};

/* ========================= GET MEMBERS (MENTOR/MOD) ========================= */
export const getCommunityMembers = async (communityId, requesterId) => {
  const requester = await CommunityMember.findOne({
    communityId,
    userId: requesterId,
    isActive: true
  });

  if (!requester || !["mentor", "moderator"].includes(requester.role)) {
    throw new AppError("Access denied", 403);
  }

  return CommunityMember.find({
    communityId,
    isActive: true
  })
    .populate("userId", "name email")
    .select("role joinedAt isMuted");
};

/* ========================= REMOVE MEMBER (MENTOR) ========================= */
export const removeMember = async (communityId, targetUserId, requesterId) => {
  const requester = await CommunityMember.findOne({
    communityId,
    userId: requesterId,
    isActive: true
  });

  if (!requester || requester.role !== "mentor") {
    throw new AppError("Only mentor can remove members", 403);
  }

  if (requesterId === targetUserId) {
    throw new AppError("Mentor cannot remove himself", 400);
  }

  const target = await CommunityMember.findOne({
    communityId,
    userId: targetUserId,
    isActive: true
  });

  if (!target) throw new AppError("Member not found", 404);
  if (target.role === "mentor")
    throw new AppError("Cannot remove another mentor", 403);

  target.isActive = false;
  await target.save();
};

/* ========================= MUTE MEMBER ========================= */
export const muteMember = async (communityId, targetUserId, requesterId) => {
  const requester = await CommunityMember.findOne({
    communityId,
    userId: requesterId,
    isActive: true
  });

  if (!requester || !["mentor", "moderator"].includes(requester.role)) {
    throw new AppError("Not authorized", 403);
  }

  const target = await CommunityMember.findOne({
    communityId,
    userId: targetUserId,
    isActive: true
  });

  if (!target) throw new AppError("Member not found", 404);
  if (target.role === "mentor")
    throw new AppError("Cannot mute mentor", 403);

  target.isMuted = true;
  await target.save();
};

/* ========================= UNMUTE MEMBER ========================= */
export const unmuteMember = async (communityId, targetUserId, requesterId) => {
  const requester = await CommunityMember.findOne({
    communityId,
    userId: requesterId,
    isActive: true
  });

  if (!requester || !["mentor", "moderator"].includes(requester.role)) {
    throw new AppError("Not authorized", 403);
  }

  const target = await CommunityMember.findOne({
    communityId,
    userId: targetUserId,
    isActive: true
  });

  if (!target) throw new AppError("Member not found", 404);

  target.isMuted = false;
  await target.save();
};

/* ========================= SELF MUTE ========================= */
export const muteMyself = async (communityId, userId) => {
  const member = await CommunityMember.findOne({
    communityId,
    userId,
    isActive: true
  });

  if (!member) {
    throw new AppError("You are not a member of this community", 404);
  }

  member.isMuted = true;
  await member.save();
};

/* ========================= SELF UNMUTE ========================= */
export const unmuteMyself = async (communityId, userId) => {
  const member = await CommunityMember.findOne({
    communityId,
    userId,
    isActive: true
  });

  if (!member) {
    throw new AppError("You are not a member of this community", 404);
  }

  member.isMuted = false;
  await member.save();
};
