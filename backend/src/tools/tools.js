import {getDailyRecommendations, getOccasionSuggestion, getShoppingSuggestions} from "../controllers/suggestion.controller.js"
import {getWardrobe} from "../controllers/wardrobe.controller.js"
import {getProgress} from "../controllers/progress.controller.js"
import scanWorker from "../workers/scanWorkerLite.js"
import cloudinary from "../configs/cloudinary.js"
import { scanQueuelite } from "../configs/queue.js"
import {fetchProducts} from "../configs/serp.js"

export const tools = {
  get_daily_recommendation: {
    name: "get_daily_recommendation",
    description: "Get personalized daily outfit recommendation using weather, profile and wardrobe",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "User ID" }
      },
      required: ["userId"]
    }
  },

  get_wardrobe: {
    name: "get_wardrobe",
    description: "Fetch all items in the user's wardrobe",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "User ID" }
      },
      required: ["userId"]
    }
  },

  get_progress: {
    name: "get_progress",
    description: "Get user's style progress, level, points and streak",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "User ID" }
      },
      required: ["userId"]
    }
  },

  scan_outfit: {
    name: "scan_outfit",
    description: "Process a scanned outfit image and add detected items to wardrobe",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "User ID" }
      },
      required: ["userId","imageurl"]
    }
  },

  get_shopping_suggestions: {
    name: "get_shopping_suggestions",
    description: "Suggest what clothing items the user should buy to improve their wardrobe",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "User ID" },
        query: { type: "string", description: "Search query for shopping suggestions" }
      },
      required: ["userId","query"]
    }
  },

  get_outfit_suggestion: {
    name: "get_outfit_suggestion",
    description: "Give outfit suggestions for a specific occasion like office, party, gym, date, interview",
    parameters: {
      type: "object",
      properties: {
        userId: { type: "string", description: "User ID" },
        occasion: { type: "string", description: "Occasion name (office, party, gym, date, interview, casual, traditional)" }
      },
      required: ["userId", "occasion"]
    }
  }
};


export const toolExecutors = {
  get_daily_recommendation: async (args) => {
    try {
      const req = { user: { id: args.userId } };
      const res = { 
        json: (data) => data,
        status: (code) => ({ json: (data) => data })
      };

      const result = await getDailyRecommendations(req, res);
      return result;
    } catch (error) {
      console.log(error,"error in daily recommendation tool")
      return `Failed to get daily recommendation tool`
    }
  },

  get_wardrobe: async (args) => {
    try {
      const req = { user: { id: args.userId } };
      const res = { json: (data) => data ,
        status: (code) => ({ json: (data) => data })
      };

      const result = await getWardrobe(req, res);
      return result;
    } catch (error) {
      console.log(error,"error in get wardrob tool")
      return `Failed to fetch wardrobe tool`
    }
  },

  get_progress: async (args) => {
    try {
      const req = { user: { id: args.userId } };
      const res = { json: (data) => data,
        status: (code) => ({ json: (data) => data })
       };

      const result = await getProgress(req, res);
      return result;
    } catch (error) {
      console.log(error,`error in get progress tool`)
      return `Failed to get progress`
    }
  },

  scan_outfit: async (args) => {
    try {
      // Queue the scan job (you already have this in scanQueue)
      const userId = args.userId
      const imageUrl = args.imageUrl

      const publicId = `scan_${userId}_${Date.now()}`
      const uploadResult = await cloudinary.uploader.upload(
        imageUrl,
        {
          folder: 'fashion/scan',
          public_id: publicId,
          overwrite: false,
        }
      );
  
      const imageHash = crypto
          .createHash('sha256')
          .update(req.file.buffer)
          .digest('hex');
  
      await scanQueuelite.add(`process-scan`,{
          userId,
          imageUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          imageHash: imageHash,
          originalFileName: req.file.originalname
      },{
          attempts: 3,
          backoff: {type: `exponential` , delay: 5000},
          removeOnComplete: true,
          removeOnFail: false
      })
      return {
        message: "Scan job queued successfully",
        status: "processing"
      };
    } catch (error) {
      console.log(error,`error in scan tool`)
      return `Failed to scan image`
    }
  },

  get_shopping_suggestions: async (args) => {
    try {
      const req = { user: { id: args.userId } }
      const res = { json: (data) => data ,
          status: (code) => ({ json: (data) => data })
        };
      const result = await fetchProducts(args.args?.query)
      return result
    } catch (error) {
      console.log(error,"error in shopping suggestion tool")
      return `failed to fetch shopping suggestion`
    }
  },

  get_outfit_suggestion: async (args) => {
    try {
      const req = { user: { id: args.userId }, body: args.args?.occasion }
      const res = { json: (data) => data ,
        status: (code) => ({ json: (data) => data })
      }
      const result = await getOutfitSuggestion(req,res)
      return result 
    } catch (error) {
      console.log(error,`error in outfit suggestion tool`)
      return `failed to fetch outfit suggestions`
    }
  }
};