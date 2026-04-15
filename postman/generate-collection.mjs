import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const j = (v) => JSON.stringify(v, null, 2);
const jsonHeader = [{ key: "Content-Type", value: "application/json" }];
const req = (method, url, body) => {
  const out = { method, url };
  if (body !== undefined) {
    out.header = jsonHeader;
    out.body = { mode: "raw", raw: j(body) };
  }
  return { request: out };
};
const item = (name, method, url, body) => ({ name, ...req(method, url, body) });
const folder = (name, entries) => ({ name, item: entries });

const ids = [
  ["roadmapId", "507f1f77bcf86cd799439011"],
  ["moduleId", "507f1f77bcf86cd799439012"],
  ["taskId", "507f1f77bcf86cd799439013"],
  ["resourceId", "507f1f77bcf86cd799439014"],
  ["moduleResourceId", "507f1f77bcf86cd799439015"],
  ["projectId", "507f1f77bcf86cd799439016"],
  ["projectResourceId", "507f1f77bcf86cd799439017"],
  ["communityId", "507f1f77bcf86cd799439018"],
  ["messageId", "507f1f77bcf86cd799439019"],
  ["notificationId", "507f1f77bcf86cd799439020"],
  ["progressId", "507f1f77bcf86cd799439021"],
  ["purchaseId", "507f1f77bcf86cd799439022"],
  ["conversationId", "507f1f77bcf86cd799439023"],
  ["planId", "507f1f77bcf86cd799439024"],
  ["projectSubmissionId", "507f1f77bcf86cd799439025"],
  ["taskSubmissionId", "507f1f77bcf86cd799439026"],
  ["mentorApplicationId", "507f1f77bcf86cd799439027"],
  ["userId", "507f1f77bcf86cd799439028"]
].map(([key, value]) => ({ key, value }));

const U = "{{baseUrl}}{{apiVersion}}";

const collection = {
  info: {
    _postman_id: "8fce3c1e-3dbf-4db0-a8a2-6a6971f0f001",
    name: "CareerNav API",
    description:
      "Full CareerNav backend API collection with dummy payloads aligned to current routes and validators.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000" },
    { key: "apiVersion", value: "/api/v1" },
    ...ids
  ],
  item: [
    folder("Core", [
      item("Health", "GET", "{{baseUrl}}/health"),
      item("Root", "GET", "{{baseUrl}}/")
    ]),
    folder("Auth", [
      item("Register", "POST", `${U}/auth/register`, {
        name: "Jane Learner",
        email: "jane.learner@example.com",
        password: "Password@123"
      }),
      item("Login", "POST", `${U}/auth/login`, {
        email: "jane.learner@example.com",
        password: "Password@123"
      }),
      item("Logout", "POST", `${U}/auth/logout`),
      item("Refresh", "POST", `${U}/auth/refresh`),
      item("Verify Email", "POST", `${U}/auth/verify-email`, {
        userId: "{{userId}}",
        otp: "123456"
      }),
      item("Resend OTP", "POST", `${U}/auth/resend-otp`, { userId: "{{userId}}" }),
      item("2FA Generate", "POST", `${U}/auth/2fa/generate`),
      item("2FA Verify", "POST", `${U}/auth/2fa/verify`, { token: "123456" }),
      item("2FA Login", "POST", `${U}/auth/login/2fa`, {
        userId: "{{userId}}",
        token: "123456"
      })
    ]),
    folder("User", [
      item("Get Me", "GET", `${U}/user/me`),
      item("Update Me", "PATCH", `${U}/user/me`, { name: "Jane Updated" }),
      item("Change Password", "PATCH", `${U}/user/me/password`, {
        currentPassword: "Password@123",
        newPassword: "Password@456"
      }),
      item("Disable 2FA", "DELETE", `${U}/user/me/2fa`),
      item("Deactivate Account", "PATCH", `${U}/user/me/account`)
    ]),
    folder("Roadmaps", [
      item("Get My Roadmaps", "GET", `${U}/roadmap/me`),
      item("List Published Roadmaps", "GET", `${U}/roadmap`),
      item("Get Roadmap", "GET", `${U}/roadmap/{{roadmapId}}`),
      item("Create Roadmap", "POST", `${U}/roadmap`, {
        title: "Frontend Engineering Roadmap",
        shortDescription:
          "A practical roadmap to learn frontend engineering from HTML basics to advanced React workflows.",
        detailedDescription:
          "This roadmap walks learners through HTML, CSS, JavaScript, React, testing, performance, accessibility, and production deployment with hands-on tasks.",
        learningOutcomes: [
          "Build responsive user interfaces using semantic HTML and CSS.",
          "Write maintainable JavaScript for interactive frontend features.",
          "Create and ship modern React applications with confidence."
        ],
        coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        domain: "frontend",
        visualOverview:
          "Start with web fundamentals, move into JavaScript and React, then finish with testing, optimization, and deployment.",
        level: "beginner",
        isPaid: true,
        price: 999
      }),
      item("Create Full Roadmap", "POST", `${U}/roadmap/full-create`, {
        title: "Fullstack Web Development Roadmap",
        shortDescription:
          "Learn frontend, backend, APIs, databases, and deployment through a complete hands-on roadmap.",
        detailedDescription:
          "This full roadmap combines modules, tasks, resources, projects, and project resources into a single publish-ready payload.",
        learningOutcomes: [
          "Build modern client applications with React.",
          "Design backend APIs with Node.js and Express.",
          "Ship a complete fullstack product with deployment and monitoring."
        ],
        coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
        domain: "fullstack",
        visualOverview:
          "Frontend fundamentals, API design, database modeling, authentication, and deployment.",
        level: "intermediate",
        isPaid: false,
        modules: [
          {
            title: "Frontend Foundations",
            description: "Understand UI structure, styling, and component thinking.",
            order: 1,
            resources: [
              {
                type: "documentation",
                title: "MDN HTML Introduction",
                link: "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML",
                description: "Reference material for semantic HTML basics.",
                learningStage: "prerequisite",
                difficulty: "beginner",
                estimatedTime: 30,
                order: 1
              }
            ],
            tasks: [
              {
                title: "Build a semantic landing page",
                description:
                  "Create a responsive landing page using semantic HTML and clean CSS structure.",
                taskType: "implementation",
                expectedThinking:
                  "Break the layout into reusable sections and focus on structure before styling details.",
                successCriteria: [
                  "Semantic HTML tags are used correctly.",
                  "The page is responsive on mobile and desktop."
                ],
                allowFullSolution: false,
                order: 1,
                resources: [
                  {
                    type: "documentation",
                    title: "Responsive Design Basics",
                    link: "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design",
                    whyThisResource:
                      "Useful for planning breakpoints and layout behavior.",
                    whenToUse: "before-task"
                  }
                ]
              }
            ]
          }
        ],
        projects: [
          {
            title: "Personal Learning Dashboard",
            problemStatement:
              "Build a dashboard where a learner can track enrolled roadmaps, module progress, upcoming tasks, and recent activity.",
            constraints: [
              "Use role-based route protection for learner access.",
              "Persist progress data in a database-backed API."
            ],
            expectedOutcome:
              "A usable fullstack dashboard with authentication, progress tracking, and polished UI states.",
            difficulty: "medium",
            extensionIdeas: ["Add mentor feedback widgets.", "Add notification preferences."],
            resources: [
              {
                type: "github",
                title: "Example Dashboard Architecture",
                link: "https://github.com/vercel/nextjs-dashboard",
                whyThisResource:
                  "Shows practical dashboard information architecture and UI composition.",
                whenToUse: "before-project"
              }
            ]
          }
        ]
      }),
      item("Update Roadmap", "PATCH", `${U}/roadmap/{{roadmapId}}`, {
        shortDescription: "Updated roadmap summary for learners exploring frontend engineering.",
        level: "intermediate",
        price: 1499
      }),
      item("Toggle Publish Roadmap", "PATCH", `${U}/roadmap/{{roadmapId}}/publish`),
      item("Delete Roadmap", "DELETE", `${U}/roadmap/{{roadmapId}}`)
    ]),
    folder("Modules", [
      item("List Modules By Roadmap", "GET", `${U}/roadmap/{{roadmapId}}/modules`),
      item("Create Module", "POST", `${U}/roadmap/{{roadmapId}}/modules`, {
        title: "JavaScript Foundations",
        description: "Variables, functions, arrays, objects, async flow, and practical debugging.",
        order: 1
      }),
      item("Update Module", "PATCH", `${U}/roadmap/modules/{{moduleId}}`, {
        title: "Advanced JavaScript Foundations",
        description: "Updated module scope with more emphasis on asynchronous patterns.",
        order: 2
      }),
      item("Delete Module", "DELETE", `${U}/roadmap/modules/{{moduleId}}`)
    ]),
    folder("Module Resources", [
      item(
        "List Module Resources",
        "GET",
        `${U}/modules/{{moduleId}}/resources?page=1&limit=10&type=documentation&difficulty=beginner&learningStage=core&sortBy=order&sortOrder=asc`
      ),
      item("Get Module Resource", "GET", `${U}/modules/resources/{{moduleResourceId}}`),
      item("Create Module Resource", "POST", `${U}/modules/{{moduleId}}/resources`, {
        type: "documentation",
        title: "JavaScript Guide",
        link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        description: "Reference material covering core JavaScript concepts needed in this module.",
        learningStage: "core",
        difficulty: "beginner",
        estimatedTime: 45,
        order: 1
      }),
      item("Update Module Resource", "PATCH", `${U}/modules/resources/{{moduleResourceId}}`, {
        difficulty: "intermediate",
        estimatedTime: 60,
        order: 2
      }),
      item("Delete Module Resource", "DELETE", `${U}/modules/resources/{{moduleResourceId}}`)
    ]),
    folder("Tasks", [
      item("List Tasks By Module", "GET", `${U}/modules/{{moduleId}}/tasks`),
      item("Create Task", "POST", `${U}/modules/{{moduleId}}/tasks`, {
        title: "Implement a reusable navbar",
        description:
          "Build a reusable navigation bar component with responsive behavior and active-state styling.",
        taskType: "implementation",
        expectedThinking:
          "Break the navbar into state, structure, and accessibility concerns before coding.",
        successCriteria: [
          "Navigation items render from data.",
          "Mobile toggle works correctly.",
          "Keyboard navigation remains accessible."
        ],
        allowFullSolution: false,
        order: 1
      }),
      item("Update Task", "PATCH", `${U}/modules/tasks/{{taskId}}`, {
        taskType: "debugging",
        allowFullSolution: true,
        order: 2
      }),
      item("Delete Task", "DELETE", `${U}/modules/tasks/{{taskId}}`)
    ]),
    folder("Task Resources", [
      item("List Task Resources", "GET", `${U}/tasks/{{taskId}}/resources`),
      item("Create Task Resource", "POST", `${U}/tasks/{{taskId}}/resources`, {
        type: "documentation",
        title: "ARIA Authoring Practices",
        link: "https://www.w3.org/WAI/ARIA/apg/",
        whyThisResource: "Helpful when building accessible interactive components.",
        whenToUse: "before-task"
      }),
      item("Update Task Resource", "PATCH", `${U}/tasks/resources/{{resourceId}}`, {
        type: "article",
        title: "Accessible Navbar Patterns",
        whenToUse: "reference"
      }),
      item("Delete Task Resource", "DELETE", `${U}/tasks/resources/{{resourceId}}`)
    ]),
    folder("Projects", [
      item("List Projects By Roadmap", "GET", `${U}/roadmap/{{roadmapId}}/projects`),
      item("Create Project", "POST", `${U}/roadmap/{{roadmapId}}/projects`, {
        title: "Build a Portfolio Platform",
        problemStatement:
          "Create a portfolio platform where users can showcase projects, skills, and contact details with an admin-friendly content model.",
        constraints: [
          "Use a responsive layout across desktop and mobile.",
          "Include a simple admin workflow for updating portfolio content."
        ],
        expectedOutcome:
          "A polished portfolio application with reusable UI sections and maintainable routing.",
        difficulty: "medium",
        extensionIdeas: ["Add project filtering by tag.", "Add analytics for profile visits."]
      }),
      item("Update Project", "PATCH", `${U}/roadmap/projects/{{projectId}}`, {
        difficulty: "hard",
        expectedOutcome: "An end-to-end portfolio application with deployment-ready quality.",
        extensionIdeas: ["Add markdown support for project writeups.", "Add CMS-backed content sync."]
      }),
      item("Delete Project", "DELETE", `${U}/roadmap/projects/{{projectId}}`)
    ]),
    folder("Project Resources", [
      item("List Project Resources", "GET", `${U}/projects/{{projectId}}/resources`),
      item("Create Project Resource", "POST", `${U}/projects/{{projectId}}/resources`, {
        type: "github",
        title: "Example Fullstack Starter",
        link: "https://github.com/vercel/nextjs-postgres-nextauth-tailwindcss-template",
        whyThisResource: "Provides a reference structure for a production-ready starter app.",
        whenToUse: "before-project"
      }),
      item("Update Project Resource", "PATCH", `${U}/projects/resources/{{projectResourceId}}`, {
        type: "documentation",
        whenToUse: "reference",
        whyThisResource:
          "Use this as a reference while refining architecture and deployment details."
      }),
      item("Delete Project Resource", "DELETE", `${U}/projects/resources/{{projectResourceId}}`)
    ]),
    folder("Enrollment", [
      item("Enroll In Roadmap", "POST", `${U}/roadmaps/{{roadmapId}}/enroll`),
      item("Get My Enrollments", "GET", `${U}/me/enrollments`),
      item("Drop Enrollment", "DELETE", `${U}/roadmaps/{{roadmapId}}/enroll`)
    ]),
    folder("Communities", [
      item("Get My Communities", "GET", `${U}/communities/me`),
      item("Get Community By Id", "GET", `${U}/communities/{{communityId}}`),
      item("Leave Community", "POST", `${U}/communities/{{communityId}}/leave`),
      item("Mute Myself In Community", "PATCH", `${U}/communities/{{communityId}}/mute`),
      item("Unmute Myself In Community", "PATCH", `${U}/communities/{{communityId}}/unmute`),
      item("Get Community Members", "GET", `${U}/communities/{{communityId}}/members`),
      item("Remove Community Member", "DELETE", `${U}/communities/{{communityId}}/members/{{userId}}`),
      item("Mute Community Member", "PATCH", `${U}/communities/{{communityId}}/members/{{userId}}/mute`),
      item("Unmute Community Member", "PATCH", `${U}/communities/{{communityId}}/members/{{userId}}/unmute`),
      item(
        "List Community Messages",
        "GET",
        `${U}/communities/{{communityId}}/messages?page=1&limit=20&includeDeleted=false&pinnedOnly=false`
      ),
      item("Create Community Message", "POST", `${U}/communities/{{communityId}}/messages`, {
        content: "I just finished the module task and wanted feedback on my approach.",
        attachments: [
          {
            url: "https://example.com/mockup.png",
            type: "image",
            name: "mockup.png",
            size: 204800
          }
        ],
        mentions: ["{{userId}}"],
        moduleId: "{{moduleId}}",
        taskId: "{{taskId}}",
        messageType: "task"
      }),
      item("Edit Community Message", "PATCH", `${U}/communities/{{communityId}}/messages/{{messageId}}`, {
        content: "Updated message after fixing the accessibility issue.",
        attachments: [
          {
            url: "https://example.com/fix-notes.pdf",
            type: "file",
            name: "fix-notes.pdf",
            size: 40960
          }
        ]
      }),
      item("Delete Community Message", "DELETE", `${U}/communities/{{communityId}}/messages/{{messageId}}`),
      item("Pin Community Message", "PATCH", `${U}/communities/{{communityId}}/messages/{{messageId}}/pin`),
      item("Unpin Community Message", "PATCH", `${U}/communities/{{communityId}}/messages/{{messageId}}/unpin`),
      item("Add Message Reaction", "POST", `${U}/communities/{{communityId}}/messages/{{messageId}}/reactions`, {
        emoji: "fire"
      }),
      item("Remove Message Reaction", "DELETE", `${U}/communities/{{communityId}}/messages/{{messageId}}/reactions`, {
        emoji: "fire"
      }),
      item("Mark Community Read", "PATCH", `${U}/communities/{{communityId}}/read`, {
        messageId: "{{messageId}}"
      })
    ]),
    folder("Notifications", [
      item("List Notifications", "GET", `${U}/notifications?page=1&limit=20&unreadOnly=false`),
      item("Create Notification", "POST", `${U}/notifications`, {
        userId: "{{userId}}",
        message: "Your mentor review is available for the latest project submission."
      }),
      item("Mark All Notifications Read", "PATCH", `${U}/notifications/read-all`),
      item("Mark Notification Read", "PATCH", `${U}/notifications/{{notificationId}}/read`),
      item("Delete Notification", "DELETE", `${U}/notifications/{{notificationId}}`)
    ]),
    folder("Project Submissions", [
      item("Submit Project", "POST", `${U}/project-submissions`, {
        projectId: "{{projectId}}",
        githubRepo: "https://github.com/example/careernav-project-submission"
      }),
      item("Get My Project Submissions", "GET", `${U}/project-submissions/me`),
      item("Review Project Submission", "PATCH", `${U}/project-submissions/{{projectSubmissionId}}/review`, {
        status: "approved"
      })
    ]),
    folder("Task Submissions", [
      item("Submit Task", "POST", `${U}/task-submissions`, {
        taskId: "{{taskId}}",
        content:
          "I implemented the feature with semantic HTML, reusable components, and keyboard-accessible interactions."
      }),
      item("Get My Task Submissions", "GET", `${U}/task-submissions/me`),
      item("Review Task Submission", "PATCH", `${U}/task-submissions/{{taskSubmissionId}}/review`, {
        status: "rejected"
      })
    ]),
    folder("My Tasks", [item("Get My Tasks", "GET", `${U}/my-tasks`)]),
    folder("Progress", [
      item("Create Progress Record", "POST", `${U}/progress`, {
        roadmapId: "{{roadmapId}}",
        moduleId: "{{moduleId}}",
        taskId: "{{taskId}}",
        status: "in-progress"
      }),
      item(
        "List Progress Records",
        "GET",
        `${U}/progress?page=1&limit=20&roadmapId={{roadmapId}}&moduleId={{moduleId}}&taskId={{taskId}}&status=in-progress&scope=task&sortBy=updatedAt&sortOrder=desc`
      ),
      item("Get Progress Record", "GET", `${U}/progress/records/{{progressId}}`),
      item("Start Task Progress", "POST", `${U}/progress/start`, { taskId: "{{taskId}}" }),
      item("Complete Task Progress", "POST", `${U}/progress/complete`, { taskId: "{{taskId}}" }),
      item("Get My Roadmap Progress", "GET", `${U}/progress/roadmaps/{{roadmapId}}`),
      item("Get Aggregated Roadmap Progress", "GET", `${U}/progress/{{roadmapId}}`),
      item("Update Progress Record", "PATCH", `${U}/progress/{{progressId}}`, {
        status: "completed"
      })
    ]),
    folder("Purchases", [
      item("Create Roadmap Purchase", "POST", `${U}/purchases/roadmaps/{{roadmapId}}`),
      item("List My Purchases", "GET", `${U}/purchases/me`),
      item("Get Purchase By Id", "GET", `${U}/purchases/{{purchaseId}}`)
    ]),
    folder("Role Profiles", [
      item("Get My Role Profile", "GET", `${U}/role-profiles/me`),
      item("List Role Profiles", "GET", `${U}/role-profiles`),
      item("Get Role Profile By User Id", "GET", `${U}/role-profiles/{{userId}}`),
      item("Upsert Role Profile", "POST", `${U}/role-profiles`, {
        userId: "{{userId}}",
        permissions: ["roadmap:write", "roadmap:publish", "community:moderate"]
      }),
      item("Update Role Profile", "PATCH", `${U}/role-profiles/{{userId}}`, {
        permissions: ["roadmap:write", "billing:read"]
      }),
      item("Delete Role Profile", "DELETE", `${U}/role-profiles/{{userId}}`)
    ]),
    folder("Mentor Profiles", [
      item("List Mentor Profiles", "GET", `${U}/mentor-profiles`),
      item("Get My Mentor Profile", "GET", `${U}/mentor-profiles/me`),
      item("Upsert My Mentor Profile", "PATCH", `${U}/mentor-profiles/me`, {
        expertise: ["frontend", "react", "accessibility"],
        experienceYears: 5,
        bio: "Frontend mentor focused on production-ready UI engineering and developer ergonomics."
      }),
      item("Get Mentor Profile By User Id", "GET", `${U}/mentor-profiles/{{userId}}`),
      item("Verify Mentor Profile", "PATCH", `${U}/mentor-profiles/{{userId}}/verify`, {
        isVerified: true
      })
    ]),
    folder("AI", [
      item("Mentor AI", "POST", `${U}/ai/mentor`, {
        roadmapId: "{{roadmapId}}",
        moduleId: "{{moduleId}}",
        taskId: "{{taskId}}",
        userQuery:
          "I understand the basics, but I am stuck on how to break this backend task into smaller steps without getting the full answer.",
        includeResources: true,
        maxTokens: 700
      }),
      item("Progress AI", "POST", `${U}/ai/progress`, {
        roadmapId: "{{roadmapId}}",
        completedTaskIds: ["{{taskId}}"],
        pendingModuleIds: ["{{moduleId}}"],
        performance: {
          selfAssessment: "I am consistent with theory but slower when tasks require implementation decisions.",
          blockers: ["I overthink database schema choices."],
          recentWins: ["Finished the authentication module."],
          consistencyScore: 74,
          averageStudyHoursPerWeek: 8
        },
        maxTokens: 800
      }),
      item("Engineering AI", "POST", `${U}/ai/engineering`, {
        instruction:
          "Review this backend feature plan and tell me what models, controllers, routes, validations, and Postman requests are missing.",
        backendContext:
          "Current stack: Node.js, Express, MongoDB with Mongoose, MVC plus service layer, centralized AppError handling, Zod validation helper.",
        architectureNotes: [
          "Auth uses cookie-based JWT middleware.",
          "Rate limiting is implemented with express-rate-limit."
        ],
        includePostmanCollection: true,
        maxTokens: 1000
      }),
      item("Create Conversation", "POST", `${U}/ai/conversations`, {
        roadmapId: "{{roadmapId}}",
        taskId: "{{taskId}}",
        purpose: "chat",
        storeMessages: false
      }),
      item("List Conversations", "GET", `${U}/ai/conversations`),
      item("Get Conversation", "GET", `${U}/ai/conversations/{{conversationId}}`),
      item("Send Message", "POST", `${U}/ai/conversations/{{conversationId}}/messages`, {
        content: "What is axios and why would I use it in a Node.js backend?",
        generate: true,
        persist: false
      }),
      item("Close Conversation", "POST", `${U}/ai/conversations/{{conversationId}}/close`),
      item("Get Learning Context", "GET", `${U}/ai/context/{{taskId}}`),
      item("Upsert Learning Context", "PATCH", `${U}/ai/context/{{taskId}}`, {
        rules: {
          prerequisites: ["HTML", "CSS", "JavaScript basics"],
          avoid: ["full solution", "copy-paste answer"],
          focus: ["reasoning", "debugging process", "tradeoff analysis"]
        }
      })
    ]),
    folder("Billing", [
      item("List Billing Plans", "GET", `${U}/billing/plans`),
      item("Get Billing Plan", "GET", `${U}/billing/plans/{{planId}}`),
      item("Create Billing Plan", "POST", `${U}/billing/plans`, {
        name: "Team Pro",
        code: "team-pro",
        description: "Shared workspace plan with higher AI limits for active teams.",
        price: 49,
        currency: "USD",
        billingInterval: "monthly",
        aiTokenLimit: 750000,
        features: ["Priority AI guidance", "Team collaboration", "Advanced analytics"],
        isDefault: false,
        status: "active"
      }),
      item("Update Billing Plan", "PATCH", `${U}/billing/plans/{{planId}}`, {
        price: 59,
        billingInterval: "yearly",
        aiTokenLimit: 900000,
        status: "active"
      }),
      item("Set Default Billing Plan", "PATCH", `${U}/billing/plans/{{planId}}/default`),
      item("Get My Usage", "GET", `${U}/billing/usage/me`),
      item("Set User Plan", "PATCH", `${U}/billing/usage/{{userId}}/plan`, {
        planId: "{{planId}}",
        expiresAt: "2027-04-15T00:00:00.000Z"
      })
    ]),
    folder("Mentor Onboarding", [
      item("Submit Mentor Application", "POST", `${U}/mentor-onboarding/apply`, {
        expertise: ["frontend", "nodejs", "system-design"],
        experienceYears: 6,
        bio: "Engineer and mentor who enjoys helping learners ship production features.",
        portfolioUrl: "https://example.dev",
        linkedInUrl: "https://linkedin.com/in/example-mentor",
        availability: "Weekdays after 7 PM IST and weekends.",
        motivation:
          "I want to help learners avoid common mistakes and build strong engineering habits."
      }),
      item("Get My Mentor Application", "GET", `${U}/mentor-onboarding/me`),
      item("List Mentor Applications", "GET", `${U}/mentor-onboarding?status=pending`),
      item("Review Mentor Application", "PATCH", `${U}/mentor-onboarding/{{mentorApplicationId}}/review`, {
        action: "approved",
        notes:
          "Strong application and relevant experience for mentoring frontend and backend learners."
      })
    ]),
    folder("Analytics", [
      item("Get Learner Analytics", "GET", `${U}/analytics/learner`),
      item("Get Mentor Analytics", "GET", `${U}/analytics/mentor`),
      item("Get Admin Analytics", "GET", `${U}/analytics/admin`)
    ])
  ]
};

writeFileSync(
  resolve("server/postman/CareerNav.postman_collection.json"),
  `${j(collection)}\n`,
  "utf8"
);
