'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Student } from '@/types';
import { dataService } from '@/lib/dataService';
import {
  KERALA_DISTRICTS,
  DAYS_OF_WEEK,
  SUPER_ADMIN_WHATSAPP_RESET,
  normalizePhoneNumber,
} from '@/lib/constants';
import {
  Building2,
  GraduationCap,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  MessageSquare,
  Users,
  Info,
  Plus,
  X,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab: 'admin' | 'student' = requestedTab === 'student' ? 'student' : 'admin';

  const [activeTab, setActiveTab] = useState<'admin' | 'student'>(initialTab);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Multi-child selection state for Student/Parent login
  const [matchingStudents, setMatchingStudents] = useState<Student[] | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');

  // Add Centre modal state
  const [isAddCenterModalOpen, setIsAddCenterModalOpen] = useState(false);
  const [centerName, setCenterName] = useState('');
  const [centerPlace, setCenterPlace] = useState('');
  const [centerState, setCenterState] = useState<'Kerala' | 'Other State'>('Kerala');
  const [district, setDistrict] = useState(KERALA_DISTRICTS[10] || 'Malappuram West');
  const [zoneOrUnit, setZoneOrUnit] = useState<'Zone' | 'Unit'>('Zone');
  const [zoneName, setZoneName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [regularDay, setRegularDay] = useState('Sunday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPlace, setNewAdminPlace] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [centerModalError, setCenterModalError] = useState<string | null>(null);
  const [centerModalSuccess, setCenterModalSuccess] = useState<string | null>(null);

  const { loginAdmin, loginStudentPhone, selectStudentSession, role } = useAuth();

  // If already authenticated, redirect to respective dashboard
  useEffect(() => {
    if (role === 'SUPER_ADMIN') router.push('/super-admin');
    else if (role === 'CENTER_ADMIN') router.push('/center-admin');
    else if (role === 'STUDENT') router.push('/student');
  }, [role, router]);

  useEffect(() => {
    setPassword('');
    setError(null);
    setMatchingStudents(null);
  }, [activeTab]);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = normalizePhoneNumber(phone);
    if (!clean || clean.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginAdmin(clean, password);
      if (!result.success) {
        setError(result.error || 'Authentication failed. Please check your credentials.');
      } else {
        if (result.mustChangePassword) {
          router.push('/change-password');
        } else if (result.role === 'SUPER_ADMIN') {
          router.push('/super-admin');
        } else {
          router.push('/center-admin');
        }
      }
    } catch {
      setError('An unexpected error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = normalizePhoneNumber(phone);
    if (!clean || clean.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginStudentPhone(clean);
      if (!res.success) {
        setError(res.error || 'No student found with this registered number.');
      } else if (res.students && res.students.length > 0) {
        if (res.students.length === 1) {
          selectStudentSession(res.students[0]);
        } else {
          // Multiple children associated with this parent phone number
          setMatchingStudents(res.students);
        }
      }
    } catch {
      setError('Failed to look up student records.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForgotPassword = () => {
    setForgotPhone(phone || '');
    setShowForgotModal(true);
  };

  const handleSendForgotWhatsApp = () => {
    const cleanNumber = normalizePhoneNumber(forgotPhone);
    const message = `Assalamu Alaikum.\n\nI have forgotten my CRE Portal password.\n\nMy login number: ${cleanNumber || '[NUMBER]'}\n\nPlease help me reset my password.`;
    const url = `https://wa.me/91${SUPER_ADMIN_WHATSAPP_RESET}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setShowForgotModal(false);
  };

  const handleRegisterCenterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCenterModalError(null);

    if (!newAdminPhone || newAdminPhone.trim().length < 10) {
      setCenterModalError('Please enter a valid 10-digit mobile number for the Centre Admin.');
      return;
    }
    if (!newAdminPassword || newAdminPassword.length < 6) {
      setCenterModalError('Please set a secure initial password (at least 6 characters).');
      return;
    }

    try {
      const res = dataService.registerCenterWithAdmin({
        centerData: {
          name: centerName,
          place: centerPlace,
          state: centerState,
          district: centerState === 'Kerala' ? district : centerPlace,
          zoneOrUnit,
          zoneName,
          unitName: zoneOrUnit === 'Unit' ? unitName : undefined,
          regularDay,
          startTime,
          endTime,
          defaultFee: 100,
          status: 'Active',
        },
        adminPhone: newAdminPhone,
        adminPasswordPlain: newAdminPassword,
        adminName: newAdminName || 'Centre Admin',
        adminPlace: newAdminPlace || centerPlace,
      });

      setCenterModalSuccess(`Centre "${res.center.name}" successfully registered! The Centre Admin can now log in using phone ${res.admin.phone}.`);
      setPhone(res.admin.phone);
      setPassword('');
      setCenterName('');
      setCenterPlace('');
      setNewAdminName('');
      setNewAdminPhone('');
      setNewAdminPlace('');
      setNewAdminPassword('');
      setTimeout(() => {
        setIsAddCenterModalOpen(false);
        setCenterModalSuccess(null);
      }, 3000);
    } catch {
      setCenterModalError('Failed to register centre. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-cre-bg flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Logos and Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="h-16 w-36 relative flex items-center justify-center">
            <Image
              src="/cre-logo.png"
              alt="CRE Logo"
              width={160}
              height={60}
              className="object-contain"
              priority
            />
          </div>
          <div className="h-10 w-px bg-slate-300"></div>
          <div className="h-14 w-36 relative flex items-center justify-center">
            <Image
              src="/wisdom-students-logo.png"
              alt="Wisdom Islamic Students Organization"
              width={160}
              height={50}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-cre-navy uppercase tracking-wide">
          Continuing Religious Education
        </h1>
        <p className="mt-1 text-xs font-bold text-cre-green">
          Wisdom Islamic Students Organization
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-cre-border sm:px-10">
          {/* Sub-options Tab Selector: Admin Login & Student Login only */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center justify-center py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'admin'
                  ? 'bg-cre-navy text-white shadow-xs'
                  : 'text-slate-600 hover:text-cre-navy hover:bg-white/60'
              }`}
            >
              <Building2 className="w-4 h-4 mr-2" />
              <span>Admin Login</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`flex items-center justify-center py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'student'
                  ? 'bg-cre-green text-white shadow-xs'
                  : 'text-slate-600 hover:text-cre-green hover:bg-white/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              <span>Student Login</span>
            </button>
          </div>

          {/* Subtitle / Guidance */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start space-x-3">
            <Info className="w-4 h-4 text-cre-navy shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              {activeTab === 'admin' ? (
                <p>
                  Portal administrators can enter their registered mobile number and password to access their management dashboard.
                </p>
              ) : (
                <p>
                  Students and parents can enter their registered mobile phone number to directly view attendance, fees, and examination records.
                </p>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* MULTI-CHILD SELECTION MODAL/CARD */}
          {matchingStudents && matchingStudents.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-cre-green-light border border-cre-green/30 rounded-xl p-4 text-center">
                <Users className="w-7 h-7 text-cre-green mx-auto mb-1.5" />
                <h3 className="text-sm font-bold text-cre-navy">
                  Multiple Students Found
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Whose information would you like to view?
                </p>
              </div>

              <div className="space-y-2">
                {matchingStudents.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => selectStudentSession(st)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-cre-green-light border border-slate-200 hover:border-cre-green rounded-xl transition-all text-left group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-cre-navy">
                        {st.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Adm No: {st.admissionNumber} • Parent: {st.parentName}
                      </p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                        {st.place || 'Active Student'}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cre-green transition-transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setMatchingStudents(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                ← Back to Phone Login
              </button>
            </div>
          ) : (
            /* LOGIN FORMS */
            <form onSubmit={activeTab === 'student' ? handleStudentSubmit : handleAdminSubmit} className="space-y-5">
              {/* Phone Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter registered mobile number"
                    className="block w-full pl-10 pr-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-cre-green focus:border-cre-green focus:outline-hidden bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Password Input (Admin Only) */}
              {activeTab === 'admin' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenForgotPassword}
                      className="text-[11px] font-semibold text-cre-navy hover:text-cre-green transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-cre-green focus:border-cre-green focus:outline-hidden bg-slate-50/50"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                  activeTab === 'student'
                    ? 'bg-cre-green hover:bg-cre-green-hover shadow-cre-green/20'
                    : 'bg-cre-navy hover:bg-cre-navy-hover shadow-cre-navy/20'
                } disabled:opacity-50`}
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  <>
                    <span>{activeTab === 'student' ? 'Access Student Portal' : 'Login to Dashboard'}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Add Centre Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need to register a centre?</span>
            <button
              type="button"
              onClick={() => setIsAddCenterModalOpen(true)}
              className="inline-flex items-center font-bold text-cre-navy hover:text-cre-green transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-cre-green" />
              Add CRE Centre
            </button>
          </div>
        </div>
      </div>

      {/* ADD CENTRE MODAL */}
      {isAddCenterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-cre-border my-8 relative">
            <button
              onClick={() => setIsAddCenterModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cre-navy text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-cre-navy">Add CRE Centre</h3>
                <p className="text-xs text-slate-500">Register a new weekly centre and assign initial administrator</p>
              </div>
            </div>

            {centerModalError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
                {centerModalError}
              </div>
            )}

            {centerModalSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{centerModalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterCenterSubmit} className="space-y-4">
              {/* Centre Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cre-navy">1. Centre Information</h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Centre Name *</label>
                  <input
                    type="text"
                    required
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    placeholder="e.g. Al-Huda Islamic Centre"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cre-green outline-hidden bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Place / City *</label>
                    <input
                      type="text"
                      required
                      value={centerPlace}
                      onChange={(e) => setCenterPlace(e.target.value)}
                      placeholder="e.g. Manjeri"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cre-green outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                    <select
                      value={centerState}
                      onChange={(e) => setCenterState(e.target.value as 'Kerala' | 'Other State')}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cre-green outline-hidden bg-white"
                    >
                      <option value="Kerala">Kerala</option>
                      <option value="Other State">Other State</option>
                    </select>
                  </div>
                </div>

                {centerState === 'Kerala' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cre-green outline-hidden bg-white"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Affiliation</label>
                    <div className="flex space-x-4 pt-1">
                      <label className="inline-flex items-center text-xs font-medium text-slate-700">
                        <input
                          type="radio"
                          name="loginZoneOrUnit"
                          checked={zoneOrUnit === 'Zone'}
                          onChange={() => setZoneOrUnit('Zone')}
                          className="mr-1.5 text-cre-green focus:ring-cre-green"
                        />
                        Zone
                      </label>
                      <label className="inline-flex items-center text-xs font-medium text-slate-700">
                        <input
                          type="radio"
                          name="loginZoneOrUnit"
                          checked={zoneOrUnit === 'Unit'}
                          onChange={() => setZoneOrUnit('Unit')}
                          className="mr-1.5 text-cre-green focus:ring-cre-green"
                        />
                        Unit
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {zoneOrUnit === 'Zone' ? 'Zone Name' : 'Unit & Zone'}
                    </label>
                    <input
                      type="text"
                      value={zoneName}
                      onChange={(e) => setZoneName(e.target.value)}
                      placeholder="e.g. Malappuram East"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cre-green outline-hidden bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Day</label>
                    <select
                      value={regularDay}
                      onChange={(e) => setRegularDay(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cre-green outline-hidden bg-white"
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cre-green outline-hidden bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cre-green outline-hidden bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Centre Admin Details & Initial Password */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cre-green">2. Centre Admin Account & Password</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Full Name</label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="e.g. Shafeeq Ahmed"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cre-green outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Place</label>
                    <input
                      type="text"
                      value={newAdminPlace}
                      onChange={(e) => setNewAdminPlace(e.target.value)}
                      placeholder="e.g. Manjeri"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cre-green outline-hidden bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cre-green outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Set Initial Password *</label>
                    <input
                      type="password"
                      required
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="Initial password"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cre-green outline-hidden bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddCenterModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs"
                >
                  Save & Register Centre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-cre-navy-light text-cre-navy">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-cre-navy">Forgot Password</h3>
                <p className="text-xs text-slate-500">Reset via Super Admin WhatsApp</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              To securely reset your password, an automated reset request message will be prepared for WhatsApp to the Super Admin.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Your Login Mobile Number
              </label>
              <input
                type="tel"
                value={forgotPhone}
                onChange={(e) => setForgotPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 mb-5 font-mono">
              Assalamu Alaikum.<br />
              I have forgotten my CRE Portal password.<br />
              My login number: {normalizePhoneNumber(forgotPhone) || '[YOUR NUMBER]'}<br />
              Please help me reset my password.
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendForgotWhatsApp}
                className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cre-bg flex items-center justify-center">
          <div className="text-xs font-bold text-cre-navy animate-pulse">Loading Portal...</div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
