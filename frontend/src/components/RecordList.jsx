import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Filter, Download, FileSpreadsheet, FileText as FilePdf,
  Trash2, ChevronLeft, ChevronRight, Loader2, AlertCircle,
  Award, RefreshCw, X, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { recordService, exportService, certificateService } from '../api';

const CATEGORIES_LIST = ['Curricular', 'Co-Curricular', 'Extra-Curricular'];
const PRIZE_LIST = ['1st Prize', '2nd Prize', '3rd Prize', 'Participation'];

const DEPARTMENTS = [
  'B.Com', 'B.Com CA', 'B.Com PA', 'B.Com (Accounting & Business Analytics)',
  'B.Com (Banking & Insurance)', 'B.Com IT', 'BBA', 'B.Sc CS', 'B.Sc IT', 'BCA',
  'B.Sc AIML', 'B.Sc DSA', 'B.Sc DCFS', 'B.Sc Mathematics', 'B.Sc Chemistry',
  'B.Sc Psychology', 'BA English', 'BA Tamil', 'M.Com',
  'M.Com (International Business)', 'MBA', 'MCA', 'M.Sc Mathematics', 'M.Sc Psychology', 'MSW'
];

const CATEGORIES = ['', 'Curricular', 'Co-Curricular', 'Extra-Curricular'];

const categoryColor = (cat) => {
  const map = {
    Curricular: 'bg-amber-50 text-amber-700',
    'Co-Curricular': 'bg-blue-50 text-blue-700',
    'Extra-Curricular': 'bg-emerald-50 text-emerald-700',
  };
  return map[cat] || 'bg-slate-100 text-slate-600';
};

const RecordList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [records,    setRecords]    = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('');
  const [dept,       setDept]       = useState('');
  const [fromDate,   setFromDate]   = useState('');
  const [toDate,     setToDate]     = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [deletingId, setDeletingId] = useState(null);
  const [exportMsg,  setExportMsg]  = useState('');

  // View certificate state
  const [viewingCert,  setViewingCert]  = useState(null);  // { url, filename }

  const fetchRecords = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: res } = await recordService.getRecords({
        page,
        limit: 10,
        search,
        category,
        department: dept,
        from_date: fromDate,
        to_date:   toDate
      });
      setRecords(res.data || []);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError('Failed to load records. Make sure the backend server is running on port 5000.');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, category, fromDate, toDate]);

  useEffect(() => {
    fetchRecords(pagination.page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  // Refetch records whenever navigating to this list page (after editing)
  useEffect(() => {
    if (location.pathname.includes('list')) {
      setSearch('');
      setCategory('');
      setFromDate('');
      setToDate('');
      setPagination({ page: 1, totalPages: 1, total: 0 });
      // Small delay to ensure state updates before fetch
      setTimeout(() => fetchRecords(1), 50);
    }
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecords(1);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClear = () => {
    setSearch(''); setCategory(''); setFromDate(''); setToDate('');
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchRecords(1), 50);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    setDeletingId(categoryId);
    try {
      await recordService.deleteRecord(categoryId);
      setRecords(prev => prev.filter(r => r.category_id !== categoryId));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete record. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (record) => {
    navigate('/dashboard/add', { state: { record, editMode: true } });
  };

  const handleDownloadCert = async (categoryId, filename) => {
    try {
      const res = await certificateService.download(categoryId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'certificate.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Certificate not available for download.');
    }
  };

  const handleViewCert = async (categoryId, filename) => {
    try {
      const res = await certificateService.view(categoryId);
      // Create blob with explicit PDF type for better browser handling
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setViewingCert({ url, filename });
    } catch {
      alert('Certificate not available for viewing.');
    }
  };

  const closeViewer = () => {
    if (viewingCert?.url) {
      window.URL.revokeObjectURL(viewingCert.url);
    }
    setViewingCert(null);
  };

  const handleExport = async (type) => {
    setExportMsg(`Exporting ${type.toUpperCase()}...`);
    try {
      const params = {
        ...(search   && { search }),
        ...(category && { category }),
        ...(dept     && { department: dept }),
        ...(fromDate && { from_date: fromDate }),
        ...(toDate   && { to_date: toDate }),
      };
      const res = type === 'excel'
        ? await exportService.exportExcel(params)
        : await exportService.exportPdf(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href = url;
      a.download = `records_export.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      setExportMsg('');
    } catch {
      setExportMsg('Export failed. Please try again.');
      setTimeout(() => setExportMsg(''), 3000);
    }
  };

  const hasFilters = search || category || dept || fromDate || toDate;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Student Records</h2>
          <p className="text-slate-500 text-sm mt-1">
            {isLoading ? 'Loading...' : `${pagination.total ?? records.length} record(s) in total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {exportMsg && <span className="text-xs text-slate-500 mr-1">{exportMsg}</span>}
          <button onClick={() => handleExport('excel')}
            className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all font-semibold text-sm">
            <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Excel
          </button>
          <button onClick={() => handleExport('pdf')}
            className="flex items-center px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-all font-semibold text-sm">
            <FilePdf className="h-4 w-4 mr-1.5" /> PDF
          </button>
          <button onClick={() => fetchRecords(pagination.page)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Backend Error</p>
            <p className="text-red-600 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)}><X className="h-4 w-4 opacity-50 hover:opacity-100" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Name, Reg No..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium">
              {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dept</label>
            <select value={dept} onChange={e => setDept(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium">
              <option value="">All Depts</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit"
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-primary-200">
              <Filter className="h-4 w-4" /> Search
            </button>
            {hasFilters && (
              <button type="button" onClick={handleClear}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all" title="Clear filters">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-900 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-200">
                <th className="px-5 py-4">Reg No</th>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Dept</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Activity</th>
                <th className="px-5 py-4">Sub-Activity</th>
                <th className="px-5 py-4">From</th>
                <th className="px-5 py-4">To</th>
                <th className="px-5 py-4">Participation Description</th>
                <th className="px-5 py-4">Awarding Agency</th>
                <th className="px-5 py-4">Prize / Result</th>
                <th className="px-5 py-4">Certificate</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <tr>
                    <td colSpan="10" className="py-24 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-500 mb-3" />
                      <p className="text-sm text-slate-400">Loading records from database...</p>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-24 text-center">
                      <Award className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-semibold">No records found</p>
                      <p className="text-slate-400 text-sm mt-1">
                        {hasFilters ? 'Try adjusting your filters.' : 'No data in the database yet.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <motion.tr
                      key={record.category_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono text-xs font-bold text-primary-600 whitespace-nowrap">
                        {record.register_number}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                            {record.student_name?.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">{record.student_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 bg-slate-100 rounded-md text-slate-600 font-semibold whitespace-nowrap">{record.department}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${categoryColor(record.category)}`}>
                          {record.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-[140px]">
                        <p className="text-sm text-slate-700 font-medium truncate" title={record.event_name}>
                          {record.event_name || <span className="text-slate-400 italic text-xs">—</span>}
                        </p>
                      </td>
                      <td className="px-5 py-4 max-w-[160px]">
                        {record.category === 'Extra-Curricular'
                          ? (
                            <p className="text-sm text-slate-600 truncate" title={record.custom_category}>
                              {record.custom_category || <span className="text-slate-400 italic text-xs">—</span>}
                            </p>
                          )
                          : <span className="text-slate-300 italic text-xs">—</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{record.from_date}</td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{record.to_date}</td>
                      <td className="px-5 py-4 max-w-[180px]">
                        <p className="text-sm text-slate-600 truncate" title={record.participation_description}>
                          {record.participation_description || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4 max-w-[180px]">
                        <p className="text-sm text-slate-600 truncate" title={record.awarding_agency}>{record.awarding_agency || '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                          {record.prize_result || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${
                          record.certificate_filename
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {record.certificate_filename ? 'Available' : 'Not Available'}
                        </span>
                      </td>
                      {/* ALWAYS-VISIBLE ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {record.certificate_filename && (
                            <>
                              <button
                                onClick={() => handleViewCert(record.category_id, record.certificate_filename)}
                                className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                                title="View Certificate"
                              >
                                <FilePdf className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadCert(record.category_id, record.certificate_filename)}
                                className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                                title="Download Certificate"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEdit(record)}
                            className="p-1.5 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all"
                            title="Edit Record"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.category_id)}
                            disabled={deletingId === record.category_id}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50"
                            title="Delete Record"
                          >
                            {deletingId === record.category_id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-900">{pagination.totalPages}</span>
              {pagination.total && <span className="ml-2 text-slate-400">({pagination.total} records)</span>}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg disabled:opacity-30 hover:bg-slate-200 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-sm font-bold text-slate-900 bg-slate-100 rounded-lg">{pagination.page}</span>
              <button disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg disabled:opacity-30 hover:bg-slate-200 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── PDF Viewer Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {viewingCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeViewer}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
                <h3 className="font-bold text-slate-900">Certificate Preview</h3>
                <button
                  onClick={closeViewer}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center">
                <iframe
                  src={viewingCert.url}
                  className="w-full h-full"
                  title="Certificate Preview"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecordList;
