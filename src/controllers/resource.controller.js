import {
  createResource,
  updateResource,
  getResourcesByTask,
  deleteResource
} from "../services/resource.service.js";

import {
  createResourceSchema,
  updateResourceSchema
} from "../validators/resource.validation.js";

import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= CREATE ========================= */
export const createResourceController = catchAsyncError(async (req, res) => {
  const {taskId}= req.params;
  const { error } = createResourceSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const resource = await createResource(req.body, req.user.id, taskId);
  res.status(201).json({ message: "Resource created successfully", resource});
});

/* ========================= UPDATE ========================= */
export const updateResourceController = catchAsyncError(async (req, res) => {
  const { error } = updateResourceSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const resource = await updateResource(
    req.params.id,
    req.user.id,
    req.body
  );

  res.json({
    message: "Resource updated successfully",
    resource
  });
});

/* ========================= GET BY TASK ========================= */
export const getResourcesByTaskController = catchAsyncError(
  async (req, res) => {
    const resources = await getResourcesByTask(req.params.taskId);
    res.json({message: "Resources fetched successfully", resources});
  }
);

/* ========================= DELETE ========================= */
export const deleteResourceController = catchAsyncError(async (req, res) => {
  await deleteResource(req.params.id, req.user.id);
  res.json({ message: "Resource deleted successfully" });
});
