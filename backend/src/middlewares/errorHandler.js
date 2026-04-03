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