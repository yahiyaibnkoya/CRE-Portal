'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole, AdminUser, Student, Center } from '@/types';
import { dataService } from '@/lib/dataService';
import { normalizePhoneNumber } from '@/lib/constants';

interface AuthContextType {
  role: UserRole | null;
  adminUser: AdminUser | null;
  selectedStudent: Student | null;
  activeCenterId: string | null;
  activeCenter: Center | null;
  availableCenters: Center[];
  isLoading: boolean;
  loginAdmin: (phone: string, passwordPlain: string) => Promise<{ success: boolean; role?: UserRole; error?: string; mustChangePassword?: boolean }>;
  loginStudentPhone: (phone: string) => Promise<{ success: boolean; students?: Student[]; error?: string }>;
  selectStudentSession: (student: Student) => void;
  setActiveCenterId: (centerId: string) => void;
  logout: () => void;
  completePasswordChange: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateCurrentAdminProfile: (arg1: string | { name: string; place?: string }, arg2?: string) => boolean;
  refreshData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [role, setRole] = useState<UserRole | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeCenterId, setActiveCenterIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataVersion, setDataVersion] = useState(0);

  const refreshData = () => setDataVersion((v) => v + 1);

  // Restore session from localStorage on mount
  useEffect(() => {
    dataService.init();
    try {
      const savedRole = localStorage.getItem('cre_auth_role') as UserRole | null;
      if (savedRole === 'SUPER_ADMIN' || savedRole === 'CENTER_ADMIN') {
        const savedPhone = localStorage.getItem('cre_auth_phone');
        if (savedPhone) {
          const user = dataService.getUserByPhone(savedPhone);
          if (user && user.isActive) {
            setRole(user.role);
            setAdminUser(user);
            const savedCenter = localStorage.getItem('cre_auth_center');
            if (savedCenter) {
              setActiveCenterIdState(savedCenter);
            } else if (user.centerIds && user.centerIds.length > 0) {
              setActiveCenterIdState(user.centerIds[0]);
            }
          }
        }
      } else if (savedRole === 'STUDENT') {
        const savedStudentId = localStorage.getItem('cre_auth_student_id');
        if (savedStudentId) {
          const st = dataService.getStudentById(savedStudentId);
          if (st) {
            setRole('STUDENT');
            setSelectedStudent(st);
            setActiveCenterIdState(st.centerId);
          }
        }
      }
    } catch (e) {
      console.error('Session restoration error', e);
    } finally {
      setIsLoading(false);
    }
  }, [dataVersion]);

  // Route protection
  useEffect(() => {
    if (isLoading) return;

    // Protect Super Admin routes
    if (pathname?.startsWith('/super-admin')) {
      if (role !== 'SUPER_ADMIN') {
        router.push('/login?tab=admin');
      }
    }

    // Protect Center Admin routes
    if (pathname?.startsWith('/center-admin')) {
      if (role !== 'CENTER_ADMIN' && role !== 'SUPER_ADMIN') {
        router.push('/login?tab=admin');
      }
    }

    // Protect Student routes
    if (pathname?.startsWith('/student')) {
      if (role !== 'STUDENT') {
        router.push('/login?tab=student');
      }
    }
  }, [role, adminUser, pathname, isLoading, router]);

  // Available centers based on role
  const allCenters = dataService.getCenters();
  const availableCenters = React.useMemo(() => {
    if (role === 'SUPER_ADMIN') {
      return allCenters;
    }
    if (role === 'CENTER_ADMIN' && adminUser) {
      return allCenters.filter((c) => adminUser.centerIds.includes(c.id));
    }
    if (role === 'STUDENT' && selectedStudent) {
      return allCenters.filter((c) => c.id === selectedStudent.centerId);
    }
    return [];
  }, [role, adminUser, selectedStudent, allCenters, dataVersion]);

  const activeCenter = React.useMemo(() => {
    if (!activeCenterId && availableCenters.length > 0) {
      return availableCenters[0];
    }
    return availableCenters.find((c) => c.id === activeCenterId) || availableCenters[0] || null;
  }, [activeCenterId, availableCenters]);

  const setActiveCenterId = (centerId: string) => {
    setActiveCenterIdState(centerId);
    localStorage.setItem('cre_auth_center', centerId);
  };

  const loginAdmin = async (phone: string, passwordPlain: string) => {
    dataService.init();
    const cleanPhone = normalizePhoneNumber(phone);

    // Multi-device sync: ensure local storage is up-to-date with Firestore
    try {
      await dataService.ensureSynced();
    } catch {
      // Offline fallback
    }

    let user = dataService.getUserByPhone(cleanPhone);

    // Multi-device fallback: fetch directly from Firestore if still not in local cache
    if (!user) {
      user = (await dataService.fetchUserFromFirestore(cleanPhone)) || undefined;
    }

    if (!user) {
      return { success: false, error: 'User with this phone number not found.' };
    }

    if (!user.isActive) {
      return { success: false, error: 'Your account is suspended. Please contact the Super Admin.' };
    }

    // Validate password
    let valid = dataService.checkUserPassword(cleanPhone, passwordPlain);
    if (!valid) {
      // Re-fetch from Firestore in case password was updated on another device
      const cloudUser = await dataService.fetchUserFromFirestore(cleanPhone);
      if (cloudUser) {
        user = cloudUser;
        valid = dataService.checkUserPassword(cleanPhone, passwordPlain);
      }
    }

    if (!valid) {
      return { success: false, error: 'Invalid 4-digit PIN. If you forgot your password, please contact the Super Admin.' };
    }

    setRole(user.role);
    setAdminUser(user);
    localStorage.setItem('cre_auth_role', user.role);
    localStorage.setItem('cre_auth_phone', user.phone);

    if (user.centerIds && user.centerIds.length > 0) {
      setActiveCenterIdState(user.centerIds[0]);
      localStorage.setItem('cre_auth_center', user.centerIds[0]);
    } else {
      const firstCenter = dataService.getCenters()[0];
      if (firstCenter) {
        setActiveCenterIdState(firstCenter.id);
        localStorage.setItem('cre_auth_center', firstCenter.id);
      }
    }

    if (user.mustChangePassword) {
      return { success: true, role: user.role, mustChangePassword: true };
    }

    return { success: true, role: user.role, mustChangePassword: false };
  };

  const loginStudentPhone = async (phone: string) => {
    dataService.init();
    const settings = dataService.getSettings();
    if (!settings.studentQuickAccessEnabled) {
      return {
        success: false,
        error: 'Student/Parent portal access is temporarily disabled by Super Admin.',
      };
    }

    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone) {
      return { success: false, error: 'Please enter a valid phone number.' };
    }

    let matches = dataService.getStudentsByPhone(cleanPhone);
    if (matches.length === 0) {
      // Multi-device fallback: check Firestore
      matches = await dataService.fetchStudentsFromFirestore(cleanPhone);
    }

    if (matches.length === 0) {
      return {
        success: false,
        error: 'No student record found with this phone number. Please check with your Centre Admin.',
      };
    }

    return { success: true, students: matches };
  };

  const selectStudentSession = (student: Student) => {
    setRole('STUDENT');
    setSelectedStudent(student);
    setActiveCenterIdState(student.centerId);

    localStorage.setItem('cre_auth_role', 'STUDENT');
    localStorage.setItem('cre_auth_student_id', student.id);
    localStorage.setItem('cre_auth_center', student.centerId);
    router.push('/student');
  };

  const completePasswordChange = async (newPassword: string) => {
    if (!adminUser) return { success: false, error: 'No authenticated user session.' };
    const success = dataService.updateUserPassword(adminUser.phone, newPassword);
    if (success) {
      const updatedUser = { ...adminUser, mustChangePassword: false };
      setAdminUser(updatedUser);
      refreshData();
      return { success: true };
    }
    return { success: false, error: 'Failed to update password.' };
  };

  const updateCurrentAdminProfile = (arg1: string | { name: string; place?: string }, arg2?: string) => {
    if (!adminUser) return false;
    const updates = typeof arg1 === 'string' ? { name: arg1, place: arg2 || '' } : arg1;
    const updated = dataService.updateAdminProfile(adminUser.phone, {
      name: updates.name,
      place: updates.place || '',
    });
    if (updated) {
      setAdminUser({ ...updated });
      refreshData();
      return true;
    }
    return false;
  };

  const logout = () => {
    setRole(null);
    setAdminUser(null);
    setSelectedStudent(null);
    setActiveCenterIdState(null);

    localStorage.removeItem('cre_auth_role');
    localStorage.removeItem('cre_auth_phone');
    localStorage.removeItem('cre_auth_student_id');
    localStorage.removeItem('cre_auth_center');

    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        adminUser,
        selectedStudent,
        activeCenterId: activeCenter?.id || null,
        activeCenter,
        availableCenters,
        isLoading,
        loginAdmin,
        loginStudentPhone,
        selectStudentSession,
        setActiveCenterId,
        logout,
        completePasswordChange,
        updateCurrentAdminProfile,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
