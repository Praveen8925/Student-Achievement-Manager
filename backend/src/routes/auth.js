const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
    login, adminLogin, staffLogin, createStaff, listStaff, deleteStaff, resetStaffPassword, changePassword, getMe
} = require('../controllers/authController');

// Public
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/staff/login', staffLogin);

// Protected - any authenticated user
router.get('/me', requireAuth, getMe);
router.put('/change-password', requireAuth, changePassword);

// Admin only
router.post('/admin/staff', requireAdmin, createStaff);
router.get('/admin/staff', requireAdmin, listStaff);
router.delete('/admin/staff/:id', requireAdmin, deleteStaff);
router.patch('/admin/staff/:id/reset-password', requireAdmin, resetStaffPassword);

module.exports = router;
