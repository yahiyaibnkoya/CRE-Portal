'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { dataService } from '@/lib/dataService';
import { KERALA_DISTRICTS, DAYS_OF_WEEK } from '@/lib/constants';
import {
  ShieldCheck,
  Building2,
  GraduationCap,
  ArrowRight,
  CheckCircle,
  Plus,
  X,
  Phone,
  Lock,
  MapPin,
  Building,
} from 'lucide-react';
import { PinInput } from '@/components/ui/PinInput';

export default function HomePage() {
  // Modal for "Add CRE Centre"
  const [isAddCenterModalOpen, setIsAddCenterModalOpen] = useState(false);
  const [centerName, setCenterName] = useState('');
  const [place, setPlace] = useState('');
  const [landmark, setLandmark] = useState('');
  const [state, setState] = useState<'Kerala' | 'Other State'>('Kerala');
  const [district, setDistrict] = useState(KERALA_DISTRICTS[10] || 'Malappuram West');
  const [zoneOrUnit, setZoneOrUnit] = useState<'Zone' | 'Unit'>('Zone');
  const [zoneName, setZoneName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [regularDay, setRegularDay] = useState('Sunday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPlace, setAdminPlace] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handlePhoneChange = (val: string) => {
    setAdminPhone(val);
    const clean = val.replace(/\D/g, '');
    if (clean.length >= 4 && !adminPassword) {
      setAdminPassword(clean.slice(-4));
    }
  };

  const handleRegisterCenterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = adminPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number for the Centre Admin.');
      return;
    }
    const finalPin = adminPassword || cleanPhone.slice(-4);
    if (!finalPin || finalPin.length !== 4) {
      setErrorMsg('Login PIN must be exactly a 4-digit number (e.g. ' + cleanPhone.slice(-4) + ').');
      return;
    }

    try {
      const res = dataService.registerCenterWithAdmin({
        centerData: {
          name: centerName,
          place,
          landmark: landmark.trim() || undefined,
          state,
          district: state === 'Kerala' ? district : place,
          zoneOrUnit,
          zoneName,
          unitName: zoneOrUnit === 'Unit' ? unitName : undefined,
          regularDay,
          startTime,
          endTime,
          defaultFee: 100,
          status: 'Active',
        },
        adminPhone,
        adminPasswordPlain: adminPassword,
        adminName: adminName || 'Centre Admin',
        adminPlace: adminPlace || place,
      });

      setSuccessMsg(`Centre "${res.center.name}" successfully registered! The Centre Admin can now log in using phone ${res.admin.phone}.`);
      setCenterName('');
      setPlace('');
      setAdminName('');
      setAdminPhone('');
      setAdminPlace('');
      setAdminPassword('');
      setTimeout(() => {
        setIsAddCenterModalOpen(false);
        setSuccessMsg(null);
      }, 3500);
    } catch {
      setErrorMsg('Failed to register centre. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-cre-bg flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-cre-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-18 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative h-8 w-22 sm:h-11 sm:w-34 flex items-center">
              <Image
                src="/cre-logo.png"
                alt="CRE Logo"
                width={140}
                height={50}
                className="object-contain max-h-8 sm:max-h-11"
                priority
              />
            </div>
            <div className="hidden sm:block h-7 w-px bg-slate-200"></div>
            <div className="hidden sm:flex relative h-9 w-36 items-center">
              <Image
                src="/wisdom-students-logo.png"
                alt="Wisdom Islamic Students Organization"
                width={160}
                height={45}
                className="object-contain max-h-9"
                priority
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={() => setIsAddCenterModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold text-cre-navy bg-cre-navy-light hover:bg-cre-navy hover:text-white transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-cre-green" />
              <span>Add CRE Centre</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Basic Information, Login Redirects & Add Centre Option */}
      <main className="flex-1 flex flex-col justify-center py-7 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cre-green-light border border-cre-green/30 text-cre-green text-[11px] sm:text-xs font-bold mb-3 sm:mb-4 mx-auto">
          <span className="w-2 h-2 rounded-full bg-cre-green"></span>
          <span>Wisdom Islamic Students Organisation</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-cre-navy tracking-tight max-w-3xl mx-auto leading-tight">
          Continuing Religious Education <span className="text-cre-green">(CRE)</span>
        </h1>

        {/* Basic Information & Core Purpose */}
        <div className="mt-5 sm:mt-6 bg-white p-4 sm:p-7 rounded-2xl border border-cre-border shadow-xs text-left space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            <span className="font-bold text-cre-navy">CRE</span> stands for <span className="font-bold text-cre-navy">Continuing Religious Education</span>, a structured religious education initiative conducted by the <span className="font-bold text-cre-green">Wisdom Islamic Students Organisation</span> in Kerala.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cre-navy block mb-1">
              Core Purpose
            </span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Designed to provide systematic, authentic Islamic knowledge alongside secular schooling for students who have moved past primary madrasa education. It helps teenage students navigate life challenges while fostering strong moral values, honesty, and a solid sense of divine consciousness.
            </p>
          </div>
        </div>

        {/* 2 Login Redirect Cards: Admin Login & Student Login */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5 text-left w-full">
          {/* Card 1: Admin Login */}
          <div className="bg-white rounded-2xl p-6 border border-cre-border hover:border-cre-navy shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-cre-navy text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-cre-navy">Admin Login</h3>
                <p className="text-xs text-slate-500">Super Admin & Centre Admin Portal</p>
              </div>
            </div>
            <Link
              href="/login?tab=admin"
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-cre-navy hover:bg-cre-navy-hover transition-all flex items-center justify-between shadow-xs"
            >
              <span>Admin Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Student / Parent Login */}
          <div className="bg-white rounded-2xl p-6 border border-cre-border hover:border-cre-green shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-cre-green text-white flex items-center justify-center shrink-0 shadow-sm shadow-cre-green/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-cre-navy">Student / Parent Login</h3>
                <p className="text-xs text-slate-500">Student & Parent Portal Access</p>
              </div>
            </div>
            <Link
              href="/login?tab=student"
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all flex items-center justify-between shadow-xs"
            >
              <span>Student / Parent Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Option to Add Centre */}
        <div className="mt-8 p-5 bg-white rounded-2xl border border-cre-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-left w-full">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-xl bg-cre-green-light text-cre-green shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-cre-navy">Want to register a new CRE Centre?</h4>
              <p className="text-xs text-slate-500 mt-0.5">Register your local centre, configure class timings, and set up the Centre Admin phone number and password.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddCenterModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20 shrink-0 inline-flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add CRE Centre
          </button>
        </div>
      </main>

      {/* Clean Compact Footer */}
      <footer className="mt-auto bg-slate-900 text-white py-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-cre-green">CRE</span>
            <span className="text-slate-400">• Continuing Religious Education • Wisdom Islamic Students Organization</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            All Rights Reserved
          </div>
        </div>
      </footer>

      {/* ADD CRE CENTRE MODAL */}
      {isAddCenterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-cre-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cre-border">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cre-navy-light text-cre-navy">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-cre-navy">Register / Add CRE Centre</h3>
                  <p className="text-[11px] text-slate-500">Provide centre information and set the Centre Admin login credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCenterModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 bg-cre-green-light border border-cre-green/30 text-cre-green text-xs rounded-xl font-bold">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleRegisterCenterSubmit} className="mt-4 space-y-4">
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cre-navy block">
                  1. Centre Details
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Centre Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    placeholder="e.g. Al-Huda Islamic Centre"
                    className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Place / City *
                    </label>
                    <input
                      type="text"
                      required
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      placeholder="e.g. Manjeri"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Salafi Masjid"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value as 'Kerala' | 'Other State')}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold focus:ring-2 focus:ring-cre-green outline-hidden"
                    >
                      <option value="Kerala">Kerala</option>
                      <option value="Other State">Other State</option>
                    </select>
                  </div>
                </div>

                {state === 'Kerala' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      District (16 Revenue & Organizational Districts)
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold focus:ring-2 focus:ring-cre-green outline-hidden"
                    >
                      {KERALA_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Affiliation Level
                    </label>
                    <div className="flex space-x-4 pt-1">
                      <label className="inline-flex items-center text-xs font-semibold text-slate-800">
                        <input
                          type="radio"
                          name="zoneOrUnit"
                          checked={zoneOrUnit === 'Zone'}
                          onChange={() => setZoneOrUnit('Zone')}
                          className="mr-1.5 text-cre-green focus:ring-cre-green"
                        />
                        Zone Level
                      </label>
                      <label className="inline-flex items-center text-xs font-semibold text-slate-800">
                        <input
                          type="radio"
                          name="zoneOrUnit"
                          checked={zoneOrUnit === 'Unit'}
                          onChange={() => setZoneOrUnit('Unit')}
                          className="mr-1.5 text-cre-green focus:ring-cre-green"
                        />
                        Unit Level
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {zoneOrUnit === 'Zone' ? 'Zone Name *' : 'Unit & Parent Zone *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={zoneName}
                      onChange={(e) => setZoneName(e.target.value)}
                      placeholder="e.g. Malappuram East"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Weekly Class Day
                    </label>
                    <select
                      value={regularDay}
                      onChange={(e) => setRegularDay(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold focus:ring-2 focus:ring-cre-green outline-hidden"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Centre Admin Login Setup */}
              <div className="pt-3 border-t border-cre-border space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cre-navy block">
                  2. Administrator Account & 4-Digit Login PIN
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Full Name
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Shafeeq Ahmed"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Place
                    </label>
                    <input
                      type="text"
                      value={adminPlace}
                      onChange={(e) => setAdminPlace(e.target.value)}
                      placeholder="e.g. Manjeri"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={adminPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Set 4-Digit Login PIN *
                    </label>
                    <PinInput
                      value={adminPassword}
                      onChange={setAdminPassword}
                      autoFocus={false}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Default: last 4 digits of phone number ({adminPhone.replace(/\D/g, '').slice(-4) || '••••'})
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-cre-border flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddCenterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20"
                >
                  Register Centre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
