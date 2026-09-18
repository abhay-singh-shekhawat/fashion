import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* gemini-1.5-flash was retired (404 NOT_FOUND) and the pinned 2.5 flash models
   return 404 for this API key, while gemini-flash-latest currently answers
   roughly 1 in 4 calls with 503 "high demand". Every vision job used to die on
   the model call *after* the Cloudinary upload had succeeded, so photos ended
   up in cloud storage but never in the database. */
const MODEL_CHAIN = ["gemini-flash-lite-latest", "gemini-flash-latest"];

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Run a prompt against the first model that answers.
 * Accepts a plain string or an array of parts ({ text } / { inlineData }).
 * responseMimeType is set so the reply is raw JSON instead of ```json fences,
 * which JSON.parse() otherwise chokes on.
 */
export const generateJson = async (promptOrParts) => {
  const parts = typeof promptOrParts === "string" ? [{ text: promptOrParts }] : promptOrParts;
  let lastError;

  for (const model of MODEL_CHAIN) {
    try {
      const generativeModel = genAi.getGenerativeModel({
        model,
        generationConfig: { responseMimeType: "application/json" },
      });
      const result = await generativeModel.generateContent(parts);
      return { text: result.response.text(), model };
    } catch (error) {
      console.warn(`[Gemini] ${model} failed: ${error.message}`);
      lastError = error;
    }
  }

  throw lastError;
};

/* Gemini rejects `fileData.fileUri` without a mimeType (400 INVALID_ARGUMENT)
   and cannot reach arbitrary URLs reliably, so fetch the bytes ourselves and
   send the image inline. */
export const fetchImagePart = async (imageUrl) => {
  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 30000,
  });
  const mimeType = response.headers["content-type"]?.split(";")[0] || "image/jpeg";
  return {
    inlineData: {
      mimeType,
      data: Buffer.from(response.data).toString("base64"),
    },
  };
};
