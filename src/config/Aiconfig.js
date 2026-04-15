import OpenAI from "openai";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ||
  process.env.OPENROUTER_CHAT_MODEL ||
  process.env.OPENAI_MODEL ||
  "openai/gpt-4o-mini";

let openaiClient = null;
let resolvedBaseUrl = null;

const resolveApiKey = () =>
  process.env.OPENROUTER_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "";

export const getResolvedAIBaseUrl = () => resolvedBaseUrl || DEFAULT_OPENAI_BASE_URL;

export function createOpenAIClient() {
  const apiKey = resolveApiKey();

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY or OPENAI_API_KEY is missing");
  }

  if (!openaiClient) {
    const options = { apiKey };

    if (process.env.OPENROUTER_BASE_URL?.trim()) {
      options.baseURL = process.env.OPENROUTER_BASE_URL.trim();
    } else if (apiKey.startsWith("sk-or-")) {
      options.baseURL = DEFAULT_OPENROUTER_BASE_URL;
      options.defaultHeaders = {
        "HTTP-Referer":
          process.env.OPENROUTER_HTTP_REFERER || "http://localhost:5000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "CareerNav AI"
      };
      logger.warn("Detected OpenRouter key. Using OpenRouter base URL.");
    }

    resolvedBaseUrl = options.baseURL || DEFAULT_OPENAI_BASE_URL;
    logger.info("OpenAI client configured", {
      baseURL: resolvedBaseUrl,
      model: DEFAULT_MODEL
    });
    openaiClient = new OpenAI(options);
  }

  return openaiClient;
}

export const createAIChatCompletion = async ({
  model = DEFAULT_MODEL,
  messages,
  maxTokens,
  temperature = 0.2,
  timeout = Number(process.env.OPENROUTER_TIMEOUT_MS || 20000)
}) => {
  const client = createOpenAIClient();

  return client.chat.completions.create(
    {
      model,
      messages,
      max_tokens: maxTokens,
      temperature
    },
    {
      timeout
    }
  );
};

export async function healthCheck() {
  try {
    const response = await createAIChatCompletion({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: "Reply with the word OK only." }],
      maxTokens: 5,
      temperature: 0
    });

    const text = response?.choices?.[0]?.message?.content?.trim?.() || "";
    return text === "OK";
  } catch (error) {
    logger.error("AI health check failed", {
      baseURL: getResolvedAIBaseUrl(),
      message: error?.message,
      status: error?.status,
      code: error?.code
    });
    return false;
  }
}

export const checkGeminiConnection = async () => {
  try {
    createOpenAIClient();
    const openaiOk = await healthCheck();

    if (!openaiOk) {
      return {
        status: "error",
        provider: "openrouter",
        message: "OpenAI health check failed"
      };
    }

    return {
      status: "connected",
      provider: getResolvedAIBaseUrl().includes("openrouter")
        ? "openrouter"
        : "openai",
      model: DEFAULT_MODEL,
      baseURL: getResolvedAIBaseUrl()
    };
  } catch (error) {
    return {
      status: "error",
      provider: "openrouter",
      message: error.message
    };
  }
};
