
import mongoose from "mongoose";

const savedResourceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource" }
});