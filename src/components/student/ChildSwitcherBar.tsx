'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, CheckCircle2 } from 'lucide-react';

export const ChildSwitcherBar: React.FC = () => {
  const { role, selectedStudent, associatedStudents, switchStudentSession } = useAuth();

  if (role !== 'STUDENT' || associatedStudents.length <= 1) {
    return null;
  }

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-cre-border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-cre-green-light/40 via-white to-white">
      <div className="flex items-center space-x-2.5">
        <div className="p-2 rounded-xl bg-cre-green text-white shrink-0 shadow-xs">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-cre-navy block">
            Children on this Mobile Number ({associatedStudents.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Click below to switch child details instantly without logging out
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {associatedStudents.map((child) => {
          const isCurrent = child.id === selectedStudent?.id;
          return (
            <button
              key={child.id}
              type="button"
              onClick={() => switchStudentSession(child)}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isCurrent
                  ? 'bg-cre-navy text-white shadow-md shadow-cre-navy/20 scale-[1.02]'
                  : 'bg-white text-slate-700 border border-cre-border hover:border-cre-green hover:text-cre-green shadow-xs'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCurrent ? 'bg-cre-green' : 'bg-slate-300'
                }`}
              />
              <span>{child.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                  isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {child.gender || 'Student'}
              </span>
              {isCurrent && (
                <span className="text-[10px] bg-cre-green text-white font-bold px-1.5 py-0.5 rounded-md flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-0.5" />
                  Viewing
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
