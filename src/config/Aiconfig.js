import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

export const checkGeminiConnection = async () => {
  try {
    const result = await geminiModel.generateContent(
      "Reply with the word OK only."
    );

    const text = result.response.text().trim();

    if (text !== "OK") {
      throw new Error("Unexpected Gemini response");
    }

    return {
      status: "connected",
      model: "gemini-1.5-flash"
    };
  } catch (error) {
    return {
      status: "error",
      message: error.message
    };
  }
};
