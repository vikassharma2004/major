import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { validateWithZod } from "../validators/zod.js";
import {
  createModuleResourceSchema,
  listModuleResourcesQuerySchema,
  moduleResourceIdParamsSchema,
  moduleResourceParamsSchema,
  updateModuleResourceSchema
} from "../validators/roadmapModuleResource.validation.js";
import {
  createModuleResource,
  deleteModuleResource,
  getModuleResourceById,
  listModuleResources,
  updateModuleResource
} from "../services/roadmapModuleResource.service.js";

export const createModuleResourceController = catchAsyncError(async (req, res) => {
  const { moduleId } = validateWithZod(moduleResourceParamsSchema, req.params);
  const payload = validateWithZod(createModuleResourceSchema, req.body);

  const resource = await createModuleResource(payload, req.user.id, moduleId);

  res.status(201).json({
    message: "Module resource created successfully",
    resource
  });
});

export const getModuleResourceController = catchAsyncError(async (req, res) => {
  const { id } = validateWithZod(moduleResourceIdParamsSchema, req.params);

  const resource = await getModuleResourceById(id, req.user.id, req.user.role);

  res.status(200).json({
    message: "Module resource fetched successfully",
    resource
  });
});

export const getModuleResourcesController = catchAsyncError(async (req, res) => {
  const { moduleId } = validateWithZod(moduleResourceParamsSchema, req.params);
  const query = validateWithZod(listModuleResourcesQuerySchema, req.query);

  const result = await listModuleResources(moduleId, req.user, query);

  res.status(200).json({
    message: "Module resources fetched successfully",
    ...result
  });
});

export const updateModuleResourceController = catchAsyncError(async (req, res) => {
  const { id } = validateWithZod(moduleResourceIdParamsSchema, req.params);
  const payload = validateWithZod(updateModuleResourceSchema, req.body);

  const resource = await updateModuleResource(id, req.user.id, payload);

  res.status(200).json({
    message: "Module resource updated successfully",
    resource
  });
});

export const deleteModuleResourceController = catchAsyncError(async (req, res) => {
  const { id } = validateWithZod(moduleResourceIdParamsSchema, req.params);

  await deleteModuleResource(id, req.user.id);

  res.status(200).json({
    message: "Module resource deleted successfully"
  });
});
