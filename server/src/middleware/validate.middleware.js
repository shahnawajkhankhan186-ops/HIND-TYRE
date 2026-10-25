const { ZodError } = require('zod');

/**
 * Express middleware for Zod schema validation
 * Validates req.body, req.query, or req.params
 */
function validate(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          error: errors[0]?.message || 'Validation error',
          validationErrors: errors,
        });
      }
      next(err);
    }
  };
}

module.exports = { validate };
