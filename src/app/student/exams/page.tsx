'use client';

import React, { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { Award, BookOpen, CheckCircle, XCircle } from 'lucide-react';

export default function StudentExamsPage() {
  const { selectedStudent, activeCenter } = useAuth();
  const studentId = selectedStudent?.id || '';
  const centerId = selectedStudent?.centerId || '';

  const exams = useMemo(() => {
    if (!centerId) return [];
    return dataService.getExams(centerId);
  }, [centerId]);

  const marks = useMemo(() => {
    if (!studentId || !centerId) return [];
    return dataService.getExamMarks(centerId, undefined, studentId);
  }, [studentId, centerId]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="pb-2 border-b border-cre-border">
          <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
            Examination Results & Scorecards
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Academic evaluations, subject marks, and semester reports for {selectedStudent?.name}
          </p>
        </div>

        {/* Exams List */}
        <div className="space-y-6">
          {exams.map((exam) => {
            const examMarks = marks.filter((m) => m.examId === exam.id);
            let totalObtained = 0;
            let totalMax = 0;
            let allPassed = examMarks.length > 0;

            examMarks.forEach((m) => {
              totalObtained += m.marksObtained;
              totalMax += m.maxMarks;
              if (!m.isPassed) allPassed = false;
            });

            const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden"
              >
                {/* Exam Banner */}
                <div className="p-5 border-b border-cre-border bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cre-navy-light text-cre-navy border border-cre-navy/15">
                        {exam.mode === 'semester' ? exam.semesterName : 'Evaluation'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Exam Date: {exam.date}</span>
                    </div>
                    <h3 className="text-sm font-bold text-cre-navy mt-1">{exam.name}</h3>
                    {exam.portion && (
                      <p className="text-xs text-slate-500 mt-0.5 italic">Portion: {exam.portion}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Total Score</span>
                      <span className="text-base font-black text-cre-navy">
                        {totalObtained} / {totalMax}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Percentage</span>
                      <span className="text-base font-black text-cre-green">
                        {overallPct}%
                      </span>
                    </div>
                    <div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          allPassed && overallPct >= 40
                            ? 'bg-cre-green-light text-cre-green border border-cre-green/30'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        {allPassed && overallPct >= 40 ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subject-wise Marks Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white border-b border-cre-border text-[11px] font-bold text-slate-700 uppercase">
                      <tr>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4 text-center">Maximum Marks</th>
                        <th className="py-3 px-4 text-center">Marks Obtained</th>
                        <th className="py-3 px-4 text-center">Percentage</th>
                        <th className="py-3 px-4 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cre-border">
                      {exam.subjects.map((sub) => {
                        const mark = examMarks.find((m) => m.subjectId === sub.id);
                        const obtained = mark ? mark.marksObtained : 0;
                        const pct = sub.maxMarks > 0 ? Math.round((obtained / sub.maxMarks) * 100) : 0;
                        const isPass = mark ? mark.isPassed : false;

                        return (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 font-bold text-slate-800">{sub.name}</td>
                            <td className="py-3.5 px-4 text-center font-mono text-slate-600">{sub.maxMarks}</td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-cre-navy text-sm">
                              {mark ? obtained : '—'}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-cre-green">
                              {mark ? `${pct}%` : '—'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {mark ? (
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    isPass
                                      ? 'bg-cre-green-light text-cre-green'
                                      : 'bg-red-50 text-red-600'
                                  }`}
                                >
                                  {isPass ? 'Passed' : 'Failed'}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {exams.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-cre-border">
              <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No examination records published yet.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
