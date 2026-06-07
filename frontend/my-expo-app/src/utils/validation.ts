import { z } from 'zod';

export const validationSchemas = {
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  height: z
    .number()
    .min(100, 'Height must be at least 100 cm')
    .max(250, 'Height must not exceed 250 cm'),
  weight: z
    .number()
    .min(30, 'Weight must be at least 30 kg')
    .max(200, 'Weight must not exceed 200 kg'),
  age: z
    .number()
    .min(12, 'Age must be at least 12')
    .max(100, 'Age must not exceed 100'),
};
