import express from "express";
import { getMyTasksController } from "../controllers/userTask.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";

const UserTaskRouter = express.Router();

UserTaskRouter.get("/", authenticate, getMyTasksController);

export default UserTaskRouter;
