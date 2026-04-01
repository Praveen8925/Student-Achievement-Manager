import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, UserPlus, Trash2, Loader2, AlertCircle, CheckCircle2,
  Eye, EyeOff, Users, LogOut, GraduationCap, Hash, User, Lock, X, RefreshCw, KeyRound
} from 'lucide-react';
import { adminService } from '../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const INPUT = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm shadow-sm";
const LABEL = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
const DEPTS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'MBA', 'MCA', 'EEE'];

const DEPARTMENTS = [
  'B.Com', 'B.Com CA', 'B.Com PA', 'B.Com (Accounting & Business Analytics)',
  'B.Com (Banking & Insurance)', 'B.Com IT', 'BBA', 'B.Sc CS', 'B.Sc IT', 'BCA',
  'B.Sc AIML', 'B.Sc DSA', 'B.Sc DCFS', 'B.Sc Mathematics', 'B.Sc Chemistry',
  'B.Sc Psychology', 'BA English', 'BA Tamil', 'M.Com',
  'M.Com (International Business)', 'MBA', 'MCA', 'M.Sc Mathematics', 'M.Sc Psychology', 'MSW'
];

const AdminPortal = () => {
  const navigate = useNavigate();
  const [authed,   setAuthed]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [toast, setToast] = useState(null); 
  const [deletingId, setDeletingId] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Reset password modal
  const [resetTarget, setResetTarget] = useState(null); // { id, name }
  const [resetPwd,    setResetPwd]    = useState('');
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg,    setResetMsg]    = useState(null); // { type, text }

  // Admin login form
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Create staff form
  const [registerForm, setRegisterForm] = useState({ 
    name: '', username: '', register_number: '', 
    password: '', department: DEPARTMENTS[0] 
  });

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Always clear any stored admin session on page load — login is required every time
  useEffect(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAuthed(false);
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoginError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        setAuthed(true);
        fetchStaff();
      } else {
        // Wrong credentials — show error inline, do NOT reload
        setLoginError(data.message || 'Invalid admin credentials. Please try again.');
      }
    } catch {
      setLoginError('Network error. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    setListLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res  = await fetch(`${API_BASE}/auth/admin/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setStaffList(json.data || []);
    } catch { setStaffList([]); }
    finally { setListLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.username || !registerForm.password) {
      showToast('error', 'Name, Username, and Password are required.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/auth/admin/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Staff account "${registerForm.username}" created successfully!`);
        setRegisterForm({ name: '', username: '', register_number: '', password: '', department: DEPARTMENTS[0] });
        fetchStaff();
      } else {
        showToast('error', data.message || 'Failed to create staff.');
      }
    } catch { showToast('error', 'Network error. Is the backend running?'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete staff account for "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/auth/admin/staff/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStaffList(prev => prev.filter(s => s.id !== id));
        showToast('success', 'Staff account deleted.');
      } else { showToast('error', data.message); }
    } catch { showToast('error', 'Failed to delete.'); }
    finally { setDeletingId(null); }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAuthed(false);
    setStaffList([]);
  };

  const openReset = (staff) => {
    setResetTarget(staff);
    setResetPwd('');
    setResetMsg(null);
    setShowResetPwd(false);
  };

  const handleResetPassword = async () => {
    if (!resetPwd || resetPwd.length < 6) {
      setResetMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setResetLoading(true);
    setResetMsg(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/auth/admin/staff/${resetTarget.id}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_password: resetPwd }),
      });
      const data = await res.json();
      if (data.success) {
        setResetMsg({ type: 'success', text: `Password reset for ${resetTarget.name}!` });
        setTimeout(() => setResetTarget(null), 1500);
        showToast('success', `Password for "${resetTarget.name}" has been reset.`);
      } else {
        setResetMsg({ type: 'error', text: data.message || 'Failed to reset password.' });
      }
    } catch {
      setResetMsg({ type: 'error', text: 'Network error. Is the backend running?' });
    } finally { setResetLoading(false); }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-primary-600 rounded-2xl shadow-xl shadow-primary-200 mb-5">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Portal</h1>
            <p className="text-slate-500 text-sm mt-2">Staff Achievement Module — Secure Access</p>
          </div>

          <form onSubmit={handleAdminLogin} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl shadow-slate-200 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Admin Username</label>
              <input
                type="text" required autoFocus
                value={loginForm.username}
                onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Password</label>
              <div className="relative group">
                <input
                  type={showPwd ? 'text' : 'password'} required
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pr-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all shadow-sm"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {loginError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 p-4 rounded-2xl">
                <AlertCircle className="h-5 w-5 flex-shrink-0" /> {loginError}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-60 shadow-lg shadow-primary-200 active:scale-[0.98]">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
              {loading ? 'Authenticating...' : 'Sign In as Admin'}
            </button>
          </form>

          <button onClick={() => navigate('/signin')} className="mt-8 w-full text-sm font-semibold text-slate-400 hover:text-primary-600 text-center transition-colors">
            ← Back to Staff Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold transition-all animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {toast.text}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 transition-opacity"><X className="h-5 w-5" /></button>
        </div>
      )}

      <nav className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary-600 rounded-xl shadow-lg shadow-primary-100">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Admin Portal</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/signin')} className="text-sm font-bold text-slate-500 hover:text-primary-600 px-4 py-2 rounded-xl transition-all">
            Staff Portal
          </button>
          <div className="h-8 w-px bg-slate-100 mx-2"></div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-red-600 transition-all bg-slate-50 hover:bg-red-50 px-5 py-2.5 rounded-2xl border border-transparent hover:border-red-100">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-12 space-y-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <span className="p-2 bg-primary-50 rounded-lg"><UserPlus className="h-5 w-5 text-primary-600" /></span>
            Create Staff Account
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={LABEL}><User className="inline h-3.5 w-3.5 mr-1.5" />Full Name *</label>
              <input required value={registerForm.name} onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))}
                className={INPUT} placeholder="" />
            </div>
            <div className="space-y-2">
              <label className={LABEL}><Hash className="inline h-3.5 w-3.5 mr-1.5" />Username *</label>
              <input required value={registerForm.username} onChange={e => setRegisterForm(f => ({ ...f, username: e.target.value }))}
                className={INPUT} placeholder="" />
            </div>
            <div className="space-y-2">
              <label className={LABEL}><Hash className="inline h-3.5 w-3.5 mr-1.5" />Register / Staff No. (optional)</label>
              <input value={registerForm.register_number} onChange={e => setRegisterForm(f => ({ ...f, register_number: e.target.value }))}
                className={INPUT} placeholder="" />
            </div>
            <div className="space-y-2">
              <label className={LABEL}><GraduationCap className="inline h-3.5 w-3.5 mr-1.5" />Department</label>
              <select value={registerForm.department} onChange={e => setRegisterForm(f => ({ ...f, department: e.target.value }))}
                className={INPUT + " appearance-none cursor-pointer"}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className={LABEL}><Lock className="inline h-3.5 w-3.5 mr-1.5" />Password *</label>
              <div className="relative">
                <input required type={showNewPwd ? 'text' : 'password'} value={registerForm.password}
                  onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                  className={INPUT + " pr-12"} />
                <button type="button" onClick={() => setShowNewPwd(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showNewPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end pt-4">
              <button type="submit" disabled={loading}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-sm flex items-center gap-2.5 transition-all disabled:opacity-60 shadow-lg shadow-primary-100 active:scale-[0.98]">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                {loading ? 'Processing...' : 'Create Staff Account'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <span className="p-2 bg-primary-50 rounded-lg"><Users className="h-5 w-5 text-primary-600" /></span>
              Staff Accounts
              <span className="text-sm font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full ml-2">{staffList.length}</span>
            </h2>
            <button onClick={fetchStaff} className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            {listLoading ? (
              <div className="py-24 flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
                <p className="text-sm font-bold text-slate-400">Fetching staff list...</p>
              </div>
            ) : staffList.length === 0 ? (
              <div className="py-24 text-center">
                <div className="inline-flex p-5 bg-slate-50 rounded-full mb-4">
                  <Users className="h-10 w-10 text-slate-200" />
                </div>
                <p className="font-bold text-slate-400">No staff accounts found</p>
                <p className="text-sm text-slate-400 mt-1">Ready to create your first account above.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-800 text-[11px] uppercase tracking-widest font-extrabold border-b border-slate-200">
                    <th className="px-8 py-5">Staff Member</th>
                    <th className="px-8 py-5">Username</th>
                    <th className="px-8 py-5">Register No.</th>
                    <th className="px-8 py-5">Department</th>
                    <th className="px-8 py-5">Joined</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {staffList.map(staff => (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-sm font-black text-slate-500 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                            {staff.name?.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-slate-900">{staff.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-mono text-sm font-bold text-primary-600">{staff.username}</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-500">{staff.register_number || '—'}</td>
                      <td className="px-8 py-5">
                        {staff.department
                          ? <span className="text-xs font-black px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg">{staff.department}</span>
                          : <span className="text-slate-300 italic text-xs">Unassigned</span>}
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-400">
                        {new Date(staff.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openReset(staff)}
                            className="p-3 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all"
                            title="Reset password"
                          >
                            <KeyRound className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(staff.id, staff.name)}
                            disabled={deletingId === staff.id}
                            className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-50"
                            title="Delete account"
                          >
                            {deletingId === staff.id
                              ? <Loader2 className="h-5 w-5 animate-spin" />
                              : <Trash2 className="h-5 w-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Reset Password Modal ─────────────────────────────── */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary-600" /> Reset Password
              </h3>
              <button onClick={() => setResetTarget(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Setting a new password for <span className="font-bold text-slate-900">{resetTarget.name}</span> ({resetTarget.username})
            </p>
            <div className="relative">
              <input
                type={showResetPwd ? 'text' : 'password'}
                value={resetPwd}
                onChange={e => setResetPwd(e.target.value)}
                placeholder="New password (min. 6 chars)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              <button type="button" onClick={() => setShowResetPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showResetPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {resetMsg && (
              <div className={`flex items-center gap-2 text-sm font-bold px-4 py-3 rounded-xl ${
                resetMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {resetMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {resetMsg.text}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setResetTarget(null)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl text-sm hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button onClick={handleResetPassword} disabled={resetLoading}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg shadow-primary-100">
                {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
