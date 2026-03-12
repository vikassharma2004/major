import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, index: true },
  role: { type: String, enum: ["user", "assistant"] },
  content: String
}, { timestamps: true });

export const AIMessage = mongoose.model("AIMessage", aiMessageSchema);
