const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    uploadCertificate,
    downloadCertificate,
    viewCertificate
} = require('../controllers/certificateController');
const { requireAuth } = require('../middleware/auth');

// Upload certificate for a specific category
router.post('/upload/:categoryId', requireAuth, upload.single('certificate'), uploadCertificate);

// Download certificate for a specific category
router.get('/download/:categoryId', requireAuth, downloadCertificate);

// View certificate for a specific category (inline)
router.get('/:categoryId/view', requireAuth, viewCertificate);

module.exports = router;
