const express = require('express');
const router = express.Router();
const {
    exportToExcel,
    exportToPDF
} = require('../controllers/exportController');
const { requireAuth } = require('../middleware/auth');

// Export records to Excel
router.get('/excel', requireAuth, exportToExcel);

// Export records to PDF
router.get('/pdf', requireAuth, exportToPDF);

module.exports = router;
