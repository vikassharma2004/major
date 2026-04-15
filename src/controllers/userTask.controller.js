import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { getMyTasks } from "../services/userTask.service.js";

export const getMyTasksController = catchAsyncError(async (req, res) => {
  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.limit, 10) || 10;

  if (page < 1 || limit < 1) {
    throw new AppError("Page and limit must be positive integers", 400);
  }

  const result = await getMyTasks(req.user.id, {
    page,
    limit: Math.min(limit, 100)
  });

  res.status(200).json(result);
});
