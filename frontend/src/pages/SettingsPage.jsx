import React, { useState } from 'react';
import { Settings, User, Bell, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { authService } from '../api';

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
    <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary-500" /> {title}
    </h3>
    {children}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-500 font-medium">{label}</span>
    <span className="text-sm text-slate-900 font-semibold">{value}</span>
  </div>
);

const INPUT = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:bg-white transition-all text-sm shadow-sm";

const SettingsPage = () => {
  const { user } = useAuth();
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdStatus, setPwdStatus] = useState(null); // { type, message }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdStatus(null);

    if (pwdForm.new_password !== pwdForm.confirm_password) {
      setPwdStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (pwdForm.new_password.length < 6) {
      setPwdStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }

    setPwdLoading(true);
    try {
      const { data } = await authService.changePassword({
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      });
      if (data.success) {
        setPwdStatus({ type: 'success', message: 'Password changed successfully!' });
        setPwdForm({ old_password: '', new_password: '', confirm_password: '' });
      }
    } catch (err) {
      setPwdStatus({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to change password. Please try again.'
      });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your account and preferences.</p>
      </header>

      {/* Account Info */}
      <Section icon={User} title="Account Information">
        <InfoRow label="Username"  value={user?.username || user?.staffId || '—'} />
        <InfoRow label="Name"      value={user?.name || 'Staff Member'} />
        <InfoRow label="Role"      value={user?.role || 'Staff'} />
      </Section>

      {/* Change Password */}
      <Section icon={Lock} title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'} required
                value={pwdForm.old_password}
                onChange={e => setPwdForm(f => ({ ...f, old_password: e.target.value }))}
                className={INPUT + ' pr-10'}
                placeholder="Enter current password"
              />
              <button type="button" onClick={() => setShowOld(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'} required
                value={pwdForm.new_password}
                onChange={e => setPwdForm(f => ({ ...f, new_password: e.target.value }))}
                className={INPUT + ' pr-10'}
                placeholder="Min. 6 characters"
              />
              <button type="button" onClick={() => setShowNew(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Confirm New Password</label>
            <input
              type="password" required
              value={pwdForm.confirm_password}
              onChange={e => setPwdForm(f => ({ ...f, confirm_password: e.target.value }))}
              className={INPUT}
              placeholder="Repeat new password"
            />
          </div>

          {pwdStatus && (
            <div className={`flex items-start gap-2 p-3 rounded-xl border text-sm font-medium ${
              pwdStatus.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {pwdStatus.type === 'success'
                ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
              <span className="flex-1">{pwdStatus.message}</span>
              <button type="button" onClick={() => setPwdStatus(null)}><X className="h-3.5 w-3.5 opacity-50 hover:opacity-100" /></button>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={pwdLoading}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-60 shadow-sm shadow-primary-200">
              {pwdLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {pwdLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <p className="text-sm text-slate-400 italic">Notification settings will be available in a future update.</p>
      </Section>
    </div>
  );
};

export default SettingsPage;
