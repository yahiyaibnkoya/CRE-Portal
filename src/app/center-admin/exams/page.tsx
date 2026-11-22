'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { Exam, ExamMark, ExamSubject, ExamMode, Student } from '@/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  Save,
  X,
  FileCheck,
} from 'lucide-react';

export default function CenterAdminExamsPage() {
  const { activeCenter, refreshData } = useAuth();
  const centerId = activeCenter?.id || '';

  const [activeTab, setActiveTab] = useState<'exams' | 'marks'>('exams');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [deleteExamId, setDeleteExamId] = useState<string | null>(null);

  // Add/Edit Exam Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<ExamMode>(activeCenter?.examMode || 'semester');
  const [semesterName, setSemesterName] = useState('Semester 1');
  const [portion, setPortion] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; maxMarks: number; passMarks?: number }>>([
    { id: 'sub-1', name: 'Quran Recitation & Tajweed', maxMarks: 50, passMarks: 20 },
    { id: 'sub-2', name: 'Aqeedah & Fiqh', maxMarks: 50, passMarks: 20 },
  ]);

  // Marks Entry State
  const [marksMap, setMarksMap] = useState<Record<string, Record<string, number>>>({}); // [studentId][subjectId] -> score
  const [saveMarksSuccess, setSaveMarksSuccess] = useState(false);

  const activeStudents = useMemo(() => {
    return dataService.getStudents(centerId).filter((s) => s.status === 'Active');
  }, [centerId]);

  const exams = useMemo(() => {
    return dataService.getExams(centerId);
  }, [centerId]);

  // Set default selected exam
  useEffect(() => {
    if (exams.length > 0 && !selectedExamId) {
      setSelectedExamId(exams[0].id);
    }
  }, [exams, selectedExamId]);

  const currentExam = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId) || null;
  }, [exams, selectedExamId]);

  // Load marks for the currently selected exam
  useEffect(() => {
    if (!currentExam) return;
    const existingMarks = dataService.getExamMarks(centerId, currentExam.id);
    const map: Record<string, Record<string, number>> = {};

    activeStudents.forEach((st) => {
      map[st.id] = {};
      currentExam.subjects.forEach((sub) => {
        const found = existingMarks.find((m) => m.studentId === st.id && m.subjectId === sub.id);
        map[st.id][sub.id] = found ? found.marksObtained : 0;
      });
    });

    setMarksMap(map);
  }, [currentExam, centerId, activeStudents]);

  const handleOpenAddExam = () => {
    setEditingExam(null);
    setName('');
    setMode(activeCenter?.examMode || 'semester');
    setSemesterName('Semester 1');
    setPortion('');
    setDate(new Date().toISOString().split('T')[0]);
    setSubjects([
      { id: 'sub-' + Date.now() + '-1', name: 'Quran Recitation & Tajweed', maxMarks: 50, passMarks: 20 },
      { id: 'sub-' + Date.now() + '-2', name: 'Aqeedah & Fiqh', maxMarks: 50, passMarks: 20 },
    ]);
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setName(exam.name);
    setMode(exam.mode);
    setSemesterName(exam.semesterName || 'Semester 1');
    setPortion(exam.portion || '');
    setDate(exam.date);
    setSubjects(exam.subjects);
    setIsExamModalOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerId) return;

    const saved = dataService.saveExam({
      id: editingExam?.id,
      centerId,
      name,
      mode,
      semesterName: mode === 'semester' ? semesterName : undefined,
      portion: mode === 'non-semester' ? portion : undefined,
      date,
      subjects,
    });

    setIsExamModalOpen(false);
    setSelectedExamId(saved.id);
    refreshData();
  };

  const handleDeleteExam = (examId: string) => {
    setDeleteExamId(examId);
  };

  const handleConfirmDeleteExam = () => {
    if (!deleteExamId) return;
    dataService.deleteExam(deleteExamId);
    setDeleteExamId(null);
    refreshData();
  };

  const handleAddSubjectField = () => {
    setSubjects([
      ...subjects,
      { id: 'sub-' + Date.now(), name: '', maxMarks: 50, passMarks: 20 },
    ]);
  };

  const handleRemoveSubjectField = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleUpdateMark = (studentId: string, subjectId: string, val: number) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: val,
      },
    }));
  };

  const handleSaveAllMarks = () => {
    if (!currentExam) return;
    const marksList: Array<{
      subjectId: string;
      studentId: string;
      marksObtained: number;
      maxMarks: number;
      isPassed: boolean;
    }> = [];

    activeStudents.forEach((st) => {
      currentExam.subjects.forEach((sub) => {
        const score = marksMap[st.id]?.[sub.id] || 0;
        const passMin = sub.passMarks ?? sub.maxMarks * 0.4;
        marksList.push({
          subjectId: sub.id,
          studentId: st.id,
          marksObtained: score,
          maxMarks: sub.maxMarks,
          isPassed: score >= passMin,
        });
      });
    });

    dataService.saveExamMarks(centerId, currentExam.id, marksList, 'Centre Admin');
    setSaveMarksSuccess(true);
    setTimeout(() => setSaveMarksSuccess(false), 3000);
    refreshData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
              Examination & Marks Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Semester-wise and portion-based exam schedules, subjects, and student scorecards
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('exams')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'exams'
                  ? 'bg-cre-navy text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-cre-border hover:bg-slate-50'
              }`}
            >
              Exams Directory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('marks')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'marks'
                  ? 'bg-cre-navy text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-cre-border hover:bg-slate-50'
              }`}
            >
              Marks Entry
            </button>
          </div>
        </div>

        {saveMarksSuccess && (
          <div className="p-4 bg-cre-green-light border border-cre-green/30 rounded-2xl flex items-center space-x-2 text-xs text-cre-green font-bold shadow-xs">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Examination marks saved and calculated successfully!</span>
          </div>
        )}

        {activeTab === 'exams' ? (
          <>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleOpenAddExam}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create New Examination
              </button>
            </div>

            {/* Exams Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams.map((exam, idx) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl border border-cre-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                          #{idx + 1}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cre-navy-light text-cre-navy border border-cre-navy/15">
                          {exam.mode === 'semester' ? exam.semesterName : 'Non-Semester / Portions'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{exam.date}</span>
                    </div>

                    <h3 className="text-sm font-bold text-cre-navy mb-1">{exam.name}</h3>
                    {exam.portion && (
                      <p className="text-xs text-slate-500 mb-3 italic">
                        Portion: {exam.portion}
                      </p>
                    )}

                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Subjects ({exam.subjects.length}):
                      </span>
                      {exam.subjects.map((s) => (
                        <div key={s.id} className="flex justify-between text-[11px] text-slate-700">
                          <span>{s.name}</span>
                          <span className="font-mono font-bold text-slate-500">Max: {s.maxMarks}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-cre-border flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExamId(exam.id);
                        setActiveTab('marks');
                      }}
                      className="text-xs font-bold text-cre-green hover:underline inline-flex items-center"
                    >
                      <Award className="w-3.5 h-3.5 mr-1" />
                      Enter Marks
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditExam(exam)}
                        className="p-1.5 text-slate-500 hover:text-cre-navy rounded-md hover:bg-slate-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExam(exam.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {exams.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-cre-border">
                  <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No examinations added yet. Click &quot;Create New Examination&quot; to begin.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* MARKS ENTRY TAB */
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-700">Select Exam:</span>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold text-cre-navy border border-cre-border rounded-xl focus:outline-hidden"
                >
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.mode === 'semester' ? e.semesterName : 'Evaluation'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSaveAllMarks}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20 inline-flex items-center"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save All Marks
              </button>
            </div>

            {currentExam ? (
              <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">#</th>
                        <th className="py-3.5 px-4">Adm No</th>
                        <th className="py-3.5 px-4">Student Name</th>
                        {currentExam.subjects.map((sub) => (
                          <th key={sub.id} className="py-3.5 px-4 text-center">
                            {sub.name}
                            <span className="block text-[9px] text-slate-400 font-normal">Max: {sub.maxMarks}</span>
                          </th>
                        ))}
                        <th className="py-3.5 px-4 text-center">Total Marks</th>
                        <th className="py-3.5 px-4 text-center">Percentage</th>
                        <th className="py-3.5 px-4 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cre-border">
                      {activeStudents.map((st, idx) => {
                        let totalObtained = 0;
                        let totalMax = 0;
                        let allPassed = true;

                        currentExam.subjects.forEach((sub) => {
                          const val = Number(marksMap[st.id]?.[sub.id] || 0);
                          totalObtained += val;
                          totalMax += sub.maxMarks;
                          const passMin = sub.passMarks ?? sub.maxMarks * 0.4;
                          if (val < passMin) allPassed = false;
                        });

                        const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

                        return (
                          <tr key={st.id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-cre-navy">
                              {st.admissionNumber}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">{st.name}</td>
                            {currentExam.subjects.map((sub) => (
                              <td key={sub.id} className="py-3.5 px-4 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={sub.maxMarks}
                                  value={marksMap[st.id]?.[sub.id] ?? 0}
                                  onChange={(e) =>
                                    handleUpdateMark(st.id, sub.id, Number(e.target.value))
                                  }
                                  className="w-16 px-2 py-1 text-center font-mono font-bold text-xs border border-cre-border rounded-lg focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                                />
                              </td>
                            ))}
                            <td className="py-3.5 px-4 text-center font-bold text-cre-navy">
                              {totalObtained} / {totalMax}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-cre-green">
                              {pct}%
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  allPassed && pct >= 40
                                    ? 'bg-cre-green-light text-cre-green'
                                    : 'bg-red-50 text-red-600'
                                }`}
                              >
                                {allPassed && pct >= 40 ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-cre-border text-xs text-slate-400">
                Please select or create an examination first.
              </div>
            )}
          </div>
        )}

        {/* CREATE / EDIT EXAM MODAL */}
        {isExamModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs max-h-screen overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-cre-border my-8">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <h3 className="text-sm font-bold text-cre-navy">
                  {editingExam ? 'Edit Examination' : 'Create Examination'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExam} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mid-Term Evaluation, Final Exam"
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mode
                    </label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as ExamMode)}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    >
                      <option value="semester">Semester-Wise</option>
                      <option value="non-semester">Non-Semester / Portions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Exam Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-medium"
                    />
                  </div>
                </div>

                {mode === 'semester' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Semester Name
                    </label>
                    <input
                      type="text"
                      value={semesterName}
                      onChange={(e) => setSemesterName(e.target.value)}
                      placeholder="e.g. Semester 1, Semester 2"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Portion Covered
                    </label>
                    <input
                      type="text"
                      value={portion}
                      onChange={(e) => setPortion(e.target.value)}
                      placeholder="e.g. Surah Al-Baqarah 1-50, Fiqh Lessons 1-4"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Semester display: Not Required</span>
                  </div>
                )}

                {/* Subjects */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Subjects & Maximum Marks
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSubjectField}
                      className="text-xs font-bold text-cre-green hover:underline"
                    >
                      + Add Subject
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {subjects.map((sub, i) => (
                      <div key={sub.id} className="flex items-center space-x-2">
                        <input
                          type="text"
                          required
                          value={sub.name}
                          onChange={(e) => {
                            const updated = [...subjects];
                            updated[i].name = e.target.value;
                            setSubjects(updated);
                          }}
                          placeholder="Subject Name"
                          className="flex-1 px-3 py-1.5 text-xs border border-cre-border rounded-lg"
                        />
                        <input
                          type="number"
                          required
                          min={1}
                          value={sub.maxMarks}
                          onChange={(e) => {
                            const updated = [...subjects];
                            updated[i].maxMarks = Number(e.target.value);
                            setSubjects(updated);
                          }}
                          placeholder="Max"
                          className="w-20 px-2 py-1.5 text-xs text-center border border-cre-border rounded-lg"
                          title="Maximum Marks"
                        />
                        {subjects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubjectField(i)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-cre-border flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsExamModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs"
                  >
                    Save Examination
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Delete Exam Modal */}
        <ConfirmModal
          isOpen={!!deleteExamId}
          title="Delete Examination"
          message="Are you sure you want to delete this examination record and its recorded marks? This action cannot be undone."
          confirmText="Delete Examination"
          isDanger={true}
          onConfirm={handleConfirmDeleteExam}
          onCancel={() => setDeleteExamId(null)}
        />
      </div>
    </AppShell>
  );
}
