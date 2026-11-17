import {
  AdminUser,
  Center,
  Student,
  AttendanceRecord,
  MonthlyFeeRecord,
  FeePayment,
  Donation,
  Expense,
  Exam,
  ExamMark,
  DonatedContact,
  SystemSettings,
  AuditLog,
  AttendanceStatus,
  FeeStatus,
  ContactStatus,
  ExamMode,
} from '@/types';
import {
  SUPER_ADMIN_DEFAULT_PHONE,
  SUPER_ADMIN_DEFAULT_PASSWORD,
  SUPER_ADMIN_WHATSAPP_RESET,
  KERALA_DISTRICTS,
  normalizePhoneNumber,
  getDefaultPassword,
} from './constants';
import { db, auth, isFirebaseConfigured, getInternalEmail } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  signOut,
} from 'firebase/auth';

// Storage keys for local-first/offline backup
const STORAGE_PREFIX = 'cre_portal_';
const getKey = (key: string) => `${STORAGE_PREFIX}${key}`;

function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(getKey(key));
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getKey(key), JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

// Initial default settings
export const DEFAULT_SETTINGS: SystemSettings = {
  newCenterApprovalMode: 'automatic',
  studentQuickAccessEnabled: true,
  superAdminPhone: SUPER_ADMIN_DEFAULT_PHONE,
  superAdminResetWhatsapp: SUPER_ADMIN_WHATSAPP_RESET,
  districts: [...KERALA_DISTRICTS],
};

// Initial Seed Data: ONLY the primary Super Admin, NO demo data!
function getInitialSeedData() {
  const superAdmin: AdminUser = {
    uid: 'super-admin-01',
    phone: SUPER_ADMIN_DEFAULT_PHONE,
    name: 'Wisdom Super Admin',
    role: 'SUPER_ADMIN',
    centerIds: [],
    passwordPin: SUPER_ADMIN_DEFAULT_PASSWORD, // '9944'
    mustChangePassword: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    users: [superAdmin],
    centers: [] as Center[],
    students: [] as Student[],
    attendance: [] as AttendanceRecord[],
    monthlyFees: [] as MonthlyFeeRecord[],
    feePayments: [] as FeePayment[],
    donations: [] as Donation[],
    expenses: [] as Expense[],
    exams: [] as Exam[],
    examMarks: [] as ExamMark[],
    donatedContacts: [] as DonatedContact[],
    settings: DEFAULT_SETTINGS,
    auditLogs: [] as AuditLog[],
  };
}

class DataService {
  private inited = false;
  private firestoreSynced = false;

  private async syncDocToFirestore(collName: string, id: string, data: any) {
    try {
      if (db && typeof window !== 'undefined') {
        await setDoc(doc(db, collName, id), JSON.parse(JSON.stringify(data)), { merge: true });
      }
    } catch (err) {
      console.warn(`Firestore sync error for ${collName}/${id}:`, err);
    }
  }

  private async deleteDocFromFirestore(collName: string, id: string) {
    try {
      if (db && typeof window !== 'undefined') {
        await deleteDoc(doc(db, collName, id));
      }
    } catch (err) {
      console.warn(`Firestore delete error for ${collName}/${id}:`, err);
    }
  }

  public init() {
    if (this.inited || typeof window === 'undefined') return;

    // 1. One-time clean purge is marked complete without modifying any real data
    localStorage.setItem(getKey('demo_purged_v2'), 'true');

    // 2. Migration for 4-Digit Password PIN
    const v3Done = localStorage.getItem(getKey('migration_v3_4digit_pin'));
    if (!v3Done) {
      const users = getLocal<AdminUser[]>('users', []);
      users.forEach((u) => {
        const norm = normalizePhoneNumber(u.phone);
        const last4 = getDefaultPassword(norm);
        if (!u.passwordPin || u.passwordPin.length !== 4) {
          u.passwordPin = last4;
        }
        // Clear obsolete 8-digit custom password
        const saved = getLocal<string | null>(`pwd_${norm}`, null);
        if (saved && saved.length !== 4) {
          localStorage.removeItem(getKey(`pwd_${norm}`));
        }
      });
      setLocal('users', users);
      localStorage.setItem(getKey('migration_v3_4digit_pin'), 'true');
    }

    // 3. Initial seed if storage is empty
    const existing = localStorage.getItem(getKey('users'));
    if (!existing) {
      const seed = getInitialSeedData();
      setLocal('users', seed.users);
      setLocal('centers', seed.centers);
      setLocal('students', seed.students);
      setLocal('attendance', seed.attendance);
      setLocal('monthlyFees', seed.monthlyFees);
      setLocal('feePayments', seed.feePayments);
      setLocal('donations', seed.donations);
      setLocal('expenses', seed.expenses);
      setLocal('exams', seed.exams);
      setLocal('examMarks', seed.examMarks);
      setLocal('donatedContacts', seed.donatedContacts);
      setLocal('settings', seed.settings);
      setLocal('auditLogs', seed.auditLogs);
    }

    this.inited = true;

    // 4. Background Cloud Sync with Firebase Firestore so added data persists across re-deployments
    if (!this.firestoreSynced && db && typeof window !== 'undefined') {
      this.firestoreSynced = true;
      this.syncWithFirestore();
    }
  }

  public async ensureSynced(): Promise<void> {
    this.init();
    await this.syncWithFirestore();
  }

  public async fetchUserFromFirestore(phone: string): Promise<AdminUser | null> {
    if (!db || typeof window === 'undefined') return null;
    try {
      const norm = normalizePhoneNumber(phone);
      // 1. Try direct Firestore query
      let snap = await getDocs(query(collection(db, 'users'), where('phone', '==', norm)));

      // 2. If not found, fetch all user docs (handles any formatting variations across devices)
      if (snap.empty) {
        snap = await getDocs(collection(db, 'users'));
      }

      if (!snap.empty) {
        const users = this.getUsers();
        let matchedUser: AdminUser | null = null;

        snap.forEach((d) => {
          const u = d.data() as AdminUser;
          const uNorm = normalizePhoneNumber(u.phone);
          const idx = users.findIndex(
            (item) => item.uid === u.uid || normalizePhoneNumber(item.phone) === uNorm
          );
          if (idx >= 0) {
            users[idx] = { ...users[idx], ...u };
          } else {
            users.push(u);
          }

          if (uNorm === norm) {
            matchedUser = u;
          }
        });

        setLocal('users', users);

        // Also sync centers to guarantee the centre object exists on this device
        try {
          const centersSnap = await getDocs(collection(db, 'centers'));
          if (!centersSnap.empty) {
            const localCenters = this.getCenters();
            const mergedCenters = [...localCenters];
            centersSnap.forEach((cd) => {
              const c = cd.data() as Center;
              const cIdx = mergedCenters.findIndex((item) => item.id === c.id);
              if (cIdx >= 0) mergedCenters[cIdx] = c;
              else mergedCenters.push(c);
            });
            setLocal('centers', mergedCenters);
          }
        } catch {
          // Non-critical
        }

        return matchedUser;
      }
    } catch (err) {
      console.warn('Error fetching user from Firestore:', err);
    }
    return null;
  }

  public async fetchStudentsFromFirestore(phone: string): Promise<Student[]> {
    if (!db || typeof window === 'undefined') return [];
    try {
      const norm = normalizePhoneNumber(phone);
      const snap = await getDocs(collection(db, 'students'));
      const matching: Student[] = [];
      const local = getLocal<Student[]>('students', []);
      const merged = [...local];

      snap.forEach((d) => {
        const s = d.data() as Student;
        const pPhone = normalizePhoneNumber(s.parentPhone || '');
        const sPhone = normalizePhoneNumber(s.studentPhone || '');
        if (pPhone === norm || sPhone === norm) {
          matching.push(s);
        }
        const idx = merged.findIndex((x) => x.id === s.id);
        if (idx >= 0) merged[idx] = s;
        else merged.push(s);
      });

      setLocal('students', merged);
      return matching;
    } catch (err) {
      console.warn('Error fetching students from Firestore:', err);
    }
    return [];
  }

  private async syncWithFirestore() {
    if (!db || typeof window === 'undefined') return;
    try {
      const collectionsToSync = [
        'centers',
        'users',
        'students',
        'attendance',
        'monthlyFees',
        'feePayments',
        'expenses',
        'donations',
        'exams',
        'examMarks',
        'donatedContacts',
      ];

      for (const collName of collectionsToSync) {
        try {
          const snap = await getDocs(collection(db, collName));
          const localItems = getLocal<any[]>(collName, []);
          const firestoreItems: any[] = [];
          if (!snap.empty) {
            snap.forEach((d) => firestoreItems.push(d.data()));
          }

          // 1. Inbound: Merge Firestore items into local storage
          const merged = [...localItems];
          firestoreItems.forEach((fi) => {
            const idField = fi.id ? 'id' : fi.uid ? 'uid' : null;
            if (idField) {
              const idx = merged.findIndex((m) => m[idField] === fi[idField]);
              if (idx >= 0) {
                const localTime = new Date(merged[idx].updatedAt || 0).getTime();
                const cloudTime = new Date(fi.updatedAt || 0).getTime();
                if (cloudTime >= localTime) {
                  merged[idx] = fi;
                }
              } else {
                merged.push(fi);
              }
            } else {
              merged.push(fi);
            }
          });
          setLocal(collName, merged);

          // 2. Outbound: Push any local items missing in Firestore up to Firestore
          for (const item of merged) {
            const idField = item.id ? 'id' : item.uid ? 'uid' : null;
            if (idField && item[idField]) {
              const inCloud = firestoreItems.some((fi) => fi[idField] === item[idField]);
              if (!inCloud) {
                await this.syncDocToFirestore(collName, item[idField], item);
              }
            }
          }
        } catch (innerErr) {
          console.warn(`Error syncing collection ${collName}:`, innerErr);
        }
      }
    } catch (err) {
      console.warn('Background Firestore sync (local-first fallback active):', err);
    }
  }

  // AUDIT LOG
  public logAudit(action: string, details: string, performedBy: string, centerId?: string) {
    const logs = getLocal<AuditLog[]>('auditLogs', []);
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      centerId,
      action,
      details,
      performedBy,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    setLocal('auditLogs', logs.slice(0, 500)); // Keep latest 500
  }

  public getAuditLogs(centerId?: string): AuditLog[] {
    this.init();
    const logs = getLocal<AuditLog[]>('auditLogs', []);
    if (centerId) {
      return logs.filter(l => !l.centerId || l.centerId === centerId);
    }
    return logs;
  }

  // SETTINGS
  public getSettings(): SystemSettings {
    this.init();
    return getLocal<SystemSettings>('settings', DEFAULT_SETTINGS);
  }

  public updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.init();
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    setLocal('settings', updated);
    return updated;
  }

  // USERS & AUTH
  public getUsers(): AdminUser[] {
    this.init();
    return getLocal<AdminUser[]>('users', []);
  }

  public getUserByPhone(phone: string): AdminUser | undefined {
    this.init();
    const norm = normalizePhoneNumber(phone);
    return this.getUsers().find(u => normalizePhoneNumber(u.phone) === norm);
  }

  public saveUser(user: AdminUser): void {
    this.init();
    const users = this.getUsers();
    const normPhone = normalizePhoneNumber(user.phone);
    const pin = user.passwordPin || getDefaultPassword(normPhone);
    const idx = users.findIndex(u => u.uid === user.uid || normalizePhoneNumber(u.phone) === normPhone);
    let saved: AdminUser;
    if (idx >= 0) {
      saved = { ...users[idx], ...user, phone: normPhone, passwordPin: pin, updatedAt: new Date().toISOString() };
      users[idx] = saved;
    } else {
      saved = { ...user, phone: normPhone, passwordPin: pin, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      users.push(saved);
    }
    setLocal('users', users);
    this.syncDocToFirestore('users', saved.uid, saved);
  }

  public updateUserPassword(phone: string, newPasswordPlain: string): boolean {
    this.init();
    const users = this.getUsers();
    const norm = normalizePhoneNumber(phone);
    const user = users.find(u => normalizePhoneNumber(u.phone) === norm);
    if (!user) return false;

    user.passwordPin = newPasswordPlain;
    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();
    setLocal('users', users);
    this.syncDocToFirestore('users', user.uid, user);

    // Save custom password locally
    setLocal(`pwd_${norm}`, newPasswordPlain);
    this.logAudit('Password Changed', `User ${user.phone} (${user.role}) changed their 4-digit PIN`, user.name);
    return true;
  }

  public checkUserPassword(phone: string, passwordInput: string): boolean {
    this.init();
    const norm = normalizePhoneNumber(phone);
    const user = this.getUserByPhone(norm);
    if (!user || !user.isActive) return false;

    // 1. Direct passwordPin property on user
    if (user.passwordPin) {
      return user.passwordPin === passwordInput;
    }

    // 2. Local custom PIN
    const savedCustom = getLocal<string | null>(`pwd_${norm}`, null);
    if (savedCustom) {
      return savedCustom === passwordInput;
    }

    // 3. Default password rule: last 4 digits of normalized phone
    const defaultPwd = getDefaultPassword(norm);
    return passwordInput === defaultPwd;
  }

  public resetUserPassword(phone: string, performedBy: string): boolean {
    this.init();
    const norm = normalizePhoneNumber(phone);
    const users = this.getUsers();
    const user = users.find(u => normalizePhoneNumber(u.phone) === norm);
    if (!user) return false;

    const defaultPin = getDefaultPassword(norm);
    user.passwordPin = defaultPin;
    user.mustChangePassword = true;
    user.updatedAt = new Date().toISOString();
    setLocal('users', users);
    this.syncDocToFirestore('users', user.uid, user);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getKey(`pwd_${norm}`));
    }
    this.logAudit('Password Reset', `Password for ${user.phone} reset to default last 4 digits PIN by ${performedBy}`, performedBy);
    return true;
  }

  public updateAdminProfile(phone: string, updates: { name: string; place?: string }): AdminUser | null {
    this.init();
    const users = this.getUsers();
    const norm = normalizePhoneNumber(phone);
    const user = users.find(u => normalizePhoneNumber(u.phone) === norm);
    if (!user) return null;
    user.name = updates.name;
    if (updates.place !== undefined) user.place = updates.place;
    user.updatedAt = new Date().toISOString();
    setLocal('users', users);
    this.syncDocToFirestore('users', user.uid, user);
    this.logAudit('Admin Profile Updated', `Admin details updated for ${phone}`, user.name);
    return user;
  }

  public deleteUser(uid: string, performedBy?: string): boolean {
    this.init();
    const users = this.getUsers();
    const user = users.find(u => u.uid === uid);
    if (!user) return false;

    // Disallow deleting the primary super administrator
    if (user.role === 'SUPER_ADMIN') {
      const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN');
      if (superAdmins.length <= 1) {
        throw new Error('Cannot delete the primary Super Administrator account.');
      }
    }

    const remainingUsers = users.filter(u => u.uid !== uid);
    setLocal('users', remainingUsers);
    this.deleteDocFromFirestore('users', uid);

    // Also remove admin phone from any centers' adminPhones list
    const centers = this.getCenters();
    let centersChanged = false;
    centers.forEach(c => {
      if (c.adminPhones && c.adminPhones.includes(user.phone)) {
        c.adminPhones = c.adminPhones.filter(p => p !== user.phone);
        this.syncDocToFirestore('centers', c.id, c);
        centersChanged = true;
      }
    });
    if (centersChanged) {
      setLocal('centers', centers);
    }

    // Clean up stored password if any
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getKey(`pwd_${normalizePhoneNumber(user.phone)}`));
    }

    this.logAudit('Administrator Deleted', `Administrator ${user.name} (${user.phone}) deleted by ${performedBy || 'Super Admin'}`, performedBy || 'Super Admin');
    return true;
  }

  public registerCenterWithAdmin(params: {
    centerData: Partial<Center> & { name: string; place: string };
    adminPhone: string;
    adminPasswordPlain: string;
    adminName: string;
    adminPlace?: string;
  }): { center: Center; admin: AdminUser } {
    this.init();
    const normPhone = normalizePhoneNumber(params.adminPhone);
    const savedCenter = this.saveCenter({
      ...params.centerData,
      adminPhones: [normPhone],
    });

    let admin = this.getUserByPhone(normPhone);
    if (admin) {
      if (!admin.centerIds.includes(savedCenter.id)) {
        admin.centerIds.push(savedCenter.id);
      }
      admin.name = params.adminName || admin.name;
      if (params.adminPlace) admin.place = params.adminPlace;
      if (params.adminPasswordPlain) admin.passwordPin = params.adminPasswordPlain;
      this.saveUser(admin);
    } else {
      admin = {
        uid: 'admin-' + Date.now().toString(36),
        phone: normPhone,
        name: params.adminName,
        place: params.adminPlace,
        role: 'CENTER_ADMIN',
        centerIds: [savedCenter.id],
        passwordPin: params.adminPasswordPlain || getDefaultPassword(normPhone),
        mustChangePassword: false, // Explicitly set password initially
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.saveUser(admin);
    }

    if (params.adminPasswordPlain) {
      setLocal(`pwd_${normPhone}`, params.adminPasswordPlain);
    }

    this.logAudit(
      'Center Registered with Admin',
      `Center ${savedCenter.name} registered with Admin ${admin.name} (${normPhone})`,
      admin.name,
      savedCenter.id
    );

    return { center: savedCenter, admin };
  }

  // CENTERS
  public getCenters(): Center[] {
    this.init();
    return getLocal<Center[]>('centers', []);
  }

  public getCenterById(id: string): Center | undefined {
    return this.getCenters().find(c => c.id === id);
  }

  public saveCenter(centerData: Partial<Center> & { name: string; place: string }): Center {
    this.init();
    const centers = this.getCenters();
    const settings = this.getSettings();

    let center: Center;
    if (centerData.id) {
      const idx = centers.findIndex(c => c.id === centerData.id);
      if (idx >= 0) {
        center = { ...centers[idx], ...centerData, updatedAt: new Date().toISOString() };
        centers[idx] = center;
      } else {
        center = centerData as Center;
        centers.push(center);
      }
    } else {
      // New Center
      const newId = 'center-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
      const defaultStatus = settings.newCenterApprovalMode === 'automatic' ? 'Active' : 'Pending Approval';
      center = {
        id: newId,
        name: centerData.name,
        place: centerData.place,
        landmark: centerData.landmark || '',
        state: centerData.state || 'Kerala',
        district: centerData.district || 'Malappuram West',
        otherStateName: centerData.otherStateName,
        otherDistrictName: centerData.otherDistrictName,
        zoneOrUnit: centerData.zoneOrUnit || 'Zone',
        zoneName: centerData.zoneName || '',
        unitName: centerData.unitName || '',
        regularDay: centerData.regularDay || 'Sunday',
        startTime: centerData.startTime || '09:00',
        endTime: centerData.endTime || '11:30',
        effectiveDate: centerData.effectiveDate || new Date().toISOString().split('T')[0],
        facultyName: centerData.facultyName || '',
        contactNumbers: centerData.contactNumbers || [],
        status: centerData.status || defaultStatus,
        defaultFee: centerData.defaultFee ?? 100,
        examMode: centerData.examMode || 'semester',
        adminPhones: centerData.adminPhones || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      centers.push(center);
    }
    setLocal('centers', centers);
    this.syncDocToFirestore('centers', center.id, center);
    this.logAudit('Center Saved', `Center ${center.name} (${center.id}) saved with status ${center.status}`, 'Admin', center.id);
    return center;
  }

  public deleteCenter(centerId: string, permanent = false): boolean {
    this.init();
    const centers = this.getCenters();
    const idx = centers.findIndex(c => c.id === centerId);
    if (idx < 0) return false;

    if (permanent) {
      centers.splice(idx, 1);
      this.deleteDocFromFirestore('centers', centerId);
      this.logAudit('Center Permanently Deleted', `Center ${centerId} permanently deleted`, 'Super Admin');
    } else {
      centers[idx].status = 'Archived';
      centers[idx].updatedAt = new Date().toISOString();
      this.syncDocToFirestore('centers', centerId, centers[idx]);
      this.logAudit('Center Archived', `Center ${centerId} archived`, 'Super Admin', centerId);
    }
    setLocal('centers', centers);
    return true;
  }

  public updateCenterStatus(centerId: string, status: Center['status']): boolean {
    this.init();
    const centers = this.getCenters();
    const center = centers.find(c => c.id === centerId);
    if (!center) return false;
    center.status = status;
    center.updatedAt = new Date().toISOString();
    setLocal('centers', centers);
    this.syncDocToFirestore('centers', centerId, center);
    this.logAudit('Center Status Changed', `Center ${center.name} status updated to ${status}`, 'Super Admin', centerId);
    return true;
  }

  // STUDENTS
  public getStudents(centerId?: string): Student[] {
    this.init();
    const list = getLocal<Student[]>('students', []);
    if (centerId) return list.filter(s => s.centerId === centerId);
    return list;
  }

  public getStudentById(studentId: string): Student | undefined {
    this.init();
    return this.getStudents().find(s => s.id === studentId);
  }

  public getStudentsByPhone(phone: string): Student[] {
    this.init();
    const norm = normalizePhoneNumber(phone);
    if (!norm) return [];
    return this.getStudents().filter(s => {
      const pPhone = normalizePhoneNumber(s.parentPhone || '');
      const sPhone = normalizePhoneNumber(s.studentPhone || '');
      return pPhone === norm || sPhone === norm;
    });
  }

  public generateAdmissionNumber(centerId: string): string {
    const students = this.getStudents(centerId);
    const count = students.length + 1;
    const center = this.getCenterById(centerId);
    const code = center ? center.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() : 'CRE';
    return `CRE-${code}-${String(count).padStart(3, '0')}`;
  }

  public saveStudent(studentData: Partial<Student> & { centerId: string; name: string }): Student {
    this.init();
    const students = this.getStudents();
    let student: Student;

    if (studentData.id) {
      const idx = students.findIndex(s => s.id === studentData.id);
      if (idx >= 0) {
        student = { ...students[idx], ...studentData, updatedAt: new Date().toISOString() };
        students[idx] = student;
      } else {
        student = studentData as Student;
        students.push(student);
      }
    } else {
      const center = this.getCenterById(studentData.centerId);
      const newId = 'std-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
      student = {
        id: newId,
        centerId: studentData.centerId,
        admissionNumber: studentData.admissionNumber || this.generateAdmissionNumber(studentData.centerId),
        name: studentData.name,
        gender: studentData.gender || 'Boy',
        parentName: studentData.parentName || '',
        studentPhone: studentData.studentPhone ? normalizePhoneNumber(studentData.studentPhone) : '',
        parentPhone: studentData.parentPhone ? normalizePhoneNumber(studentData.parentPhone) : '',
        place: studentData.place || '',
        admissionDate: studentData.admissionDate || new Date().toISOString().split('T')[0],
        defaultFee: studentData.defaultFee ?? (center?.defaultFee ?? 100),
        status: studentData.status || 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      students.push(student);
    }
    setLocal('students', students);
    this.syncDocToFirestore('students', student.id, student);
    this.logAudit('Student Saved', `Student ${student.name} (${student.admissionNumber}) saved`, 'Admin', student.centerId);
    return student;
  }

  public setStudentStatus(studentId: string, status: 'Active' | 'Inactive'): boolean {
    this.init();
    const students = this.getStudents();
    const s = students.find(item => item.id === studentId);
    if (!s) return false;
    s.status = status;
    s.updatedAt = new Date().toISOString();
    setLocal('students', students);
    this.syncDocToFirestore('students', s.id, s);
    this.logAudit('Student Status Changed', `Student ${s.name} status updated to ${status}`, 'Admin', s.centerId);
    return true;
  }

  public deleteStudent(studentId: string, performedBy?: string): boolean {
    this.init();
    const students = this.getStudents();
    const s = students.find(item => item.id === studentId);
    if (!s) return false;
    const remaining = students.filter(item => item.id !== studentId);
    setLocal('students', remaining);
    this.deleteDocFromFirestore('students', studentId);
    this.logAudit(
      'Student Deleted',
      `Student ${s.name} (${s.admissionNumber}) permanently removed by ${performedBy || 'Admin'}`,
      performedBy || 'Admin',
      s.centerId
    );
    return true;
  }

  // ATTENDANCE
  public getAttendanceRecords(centerId: string, date?: string): AttendanceRecord[] {
    this.init();
    const list = getLocal<AttendanceRecord[]>('attendance', []).filter(a => a.centerId === centerId);
    if (date) return list.filter(a => a.date === date);
    return list;
  }

  public saveAttendance(centerId: string, date: string, records: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>, recordedBy: string): void {
    this.init();
    let allRecords = getLocal<AttendanceRecord[]>('attendance', []);
    // Remove existing records for this center and date (re-saving)
    allRecords = allRecords.filter(a => !(a.centerId === centerId && a.date === date));

    const newRecords: AttendanceRecord[] = records.map(r => ({
      id: `att-${centerId}-${date}-${r.studentId}`,
      centerId,
      date,
      studentId: r.studentId,
      status: r.status,
      remarks: r.remarks,
      recordedBy,
      recordedAt: new Date().toISOString(),
    }));

    allRecords.push(...newRecords);
    setLocal('attendance', allRecords);
    newRecords.forEach(r => this.syncDocToFirestore('attendance', r.id, r));
    this.logAudit('Attendance Saved', `Attendance for date ${date} saved (${newRecords.length} students)`, recordedBy, centerId);
  }

  public calculateStudentAttendance(studentId: string, centerId: string, month?: string) {
    const all = this.getAttendanceRecords(centerId).filter(a => {
      if (a.studentId !== studentId) return false;
      if (month && !a.date.startsWith(month)) return false;
      return true;
    });

    // Total unique class dates conducted for this center
    const allCenterRecords = this.getAttendanceRecords(centerId).filter(a => {
      if (month && !a.date.startsWith(month)) return false;
      return true;
    });
    const uniqueDates = Array.from(new Set(allCenterRecords.map(a => a.date)));
    const totalConducted = uniqueDates.length;

    const present = all.filter(a => a.status === 'Present').length;
    const absent = all.filter(a => a.status === 'Absent').length;
    const leave = all.filter(a => a.status === 'Leave').length;
    const percentage = totalConducted > 0 ? Math.round((present / totalConducted) * 100) : 0;

    return { totalConducted, present, absent, leave, percentage, records: all };
  }

  // MONTHLY FEES & PAYMENTS
  public getMonthlyFees(centerId: string, month?: string): MonthlyFeeRecord[] {
    this.init();
    const list = getLocal<MonthlyFeeRecord[]>('monthlyFees', []).filter(f => f.centerId === centerId);
    if (month) return list.filter(f => f.month === month);
    return list;
  }

  public getFeePayments(centerId?: string, month?: string): FeePayment[] {
    this.init();
    let list = getLocal<FeePayment[]>('feePayments', []);
    if (centerId) list = list.filter(p => p.centerId === centerId);
    if (month) list = list.filter(p => p.month === month);
    return list;
  }

  public recordFeePayment(params: {
    centerId: string;
    studentId: string;
    month: string; // YYYY-MM
    amount: number;
    paymentDate: string;
    remarks?: string;
    recordedBy: string;
  }): FeePayment {
    this.init();
    const payments = getLocal<FeePayment[]>('feePayments', []);
    const paymentId = 'pay-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);

    const payment: FeePayment = {
      id: paymentId,
      centerId: params.centerId,
      studentId: params.studentId,
      month: params.month,
      amount: params.amount,
      paymentDate: params.paymentDate,
      remarks: params.remarks,
      recordedBy: params.recordedBy,
      createdAt: new Date().toISOString(),
    };
    payments.unshift(payment);
    setLocal('feePayments', payments);
    this.syncDocToFirestore('feePayments', payment.id, payment);

    // Update or generate MonthlyFeeRecord
    const student = this.getStudentById(params.studentId);
    const expected = student?.defaultFee ?? 100;
    const monthlyFees = getLocal<MonthlyFeeRecord[]>('monthlyFees', []);
    const idx = monthlyFees.findIndex(m => m.centerId === params.centerId && m.studentId === params.studentId && m.month === params.month);

    const prevPaid = idx >= 0 ? monthlyFees[idx].paidAmount : 0;
    const totalPaid = prevPaid + params.amount;
    const outstanding = Math.max(0, expected - totalPaid);
    const advance = Math.max(0, totalPaid - expected);

    let status: FeeStatus = 'Unpaid';
    if (totalPaid >= expected) {
      status = advance > 0 ? 'Advance / Excess' : 'Paid';
    } else if (totalPaid > 0) {
      status = 'Partially Paid';
    }

    let updatedFeeRecord: MonthlyFeeRecord;
    if (idx >= 0) {
      updatedFeeRecord = {
        ...monthlyFees[idx],
        paidAmount: totalPaid,
        outstandingAmount: outstanding,
        advanceCredit: advance,
        status,
        lastPaymentDate: params.paymentDate,
        remarks: params.remarks || monthlyFees[idx].remarks,
      };
      monthlyFees[idx] = updatedFeeRecord;
    } else {
      updatedFeeRecord = {
        id: `fee-${params.centerId}-${params.month}-${params.studentId}`,
        centerId: params.centerId,
        studentId: params.studentId,
        month: params.month,
        expectedFee: expected,
        paidAmount: totalPaid,
        outstandingAmount: outstanding,
        advanceCredit: advance,
        status,
        lastPaymentDate: params.paymentDate,
        remarks: params.remarks,
      };
      monthlyFees.push(updatedFeeRecord);
    }
    setLocal('monthlyFees', monthlyFees);
    this.syncDocToFirestore('monthlyFees', updatedFeeRecord.id, updatedFeeRecord);

    this.logAudit('Fee Payment Recorded', `Payment of ₹${params.amount} recorded for student ${student?.name || params.studentId} for ${params.month}`, params.recordedBy, params.centerId);
    return payment;
  }

  public updateStudentMonthlyFee(params: {
    centerId: string;
    studentId: string;
    month: string;
    expectedFee: number;
    status?: FeeStatus;
    remarks?: string;
  }): void {
    this.init();
    const monthlyFees = getLocal<MonthlyFeeRecord[]>('monthlyFees', []);
    const idx = monthlyFees.findIndex(m => m.centerId === params.centerId && m.studentId === params.studentId && m.month === params.month);

    let feeRec: MonthlyFeeRecord;
    if (idx >= 0) {
      const rec = monthlyFees[idx];
      rec.expectedFee = params.expectedFee;
      rec.outstandingAmount = Math.max(0, params.expectedFee - rec.paidAmount);
      rec.advanceCredit = Math.max(0, rec.paidAmount - params.expectedFee);
      if (params.status) rec.status = params.status;
      if (params.remarks) rec.remarks = params.remarks;
      feeRec = rec;
    } else {
      feeRec = {
        id: `fee-${params.centerId}-${params.month}-${params.studentId}`,
        centerId: params.centerId,
        studentId: params.studentId,
        month: params.month,
        expectedFee: params.expectedFee,
        paidAmount: 0,
        outstandingAmount: params.expectedFee,
        advanceCredit: 0,
        status: params.status || 'Unpaid',
        remarks: params.remarks,
      };
      monthlyFees.push(feeRec);
    }
    setLocal('monthlyFees', monthlyFees);
    this.syncDocToFirestore('monthlyFees', feeRec.id, feeRec);
  }

  // DONATIONS
  public getDonations(centerId?: string, month?: string): Donation[] {
    this.init();
    let list = getLocal<Donation[]>('donations', []);
    if (centerId) list = list.filter(d => d.centerId === centerId);
    if (month) list = list.filter(d => d.date.startsWith(month));
    return list;
  }

  public addDonation(params: Omit<Donation, 'id' | 'createdAt'>): Donation {
    this.init();
    const donations = getLocal<Donation[]>('donations', []);
    const newDonation: Donation = {
      id: 'don-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      ...params,
      createdAt: new Date().toISOString(),
    };
    donations.unshift(newDonation);
    setLocal('donations', donations);
    this.syncDocToFirestore('donations', newDonation.id, newDonation);
    this.logAudit('Donation Added', `Donation of ₹${newDonation.amount} recorded from ${newDonation.donorName || 'Anonymous'}`, newDonation.recordedBy, newDonation.centerId);
    return newDonation;
  }

  // EXPENSES
  public getExpenses(centerId?: string, month?: string): Expense[] {
    this.init();
    let list = getLocal<Expense[]>('expenses', []);
    if (centerId) list = list.filter(e => e.centerId === centerId);
    if (month) list = list.filter(e => e.date.startsWith(month));
    return list;
  }

  public addExpense(params: Omit<Expense, 'id' | 'createdAt'>): Expense {
    this.init();
    const expenses = getLocal<Expense[]>('expenses', []);
    const newExpense: Expense = {
      id: 'exp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      ...params,
      createdAt: new Date().toISOString(),
    };
    expenses.unshift(newExpense);
    setLocal('expenses', expenses);
    this.syncDocToFirestore('expenses', newExpense.id, newExpense);
    this.logAudit('Expense Recorded', `Expense ₹${newExpense.amount} (${newExpense.category}) recorded`, newExpense.recordedBy, newExpense.centerId);
    return newExpense;
  }

  public deleteExpense(expenseId: string, performedBy: string): boolean {
    this.init();
    const expenses = getLocal<Expense[]>('expenses', []);
    const idx = expenses.findIndex(e => e.id === expenseId);
    if (idx < 0) return false;
    const removed = expenses.splice(idx, 1)[0];
    setLocal('expenses', expenses);
    this.deleteDocFromFirestore('expenses', expenseId);
    this.logAudit('Expense Deleted', `Expense of ₹${removed.amount} (${removed.category}) deleted`, performedBy, removed.centerId);
    return true;
  }

  // FINANCIAL SUMMARY CALCULATIONS
  public getFinancialSummary(centerId?: string, month?: string) {
    const feePayments = this.getFeePayments(centerId, month);
    const totalFeeIncome = feePayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const donations = this.getDonations(centerId, month);
    const totalDonationIncome = donations.reduce((acc, d) => acc + (d.amount || 0), 0);

    const totalIncome = totalFeeIncome + totalDonationIncome;

    const expenses = this.getExpenses(centerId, month);
    const weeklyExpenses = expenses.filter(e => e.type === 'weekly');
    const otherExpenses = expenses.filter(e => e.type === 'other');

    const totalWeeklyExpense = weeklyExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalOtherExpense = otherExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalExpenses = totalWeeklyExpense + totalOtherExpense;

    const netBalance = totalIncome - totalExpenses;

    return {
      totalFeeIncome,
      totalDonationIncome,
      totalIncome,
      totalWeeklyExpense,
      totalOtherExpense,
      totalExpenses,
      netBalance,
    };
  }

  // EXAMINATIONS
  public getExams(centerId: string): Exam[] {
    this.init();
    return getLocal<Exam[]>('exams', []).filter(e => e.centerId === centerId);
  }

  public getExamById(examId: string): Exam | undefined {
    this.init();
    return getLocal<Exam[]>('exams', []).find(e => e.id === examId);
  }

  public saveExam(examData: Partial<Exam> & { centerId: string; name: string; date: string }): Exam {
    this.init();
    const exams = getLocal<Exam[]>('exams', []);
    let exam: Exam;

    if (examData.id) {
      const idx = exams.findIndex(e => e.id === examData.id);
      if (idx >= 0) {
        exam = { ...exams[idx], ...examData };
        exams[idx] = exam;
      } else {
        exam = examData as Exam;
        exams.push(exam);
      }
    } else {
      const newId = 'exam-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
      exam = {
        id: newId,
        centerId: examData.centerId,
        name: examData.name,
        mode: examData.mode || 'semester',
        semesterName: examData.semesterName,
        portion: examData.portion,
        date: examData.date,
        subjects: examData.subjects || [],
        createdAt: new Date().toISOString(),
      };
      exams.push(exam);
    }
    setLocal('exams', exams);
    this.syncDocToFirestore('exams', exam.id, exam);
    this.logAudit('Exam Saved', `Exam ${exam.name} saved for center ${exam.centerId}`, 'Admin', exam.centerId);
    return exam;
  }

  public deleteExam(examId: string, performedBy: string): boolean {
    this.init();
    const exams = getLocal<Exam[]>('exams', []);
    const idx = exams.findIndex(e => e.id === examId);
    if (idx < 0) return false;
    const removed = exams.splice(idx, 1)[0];
    setLocal('exams', exams);
    this.deleteDocFromFirestore('exams', examId);
    this.logAudit('Exam Deleted', `Exam ${removed.name} deleted`, performedBy, removed.centerId);
    return true;
  }

  public getExamMarks(centerId: string, examId?: string, studentId?: string): ExamMark[] {
    this.init();
    let marks = getLocal<ExamMark[]>('examMarks', []).filter(m => m.centerId === centerId);
    if (examId) marks = marks.filter(m => m.examId === examId);
    if (studentId) marks = marks.filter(m => m.studentId === studentId);
    return marks;
  }

  public saveExamMarks(centerId: string, examId: string, marksList: Array<{ subjectId: string; studentId: string; marksObtained: number; maxMarks: number; isPassed: boolean; remarks?: string }>): void {
    this.init();
    let allMarks = getLocal<ExamMark[]>('examMarks', []);
    // Remove existing marks for this exam and replace
    allMarks = allMarks.filter(m => !(m.centerId === centerId && m.examId === examId));

    const newMarks: ExamMark[] = marksList.map(m => ({
      id: `mark-${examId}-${m.subjectId}-${m.studentId}`,
      centerId,
      examId,
      subjectId: m.subjectId,
      studentId: m.studentId,
      marksObtained: m.marksObtained,
      maxMarks: m.maxMarks,
      isPassed: m.isPassed,
      remarks: m.remarks,
      enteredAt: new Date().toISOString(),
    }));

    allMarks.push(...newMarks);
    setLocal('examMarks', allMarks);
    newMarks.forEach(m => this.syncDocToFirestore('examMarks', m.id, m));
    this.logAudit('Exam Marks Recorded', `Marks recorded for exam ${examId} (${newMarks.length} records)`, 'Admin', centerId);
  }

  // DONATED CONTACTS
  public getDonatedContacts(centerId?: string): DonatedContact[] {
    this.init();
    const list = getLocal<DonatedContact[]>('donatedContacts', []);
    if (centerId) return list.filter(c => c.centerId === centerId);
    return list;
  }

  public addDonatedContact(params: {
    centerId: string;
    name: string;
    phone: string;
    place: string;
    remarks?: string;
    submittedByStudentId?: string;
  }): { success: boolean; contact?: DonatedContact; warningDuplicate?: boolean } {
    this.init();
    const normPhone = normalizePhoneNumber(params.phone);
    const existing = this.getDonatedContacts(params.centerId);
    const isDuplicate = existing.some(c => normalizePhoneNumber(c.phone) === normPhone);

    const contacts = getLocal<DonatedContact[]>('donatedContacts', []);
    const newContact: DonatedContact = {
      id: 'dc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      centerId: params.centerId,
      name: params.name,
      phone: normPhone,
      place: params.place,
      remarks: params.remarks,
      status: 'New',
      submittedByStudentId: params.submittedByStudentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contacts.unshift(newContact);
    setLocal('donatedContacts', contacts);
    this.syncDocToFirestore('donatedContacts', newContact.id, newContact);
    this.logAudit('Contact Donated', `New admission lead ${newContact.name} (${newContact.phone}) submitted`, 'User', newContact.centerId);

    return { success: true, contact: newContact, warningDuplicate: isDuplicate };
  }

  public updateDonatedContactStatus(contactId: string, status: ContactStatus, performedBy: string): boolean {
    this.init();
    const contacts = getLocal<DonatedContact[]>('donatedContacts', []);
    const c = contacts.find(item => item.id === contactId);
    if (!c) return false;
    c.status = status;
    c.updatedAt = new Date().toISOString();
    setLocal('donatedContacts', contacts);
    this.syncDocToFirestore('donatedContacts', c.id, c);
    this.logAudit('Contact Status Updated', `Lead ${c.name} status updated to ${status}`, performedBy, c.centerId);
    return true;
  }

  public deleteDonatedContact(contactId: string, performedBy: string): boolean {
    this.init();
    const contacts = getLocal<DonatedContact[]>('donatedContacts', []);
    const idx = contacts.findIndex(c => c.id === contactId);
    if (idx < 0) return false;
    const removed = contacts.splice(idx, 1)[0];
    setLocal('donatedContacts', contacts);
    this.deleteDocFromFirestore('donatedContacts', contactId);
    this.logAudit('Contact Deleted', `Lead ${removed.name} deleted`, performedBy, removed.centerId);
    return true;
  }

  // EXPORT / BACKUP
  public exportData(centerId?: string) {
    this.init();
    const dump = {
      exportDate: new Date().toISOString(),
      centerId: centerId || 'ALL',
      centers: centerId ? this.getCenters().filter(c => c.id === centerId) : this.getCenters(),
      students: this.getStudents(centerId),
      attendance: centerId ? this.getAttendanceRecords(centerId) : getLocal<AttendanceRecord[]>('attendance', []),
      feePayments: this.getFeePayments(centerId),
      monthlyFees: centerId ? this.getMonthlyFees(centerId) : getLocal<MonthlyFeeRecord[]>('monthlyFees', []),
      donations: this.getDonations(centerId),
      expenses: this.getExpenses(centerId),
      exams: centerId ? this.getExams(centerId) : getLocal<Exam[]>('exams', []),
      examMarks: centerId ? this.getExamMarks(centerId) : getLocal<ExamMark[]>('examMarks', []),
      donatedContacts: this.getDonatedContacts(centerId),
    };
    return dump;
  }
}

export const dataService = new DataService();
