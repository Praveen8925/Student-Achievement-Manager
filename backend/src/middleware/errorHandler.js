// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Joi validation error
    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: err.details.map(detail => detail.message)
        });
    }

    // Multer file upload error
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            error: 'File Upload Error',
            message: err.message
        });
    }

    // Custom error with status code
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }

    // Default server error
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
};

// Not found handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};
