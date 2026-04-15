import mongoose from "mongoose";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { getCache, setCache } from "../config/cache.js";
import { User } from "../models/Auth/User.model.js";
import { Roadmap } from "../models/roadmap/Roadmap.model.js";
import { RoadmapTask } from "../models/roadmap/RoadmapTask.modal.js";
import { Enrollment } from "../models/Progress/Enrollment.modal.js";
import { UserProgress } from "../models/Progress/UserProgress.js";
import { CommunityMember } from "../models/Community/CommunityMember.model.js";
import { Community } from "../models/Community/Community.model.js";
import { Purchase } from "../models/Profile/purchase.model.js";

const ANALYTICS_TTL_SECONDS = 90;
const { ObjectId } = mongoose.Types;

const toObjectId = (value) => new ObjectId(value);

const emptyLearnerAnalytics = {
  totalRoadmapsFollowed: 0,
  totalTasksCompleted: 0,
  totalCommunitiesJoined: 0,
  recentActivity: []
};

const emptyMentorAnalytics = {
  totalLearners: 0,
  totalRoadmaps: 0,
  publishedRoadmaps: 0,
  unpublishedRoadmaps: 0,
  unpaidCommission: 0
};

const emptyAdminAnalytics = {
  totalUsers: 0,
  totalRoadmaps: 0,
  totalPublishedRoadmaps: 0,
  totalRevenue: 0,
  activeUsers: 0,
  domainDistribution: []
};

const buildLearnerPipeline = (userId) => [
  { $match: { _id: toObjectId(userId) } },
  { $limit: 1 },
  {
    $lookup: {
      from: Enrollment.collection.name,
      let: { userId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$userId", "$$userId"]
            }
          }
        },
        {
          $lookup: {
            from: Roadmap.collection.name,
            localField: "roadmapId",
            foreignField: "_id",
            as: "roadmap"
          }
        },
        {
          $unwind: {
            path: "$roadmap",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $facet: {
            stats: [
              {
                $group: {
                  _id: null,
                  roadmapIds: { $addToSet: "$roadmapId" }
                }
              },
              {
                $project: {
                  _id: 0,
                  totalRoadmapsFollowed: { $size: "$roadmapIds" }
                }
              }
            ],
            recent: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 0,
                  type: { $literal: "roadmap_enrollment" },
                  action: { $literal: "roadmap_enrolled" },
                  title: "$roadmap.title",
                  date: { $ifNull: ["$startedAt", "$createdAt"] },
                  metadata: {
                    roadmapId: "$roadmapId",
                    status: "$status"
                  }
                }
              }
            ]
          }
        },
        {
          $project: {
            _id: 0,
            stats: {
              $ifNull: [
                { $first: "$stats" },
                { totalRoadmapsFollowed: 0 }
              ]
            },
            recent: "$recent"
          }
        }
      ],
      as: "enrollmentAnalytics"
    }
  },
  {
    $lookup: {
      from: UserProgress.collection.name,
      let: { userId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$userId", "$$userId"] },
                { $eq: ["$status", "completed"] }
              ]
            }
          }
        },
        {
          $lookup: {
            from: Roadmap.collection.name,
            localField: "roadmapId",
            foreignField: "_id",
            as: "roadmap"
          }
        },
        {
          $lookup: {
            from: RoadmapTask.collection.name,
            localField: "taskId",
            foreignField: "_id",
            as: "task"
          }
        },
        {
          $unwind: {
            path: "$roadmap",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: "$task",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $facet: {
            stats: [
              {
                $count: "totalTasksCompleted"
              }
            ],
            recent: [
              { $sort: { updatedAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 0,
                  type: { $literal: "task_progress" },
                  action: { $literal: "task_completed" },
                  title: "$task.title",
                  date: "$updatedAt",
                  metadata: {
                    roadmapId: "$roadmapId",
                    roadmapTitle: "$roadmap.title",
                    taskId: "$taskId"
                  }
                }
              }
            ]
          }
        },
        {
          $project: {
            _id: 0,
            stats: {
              $ifNull: [
                { $first: "$stats" },
                { totalTasksCompleted: 0 }
              ]
            },
            recent: "$recent"
          }
        }
      ],
      as: "progressAnalytics"
    }
  },
  {
    $lookup: {
      from: CommunityMember.collection.name,
      let: { userId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$userId", "$$userId"] },
                { $eq: ["$isActive", true] }
              ]
            }
          }
        },
        {
          $lookup: {
            from: Community.collection.name,
            localField: "communityId",
            foreignField: "_id",
            as: "community"
          }
        },
        {
          $unwind: {
            path: "$community",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            $or: [
              { community: { $eq: null } },
              { "community.isActive": true }
            ]
          }
        },
        {
          $facet: {
            stats: [
              { $count: "totalCommunitiesJoined" }
            ],
            recent: [
              { $sort: { joinedAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 0,
                  type: { $literal: "community_membership" },
                  action: { $literal: "community_joined" },
                  title: "$community.name",
                  date: { $ifNull: ["$joinedAt", "$createdAt"] },
                  metadata: {
                    communityId: "$communityId",
                    role: "$role"
                  }
                }
              }
            ]
          }
        },
        {
          $project: {
            _id: 0,
            stats: {
              $ifNull: [
                { $first: "$stats" },
                { totalCommunitiesJoined: 0 }
              ]
            },
            recent: "$recent"
          }
        }
      ],
      as: "communityAnalytics"
    }
  },
  {
    $lookup: {
      from: Purchase.collection.name,
      let: { userId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$userId", "$$userId"] },
                { $in: ["$status", ["pending", "success", "refunded"]] }
              ]
            }
          }
        },
        {
          $lookup: {
            from: Roadmap.collection.name,
            localField: "roadmapId",
            foreignField: "_id",
            as: "roadmap"
          }
        },
        {
          $unwind: {
            path: "$roadmap",
            preserveNullAndEmptyArrays: true
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            type: { $literal: "purchase" },
            action: { $literal: "roadmap_purchase" },
            title: "$roadmap.title",
            date: { $ifNull: ["$purchasedAt", "$createdAt"] },
            metadata: {
              roadmapId: "$roadmapId",
              amount: "$amount",
              status: "$status"
            }
          }
        }
      ],
      as: "purchaseActivity"
    }
  },
  {
    $addFields: {
      enrollmentAnalytics: {
        $ifNull: [
          { $first: "$enrollmentAnalytics" },
          { stats: { totalRoadmapsFollowed: 0 }, recent: [] }
        ]
      },
      progressAnalytics: {
        $ifNull: [
          { $first: "$progressAnalytics" },
          { stats: { totalTasksCompleted: 0 }, recent: [] }
        ]
      },
      communityAnalytics: {
        $ifNull: [
          { $first: "$communityAnalytics" },
          { stats: { totalCommunitiesJoined: 0 }, recent: [] }
        ]
      }
    }
  },
  {
    $project: {
      _id: 0,
      totalRoadmapsFollowed: "$enrollmentAnalytics.stats.totalRoadmapsFollowed",
      totalTasksCompleted: "$progressAnalytics.stats.totalTasksCompleted",
      totalCommunitiesJoined: "$communityAnalytics.stats.totalCommunitiesJoined",
      recentActivity: {
        $concatArrays: [
          "$enrollmentAnalytics.recent",
          "$progressAnalytics.recent",
          "$communityAnalytics.recent",
          "$purchaseActivity"
        ]
      }
    }
  },
  {
    $unwind: {
      path: "$recentActivity",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $sort: {
      "recentActivity.date": -1
    }
  },
  {
    $group: {
      _id: null,
      totalRoadmapsFollowed: { $first: "$totalRoadmapsFollowed" },
      totalTasksCompleted: { $first: "$totalTasksCompleted" },
      totalCommunitiesJoined: { $first: "$totalCommunitiesJoined" },
      recentActivity: { $push: "$recentActivity" }
    }
  },
  {
    $project: {
      _id: 0,
      totalRoadmapsFollowed: 1,
      totalTasksCompleted: 1,
      totalCommunitiesJoined: 1,
      recentActivity: {
        $slice: [
          {
            $filter: {
              input: "$recentActivity",
              as: "activity",
              cond: { $ne: ["$$activity", null] }
            }
          },
          5
        ]
      }
    }
  }
];

const buildMentorPipeline = (userId) => [
  { $match: { _id: toObjectId(userId) } },
  { $limit: 1 },
  {
    $lookup: {
      from: Roadmap.collection.name,
      let: { mentorId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$createdBy", "$$mentorId"]
            }
          }
        },
        {
          $project: {
            _id: 1,
            isPublished: 1
          }
        }
      ],
      as: "mentorRoadmaps"
    }
  },
  {
    $lookup: {
      from: Enrollment.collection.name,
      let: { roadmapIds: "$mentorRoadmaps._id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $in: ["$roadmapId", "$$roadmapIds"] },
                { $in: ["$status", ["active", "completed"]] }
              ]
            }
          }
        },
        {
          $group: {
            _id: "$userId"
          }
        },
        {
          $count: "totalLearners"
        }
      ],
      as: "learnerAnalytics"
    }
  },
  {
    $lookup: {
      from: Purchase.collection.name,
      let: { roadmapIds: "$mentorRoadmaps._id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $in: ["$roadmapId", "$$roadmapIds"] },
                { $eq: ["$status", "success"] }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            unpaidCommission: { $sum: "$amount" }
          }
        }
      ],
      as: "commissionAnalytics"
    }
  },
  {
    $project: {
      _id: 0,
      totalLearners: {
        $ifNull: [
          { $first: "$learnerAnalytics.totalLearners" },
          0
        ]
      },
      totalRoadmaps: { $size: "$mentorRoadmaps" },
      publishedRoadmaps: {
        $size: {
          $filter: {
            input: "$mentorRoadmaps",
            as: "roadmap",
            cond: { $eq: ["$$roadmap.isPublished", true] }
          }
        }
      },
      unpublishedRoadmaps: {
        $size: {
          $filter: {
            input: "$mentorRoadmaps",
            as: "roadmap",
            cond: { $eq: ["$$roadmap.isPublished", false] }
          }
        }
      },
      unpaidCommission: {
        $ifNull: [
          { $first: "$commissionAnalytics.unpaidCommission" },
          0
        ]
      }
    }
  }
];

const buildAdminPipeline = (userId, activeSince) => [
  { $match: { _id: toObjectId(userId) } },
  { $limit: 1 },
  {
    $lookup: {
      from: User.collection.name,
      pipeline: [
        {
          $facet: {
            totals: [
              {
                $match: {
                  status: { $ne: "deleted" }
                }
              },
              {
                $count: "totalUsers"
              }
            ],
            active: [
              {
                $match: {
                  status: { $ne: "deleted" },
                  lastLoginAt: { $gte: activeSince }
                }
              },
              {
                $count: "activeUsers"
              }
            ]
          }
        },
        {
          $project: {
            _id: 0,
            totalUsers: {
              $ifNull: [
                { $first: "$totals.totalUsers" },
                0
              ]
            },
            activeUsers: {
              $ifNull: [
                { $first: "$active.activeUsers" },
                0
              ]
            }
          }
        }
      ],
      as: "userAnalytics"
    }
  },
  {
    $lookup: {
      from: Roadmap.collection.name,
      pipeline: [
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalRoadmaps: { $sum: 1 },
                  totalPublishedRoadmaps: {
                    $sum: {
                      $cond: [{ $eq: ["$isPublished", true] }, 1, 0]
                    }
                  }
                }
              }
            ],
            domainDistribution: [
              {
                $group: {
                  _id: "$domain",
                  count: { $sum: 1 }
                }
              },
              {
                $project: {
                  _id: 0,
                  domain: "$_id",
                  count: 1
                }
              },
              { $sort: { count: -1, domain: 1 } }
            ]
          }
        },
        {
          $project: {
            _id: 0,
            totalRoadmaps: {
              $ifNull: [
                { $first: "$totals.totalRoadmaps" },
                0
              ]
            },
            totalPublishedRoadmaps: {
              $ifNull: [
                { $first: "$totals.totalPublishedRoadmaps" },
                0
              ]
            },
            domainDistribution: "$domainDistribution"
          }
        }
      ],
      as: "roadmapAnalytics"
    }
  },
  {
    $lookup: {
      from: Purchase.collection.name,
      pipeline: [
        {
          $match: {
            status: "success"
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" }
          }
        }
      ],
      as: "revenueAnalytics"
    }
  },
  {
    $project: {
      _id: 0,
      totalUsers: {
        $ifNull: [
          { $first: "$userAnalytics.totalUsers" },
          0
        ]
      },
      activeUsers: {
        $ifNull: [
          { $first: "$userAnalytics.activeUsers" },
          0
        ]
      },
      totalRoadmaps: {
        $ifNull: [
          { $first: "$roadmapAnalytics.totalRoadmaps" },
          0
        ]
      },
      totalPublishedRoadmaps: {
        $ifNull: [
          { $first: "$roadmapAnalytics.totalPublishedRoadmaps" },
          0
        ]
      },
      totalRevenue: {
        $ifNull: [
          { $first: "$revenueAnalytics.totalRevenue" },
          0
        ]
      },
      domainDistribution: {
        $ifNull: [
          { $first: "$roadmapAnalytics.domainDistribution" },
          []
        ]
      }
    }
  }
];

const getLearnerAnalyticsData = async (userId) => {
  const [analytics = emptyLearnerAnalytics] = await User.aggregate(
    buildLearnerPipeline(userId)
  );

  return analytics;
};

const getMentorAnalyticsData = async (userId) => {
  const [analytics = emptyMentorAnalytics] = await User.aggregate(
    buildMentorPipeline(userId)
  );

  return analytics;
};

const getAdminAnalyticsData = async (userId) => {
  const activeSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [analytics = emptyAdminAnalytics] = await User.aggregate(
    buildAdminPipeline(userId, activeSince)
  );

  return analytics;
};

export const getLearnerAnalyticsController = catchAsyncError(async (req, res) => {
  const cacheKey = `learner_analytics_${req.user.id}`;
  const cached = getCache(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  const data = await getLearnerAnalyticsData(req.user.id);
  setCache(cacheKey, data, ANALYTICS_TTL_SECONDS);

  res.status(200).json({
    success: true,
    data
  });
});

export const getMentorAnalyticsController = catchAsyncError(async (req, res) => {
  const cacheKey = `mentor_analytics_${req.user.id}`;
  const cached = getCache(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  const data = await getMentorAnalyticsData(req.user.id);
  setCache(cacheKey, data, ANALYTICS_TTL_SECONDS);

  res.status(200).json({
    success: true,
    data
  });
});

export const getAdminAnalyticsController = catchAsyncError(async (req, res) => {
  const cacheKey = "admin_analytics";
  const cached = getCache(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  const data = await getAdminAnalyticsData(req.user.id);
  setCache(cacheKey, data, ANALYTICS_TTL_SECONDS);

  res.status(200).json({
    success: true,
    data
  });
});

export const analyticsAggregationExamples = {
  learner: buildLearnerPipeline("000000000000000000000001"),
  mentor: buildMentorPipeline("000000000000000000000001"),
  admin: buildAdminPipeline(
    "000000000000000000000001",
    new Date("2026-03-10T00:00:00.000Z")
  )
};

export const analyticsSampleResponses = {
  learner: {
    success: true,
    data: {
      totalRoadmapsFollowed: 4,
      totalTasksCompleted: 27,
      totalCommunitiesJoined: 3,
      recentActivity: [
        {
          type: "task_progress",
          action: "task_completed",
          title: "Build Auth Middleware",
          date: "2026-03-17T06:20:00.000Z",
          metadata: {
            roadmapId: "65f7c1c2c6c32d4d7f8d0001",
            roadmapTitle: "Backend Developer",
            taskId: "65f7c1c2c6c32d4d7f8d0009"
          }
        }
      ]
    }
  },
  mentor: {
    success: true,
    data: {
      totalLearners: 128,
      totalRoadmaps: 6,
      publishedRoadmaps: 4,
      unpublishedRoadmaps: 2,
      unpaidCommission: 48250
    }
  },
  admin: {
    success: true,
    data: {
      totalUsers: 1842,
      totalRoadmaps: 96,
      totalPublishedRoadmaps: 71,
      totalRevenue: 524000,
      activeUsers: 347,
      domainDistribution: [
        { domain: "backend", count: 22 },
        { domain: "frontend", count: 19 }
      ]
    }
  }
};
