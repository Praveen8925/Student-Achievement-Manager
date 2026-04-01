import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Upload, CheckCircle2, FileText,
  Calendar, User, GraduationCap, Hash, Loader2, AlertCircle, X, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { recordService, certificateService } from '../api';

const INPUT_CLASS = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:bg-white transition-all shadow-sm text-sm";
const LABEL_CLASS = "block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5";

const DEPARTMENTS = [
  'B.Com', 'B.Com CA', 'B.Com PA', 'B.Com (Accounting & Business Analytics)',
  'B.Com (Banking & Insurance)', 'B.Com IT', 'BBA', 'B.Sc CS', 'B.Sc IT', 'BCA',
  'B.Sc AIML', 'B.Sc DSA', 'B.Sc DCFS', 'B.Sc Mathematics', 'B.Sc Chemistry',
  'B.Sc Psychology', 'BA English', 'BA Tamil', 'M.Com',
  'M.Com (International Business)', 'MBA', 'MCA', 'M.Sc Mathematics', 'M.Sc Psychology', 'MSW'
];
const CATEGORIES  = ['Academic', 'Sports', 'Cultural', 'Technical', 'Other'];
const PRIZE_RESULTS = ['1st Prize', '2nd Prize', '3rd Prize', 'Participation', 'Consolation'];

const RecordForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get edit mode and record data from navigation state
  const editMode = location.state?.editMode || false;
  const recordData = location.state?.record || null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // { type: 'success'|'error', message }
  const [uploadedFiles, setUploadedFiles] = useState({}); // key: `${eventIdx}-${catIdx}` -> File

  // Handler to go back to list page
  const handleBack = () => {
    navigate('/dashboard/list');
  };

  // Get default values based on mode - moved inside component to access state
  const getDefaultValues = () => {
    if (editMode && recordData) {
      return {
        register_number: recordData.register_number || '',
        student_name: recordData.student_name || '',
        department: recordData.department || '',
        events: [{
          description: recordData.event_description || '',
          event_name: recordData.event_name || '',
          from_date: recordData.from_date || '',
          to_date: recordData.to_date || '',
          categories: [{
            category: recordData.category || 'Academic',
            prize_result: recordData.prize_result || 'Participation',
            custom_category: recordData.custom_category || ''
          }]
        }]
      };
    }

    return {
      register_number: '',
      student_name: '',
      department: '',
      events: [{
        description: '',
        event_name: '',
        from_date: '',
        to_date: '',
        categories: [{ category: 'Academic', prize_result: 'Participation', custom_category: '' }]
      }]
    };
  };

  const { register, control, handleSubmit, reset, formState: { errors }, watch } = useForm({
    defaultValues: getDefaultValues()
  });

  const { fields: eventFields, append: appendEvent, remove: removeEvent } = useFieldArray({
    control, name: 'events'
  });

  // Reset form when location state changes (entering edit mode)
  useEffect(() => {
    reset(getDefaultValues());
  }, [location.state]);

  const handleFileChange = (eventIdx, catIdx, file) => {
    setUploadedFiles(prev => ({ ...prev, [`${eventIdx}-${catIdx}`]: file }));
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      if (editMode && recordData) {
        // Update existing record
        const cat0 = data.events[0].categories[0];
        const updateData = {
          event_description: data.events[0].description.trim(),
          event_name: data.events[0].event_name?.trim() || '',
          from_date: data.events[0].from_date,
          to_date: data.events[0].to_date,
          category: cat0.category,
          custom_category: cat0.category === 'Other'
            ? (cat0.custom_category?.trim() || '')
            : '',
          prize_result: cat0.prize_result || ''
        };

        await recordService.updateRecord(recordData.category_id, updateData);

        // Upload certificate if file was chosen in edit mode
        const file = uploadedFiles['0-0'];
        if (file) {
          try {
            await certificateService.upload(recordData.category_id, file);
            setSubmitStatus({ type: 'success', message: 'Record and certificate updated successfully!' });
          } catch (certErr) {
            console.error('Certificate upload failed:', certErr);
            setSubmitStatus({ type: 'success', message: 'Record updated successfully! (Certificate upload failed)' });
          }
        } else {
          setSubmitStatus({ type: 'success', message: 'Record updated successfully!' });
        }

        // Navigate back to list page after successful update
        setTimeout(() => navigate('/dashboard/list'), 1500);
      } else {
        // Create new record
        const payload = {
          register_number: data.register_number.trim(),
          student_name:    data.student_name.trim(),
          department:      data.department,
          events: data.events.map((ev) => ({
            description: ev.description.trim(),
            event_name:  ev.event_name?.trim() || '',
            from_date:   ev.from_date,
            to_date:     ev.to_date,
            categories:  ev.categories.map(cat => ({
              category: cat.category,
              custom_category: cat.category === 'Other' ? (cat.custom_category?.trim() || '') : '',
              prize_result: cat.prize_result || ''
            })),
          })),
        };

        const { data: res } = await recordService.createRecord(payload);
        const createdRecords = res.data; // array of { student, event, category }

        // Upload certificates if any files were chosen
        // Records are created in the same order as form events/categories
        let uploadResults = [];
        const uploadPromises = [];
        let recordIndex = 0;

        data.events.forEach((ev, eIdx) => {
          ev.categories.forEach((cat, cIdx) => {
            const file = uploadedFiles[`${eIdx}-${cIdx}`];
            if (file && createdRecords[recordIndex]) {
              const categoryId = createdRecords[recordIndex].category.id;
              uploadPromises.push(
                certificateService.upload(categoryId, file)
                  .then(() => ({ success: true, categoryId }))
                  .catch((err) => {
                    console.error('Certificate upload failed:', err);
                    return { success: false, categoryId, error: err };
                  })
              );
            }
            recordIndex++;
          });
        });

        if (uploadPromises.length) {
          uploadResults = await Promise.allSettled(uploadPromises);
          const successUploads = uploadResults.filter(result => result.status === 'fulfilled' && result.value.success).length;
          const failedUploads = uploadResults.length - successUploads;

          if (failedUploads > 0) {
            setSubmitStatus({
              type: 'success',
              message: `Record saved! ${successUploads} certificate(s) uploaded, ${failedUploads} failed.`
            });
          } else {
            setSubmitStatus({
              type: 'success',
              message: `Record and ${successUploads} certificate(s) saved successfully!`
            });
          }
        } else {
          setSubmitStatus({ type: 'success', message: 'Record saved successfully to the database!' });
        }

        reset();
        setUploadedFiles({});
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || `Failed to ${editMode ? 'update' : 'save'} record. Please try again.`;
      setSubmitStatus({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 sm:px-0">
      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <div className="flex items-center gap-4 mb-4">
          {editMode && (
            <button
              onClick={handleBack}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              title="Back to Records"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {editMode ? 'Edit Achievement Record' : 'Add Achievement Record'}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              {editMode
                ? 'Update the details below to modify the student achievement record.'
                : 'Fill in the details below to save student achievements to the database.'
              }
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Info */}
        <section className="bg-white p-7 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
              <User className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Student Information</h3>
            {editMode && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-semibold">EDITING</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={LABEL_CLASS}>
                <Hash className="inline h-3 w-3 mr-1" />Register No.
              </label>
              <input
                {...register('register_number', { required: 'Required' })}
                className={`${INPUT_CLASS} ${errors.register_number ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : ''} ${editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                readOnly={editMode}
              />
              {errors.register_number && <p className="text-xs text-red-500 mt-1">{errors.register_number.message}</p>}
            </div>
            <div>
              <label className={LABEL_CLASS}>Student Name</label>
              <input
                {...register('student_name', { required: 'Required' })}
                className={`${INPUT_CLASS} ${errors.student_name ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : ''} ${editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                readOnly={editMode}
              />
              {errors.student_name && <p className="text-xs text-red-500 mt-1">{errors.student_name.message}</p>}
            </div>
            <div>
              <label className={LABEL_CLASS}>
                <GraduationCap className="inline h-3.5 w-3.5 mr-1" />Department
              </label>
              <select
                {...register('department', { required: 'Required' })}
                className={`${INPUT_CLASS} ${errors.department ? 'border-red-400' : ''} ${editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={editMode}
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
            </div>
          </div>
        </section>

        {/* Events Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Events & Achievements</h3>
            </div>
            <button
              type="button"
              onClick={() => appendEvent({ description: '', event_name: '', from_date: '', to_date: '', categories: [{ category: 'Academic', prize_result: 'Participation', custom_category: '', event_name: '' }] })}
              className={`flex items-center px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 shadow-sm transition-all ${editMode ? 'hidden' : ''}`}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Event
            </button>
          </div>

          <AnimatePresence>
            {eventFields.map((event, eIdx) => (
              <EventCard
                key={event.id}
                eIdx={eIdx}
                register={register}
                control={control}
                errors={errors}
                watch={watch}
                removeEvent={removeEvent}
                canRemove={eventFields.length > 1 && !editMode}
                uploadedFiles={uploadedFiles}
                onFileChange={handleFileChange}
                editMode={editMode}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Status message */}
        <AnimatePresence>
          {submitStatus && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`flex items-start gap-3 p-4 rounded-xl font-medium text-sm border ${
                submitStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {submitStatus.type === 'success'
                ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
              <span className="flex-1">{submitStatus.message}</span>
              <button type="button" onClick={() => setSubmitStatus(null)}>
                <X className="h-4 w-4 opacity-60 hover:opacity-100" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {!editMode && (
            <button
              type="button"
              onClick={() => { reset(); setUploadedFiles({}); setSubmitStatus(null); }}
              className="px-6 py-2.5 bg-white text-slate-600 font-semibold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-sm"
            >
              Reset
            </button>
          )}
          {editMode && (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2.5 bg-white text-slate-600 font-semibold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-sm"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-200 disabled:opacity-60 flex items-center gap-2 transition-all text-sm"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isSubmitting
              ? (editMode ? 'Updating...' : 'Saving...')
              : (editMode ? 'Update' : 'Save')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

// Sub-component for each event card
const EventCard = ({ eIdx, register, control, errors, watch, removeEvent, canRemove, uploadedFiles, onFileChange, editMode = false }) => {
  const { fields: catFields, append: appendCat, remove: removeCat } = useFieldArray({
    control, name: `events.${eIdx}.categories`
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden mb-4"
    >
      {/* Colored left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-l-2xl" />

      <div className="p-7 pl-8">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-sm font-bold text-slate-700">Event #{eIdx + 1}</h4>
          {canRemove && (
            <button
              type="button"
              onClick={() => removeEvent(eIdx)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Event fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>Event Description</label>
            <textarea
              {...register(`events.${eIdx}.description`, { required: 'Required' })}
              className={`${INPUT_CLASS} h-24 resize-none`}
            />
          </div>
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>Event Name (Optional)</label>
            <input
              {...register(`events.${eIdx}.event_name`)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>From Date</label>
            <input
              type="date"
              {...register(`events.${eIdx}.from_date`, { required: 'Required' })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>To Date</label>
            <input
              type="date"
              {...register(`events.${eIdx}.to_date`, { required: 'Required' })}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className={LABEL_CLASS + ' mb-0'}>Categories & Certificates</label>
            <button
              type="button"
              onClick={() => appendCat({ category: 'Academic', prize_result: 'Participation', custom_category: '' })}
              className={`text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center transition-colors ${editMode ? 'hidden' : ''}`}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Achievement
            </button>
          </div>
          <div className="space-y-3">
            {catFields.map((cat, cIdx) => {
              const fileKey = `${eIdx}-${cIdx}`;
              const chosenFile = uploadedFiles[fileKey];
              const watchCategory = watch(`events.${eIdx}.categories.${cIdx}.category`);
              const isOtherCategory = watchCategory === 'Other';

              return (
                <div key={cat.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  {/* First Row: Category and Prize/Result */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Category Dropdown */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
                      <select
                        {...register(`events.${eIdx}.categories.${cIdx}.category`)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm font-medium"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Prize/Result Dropdown */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Prize/Result</label>
                      <select
                        {...register(`events.${eIdx}.categories.${cIdx}.prize_result`)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm font-medium"
                      >
                        {PRIZE_RESULTS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>



                  {/* Custom Category Input (shows only when "Other" is selected) */}
                  {isOtherCategory && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Custom Category</label>
                      <input
                        {...register(`events.${eIdx}.categories.${cIdx}.custom_category`, {
                          required: isOtherCategory ? 'Please specify the category' : false
                        })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      />
                      {errors.events?.[eIdx]?.categories?.[cIdx]?.custom_category && (
                        <p className="text-xs text-red-500 mt-1">{errors.events[eIdx].categories[cIdx].custom_category.message}</p>
                      )}
                    </div>
                  )}

                  {/* Second Row: File Upload and Delete */}
                  <div className="flex items-end gap-3">
                    {/* File Upload */}
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Certificate (PDF)</label>
                      <label className="relative cursor-pointer block">
                        <input
                          type="file"
                          accept=".pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => onFileChange(eIdx, cIdx, e.target.files[0])}
                        />
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed text-xs font-semibold transition-all ${
                          chosenFile
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                            : 'border-slate-300 bg-white text-slate-500 hover:border-primary-400 hover:text-primary-600'
                        }`}>
                          {chosenFile ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{chosenFile.name}</span></>
                          ) : (
                            <><Upload className="h-3.5 w-3.5 flex-shrink-0" /><span>Upload PDF Certificate</span></>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Delete Button */}
                    {catFields.length > 1 && !editMode && (
                      <button
                        type="button"
                        onClick={() => removeCat(cIdx)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RecordForm;
