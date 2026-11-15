'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { KERALA_DISTRICTS, DAYS_OF_WEEK } from '@/lib/constants';
import {
  Building,
  MapPin,
  Clock,
  Calendar,
  User,
  Phone,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Lock,
} from 'lucide-react';

export default function CenterInfoPage() {
  const { activeCenter, adminUser, updateCurrentAdminProfile, refreshData } = useAuth();

  // Admin Profile Form state
  const [adminName, setAdminName] = useState(adminUser?.name || '');
  const [adminPhone, setAdminPhone] = useState(adminUser?.phone || '');
  const [adminPlace, setAdminPlace] = useState(adminUser?.place || '');
  const [adminSuccess, setAdminSuccess] = useState(false);

  // Centre Form state
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [state, setState] = useState<'Kerala' | 'Other State'>('Kerala');
  const [district, setDistrict] = useState(KERALA_DISTRICTS[10]);
  const [otherStateName, setOtherStateName] = useState('');
  const [otherDistrictName, setOtherDistrictName] = useState('');
  const [zoneOrUnit, setZoneOrUnit] = useState<'Zone' | 'Unit'>('Zone');
  const [zoneName, setZoneName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [regularDay, setRegularDay] = useState('Sunday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [contactNumbers, setContactNumbers] = useState<string[]>(['']);
  const [defaultFee, setDefaultFee] = useState<number>(100);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (adminUser) {
      setAdminName(adminUser.name || '');
      setAdminPhone(adminUser.phone || '');
      setAdminPlace(adminUser.place || '');
    }
  }, [adminUser]);

  useEffect(() => {
    if (activeCenter) {
      setName(activeCenter.name);
      setPlace(activeCenter.place);
      setState(activeCenter.state as 'Kerala' | 'Other State');
      setDistrict(activeCenter.district);
      setOtherStateName(activeCenter.otherStateName || '');
      setOtherDistrictName(activeCenter.otherDistrictName || '');
      setZoneOrUnit(activeCenter.zoneOrUnit);
      setZoneName(activeCenter.zoneName);
      setUnitName(activeCenter.unitName || '');
      setRegularDay(activeCenter.regularDay);
      setStartTime(activeCenter.startTime);
      setEndTime(activeCenter.endTime);
      setEffectiveDate(activeCenter.effectiveDate);
      setFacultyName(activeCenter.facultyName || '');
      setContactNumbers(activeCenter.contactNumbers.length > 0 ? activeCenter.contactNumbers : ['']);
      setDefaultFee(activeCenter.defaultFee);
    }
  }, [activeCenter]);

  if (!activeCenter) {
    return (
      <AppShell>
        <div className="p-8 text-center bg-white rounded-2xl border border-cre-border">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h2 className="text-sm font-bold text-cre-navy">No Assigned Centre</h2>
        </div>
      </AppShell>
    );
  }

  const handleAdminProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) return;

    updateCurrentAdminProfile(adminName.trim(), adminPlace.trim());
    setAdminSuccess(true);
    setTimeout(() => setAdminSuccess(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContacts = contactNumbers.filter((n) => n.trim().length > 0).slice(0, 3);

    dataService.saveCenter({
      id: activeCenter.id,
      name,
      place,
      state,
      district: state === 'Kerala' ? district : otherDistrictName,
      otherStateName: state === 'Other State' ? otherStateName : undefined,
      otherDistrictName: state === 'Other State' ? otherDistrictName : undefined,
      zoneOrUnit,
      zoneName,
      unitName: zoneOrUnit === 'Unit' ? unitName : undefined,
      regularDay,
      startTime,
      endTime,
      effectiveDate,
      facultyName,
      contactNumbers: cleanContacts,
      defaultFee: Number(defaultFee),
      status: activeCenter.status,
    });

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    refreshData();
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="pb-2 border-b border-cre-border flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
              Centre & Administrator Details
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Maintain institutional details, class timings, and administrator profile
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              activeCenter.status === 'Active'
                ? 'bg-cre-green-light text-cre-green border border-cre-green/30'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            Status: {activeCenter.status}
          </span>
        </div>

        {/* 1. ADMIN DETAILS ENTERING SECTION */}
        <div className="bg-white p-6 rounded-2xl border border-cre-border shadow-xs">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-cre-navy text-white shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-cre-navy">Administrator Profile Details</h2>
              <p className="text-xs text-slate-500">Your administrator personal identity and assigned place</p>
            </div>
          </div>

          {adminSuccess && (
            <div className="mb-4 p-3.5 bg-cre-green-light border border-cre-green/30 rounded-xl flex items-center space-x-2 text-xs text-cre-green font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-cre-green" />
              <span>Administrator details updated successfully.</span>
            </div>
          )}

          <form onSubmit={handleAdminProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Name *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Shafeeq Ahmed"
                    className="block w-full pl-9 pr-3 py-2 text-xs font-semibold border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:border-cre-green focus:outline-hidden bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Phone (Already logged in number - disabled/read-only) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number (Logged-in Mobile)
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    disabled
                    readOnly
                    value={adminPhone}
                    className="block w-full pl-9 pr-8 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-100 text-slate-600 cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Registered authentication number
                </span>
              </div>

              {/* Place */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Place *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={adminPlace}
                    onChange={(e) => setAdminPlace(e.target.value)}
                    placeholder="e.g. Manjeri"
                    className="block w-full pl-9 pr-3 py-2 text-xs font-semibold border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:border-cre-green focus:outline-hidden bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-cre-navy hover:bg-cre-navy-hover transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Update Admin Details
              </button>
            </div>
          </form>
        </div>

        {/* 2. CENTRE INFORMATION SECTION */}
        {success && (
          <div className="p-4 bg-cre-green-light border border-cre-green/30 rounded-2xl flex items-center space-x-2 text-xs text-cre-green font-bold shadow-xs">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Centre information updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-cre-border shadow-xs">
          <div className="flex items-center space-x-3 mb-2 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-cre-green text-white shadow-xs">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-cre-navy">Institutional Information & Schedule</h2>
              <p className="text-xs text-slate-500">Configure weekly timings, faculty in charge, and public contacts</p>
            </div>
          </div>

          {/* Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Centre Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Place / City *
              </label>
              <input
                type="text"
                required
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
              />
            </div>
          </div>

          {/* State & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value as 'Kerala' | 'Other State')}
                className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden font-semibold"
              >
                <option value="Kerala">Kerala</option>
                <option value="Other State">Other State</option>
              </select>
            </div>

            {state === 'Kerala' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  District (16 Revenue & Organizational Districts)
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden font-semibold"
                >
                  {KERALA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={otherStateName}
                    onChange={(e) => setOtherStateName(e.target.value)}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    District Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={otherDistrictName}
                    onChange={(e) => setOtherDistrictName(e.target.value)}
                    placeholder="e.g. Mangalore"
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Affiliation: Zone or Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Affiliation Category
              </label>
              <div className="flex space-x-6 pt-2">
                <label className="inline-flex items-center text-xs font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="zoneOrUnit"
                    checked={zoneOrUnit === 'Zone'}
                    onChange={() => setZoneOrUnit('Zone')}
                    className="mr-2 text-cre-green focus:ring-cre-green"
                  />
                  Zone Level
                </label>
                <label className="inline-flex items-center text-xs font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="zoneOrUnit"
                    checked={zoneOrUnit === 'Unit'}
                    onChange={() => setZoneOrUnit('Unit')}
                    className="mr-2 text-cre-green focus:ring-cre-green"
                  />
                  Unit Level
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {zoneOrUnit === 'Zone' ? 'Zone Name *' : 'Unit & Parent Zone Name *'}
              </label>
              <input
                type="text"
                required
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. Malappuram East"
                className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl"
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Weekly Class Day
              </label>
              <select
                value={regularDay}
                onChange={(e) => setRegularDay(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold"
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
                Starting Time
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
                Ending Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Effective Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl"
              />
            </div>
          </div>

          {/* Faculty & Default Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Faculty Name
              </label>
              <input
                type="text"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                placeholder="e.g. Usthad Abdul Rasheed Salafi"
                className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Monthly Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                value={defaultFee}
                onChange={(e) => setDefaultFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-bold text-cre-green"
              />
            </div>
          </div>

          {/* Public Contact Numbers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Public Contact Numbers (Max 3 – Displayed to Students)
              </label>
              {contactNumbers.length < 3 && (
                <button
                  type="button"
                  onClick={() => setContactNumbers([...contactNumbers, ''])}
                  className="text-xs font-bold text-cre-green hover:underline"
                >
                  + Add Contact Number
                </button>
              )}
            </div>
            <div className="space-y-2">
              {contactNumbers.map((num, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="tel"
                    value={num}
                    onChange={(e) => {
                      const updated = [...contactNumbers];
                      updated[idx] = e.target.value;
                      setContactNumbers(updated);
                    }}
                    placeholder={`Contact Number ${idx + 1}`}
                    className="flex-1 px-3 py-2 text-xs border border-cre-border rounded-xl"
                  />
                  {contactNumbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setContactNumbers(contactNumbers.filter((_, i) => i !== idx))}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-cre-border flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20"
            >
              Save Centre Information
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
