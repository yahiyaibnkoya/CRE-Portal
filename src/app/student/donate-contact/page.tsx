'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { normalizePhoneNumber } from '@/lib/constants';
import {
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Phone,
  MapPin,
  Heart,
  ArrowRight,
} from 'lucide-react';

export default function StudentDonateContactPage() {
  const { selectedStudent, activeCenter } = useAuth();
  const centerId = selectedStudent?.centerId || '';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [remarks, setRemarks] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDuplicateWarning(false);

    const cleanPhone = normalizePhoneNumber(phone);
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!centerId) {
      setError('No active centre associated.');
      return;
    }

    const res = dataService.addDonatedContact({
      centerId,
      name,
      phone: cleanPhone,
      place,
      remarks,
      submittedByStudentId: selectedStudent?.id,
    });

    if (res.success) {
      setSubmitted(true);
      if (res.warningDuplicate) {
        setDuplicateWarning(true);
      }
      setName('');
      setPhone('');
      setPlace('');
      setRemarks('');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center pb-2 border-b border-cre-border">
          <div className="w-12 h-12 rounded-2xl bg-cre-green-light text-cre-green flex items-center justify-center mx-auto mb-2">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
            Donate a Contact
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Recommend relatives, friends, or neighbors who may be interested in joining Continuing Religious Education (CRE).
          </p>
        </div>

        {/* Success Alert */}
        {submitted && (
          <div className="p-5 bg-cre-green-light border border-cre-green/30 rounded-2xl text-xs space-y-2">
            <div className="flex items-center space-x-2 text-cre-green font-bold text-sm">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>Jazakallahu Khairan! Contact Recommended.</span>
            </div>
            <p className="text-slate-600">
              The recommendation has been forwarded to the administrators of{' '}
              <span className="font-bold text-cre-navy">{activeCenter?.name}</span>.
            </p>
            {duplicateWarning && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Notice: This phone number was previously registered or recommended for this centre.</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-2 text-xs font-bold text-cre-navy underline"
            >
              Recommend another person
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-cre-border shadow-xs">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Candidate Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nihad Paravakkal"
                className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Candidate Mobile Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9847123456"
                  className="w-full pl-9 pr-3.5 py-2 text-xs border border-cre-border rounded-xl font-mono focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Place / Locality *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="e.g. Manjeri, Malappuram"
                  className="w-full pl-9 pr-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Additional Remarks (Optional)
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Student is in 8th standard, interested in Sunday batch"
                className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20"
              >
                <span>Submit Contact Recommendation</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
