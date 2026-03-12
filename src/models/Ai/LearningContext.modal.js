import mongoose from "mongoose";

const learningContextSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  taskId: mongoose.Schema.Types.ObjectId,
  rules: Object
});

learningContextSchema.index({ userId: 1, taskId: 1 });

export const LearningContext = mongoose.model("LearningContext", learningContextSchema);
