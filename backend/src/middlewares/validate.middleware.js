import { z } from 'zod';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // If auth middleware populated req.user, inject userId into body so schemas
      // that expect userId don't fail when the client omits it.
      if (req.user && typeof req.body === 'object' && !req.body.userId) {
        req.body = { ...req.body, userId: req.user.id };
      }

      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const zError = result.error;
        // Zod errors may expose issues (zod v3) or errors; handle both safely
        const issues = zError?.issues ?? zError?.errors ?? [];

        const details = (Array.isArray(issues) ? issues : []).map(err => ({
          field: Array.isArray(err.path) ? err.path.join('.') : (err.path ?? ''),
          message: err.message ?? String(err)
        }));

        if (details.length === 0) {
          // Fallback when Zod error shape is unexpected
          return res.status(400).json({ error: 'Validation failed', message: zError?.message ?? 'Invalid request data' });
        }

        return res.status(400).json({ error: 'Validation failed', details });
      }

      req.validatedBody = result.data;
      next();
    } catch (error) {
      // Log unexpected errors to help debugging and return a useful message
      console.error('[Validate] Unexpected error validating request:', error);
      return res.status(400).json({ error: 'Invalid request data', message: error?.message || String(error) });
    }
  };
};