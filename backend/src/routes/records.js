const express = require('express');
const router = express.Router();
const {
    createRecord,
    getRecords,
    getRecordById,
    updateRecord,
    deleteRecord,
    getStudentsByDeptAndYear
} = require('../controllers/recordController');

const { requireAuth } = require('../middleware/auth');

// Student lookup
router.get('/students/lookup', requireAuth, getStudentsByDeptAndYear);

// Create a new record
router.post('/', requireAuth, createRecord);

// Get all records with search and filter
router.get('/', requireAuth, getRecords);

// Get a single record by category ID
router.get('/:categoryId', requireAuth, getRecordById);

// Update a record
router.put('/:categoryId', requireAuth, updateRecord);

// Delete a record
router.delete('/:categoryId', requireAuth, deleteRecord);

module.exports = router;
