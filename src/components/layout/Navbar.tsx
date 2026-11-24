'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  LogOut,
  Building,
  User,
  Menu,
  X,
  Phone,
  CheckCircle2,
  Edit2,
  Save,
  Users,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const {
    role,
    adminUser,
    selectedStudent,
    associatedStudents,
    activeCenter,
    availableCenters,
    setActiveCenterId,
    logout,
    switchStudentSession,
    updateCurrentAdminProfile,
  } = useAuth();

  // Admin Profile Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(adminUser?.name || '');
  const [profilePlace, setProfilePlace] = useState(adminUser?.place || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleOpenProfileModal = () => {
    setProfileName(adminUser?.name || '');
    setProfilePlace(adminUser?.place || '');
    setSaveSuccess(false);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    updateCurrentAdminProfile(profileName.trim(), profilePlace.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsProfileModalOpen(false);
    }, 1500);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-cre-border shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-17">
          {/* Left: Brand Logos & Title */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {role && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-1.5 rounded-lg text-cre-navy hover:bg-cre-navy-light transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="relative h-8 w-22 sm:h-11 sm:w-32 flex items-center">
                <Image
                  src="/cre-logo.png"
                  alt="CRE Logo"
                  width={140}
                  height={50}
                  className="object-contain max-h-8 sm:max-h-11"
                  priority
                />
              </div>
              <div className="hidden md:block h-7 w-px bg-slate-200"></div>
              <div className="hidden md:flex relative h-9 w-36 items-center">
                <Image
                  src="/wisdom-students-logo.png"
                  alt="Wisdom Islamic Students Organization"
                  width={160}
                  height={45}
                  className="object-contain max-h-9"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Center: Active Centre Selector (For multi-centre admins) */}
          <div className="flex items-center space-x-2">
            {role === 'CENTER_ADMIN' && availableCenters.length > 1 && (
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <Building className="w-3.5 h-3.5 text-cre-green mr-1.5 shrink-0" />
                <span className="text-slate-500 mr-1.5 hidden sm:inline text-[11px] font-medium">Centre:</span>
                <select
                  value={activeCenter?.id || ''}
                  onChange={(e) => setActiveCenterId(e.target.value)}
                  className="bg-transparent font-bold text-cre-navy border-none focus:ring-0 p-0 text-xs cursor-pointer outline-hidden"
                >
                  {availableCenters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.place})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {role === 'CENTER_ADMIN' && availableCenters.length === 1 && activeCenter && (
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <Building className="w-3.5 h-3.5 text-cre-green shrink-0" />
                <span className="font-bold text-cre-navy truncate max-w-[180px]">
                  {activeCenter.name}
                </span>
                <span className="text-[10px] text-slate-500">({activeCenter.place})</span>
              </div>
            )}
          </div>

          {/* Right: User Information & Logout */}
          <div className="flex items-center space-x-3">
            {role ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Clickable Profile Info for Admins */}
                {role !== 'STUDENT' ? (
                  <button
                    type="button"
                    onClick={handleOpenProfileModal}
                    className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                    title="Edit Admin Details"
                  >
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-xs font-bold text-cre-navy group-hover:text-cre-green transition-colors flex items-center">
                        {adminUser?.name || (role === 'SUPER_ADMIN' ? 'Super Admin' : 'Centre Admin')}
                        <Edit2 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-cre-green" />
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {adminUser?.phone || ''} {adminUser?.place ? `• ${adminUser.place}` : ''}
                      </span>
                    </div>

                    <div className="h-8 w-8 rounded-full bg-cre-green/10 border border-cre-green/30 flex items-center justify-center text-cre-green font-bold text-xs group-hover:bg-cre-green group-hover:text-white transition-all">
                      {role === 'SUPER_ADMIN' ? 'SA' : 'CA'}
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-xs font-bold text-cre-navy">
                        {selectedStudent?.name || 'Student / Parent'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Adm: {selectedStudent?.admissionNumber || ''}
                      </span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-cre-green/10 border border-cre-green/30 flex items-center justify-center text-cre-green font-bold text-xs">
                      ST
                    </div>
                  </div>
                )}

                {/* Logout Button with Confirmation */}
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center space-x-1 text-slate-600 hover:text-red-600 hover:bg-red-50 p-1.5 sm:px-2.5 sm:py-1.5 rounded-md text-xs font-medium transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg text-white bg-cre-green hover:bg-cre-green-hover transition-colors shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* MULTI-CHILD SWITCHING BAR FOR STUDENT PORTAL */}
      {role === 'STUDENT' && associatedStudents.length > 1 && (
        <div className="bg-cre-navy-light border-t border-cre-navy/10 px-3 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-cre-navy">
              <Users className="w-4 h-4 text-cre-green shrink-0" />
              <span>Switch Student Profile:</span>
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
              {associatedStudents.map((st) => {
                const isCurrent = selectedStudent?.id === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => switchStudentSession(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                      isCurrent
                        ? 'bg-cre-green text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{st.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {st.admissionNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN DETAILS EDIT MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border relative">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cre-navy text-white flex items-center justify-center shadow-xs">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-cre-navy">Administrator Profile</h3>
                <p className="text-xs text-slate-500">View and update your personal admin details</p>
              </div>
            </div>

            {saveSuccess && (
              <div className="mb-4 p-3 bg-cre-green-light border border-cre-green/30 rounded-xl flex items-center space-x-2 text-xs text-cre-green font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-cre-green" />
                <span>Administrator details updated successfully.</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Full Name *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Shafeeq Ahmed"
                    className="block w-full pl-9 pr-3 py-2 text-xs font-semibold border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (Already Logged-In)
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    disabled
                    value={adminUser?.phone || ''}
                    className="block w-full pl-9 pr-3 py-2 text-xs font-mono font-semibold bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Place / Locality
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <input
                    type="text"
                    value={profilePlace}
                    onChange={(e) => setProfilePlace(e.target.value)}
                    placeholder="e.g. Manjeri"
                    className="block w-full px-3 py-2 text-xs font-semibold border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-5 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM LOGOUT MODAL */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Confirm Sign Out"
        message="Are you sure you want to log out of the portal? You will need your login credentials to sign in again."
        confirmText="Yes, Logout"
        isDanger={true}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
};
