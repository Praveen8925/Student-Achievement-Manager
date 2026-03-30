const supabase = require('../utils/supabase');
const fs = require('fs').promises;
const path = require('path');

// Upload certificate for a specific category
const uploadCertificate = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        if (!req.file) {
            const error = new Error('No file uploaded');
            error.statusCode = 400;
            return next(error);
        }

        // Get the category to check if it exists
        const { data: categoryData, error: fetchError } = await supabase
            .from('event_categories')
            .select('*')
            .eq('id', categoryId)
            .single();

        if (fetchError) {
            // Delete the uploaded file since we'll reject the request
            await fs.unlink(req.file.path);

            if (fetchError.code === 'PGRST116') {
                const error = new Error('Category not found');
                error.statusCode = 404;
                return next(error);
            }
            throw new Error(`Failed to fetch category: ${fetchError.message}`);
        }

        // Delete old certificate if exists
        if (categoryData.certificate_filename) {
            const oldFilePath = path.join('uploads', categoryData.certificate_filename);
            try {
                await fs.unlink(oldFilePath);
            } catch (err) {
                console.error('Failed to delete old certificate:', err);
                // Continue with upload even if old file deletion fails
            }
        }

        // Update category with new certificate info
        const certificateUrl = `/api/certificates/download/${categoryId}`;
        const { data: updatedCategory, error: updateError } = await supabase
            .from('event_categories')
            .update({
                certificate_url: certificateUrl,
                certificate_filename: req.file.filename
            })
            .eq('id', categoryId)
            .select()
            .single();

        if (updateError) {
            // Delete the uploaded file since update failed
            await fs.unlink(req.file.path);
            throw new Error(`Failed to update certificate: ${updateError.message}`);
        }

        res.status(200).json({
            success: true,
            message: 'Certificate uploaded successfully',
            data: {
                certificate_url: certificateUrl,
                certificate_filename: req.file.filename
            }
        });

    } catch (error) {
        // Clean up uploaded file on error
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (err) {
                console.error('Failed to clean up file:', err);
            }
        }
        next(error);
    }
};

// Download certificate for a specific category
const downloadCertificate = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        // Get the category to retrieve certificate info
        const { data: categoryData, error: fetchError } = await supabase
            .from('event_categories')
            .select('*')
            .eq('id', categoryId)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                const error = new Error('Category not found');
                error.statusCode = 404;
                return next(error);
            }
            throw new Error(`Failed to fetch category: ${fetchError.message}`);
        }

        if (!categoryData.certificate_filename) {
            const error = new Error('No certificate found for this category');
            error.statusCode = 404;
            return next(error);
        }

        const filePath = path.join('uploads', categoryData.certificate_filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (err) {
            const error = new Error('Certificate file not found');
            error.statusCode = 404;
            return next(error);
        }

        // Send file
        res.download(filePath, `certificate_${categoryId}.pdf`, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                if (!res.headersSent) {
                    next(err);
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

// View certificate inline (for preview in browser)
const viewCertificate = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        // Get the category to retrieve certificate info
        const { data: categoryData, error: fetchError } = await supabase
            .from('event_categories')
            .select('*')
            .eq('id', categoryId)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                const error = new Error('Category not found');
                error.statusCode = 404;
                return next(error);
            }
            throw new Error(`Failed to fetch category: ${fetchError.message}`);
        }

        if (!categoryData.certificate_filename) {
            const error = new Error('No certificate found for this category');
            error.statusCode = 404;
            return next(error);
        }

        const filePath = path.join('uploads', categoryData.certificate_filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (err) {
            const error = new Error('Certificate file not found');
            error.statusCode = 404;
            return next(error);
        }

        // Read and send file as inline PDF
        const fileData = await fs.readFile(filePath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=certificate.pdf');
        res.send(fileData);

    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadCertificate,
    downloadCertificate,
    viewCertificate
};
