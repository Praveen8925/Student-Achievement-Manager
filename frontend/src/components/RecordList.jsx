import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Download, FileSpreadsheet, FileText as FilePdf,
  Trash2, ChevronLeft, ChevronRight, Loader2, AlertCircle,
  Award, RefreshCw, X, Pencil, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { recordService, exportService, certificateService } from '../api';

const CATEGORIES_LIST = ['Academic', 'Sports', 'Cultural', 'Technical', 'Other'];
const PRIZE_LIST = ['1st Prize', '2nd Prize', '3rd Prize', 'Participation', 'Consolation'];

const DEPARTMENTS = [
  'B.Com', 'B.Com CA', 'B.Com PA', 'B.Com (Accounting & Business Analytics)',
  'B.Com (Banking & Insurance)', 'B.Com IT', 'BBA', 'B.Sc CS', 'B.Sc IT', 'BCA',
  'B.Sc AIML', 'B.Sc DSA', 'B.Sc DCFS', 'B.Sc Mathematics', 'B.Sc Chemistry',
  'B.Sc Psychology', 'BA English', 'BA Tamil', 'M.Com',
  'M.Com (International Business)', 'MBA', 'MCA', 'M.Sc Mathematics', 'M.Sc Psychology', 'MSW'
];

const CATEGORIES = ['', 'Academic', 'Sports', 'Cultural', 'Technical', 'Other'];

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

const RecordList = () => {
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

  // Edit state
  const [editRecord,   setEditRecord]   = useState(null);  // the record being edited
  const [editForm,     setEditForm]     = useState({});
  const [isSaving,     setIsSaving]     = useState(false);
  const [saveMsg,      setSaveMsg]      = useState(null);  // { type, text }

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
      // Close edit drawer if deleting the open record
      if (editRecord?.category_id === categoryId) setEditRecord(null);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete record. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (record) => {
    setEditRecord(record);
    setEditForm({
      event_name: record.event_name || '',
      event_description: record.event_description || '',
      from_date: record.from_date || '',
      to_date: record.to_date || '',
      category: record.category || 'Academic',
      prize_result: record.prize_result || 'Participation',
      custom_category: record.custom_category || '',
    });
    setSaveMsg(null);
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      await recordService.updateRecord(editRecord.category_id, {
        event_description: editForm.event_description,
        event_name: editForm.event_name,
        from_date: editForm.from_date,
        to_date: editForm.to_date,
        category: editForm.category,
        prize_result: editForm.prize_result,
        custom_category: editForm.category === 'Other' ? editForm.custom_category : '',
      });
      setSaveMsg({ type: 'success', text: 'Record updated successfully!' });
      // Update the record in the list
      setRecords(prev => prev.map(r =>
        r.category_id === editRecord.category_id
          ? { ...r, ...editForm }
          : r
      ));
      setTimeout(() => setEditRecord(null), 1200);
    } catch (err) {
      setSaveMsg({ type: 'error', text: err?.response?.data?.message || 'Update failed.' });
    } finally { setIsSaving(false); }
  };

  const handleDownloadCert = async (categoryId, filename) => {
    try {
      const res = await certificateService.download(categoryId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'certificate.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Certificate not available for download.');
    }
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
          <div className="md:col-span-4 relative">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Name, Reg No, Event..."
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
                <th className="px-5 py-4">Event Name</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">From</th>
                <th className="px-5 py-4">To</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="py-24 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-500 mb-3" />
                      <p className="text-sm text-slate-400">Loading records from database...</p>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-24 text-center">
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
                      <td className="px-5 py-4 max-w-[140px]">
                        <p className="text-sm text-slate-700 font-medium truncate" title={record.event_name}>
                          {record.event_name || <span className="text-slate-400 italic text-xs">—</span>}
                        </p>
                      </td>
                      <td className="px-5 py-4 max-w-[180px]">
                        <p className="text-sm text-slate-600 truncate" title={record.event_description}>{record.event_description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${categoryColor(record.category)}`}>
                          {record.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{record.from_date}</td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{record.to_date}</td>
                      {/* ALWAYS-VISIBLE ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {record.certificate_filename && (
                            <button
                              onClick={() => handleDownloadCert(record.category_id, record.certificate_filename)}
                              className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                              title="Download Certificate"
                            >
                              <Download className="h-4 w-4" />
                            </button>
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

      {/* ── Edit Record Drawer ────────────────────────────────────── */}
      <AnimatePresence>
        {editRecord && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end"
            onClick={(e) => { if (e.target === e.currentTarget) setEditRecord(null); }}
          >
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto flex flex-col"
            >
              {/* Drawer header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Pencil className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Edit Record</h3>
                    <p className="text-xs text-slate-400 font-semibold">{editRecord.student_name} · {editRecord.register_number}</p>
                  </div>
                </div>
                <button onClick={() => setEditRecord(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 px-6 py-6 space-y-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Event Name</label>
                  <input value={editForm.event_name}
                    onChange={e => setEditForm(f => ({ ...f, event_name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="e.g. National Hackathon 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea rows={3} value={editForm.event_description}
                    onChange={e => setEditForm(f => ({ ...f, event_description: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">From Date</label>
                    <input type="date" value={editForm.from_date}
                      onChange={e => setEditForm(f => ({ ...f, from_date: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">To Date</label>
                    <input type="date" value={editForm.to_date}
                      onChange={e => setEditForm(f => ({ ...f, to_date: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Category</label>
                  <select value={editForm.category}
                    onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
                    {CATEGORIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {editForm.category === 'Other' && (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Custom Category</label>
                    <input value={editForm.custom_category}
                      onChange={e => setEditForm(f => ({ ...f, custom_category: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      placeholder="Specify category"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Prize / Result</label>
                  <select value={editForm.prize_result}
                    onChange={e => setEditForm(f => ({ ...f, prize_result: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
                    {PRIZE_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {saveMsg && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold ${
                    saveMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {saveMsg.type === 'success' ? <Award className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {saveMsg.text}
                  </div>
                )}
              </div>

              {/* Drawer footer */}
              <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex gap-3 sticky bottom-0">
                <button onClick={() => setEditRecord(null)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl text-sm hover:bg-white transition-all">
                  Cancel
                </button>
                <button onClick={handleUpdate} disabled={isSaving}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg shadow-primary-100">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? 'Saving...' : 'Update Record'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecordList;
