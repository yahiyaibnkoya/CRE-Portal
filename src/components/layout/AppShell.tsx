'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { PinInput } from '@/components/ui/PinInput';
import { KeyRound, X, CheckCircle, ShieldAlert } from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { adminUser, refreshData } = useAuth();

  const [showDefaultPinModal, setShowDefaultPinModal] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = sessionStorage.getItem('dismissed_default_pin_prompt');
    if (!dismissed && adminUser && adminUser.mustChangePassword) {
      setShowDefaultPinModal(true);
    }
  }, [adminUser]);

  const handleDismissPrompt = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dismissed_default_pin_prompt', 'true');
    }
    setShowDefaultPinModal(false);
    setIsChangingPin(false);
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (!adminUser) return;
    if (newPin.length !== 4) {
      setPinError('Please enter a 4-digit PIN.');
      return;
    }

    const success = dataService.updateUserPassword(adminUser.phone, newPin);
    if (success) {
      setPinSuccess(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dismissed_default_pin_prompt', 'true');
      }
      setTimeout(() => {
        setPinSuccess(false);
        setShowDefaultPinModal(false);
        setIsChangingPin(false);
        refreshData();
      }, 1500);
    } else {
      setPinError('Failed to update PIN. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cre-bg font-sans">
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen((v) => !v)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-7 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* NON-COMPULSORY DEFAULT PIN POPUP MODAL */}
      {showDefaultPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border relative">
            <button
              type="button"
              onClick={handleDismissPrompt}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-cre-navy">Security Recommendation</h3>
                <p className="text-xs text-slate-500">Default PIN in use</p>
              </div>
            </div>

            {pinSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Your custom 4-digit PIN has been successfully set!</span>
              </div>
            ) : isChangingPin ? (
              <form onSubmit={handleSaveNewPin} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your new custom 4-digit PIN below:
                </p>

                {pinError && (
                  <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
                    {pinError}
                  </div>
                )}

                <div className="flex justify-center py-2">
                  <PinInput
                    value={newPin}
                    onChange={setNewPin}
                    autoFocus={true}
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={newPin.length !== 4}
                    className="px-5 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    Save New PIN
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="text-xs text-slate-600 leading-relaxed mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  You are currently using the default PIN (the last 4 digits of your phone number). If you wish, you can set a custom 4-digit PIN now, or simply continue with your current PIN.
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleDismissPrompt}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-center"
                  >
                    Continue with Current PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(true)}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-cre-navy hover:bg-cre-navy-hover rounded-xl shadow-xs transition-colors text-center inline-flex items-center justify-center space-x-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change PIN</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
