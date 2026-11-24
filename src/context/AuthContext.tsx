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
  associatedStudents: Student[];
  activeCenterId: string | null;
  activeCenter: Center | null;
  availableCenters: Center[];
  isLoading: boolean;
  dataVersion: number;
  loginAdmin: (phone: string, passwordPlain: string) => Promise<{ success: boolean; role?: UserRole; error?: string; mustChangePassword?: boolean }>;
  loginStudentPhone: (phone: string) => Promise<{ success: boolean; students?: Student[]; error?: string }>;
  selectStudentSession: (student: Student) => void;
  switchStudentSession: (student: Student) => void;
  setActiveCenterId: (centerId: string) => void;
  logout: () => void;
  completePasswordChange: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateCurrentAdminProfile: (arg1: string | { name: string; place?: string }, arg2?: string) => boolean;
  updateSuperAdminPhoneAndPin: (newPhone: string, newPin?: string, newName?: string, newPlace?: string) => Promise<boolean>;
  refreshData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [role, setRole] = useState<UserRole | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [associatedStudents, setAssociatedStudents] = useState<Student[]>([]);
  const [activeCenterId, setActiveCenterIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataVersion, setDataVersion] = useState(0);

  const refreshData = () => setDataVersion((v) => v + 1);

  // Subscribe to realtime dataService updates
  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setDataVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  // Restore session on mount from pure Firestore database
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        await dataService.ensureSynced();

        const savedRole = localStorage.getItem('cre_auth_role') as UserRole | null;
        const savedPhone = localStorage.getItem('cre_auth_phone');

        if ((savedRole === 'SUPER_ADMIN' || savedRole === 'CENTER_ADMIN') && savedPhone) {
          let user = dataService.getUserByPhone(savedPhone);
          if (!user) {
            user = (await dataService.fetchUserFromFirestore(savedPhone)) || undefined;
          }

          if (user && user.isActive && isMounted) {
            setRole(user.role);
            setAdminUser(user);
            const savedCenter = localStorage.getItem('cre_auth_center');
            if (savedCenter) {
              setActiveCenterIdState(savedCenter);
            } else if (user.centerIds && user.centerIds.length > 0) {
              setActiveCenterIdState(user.centerIds[0]);
            }
          }
        } else if (savedRole === 'STUDENT' && savedPhone) {
          let matches = dataService.getStudentsByPhone(savedPhone);
          if (matches.length === 0) {
            matches = await dataService.fetchStudentsFromFirestore(savedPhone);
          }
          if (isMounted) setAssociatedStudents(matches);

          const savedStudentId = localStorage.getItem('cre_auth_student_id');
          const st = matches.find((s) => s.id === savedStudentId) || matches[0];
          if (st && isMounted) {
            setRole('STUDENT');
            setSelectedStudent(st);
            setActiveCenterIdState(st.centerId);
          }
        }
      } catch (e) {
        console.error('Session restoration error:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Route protection using replace to prevent back button loops
  useEffect(() => {
    if (isLoading) return;

    if (pathname?.startsWith('/super-admin')) {
      if (role !== 'SUPER_ADMIN') {
        router.replace('/login?tab=admin');
      }
    }

    if (pathname?.startsWith('/center-admin')) {
      if (role !== 'CENTER_ADMIN' && role !== 'SUPER_ADMIN') {
        router.replace('/login?tab=admin');
      }
    }

    if (pathname?.startsWith('/student')) {
      if (role !== 'STUDENT') {
        router.replace('/login?tab=student');
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
    const cleanPhone = normalizePhoneNumber(phone);

    try {
      await dataService.ensureSynced();
    } catch {
      // Offline fallback
    }

    let user = dataService.getUserByPhone(cleanPhone);
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

    try {
      await dataService.ensureSynced();
    } catch {
      // Ignore
    }

    let matches = dataService.getStudentsByPhone(cleanPhone);
    if (matches.length === 0) {
      matches = await dataService.fetchStudentsFromFirestore(cleanPhone);
    }

    if (matches.length === 0) {
      return {
        success: false,
        error: 'No student record found with this phone number. Please check with your Centre Admin.',
      };
    }

    setAssociatedStudents(matches);
    localStorage.setItem('cre_auth_phone', cleanPhone);
    return { success: true, students: matches };
  };

  const selectStudentSession = (student: Student) => {
    setRole('STUDENT');
    setSelectedStudent(student);
    setActiveCenterIdState(student.centerId);

    localStorage.setItem('cre_auth_role', 'STUDENT');
    localStorage.setItem('cre_auth_student_id', student.id);
    localStorage.setItem('cre_auth_center', student.centerId);
    router.replace('/student');
  };

  const switchStudentSession = (student: Student) => {
    setSelectedStudent(student);
    setActiveCenterIdState(student.centerId);
    localStorage.setItem('cre_auth_student_id', student.id);
    localStorage.setItem('cre_auth_center', student.centerId);
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

  const updateSuperAdminPhoneAndPin = async (
    newPhone: string,
    newPin?: string,
    newName?: string,
    newPlace?: string
  ) => {
    const cleanPhone = normalizePhoneNumber(newPhone);
    const success = dataService.updateSuperAdminCredentials(cleanPhone, newPin, newName);
    if (success) {
      if (newPlace && cleanPhone) {
        dataService.updateAdminProfile(cleanPhone, { name: newName || 'Super Admin', place: newPlace });
      }
      const updated = dataService.getUserByPhone(cleanPhone);
      if (updated) {
        setAdminUser({ ...updated });
      }
      localStorage.setItem('cre_auth_phone', cleanPhone);
      refreshData();
      return true;
    }
    return false;
  };

  const logout = () => {
    setRole(null);
    setAdminUser(null);
    setSelectedStudent(null);
    setAssociatedStudents([]);
    setActiveCenterIdState(null);

    localStorage.removeItem('cre_auth_role');
    localStorage.removeItem('cre_auth_phone');
    localStorage.removeItem('cre_auth_student_id');
    localStorage.removeItem('cre_auth_center');

    router.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        adminUser,
        selectedStudent,
        associatedStudents,
        activeCenterId,
        activeCenter,
        availableCenters,
        isLoading,
        dataVersion,
        loginAdmin,
        loginStudentPhone,
        selectStudentSession,
        switchStudentSession,
        setActiveCenterId,
        logout,
        completePasswordChange,
        updateCurrentAdminProfile,
        updateSuperAdminPhoneAndPin,
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
