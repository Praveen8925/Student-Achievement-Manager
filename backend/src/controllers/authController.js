const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../utils/supabase');

const signToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

// ─── Admin Login ────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ success: false, message: 'Username and password are required.' });

    if (
        username !== process.env.ADMIN_USERNAME ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = signToken({ role: 'admin', username });
    res.json({ success: true, token, user: { role: 'admin', name: 'Administrator', username } });
};

// ─── Unified Login (Admin or Staff) ──────────────────────────────────────────
const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ success: false, message: 'Username and password are required.' });

    // Try admin login first
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = signToken({ role: 'admin', username });
        return res.json({ success: true, token, user: { role: 'admin', name: 'Administrator', username } });
    }

    // Try staff login
    const { data: staff, error } = await supabase
        .from('staff_users')
        .select('*')
        .or(`username.eq.${username.trim()},register_number.eq.${username.trim()}`)
        .single();

    if (error || !staff)
        return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your username and password.' });

    const valid = await bcrypt.compare(password, staff.password_hash);
    if (!valid)
        return res.status(401).json({ success: false, message: 'Invalid username or password.' });

    const token = signToken({
        id: staff.id,
        role: 'staff',
        username: staff.username,
        name: staff.name,
        register_number: staff.register_number
    });

    res.json({
        success: true,
        token,
        user: {
            id: staff.id,
            role: 'staff',
            name: staff.name,
            username: staff.username,
            staffId: staff.register_number || staff.username
        }
    });
};

// ─── Staff Login ─────────────────────────────────────────────────────────────
const staffLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ success: false, message: 'Username and password are required.' });

    const { data: staff, error } = await supabase
        .from('staff_users')
        .select('*')
        .or(`username.eq.${username.trim()},register_number.eq.${username.trim()}`)
        .single();

    if (error || !staff)
        return res.status(401).json({ success: false, message: 'Invalid credentials. Please use your Username or Register No.' });

    const valid = await bcrypt.compare(password, staff.password_hash);
    if (!valid)
        return res.status(401).json({ success: false, message: 'Invalid username or password.' });

    const token = signToken({
        id: staff.id,
        role: 'staff',
        username: staff.username,
        name: staff.name,
        register_number: staff.register_number
    });

    res.json({
        success: true,
        token,
        user: {
            id: staff.id,
            role: 'staff',
            name: staff.name,
            username: staff.username,
            staffId: staff.register_number || staff.username
        }
    });
};

// ─── Admin: Create Staff User ────────────────────────────────────────────────
const createStaff = async (req, res) => {
    const { name, username, register_number, password, department } = req.body;
    if (!name || !username || !password)
        return res.status(400).json({ success: false, message: 'Name, username, and password are required.' });

    // Check if username already exists
    const { data: existing } = await supabase
        .from('staff_users')
        .select('id')
        .eq('username', username.trim())
        .single();

    if (existing)
        return res.status(409).json({ success: false, message: 'Username already exists.' });

    const password_hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
        .from('staff_users')
        .insert([{ name, username: username.trim(), register_number: register_number?.trim() || null, password_hash, department: department || null }])
        .select('id, name, username, register_number, department, created_at')
        .single();

    if (error)
        return res.status(500).json({ success: false, message: `Failed to create staff: ${error.message}` });

    res.status(201).json({ success: true, message: 'Staff account created successfully.', data });
};

// ─── Admin: List Staff Users ─────────────────────────────────────────────────
const listStaff = async (req, res) => {
    const { data, error } = await supabase
        .from('staff_users')
        .select('id, name, username, register_number, department, created_at')
        .order('created_at', { ascending: false });

    if (error)
        return res.status(500).json({ success: false, message: error.message });

    res.json({ success: true, data });
};

// ─── Admin: Reset Staff Password ─────────────────────────────────────────────
const resetStaffPassword = async (req, res) => {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6)
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });

    const password_hash = await bcrypt.hash(new_password, 12);
    const { error } = await supabase
        .from('staff_users')
        .update({ password_hash })
        .eq('id', id);

    if (error)
        return res.status(500).json({ success: false, message: error.message });

    res.json({ success: true, message: 'Staff password reset successfully.' });
};

// ─── Admin: Delete Staff User ─────────────────────────────────────────────────
const deleteStaff = async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('staff_users')
        .delete()
        .eq('id', id);

    if (error)
        return res.status(500).json({ success: false, message: error.message });

    res.json({ success: true, message: 'Staff account deleted.' });
};

// ─── Change Password (Staff) ─────────────────────────────────────────────────
const changePassword = async (req, res) => {
    const { old_password, new_password } = req.body;
    const userId = req.user.id;

    if (!old_password || !new_password)
        return res.status(400).json({ success: false, message: 'Old and new passwords are required.' });

    if (new_password.length < 6)
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });

    const { data: staff, error } = await supabase
        .from('staff_users')
        .select('password_hash')
        .eq('id', userId)
        .single();

    if (error || !staff)
        return res.status(404).json({ success: false, message: 'User not found.' });

    const valid = await bcrypt.compare(old_password, staff.password_hash);
    if (!valid)
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    const password_hash = await bcrypt.hash(new_password, 12);
    const { error: updateError } = await supabase
        .from('staff_users')
        .update({ password_hash })
        .eq('id', userId);

    if (updateError)
        return res.status(500).json({ success: false, message: 'Failed to update password.' });

    res.json({ success: true, message: 'Password changed successfully.' });
};

// ─── Get current user (me) ───────────────────────────────────────────────────
const getMe = (req, res) => {
    res.json({ success: true, user: req.user });
};

module.exports = { login, adminLogin, staffLogin, createStaff, listStaff, deleteStaff, resetStaffPassword, changePassword, getMe };
