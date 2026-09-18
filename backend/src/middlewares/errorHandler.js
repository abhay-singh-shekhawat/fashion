const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);

  // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: Object.values(err.errors).map(e => e.message)
        });
  }

  // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }

    /* Multer's own failures. A file over the limit is the client's problem and
       needs a status that says so — this used to fall through to a 500 with
       "File too large", which reads like a server fault. */
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'Image is too large — the limit is 5MB' });
        }
        return res.status(400).json({
            error: err.code === 'LIMIT_UNEXPECTED_FILE'
                ? `Upload rejected: unexpected field "${err.field}"`
                : `Upload rejected: ${err.message}`
        });
    }

    // Multer file errors
    if (err.message.includes('Only image files')) {
        return res.status(400).json({ error: 'Only image files are allowed' });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export default errorHandler;