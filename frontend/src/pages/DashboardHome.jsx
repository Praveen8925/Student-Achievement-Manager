import React, { useState, useEffect } from 'react';
import { Users, Award, Calendar, TrendingUp, Plus, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { recordService } from '../api';

const categoryColor = (cat) => {
  const map = {
    Technical: 'bg-blue-50 text-blue-700',
    Sports:    'bg-emerald-50 text-emerald-700',
    Cultural:  'bg-purple-50 text-purple-700',
    Academic:  'bg-amber-50 text-amber-700',
    Other:     'bg-slate-100 text-slate-600',
  };
  return map[cat] || map.Other;
};

const StatCard = ({ icon: Icon, label, value, trend, color, loading }) => (
  <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-start justify-between mb-3 sm:mb-4">
      <div className={`p-2.5 sm:p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center">
          <TrendingUp className="h-3 w-3 mr-1" />{trend}
        </span>
      )}
    </div>
    {loading ? (
      <div className="h-7 sm:h-8 w-16 sm:w-20 bg-slate-100 rounded animate-pulse mt-1"></div>
    ) : (
      <>
        <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1">{label}</p>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{value}</h3>
      </>
    )}
  </div>
);

const DashboardHome = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ students: 0, achievements: 0, events: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res } = await recordService.getRecords({ page: 1, limit: 6 });
        const allRecords = res.data || [];
        setRecords(allRecords);

        // Compute stats from the flat records
        const uniqueStudents = new Set(allRecords.map(r => r.register_number)).size;
        const uniqueEvents   = new Set(allRecords.map(r => r.event_id)).size;
        setStats({
          students:     uniqueStudents,
          achievements: res.pagination?.total || allRecords.length,
          events:       uniqueEvents,
        });
      } catch (err) {
        const errorMsg = err?.response?.data?.message || err?.message || '';
        if (errorMsg.includes('table') || errorMsg.includes('relation') || errorMsg.includes('does not exist') || errorMsg.includes('schema cache')) {
          setError('Database tables not found. Please set up the database schema in Supabase. See COMPLETE_SETUP_GUIDE.md for instructions.');
        } else if (err.code === 'ERR_NETWORK' || !err.response) {
          setError('Could not connect to backend. Make sure the server is running on port 5000.');
        } else {
          setError(errorMsg || 'Failed to load records. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { icon: Award,    label: 'Total Records',  value: stats.achievements, color: 'bg-primary-50 text-primary-600' },
    { icon: Users,    label: 'Unique Students', value: stats.students,    color: 'bg-emerald-50 text-emerald-600' },
    { icon: Calendar, label: 'Events Logged',   value: stats.events,      color: 'bg-purple-50 text-purple-600' },
    { icon: TrendingUp,label: 'Departments',    value: new Set(records.map(r => r.department)).size || '—', color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 px-4 sm:px-0">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Welcome back! Here's what's happening in your module.</p>
        </div>
        <Link
          to="/dashboard/add"
          className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-primary-200 group text-sm"
        >
          <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
          Add New Record
        </Link>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex flex-col sm:flex-row items-start gap-3 p-4 sm:p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-base">Setup Required</p>
            <p className="text-red-600 mt-1 text-sm">{error}</p>
            {error.includes('Database tables') && (
              <div className="mt-3 p-3 bg-white/60 rounded-lg border border-red-200">
                <p className="font-semibold text-sm mb-2">📋 Quick Setup (2 minutes):</p>
                <ol className="text-xs space-y-1.5 list-decimal list-inside text-red-700">
                  <li>Go to: <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-red-800">Supabase Dashboard</a></li>
                  <li>Click: <span className="font-semibold">SQL Editor</span> → <span className="font-semibold">+ New Query</span></li>
                  <li>Copy content from: <code className="bg-white px-1 py-0.5 rounded">backend/database-schema.sql</code></li>
                  <li>Paste and click <span className="font-semibold">RUN</span></li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <StatCard {...card} loading={loading} />
          </motion.div>
        ))}
      </div>

      {/* Recent Records Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">Recent Records</h4>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Latest student achievement entries</p>
          </div>
          <Link
            to="/dashboard/list"
            className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center transition-colors"
          >
            View all <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
          </Link>
        </div>

        <div>
          {loading ? (
            <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-3" />
              <p className="text-sm">Loading records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 sm:py-20 text-center text-slate-400 px-4">
              <Award className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-500">No records yet</p>
              <p className="text-sm mt-1">Add your first student achievement record.</p>
              <Link to="/dashboard/add" className="mt-4 inline-flex items-center text-sm text-primary-600 font-semibold hover:underline">
                <Plus className="h-4 w-4 mr-1" /> Add Record
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                      <th className="px-6 py-3">Reg No</th>
                      <th className="px-6 py-3">Student</th>
                      <th className="px-6 py-3">Dept</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Activity</th>
                      <th className="px-6 py-3">Sub-Activity</th>
                      <th className="px-6 py-3">From</th>
                      <th className="px-6 py-3">To</th>
                      <th className="px-6 py-3">Participation Description</th>
                      <th className="px-6 py-3">Awarding Agency</th>
                      <th className="px-6 py-3">Prize / Result</th>
                      <th className="px-6 py-3">Certificate</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.slice(0, 10).map((record) => (
                      <tr key={record.category_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-primary-600">{record.register_number}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                              {record.student_name?.charAt(0)}
                            </div>
                            <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">{record.student_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2 py-1 bg-slate-100 rounded-md text-slate-600 font-semibold">{record.department}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${categoryColor(record.category)}`}>
                            {record.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-[180px]">
                          <p className="text-sm text-slate-700 truncate">{record.event_name || '—'}</p>
                        </td>
                        <td className="px-6 py-4 max-w-[160px]">
                          {record.category === 'Extra-Curricular'
                            ? <p className="text-sm text-slate-600 truncate">{record.custom_category || '—'}</p>
                            : <span className="text-slate-300 italic text-xs">—</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{record.from_date}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{record.to_date}</td>
                        <td className="px-6 py-4 max-w-[180px]">
                          <p className="text-sm text-slate-700 truncate">{record.participation_description || '—'}</p>
                        </td>
                        <td className="px-6 py-4 max-w-[180px]">
                          <p className="text-sm text-slate-600 truncate">{record.awarding_agency || '—'}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">{record.prize_result || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${
                            record.certificate_filename
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {record.certificate_filename ? 'Available' : 'Not Available'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to="/dashboard/list"
                            className="text-slate-400 hover:text-primary-600 transition-colors"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {records.slice(0, 6).map((record) => (
                  <div key={record.category_id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                          {record.student_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{record.student_name}</p>
                          <p className="text-xs font-mono text-primary-600 font-semibold">{record.register_number}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-100 rounded-md text-slate-600 font-semibold">{record.department}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2.5 line-clamp-2">{record.participation_description || '—'}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${categoryColor(record.category)}`}>
                          {record.category}
                        </span>
                        <span className="text-xs text-slate-500">{record.from_date}</span>
                      </div>
                      <Link
                        to="/dashboard/list"
                        className="text-slate-400 hover:text-primary-600 transition-colors"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
