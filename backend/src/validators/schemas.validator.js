import { z } from 'zod';

export const profileSchema = z.object({
    userId: z.string().min(1, "userId is required"),
    heightCm: z.number().min(100).max(250),
    weightKg: z.number().min(30).max(200),
    age: z.number().min(12).max(100),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).default('prefer_not_to_say'),
    skinTone: z.enum(['warm', 'cool', 'neutral', 'olive', 'unknown']).optional().default('unknown')
});

export const clothingItemSchema = z.object({
    userId: z.string().min(1),
    name: z.string().min(2).max(100),
    category: z.enum(['top', 'bottom', 'outerwear', 'footwear', 'accessory', 'other']),
    color: z.string().optional().default('unknown'),
    formality: z.enum(['casual', 'smart_casual', 'formal', 'business', 'party', 'sporty', 'traditional', 'unknown']).default('unknown')
});

export const chatSchema = z.object({
    userId: z.string().min(1),
    message: z.string().min(3, "Message must be at least 3 characters")
});
