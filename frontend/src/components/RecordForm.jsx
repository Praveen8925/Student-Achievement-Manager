import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Trash2, Upload, CheckCircle2,
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

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year'];
const PARTICIPATION_CATEGORIES = ['Curricular', 'Co-Curricular', 'Extra-Curricular'];
const ACTIVITY_OPTIONS_BY_CATEGORY = {
  Curricular: [
    'Regular Academic Classes',
    'Internal Assessment',
    'Model Examination',
    'University Examination',
    'Laboratory Practical',
    'Lab Record Submission',
    'Viva Voce',
    'Assignment Submission',
    'Case Study',
    'Class Test',
    'Mini Project',
    'Major Project',
    'Project Review',
    'Industrial Training (Curriculum Based)',
    'Internship (Curriculum Based)',
    'Seminar (Academic Requirement)',
    'Project Presentation',
    'Other'
  ],
  'Co-Curricular': [
    'Technical Event',
    'Hackathon',
    'Coding Competition',
    'Debugging Contest',
    'Project Expo',
    'Paper Presentation',
    'Poster Presentation',
    'Seminar',
    'Webinar',
    'Workshop',
    'Industrial Visit',
    'Internship',
    'Inplant Training',
    'MOOC (Online Course)',
    'NPTEL Certification',
    'Coursera Certification',
    'Udemy Certification',
    'EdX Certification',
    'Technical Quiz',
    'Case Study Competition',
    'Research Activity',
    'Mini Project',
    'Major Project',
    'Conference Participation',
    'Journal Publication',
    'Patent Filing',
    'Other'
  ],
  'Extra-Curricular': [
    'Sports & Games', 'Music & Singing', 'Dance',
    'Arts & Cultural Activities', 'Creative Arts',
    'Communication & Personality', 'Clubs & Social Activities', 'Other'
  ]
};
const EXTRA_ACTIVITY_OPTIONS_BY_GROUP = {
  'Sports & Games': [
    'Football', 'Cricket', 'Basketball', 'Volleyball', 'Badminton',
    'Table Tennis', 'Athletics', 'Kabaddi', 'Chess', 'Carrom'
  ],
  'Music & Singing': [
    'Singing (Solo / Group)',
    'Instrument Playing (Guitar, Keyboard, Drums, etc.)',
    'College Band',
    'Music Competitions',
    'Karaoke Events'
  ],
  Dance: [
    'Solo Dance', 'Group Dance', 'Classical Dance', 'Western Dance', 'Folk Dance'
  ],
  'Arts & Cultural Activities': [
    'Drama / Skit', 'Mime', 'Fashion Show', 'Anchoring / Hosting'
  ],
  'Creative Arts': [
    'Drawing', 'Painting', 'Sketching', 'Poster Making', 'Craft Work'
  ],
  'Communication & Personality': [
    'Debate', 'Public Speaking', 'Elocution', 'Group Discussion', 'Quiz Competition'
  ],
  'Clubs & Social Activities': [
    'NSS Activity', 'NCC Activity', 'Social Service', 'Club Participation', 'Event Organizing'
  ]
};
const PRIZE_RESULTS = ['1st Prize', '2nd Prize', '3rd Prize', 'Participation'];

const MOCK_STUDENTS = Array.from({ length: 60 }, (_, index) => {
  const number = String(index + 1).padStart(3, '0');
  return {
    id: `mock-${number}`,
    register_number: `23BAM${number}`,
    name: `Student ${number}`
  };
});

const RecordForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const editMode = location.state?.editMode || false;
  const recordData = location.state?.record || null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});

  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState('');

  const handleBack = () => {
    navigate('/dashboard/list');
  };

  const getDefaultValues = () => {
    if (editMode && recordData) {
      return {
        register_number: recordData.register_number || '',
        student_name: recordData.student_name || '',
        department: recordData.department || '',
        participations: [{
          category: recordData.category || 'Curricular',
          activity: recordData.event_name || 'Technical Events',
          custom_activity: recordData.category === 'Extra-Curricular' ? '' : (recordData.custom_category || ''),
          extra_activity: recordData.category === 'Extra-Curricular' ? (recordData.custom_category || '') : '',
          participation_description: recordData.participation_description || '',
          from_date: recordData.from_date || '',
          to_date: recordData.to_date || '',
          awarding_agency: recordData.awarding_agency || '',
          prize_result: recordData.prize_result || 'Participation'
        }]
      };
    }

    return {
      register_number: '',
      student_name: '',
      department: '',
      participations: [{
        category: '',
        activity: 'Technical Events',
        custom_activity: '',
        extra_activity: '',
        participation_description: '',
        from_date: '',
        to_date: '',
        awarding_agency: '',
        prize_result: 'Participation'
      }]
    };
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: getDefaultValues()
  });

  const { fields: participationFields, append: appendParticipation, remove: removeParticipation } = useFieldArray({
    control, name: 'participations'
  });

  useEffect(() => {
    reset(getDefaultValues());
  }, [location.state]);

  useEffect(() => {
    if (editMode) {
      setSelectedDepartment(recordData?.department || '');
      setSelectedYear('');
      return;
    }

    if (!selectedDepartment || !selectedYear) {
      setStudents([]);
      setSelectedStudentId('');
      setStudentSearch('');
      return;
    }

    setStudentLoading(true);
    setStudentError('');
    setStudents(MOCK_STUDENTS);
    setStudentLoading(false);
  }, [selectedDepartment, selectedYear, editMode, recordData]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const query = studentSearch.toLowerCase();
    return students.filter((student) =>
      student.register_number?.toLowerCase().includes(query) ||
      student.name?.toLowerCase().includes(query)
    );
  }, [students, studentSearch]);

  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(studentId);
    const selected = students.find((student) => student.id === studentId);
    if (!selected) return;

    setValue('register_number', selected.register_number || '');
    setValue('student_name', selected.name || '');
    setValue('department', selectedDepartment || '');
  };

  const handleDepartmentChange = (event) => {
    const value = event.target.value;
    setSelectedDepartment(value);
    setSelectedStudentId('');
    setStudentSearch('');
    setValue('department', value);
    setValue('register_number', '');
    setValue('student_name', '');
  };

  const handleYearChange = (event) => {
    const value = event.target.value;
    setSelectedYear(value);
    setSelectedStudentId('');
    setStudentSearch('');
    setValue('register_number', '');
    setValue('student_name', '');
  };

  const handleFileChange = (index, file) => {
    setUploadedFiles((prev) => ({ ...prev, [index]: file }));
  };

  const handleRemoveParticipation = (index) => {
    removeParticipation(index);
    setUploadedFiles((prev) => {
      const next = {};
      Object.keys(prev).forEach((key) => {
        const numericKey = Number(key);
        if (numericKey < index) {
          next[numericKey] = prev[key];
        } else if (numericKey > index) {
          next[numericKey - 1] = prev[key];
        }
      });
      return next;
    });
  };

  const validateParticipationDates = (entries) => {
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      if (!entry.category) continue;
      if (entry.from_date && entry.to_date && entry.from_date > entry.to_date) {
        return `Participation #${i + 1}: From date must be before or equal to To date.`;
      }
    }
    return '';
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      if (!data.register_number || !data.student_name || !data.department) {
        setSubmitStatus({ type: 'error', message: 'Please select a student before saving.' });
        return;
      }

      const seenKeys = new Set();
      for (let i = 0; i < data.participations.length; i += 1) {
        const entry = data.participations[i];
        if (!entry.category) continue;
        const activityName = entry.activity === 'Other'
          ? (entry.custom_activity?.trim() || 'Other')
          : entry.activity;
        const extraKey = entry.category === 'Extra-Curricular' ? (entry.extra_activity || '') : '';
        const key = `${activityName}::${extraKey}::${entry.from_date}::${entry.to_date}`;
        if (seenKeys.has(key)) {
          setSubmitStatus({ type: 'error', message: `Duplicate participation found at #${i + 1}.` });
          return;
        }
        seenKeys.add(key);
      }

      const dateError = validateParticipationDates(data.participations || []);
      if (dateError) {
        setSubmitStatus({ type: 'error', message: dateError });
        return;
      }

      if (!editMode) {
        const missingFileIndex = data.participations.findIndex((entry, idx) => entry.category && !uploadedFiles[idx]);
        if (missingFileIndex !== -1) {
          setSubmitStatus({ type: 'error', message: `Please upload a certificate for participation #${missingFileIndex + 1}.` });
          return;
        }
      }

      if (editMode && recordData) {
        const entry = data.participations[0];
        const activityName = entry.activity === 'Other'
          ? (entry.custom_activity?.trim() || 'Other')
          : entry.activity;

        const updateData = {
          participation_description: entry.participation_description?.trim() || '',
          awarding_agency: entry.awarding_agency.trim(),
          event_name: activityName,
          from_date: entry.from_date,
          to_date: entry.to_date,
          category: entry.category,
          custom_category: entry.activity === 'Other'
            ? (entry.custom_activity?.trim() || '')
            : (entry.category === 'Extra-Curricular' ? (entry.extra_activity || '') : ''),
          prize_result: entry.prize_result || ''
        };

        await recordService.updateRecord(recordData.category_id, updateData);

        const file = uploadedFiles[0];
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

        setTimeout(() => navigate('/dashboard/list'), 1500);
      } else {
        const payload = {
          register_number: data.register_number.trim(),
          student_name: data.student_name.trim(),
          department: data.department,
          participations: data.participations.map((entry) => ({
            category: entry.category,
            activity: entry.activity,
            custom_activity: entry.activity === 'Other'
              ? (entry.custom_activity?.trim() || '')
              : (entry.category === 'Extra-Curricular' ? (entry.extra_activity || '') : ''),
            participation_description: entry.participation_description?.trim() || '',
            from_date: entry.from_date,
            to_date: entry.to_date,
            awarding_agency: entry.awarding_agency.trim(),
            prize_result: entry.prize_result || ''
          }))
        };

        const { data: res } = await recordService.createRecord(payload);
        const createdRecords = res.data || [];

        const uploadPromises = createdRecords.map((record, index) => {
          const file = uploadedFiles[index];
          if (!file) return Promise.resolve({ success: false, skipped: true });

          return certificateService.upload(record.category.id, file)
            .then(() => ({ success: true }))
            .catch((err) => {
              console.error('Certificate upload failed:', err);
              return { success: false, error: err };
            });
        });

        const results = await Promise.all(uploadPromises);
        const successUploads = results.filter((result) => result.success).length;
        const failedUploads = results.length - successUploads;

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

        reset();
        setUploadedFiles({});
        setSelectedStudentId('');
        setStudentSearch('');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || `Failed to ${editMode ? 'update' : 'save'} record. Please try again.`;
      setSubmitStatus({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedParticipations = watch('participations');

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 sm:px-0">
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
              {editMode ? 'Edit Participation Record' : 'Add Participation Record'}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              {editMode
                ? 'Update the details below to modify the student participation record.'
                : 'Select a student and add participation details for achievement tracking.'
              }
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="bg-white p-7 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
              <User className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Student Selection</h3>
            {editMode && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-semibold">EDITING</span>}
          </div>

          {!editMode && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div>
                <label className={LABEL_CLASS}>
                  <GraduationCap className="inline h-3.5 w-3.5 mr-1" />Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  className={`${INPUT_CLASS} ${errors.department ? 'border-red-400' : ''}`}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Year</label>
                <select
                  value={selectedYear}
                  onChange={handleYearChange}
                  className={INPUT_CLASS}
                >
                  <option value="">Select Year</option>
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Student</label>
                <input
                  type="text"
                  placeholder="Search by name or register number"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  className={INPUT_CLASS}
                  disabled={!selectedDepartment || !selectedYear}
                />
                <select
                  value={selectedStudentId}
                  onChange={(event) => handleSelectStudent(event.target.value)}
                  className={`${INPUT_CLASS} mt-2`}
                  disabled={!selectedDepartment || !selectedYear || studentLoading}
                >
                  <option value="">
                    {studentLoading ? 'Loading students...' : 'Select student'}
                  </option>
                  {filteredStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.register_number} - {student.name}
                    </option>
                  ))}
                </select>
                {studentError && <p className="text-xs text-red-500 mt-1">{studentError}</p>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={LABEL_CLASS}>
                <Hash className="inline h-3 w-3 mr-1" />Register No.
              </label>
              <input
                {...register('register_number', { required: 'Required' })}
                className={`${INPUT_CLASS} ${errors.register_number ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : ''} ${editMode || selectedStudentId ? 'opacity-70' : ''}`}
                readOnly
              />
              {errors.register_number && <p className="text-xs text-red-500 mt-1">{errors.register_number.message}</p>}
            </div>
            <div>
              <label className={LABEL_CLASS}>Student Name</label>
              <input
                {...register('student_name', { required: 'Required' })}
                className={`${INPUT_CLASS} ${errors.student_name ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : ''} ${editMode || selectedStudentId ? 'opacity-70' : ''}`}
                readOnly
              />
              {errors.student_name && <p className="text-xs text-red-500 mt-1">{errors.student_name.message}</p>}
            </div>
            <div>
              <label className={LABEL_CLASS}>
                <GraduationCap className="inline h-3.5 w-3.5 mr-1" />Department
              </label>
              <input
                {...register('department', { required: 'Required' })}
                className={`${INPUT_CLASS} ${errors.department ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : ''} opacity-70`}
                readOnly
              />
              {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
            </div>
          </div>
        </section>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Student Participation & Achievement</h3>
            </div>
            {!editMode && (
              <button
                type="button"
                onClick={() => appendParticipation({
                  category: '',
                  activity: 'Technical Events',
                  custom_activity: '',
                  extra_activity: '',
                  participation_description: '',
                  from_date: '',
                  to_date: '',
                  awarding_agency: '',
                  prize_result: 'Participation'
                })}
                className="flex items-center px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 shadow-sm transition-all"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Add Participation
              </button>
            )}
          </div>

          <AnimatePresence>
            {participationFields.map((entry, index) => {
              const watchCategory = watchedParticipations?.[index]?.category;
              const watchActivity = watchedParticipations?.[index]?.activity;
              const showCustomActivity = watchActivity === 'Other';
              const extraOptions = EXTRA_ACTIVITY_OPTIONS_BY_GROUP[watchActivity] || [];
              const chosenFile = uploadedFiles[index];

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden mb-4"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-l-2xl" />

                  <div className="p-7 pl-8">
                    <div className="flex items-center justify-between mb-5">
                      <h4 className="text-sm font-bold text-slate-700">Participation #{index + 1}</h4>
                      {!editMode && participationFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipation(index)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <div>
                        <label className={LABEL_CLASS}>Category</label>
                        <select
                          {...register(`participations.${index}.category`, { required: 'Required' })}
                          className={`${INPUT_CLASS} ${errors.participations?.[index]?.category ? 'border-red-400' : ''}`}
                        >
                          <option value="">Select Category</option>
                          {PARTICIPATION_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      {!!watchCategory && (
                        <>
                          <div>
                            <label className={LABEL_CLASS}>Activity</label>
                            <select
                              {...register(`participations.${index}.activity`, { required: watchCategory ? 'Required' : false })}
                              className={`${INPUT_CLASS} ${errors.participations?.[index]?.activity ? 'border-red-400' : ''}`}
                            >
                              {(ACTIVITY_OPTIONS_BY_CATEGORY[watchCategory] || []).map((activity) => (
                                <option key={activity} value={activity}>{activity}</option>
                              ))}
                            </select>
                          </div>
                          {watchCategory === 'Extra-Curricular' && !!watchActivity && extraOptions.length > 0 && (
                            <div>
                              <label className={LABEL_CLASS}>Sub Activity (Optional)</label>
                              <select
                                {...register(`participations.${index}.extra_activity`)}
                                className={INPUT_CLASS}
                              >
                                <option value="">Select Sub Activity</option>
                                {extraOptions.map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {showCustomActivity && (
                            <div className="md:col-span-2">
                              <label className={LABEL_CLASS}>Custom Activity</label>
                              <input
                                {...register(`participations.${index}.custom_activity`, { required: showCustomActivity ? 'Required' : false })}
                                className={`${INPUT_CLASS} ${errors.participations?.[index]?.custom_activity ? 'border-red-400' : ''}`}
                              />
                              {errors.participations?.[index]?.custom_activity && (
                                <p className="text-xs text-red-500 mt-1">{errors.participations[index].custom_activity.message}</p>
                              )}
                            </div>
                          )}
                          <div>
                            <label className={LABEL_CLASS}>From Date</label>
                            <input
                              type="date"
                              {...register(`participations.${index}.from_date`, { required: watchCategory ? 'Required' : false })}
                              className={`${INPUT_CLASS} ${errors.participations?.[index]?.from_date ? 'border-red-400' : ''}`}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>To Date</label>
                            <input
                              type="date"
                              {...register(`participations.${index}.to_date`, { required: watchCategory ? 'Required' : false })}
                              className={`${INPUT_CLASS} ${errors.participations?.[index]?.to_date ? 'border-red-400' : ''}`}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className={LABEL_CLASS}>Participation & Achievement Description</label>
                            <input
                              {...register(`participations.${index}.participation_description`, { required: watchCategory ? 'Required' : false })}
                              className={`${INPUT_CLASS} ${errors.participations?.[index]?.participation_description ? 'border-red-400' : ''}`}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className={LABEL_CLASS}>Awarding Agency</label>
                            <input
                              {...register(`participations.${index}.awarding_agency`, { required: watchCategory ? 'Required' : false })}
                              className={`${INPUT_CLASS} ${errors.participations?.[index]?.awarding_agency ? 'border-red-400' : ''}`}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Prize / Result</label>
                            <select
                              {...register(`participations.${index}.prize_result`, { required: watchCategory ? 'Required' : false })}
                              className={`${INPUT_CLASS} ${errors.participations?.[index]?.prize_result ? 'border-red-400' : ''}`}
                            >
                              {PRIZE_RESULTS.map((result) => (
                                <option key={result} value={result}>{result}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Certificate (PDF)</label>
                            <label className="relative cursor-pointer block">
                              <input
                                type="file"
                                accept=".pdf"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(event) => handleFileChange(index, event.target.files?.[0])}
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
                            {!editMode && !chosenFile && (
                              <p className="text-xs text-slate-400 mt-1">Certificate is required for each entry.</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

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

        <div className="flex items-center justify-end gap-3 pt-2">
          {!editMode && (
            <button
              type="button"
              onClick={() => {
                reset();
                setUploadedFiles({});
                setSubmitStatus(null);
                setSelectedDepartment('');
                setSelectedYear('');
                setSelectedStudentId('');
                setStudentSearch('');
              }}
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

export default RecordForm;
