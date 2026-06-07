import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .regex(
        /[!@#$%^&*]/,
        'Password must contain special character (!@#$%^&*)'
      ),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'Must accept terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

export const profileSchema = z.object({
  heightCm: z
    .number()
    .min(100, 'Height must be at least 100 cm')
    .max(250, 'Height must be less than 250 cm'),
  weightKg: z
    .number()
    .min(30, 'Weight must be at least 30 kg')
    .max(200, 'Weight must be less than 200 kg'),
  age: z.number().min(12, 'You must be at least 12').max(100, 'Invalid age'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  skinTone: z.enum(['warm', 'cool', 'neutral', 'olive', 'unknown'], {
    errorMap: () => ({ message: 'Please select a skin tone' }),
  }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;