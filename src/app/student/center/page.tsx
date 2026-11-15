'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { Building, MapPin, Calendar, Clock, User, Phone, Info } from 'lucide-react';

export default function StudentCenterInfoPage() {
  const { activeCenter } = useAuth();

  if (!activeCenter) {
    return (
      <AppShell>
        <div className="p-8 text-center bg-white rounded-2xl border border-cre-border">
          <p className="text-xs text-slate-500">No active centre information found.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="pb-2 border-b border-cre-border">
          <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
            CRE Centre Information
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional overview, schedule, and public helpline contacts
          </p>
        </div>

        {/* Centre Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-cre-border shadow-xs space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cre-green">
                Affiliated CRE Centre
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-cre-navy mt-1">
                {activeCenter.name}
              </h2>
              <div className="flex items-center text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <span>
                  {activeCenter.place}, {activeCenter.state === 'Kerala' ? activeCenter.district : activeCenter.otherStateName}
                </span>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cre-green-light text-cre-green border border-cre-green/30">
              {activeCenter.status}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Organized By</span>
              <span className="text-sm font-bold text-cre-navy mt-0.5 block">
                {activeCenter.zoneOrUnit}: {activeCenter.zoneName}
                {activeCenter.unitName ? ` (${activeCenter.unitName})` : ''}
              </span>
              <span className="text-[11px] text-slate-500">Wisdom Islamic Students Organization</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Weekly Class Schedule</span>
              <span className="text-sm font-bold text-cre-navy mt-0.5 block">
                Every {activeCenter.regularDay}
              </span>
              <span className="text-[11px] text-slate-500">
                {activeCenter.startTime} to {activeCenter.endTime} (Asia/Kolkata Time)
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Faculty Usthad</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {activeCenter.facultyName || 'Appointed Faculty'}
              </span>
              <span className="text-[11px] text-slate-500">Religious Educator</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Monthly Programme Fee</span>
              <span className="text-sm font-bold text-cre-green mt-0.5 block">
                ₹{activeCenter.defaultFee} / Month
              </span>
              <span className="text-[11px] text-slate-500">Voluntary non-profit religious education</span>
            </div>
          </div>

          {/* Public Contact Helplines */}
          <div className="pt-4 border-t border-cre-border">
            <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider mb-3">
              Official Helpline & Support Contacts
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeCenter.contactNumbers.map((num, i) => (
                <a
                  key={i}
                  href={`tel:${num}`}
                  className="p-3 bg-cre-green-light/40 hover:bg-cre-green-light border border-cre-green/20 rounded-xl flex items-center space-x-3 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-cre-green text-white flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Contact #{i + 1}</span>
                    <span className="text-xs font-mono font-bold text-cre-navy group-hover:underline">
                      {num}
                    </span>
                  </div>
                </a>
              ))}

              {activeCenter.contactNumbers.length === 0 && (
                <p className="text-xs text-slate-400 italic">No contact numbers registered.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
