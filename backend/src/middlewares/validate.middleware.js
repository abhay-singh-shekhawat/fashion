import { z } from 'zod';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      req.validatedBody = result.data;
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid request data' });
    }
  };
};