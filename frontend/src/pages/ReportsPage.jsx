import React, { useState } from 'react';
import { FileBarChart, Download, FileSpreadsheet, FileText, Filter, Calendar, Tag, RefreshCw, AlertCircle } from 'lucide-react';
import { exportService } from '../api';

const CATEGORIES = ['', 'Academic', 'Sports', 'Cultural', 'Technical', 'Other'];

const ReportsPage = () => {
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [category,  setCategory]  = useState('');
  const [loading,   setLoading]   = useState({ excel: false, pdf: false });
  const [message,   setMessage]   = useState(null);

  const handleExport = async (type) => {
    setLoading(l => ({ ...l, [type]: true }));
    setMessage(null);
    try {
      const params = {
        ...(fromDate && { from_date: fromDate }),
        ...(toDate   && { to_date: toDate }),
        ...(category && { category }),
      };
      const res = type === 'excel'
        ? await exportService.exportExcel(params)
        : await exportService.exportPdf(params);

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `achievement_report.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: `${type.toUpperCase()} report downloaded successfully!` });
    } catch {
      setMessage({ type: 'error', text: `Failed to export ${type.toUpperCase()} report. Make sure the backend is running.` });
    } finally {
      setLoading(l => ({ ...l, [type]: false }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Reports & Exports</h2>
        <p className="text-slate-500 text-sm mt-1">Generate and download filtered achievement reports.</p>
      </header>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
        <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary-500" /> Filter Criteria
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <Calendar className="inline h-3 w-3 mr-1" />From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <Calendar className="inline h-3 w-3 mr-1" />To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <Tag className="inline h-3 w-3 mr-1" />Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => { setFromDate(''); setToDate(''); setCategory(''); setMessage(null); }}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Clear Filters
          </button>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {message.text}
        </div>
      )}

      {/* Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button
          onClick={() => handleExport('excel')}
          disabled={loading.excel}
          className="flex items-center justify-center gap-3 p-6 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl transition-all shadow-sm group text-left disabled:opacity-60"
        >
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="h-7 w-7" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">Export to Excel</p>
            <p className="text-sm text-slate-500 mt-0.5">Download as .xlsx spreadsheet</p>
          </div>
          {loading.excel
            ? <span className="ml-auto text-xs text-slate-400 animate-pulse">Generating...</span>
            : <Download className="ml-auto h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />}
        </button>

        <button
          onClick={() => handleExport('pdf')}
          disabled={loading.pdf}
          className="flex items-center justify-center gap-3 p-6 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-2xl transition-all shadow-sm group text-left disabled:opacity-60"
        >
          <div className="p-3 bg-red-100 text-red-700 rounded-xl group-hover:scale-110 transition-transform">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">Export to PDF</p>
            <p className="text-sm text-slate-500 mt-0.5">Download as printable PDF report</p>
          </div>
          {loading.pdf
            ? <span className="ml-auto text-xs text-slate-400 animate-pulse">Generating...</span>
            : <Download className="ml-auto h-5 w-5 text-slate-400 group-hover:text-red-600 transition-colors" />}
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;
