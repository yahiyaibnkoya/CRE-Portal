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
  Faculty,
  FacultyStatus,
  ClassNotHeld,
  SystemSettings,
  AuditLog,
  AttendanceStatus,
  FeeStatus,
  ContactStatus,
  ExamMode,
  StudentStatus,
  CenterStatus,
} from '@/types';
import {
  SUPER_ADMIN_DEFAULT_PHONE,
  SUPER_ADMIN_DEFAULT_PASSWORD,
  SUPER_ADMIN_WHATSAPP_RESET,
  KERALA_DISTRICTS,
  normalizePhoneNumber,
  getDefaultPassword,
} from './constants';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

// Initial default settings
export const DEFAULT_SETTINGS: SystemSettings = {
  newCenterApprovalMode: 'automatic',
  studentQuickAccessEnabled: true,
  superAdminPhone: SUPER_ADMIN_DEFAULT_PHONE,
  superAdminResetWhatsapp: SUPER_ADMIN_WHATSAPP_RESET,
  districts: [...KERALA_DISTRICTS],
};

function getDefaultSuperAdmin(): AdminUser {
  return {
    uid: 'super-admin-01',
    phone: SUPER_ADMIN_DEFAULT_PHONE,
    name: 'Wisdom Super Admin',
    role: 'SUPER_ADMIN',
    centerIds: [],
    passwordPin: SUPER_ADMIN_DEFAULT_PASSWORD, // '9944'
    mustChangePassword: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

class DataService {
  private inited = false;
  private syncing = false;
  private realtimeActive = false;
  private listeners: Set<() => void> = new Set();
  private unsubs: Unsubscribe[] = [];

  // In-memory cache: Sole runtime store populated directly from Firestore
  // NEVER persisted to LocalStorage!
  private cache = {
    users: [getDefaultSuperAdmin()] as AdminUser[],
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
    faculties: [] as Faculty[],
    classNotHeld: [] as ClassNotHeld[],
    settings: DEFAULT_SETTINGS,
    auditLogs: [] as AuditLog[],
  };

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  public notifyListeners(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('DataService listener error:', err);
      }
    });
  }

  public async syncDocToFirestore(collName: string, id: string, data: any) {
    try {
      if (db && typeof window !== 'undefined') {
        await setDoc(doc(db, collName, id), JSON.parse(JSON.stringify(data)), { merge: true });
      }
    } catch (err) {
      console.warn(`Firestore sync error for ${collName}/${id}:`, err);
    }
  }

  public async deleteDocFromFirestore(collName: string, id: string) {
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
    this.inited = true;

    // RULE ENFORCEMENT: Purge any legacy cre_portal_* keys from browser localStorage
    // No application data is EVER kept in localStorage!
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cre_portal_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // LocalStorage access check
    }

    // Start background sync & realtime listeners
    this.syncWithFirestore();
    this.startRealtimeSync();
  }

  private startRealtimeSync() {
    const firestoreDb = db;
    if (!firestoreDb || typeof window === 'undefined' || this.realtimeActive) return;
    this.realtimeActive = true;

    const collectionsToListen: Array<keyof typeof this.cache> = [
      'users',
      'centers',
      'students',
      'attendance',
      'monthlyFees',
      'feePayments',
      'donations',
      'expenses',
      'exams',
      'examMarks',
      'donatedContacts',
      'faculties',
      'classNotHeld',
      'auditLogs',
    ];

    collectionsToListen.forEach((collName) => {
      try {
        const unsub = onSnapshot(
          collection(firestoreDb, collName),
          (snap) => {
            const items: any[] = [];
            snap.forEach((d) => items.push(d.data()));

            if (collName === 'users') {
              if (items.length > 0) {
                this.cache.users = items as AdminUser[];
              }
            } else {
              (this.cache as any)[collName] = items;
            }
            this.notifyListeners();
          },
          (err) => {
            console.warn(`Realtime listener error for ${collName}:`, err);
          }
        );
        this.unsubs.push(unsub);
      } catch (e) {
        console.warn(`Could not attach realtime listener for ${collName}:`, e);
      }
    });

    // Realtime listener for settings
    try {
      const unsubSet = onSnapshot(collection(firestoreDb, 'settings'), (snap) => {
        if (!snap.empty) {
          this.cache.settings = { ...DEFAULT_SETTINGS, ...snap.docs[0].data() };
          this.notifyListeners();
        }
      });
      this.unsubs.push(unsubSet);
    } catch {
      // Non-critical
    }
  }

  public async ensureSynced(): Promise<void> {
    this.init();
    await this.syncWithFirestore();
  }

  public async syncWithFirestore(): Promise<void> {
    if (!db || typeof window === 'undefined' || this.syncing) return;
    this.syncing = true;

    try {
      const collectionsToSync: Array<keyof typeof this.cache> = [
        'users',
        'centers',
        'students',
        'attendance',
        'monthlyFees',
        'feePayments',
        'donations',
        'expenses',
        'exams',
        'examMarks',
        'donatedContacts',
        'faculties',
        'classNotHeld',
        'auditLogs',
      ];

      for (const collName of collectionsToSync) {
        try {
          const snap = await getDocs(collection(db, collName));
          const items: any[] = [];
          snap.forEach((d) => items.push(d.data()));

          if (collName === 'users') {
            if (items.length === 0) {
              const defAdmin = getDefaultSuperAdmin();
              this.cache.users = [defAdmin];
              await this.syncDocToFirestore('users', defAdmin.uid, defAdmin);
            } else {
              this.cache.users = items as AdminUser[];
            }
          } else {
            (this.cache as any)[collName] = items;
          }
        } catch (innerErr) {
          console.warn(`Error pulling collection ${collName} from Firestore:`, innerErr);
        }
      }

      // Settings doc sync
      try {
        const setSnap = await getDocs(collection(db, 'settings'));
        if (!setSnap.empty) {
          this.cache.settings = { ...DEFAULT_SETTINGS, ...setSnap.docs[0].data() };
        }
      } catch {
        // Non-critical
      }
      this.notifyListeners();
    } catch (err) {
      console.warn('Firestore sync error:', err);
    } finally {
      this.syncing = false;
    }
  }

  public async fetchUserFromFirestore(phone: string): Promise<AdminUser | null> {
    if (!db || typeof window === 'undefined') return null;
    try {
      const norm = normalizePhoneNumber(phone);
      let snap = await getDocs(query(collection(db, 'users'), where('phone', '==', norm)));
      if (snap.empty) {
        snap = await getDocs(collection(db, 'users'));
      }

      if (!snap.empty) {
        let matchedUser: AdminUser | null = null;
        snap.forEach((d) => {
          const u = d.data() as AdminUser;
          const uNorm = normalizePhoneNumber(u.phone);
          const idx = this.cache.users.findIndex(
            (item) => item.uid === u.uid || normalizePhoneNumber(item.phone) === uNorm
          );
          if (idx >= 0) this.cache.users[idx] = { ...this.cache.users[idx], ...u };
          else this.cache.users.push(u);

          if (uNorm === norm) {
            matchedUser = u;
          }
        });
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

      snap.forEach((d) => {
        const s = d.data() as Student;
        const pPhone = normalizePhoneNumber(s.parentPhone || '');
        const sPhone = normalizePhoneNumber(s.studentPhone || '');
        if (pPhone === norm || sPhone === norm) {
          matching.push(s);
        }
        const idx = this.cache.students.findIndex((x) => x.id === s.id);
        if (idx >= 0) this.cache.students[idx] = s;
        else this.cache.students.push(s);
      });

      return matching;
    } catch (err) {
      console.warn('Error fetching students from Firestore:', err);
      return [];
    }
  }

  // AUDIT LOG
  public logAudit(action: string, details: string, performedBy: string, centerId?: string) {
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      centerId,
      action,
      details,
      performedBy,
      timestamp: new Date().toISOString(),
    };
    this.cache.auditLogs.unshift(newLog);
    this.syncDocToFirestore('auditLogs', newLog.id, newLog);
  }

  public getAuditLogs(centerId?: string): AuditLog[] {
    this.init();
    if (centerId) {
      return this.cache.auditLogs.filter((l) => !l.centerId || l.centerId === centerId);
    }
    return this.cache.auditLogs;
  }

  // SETTINGS
  public getSettings(): SystemSettings {
    this.init();
    return this.cache.settings;
  }

  public updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.init();
    this.cache.settings = { ...this.cache.settings, ...settings };
    this.syncDocToFirestore('settings', 'global', this.cache.settings);
    return this.cache.settings;
  }

  // USERS & AUTH
  public getUsers(): AdminUser[] {
    this.init();
    return this.cache.users;
  }

  public getUserByPhone(phone: string): AdminUser | undefined {
    this.init();
    const norm = normalizePhoneNumber(phone);
    return this.cache.users.find((u) => normalizePhoneNumber(u.phone) === norm);
  }

  public saveUser(user: AdminUser): void {
    this.init();
    const normPhone = normalizePhoneNumber(user.phone);
    const pin = user.passwordPin || getDefaultPassword(normPhone);
    const idx = this.cache.users.findIndex(
      (u) => u.uid === user.uid || normalizePhoneNumber(u.phone) === normPhone
    );
    let saved: AdminUser;
    if (idx >= 0) {
      saved = { ...this.cache.users[idx], ...user, phone: normPhone, passwordPin: pin, updatedAt: new Date().toISOString() };
      this.cache.users[idx] = saved;
    } else {
      saved = { ...user, phone: normPhone, passwordPin: pin, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      this.cache.users.push(saved);
    }
    this.syncDocToFirestore('users', saved.uid, saved);
  }

  public updateUserPassword(phone: string, newPasswordPlain: string): boolean {
    this.init();
    const norm = normalizePhoneNumber(phone);
    const user = this.cache.users.find((u) => normalizePhoneNumber(u.phone) === norm);
    if (!user) return false;

    user.passwordPin = newPasswordPlain;
    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();
    this.syncDocToFirestore('users', user.uid, user);
    this.logAudit('Password Changed', `User ${user.phone} (${user.role}) changed their 4-digit PIN`, user.name);
    return true;
  }

  public updateSuperAdminCredentials(newPhone: string, newPin?: string, newName?: string): boolean {
    this.init();
    const normPhone = normalizePhoneNumber(newPhone);
    const superAdmin = this.cache.users.find((u) => u.role === 'SUPER_ADMIN');
    if (!superAdmin) return false;

    superAdmin.phone = normPhone;
    if (newPin && newPin.length === 4) {
      superAdmin.passwordPin = newPin;
    }
    if (newName) {
      superAdmin.name = newName;
    }
    superAdmin.updatedAt = new Date().toISOString();

    // Update settings superAdminPhone
    this.cache.settings.superAdminPhone = normPhone;
    this.syncDocToFirestore('settings', 'global', this.cache.settings);

    // Save user in Firestore
    this.syncDocToFirestore('users', superAdmin.uid, superAdmin);
    this.logAudit('Super Admin Updated', `Super Admin contact/credentials updated to ${normPhone}`, 'Super Admin');
    return true;
  }

  public checkUserPassword(phone: string, passwordInput: string): boolean {
    this.init();
    const norm = normalizePhoneNumber(phone);
    const user = this.getUserByPhone(norm);
    if (!user || !user.isActive) return false;

    if (user.passwordPin) {
      return user.passwordPin === passwordInput;
    }
    const defaultPwd = getDefaultPassword(norm);
    return passwordInput === defaultPwd;
  }

  public resetUserPassword(phone: string, performedBy: string): boolean {
    const norm = normalizePhoneNumber(phone);
    const user = this.getUserByPhone(norm);
    if (!user) return false;

    const defaultPin = getDefaultPassword(norm);
    user.passwordPin = defaultPin;
    user.mustChangePassword = true;
    user.updatedAt = new Date().toISOString();
    this.syncDocToFirestore('users', user.uid, user);
    this.logAudit('Password Reset', `Password for ${user.phone} reset to default last 4 digits PIN by ${performedBy}`, performedBy);
    return true;
  }

  public deleteUser(userId: string): { success: boolean; error?: string } {
    this.init();
    const user = this.cache.users.find((u) => u.uid === userId);
    if (!user) return { success: false, error: 'User not found.' };

    if (user.role === 'SUPER_ADMIN') {
      const allSuperAdmins = this.cache.users.filter((u) => u.role === 'SUPER_ADMIN');
      if (allSuperAdmins.length <= 1) {
        return {
          success: false,
          error: 'The primary Super Admin account cannot be deleted unless another Super Admin is added first.',
        };
      }
    }

    this.cache.users = this.cache.users.filter((u) => u.uid !== userId);
    this.deleteDocFromFirestore('users', userId);

    // Remove user phone from any assigned center's admin list
    this.cache.centers.forEach((c) => {
      if (c.adminPhones.includes(user.phone)) {
        c.adminPhones = c.adminPhones.filter((p) => p !== user.phone);
        this.syncDocToFirestore('centers', c.id, c);
      }
    });

    this.logAudit('Administrator Deleted', `Administrator ${user.name} (${user.phone}) deleted`, 'Super Admin');
    return { success: true };
  }

  public updateAdminProfile(phone: string, updates: { name: string; place?: string }): AdminUser | null {
    this.init();
    const norm = normalizePhoneNumber(phone);
    const user = this.cache.users.find((u) => normalizePhoneNumber(u.phone) === norm);
    if (!user) return null;

    user.name = updates.name;
    if (updates.place !== undefined) user.place = updates.place;
    user.updatedAt = new Date().toISOString();
    this.syncDocToFirestore('users', user.uid, user);
    this.logAudit('Profile Updated', `Admin profile updated for ${user.phone}`, user.name);
    return user;
  }

  // FACULTIES
  public getFaculties(status?: FacultyStatus): Faculty[] {
    this.init();
    if (status) {
      return this.cache.faculties.filter((f) => f.status === status);
    }
    return this.cache.faculties;
  }

  public getFacultyById(id: string): Faculty | undefined {
    this.init();
    return this.cache.faculties.find((f) => f.id === id);
  }

  public saveFaculty(facultyData: Partial<Faculty>, performedBy: string = 'Super Admin'): Faculty {
    this.init();
    const now = new Date().toISOString();
    let saved: Faculty;
    const phoneNorm = facultyData.phone ? normalizePhoneNumber(facultyData.phone) : '';

    if (facultyData.id) {
      const idx = this.cache.faculties.findIndex((f) => f.id === facultyData.id);
      if (idx >= 0) {
        saved = {
          ...this.cache.faculties[idx],
          ...facultyData,
          phone: phoneNorm || this.cache.faculties[idx].phone || '',
          updatedAt: now,
        } as Faculty;
        this.cache.faculties[idx] = saved;
      } else {
        saved = {
          id: facultyData.id,
          name: facultyData.name || 'Faculty Member',
          phone: phoneNorm,
          place: facultyData.place || '',
          qualification: facultyData.qualification || '',
          status: facultyData.status || 'Approved',
          assignedCenterIds: facultyData.assignedCenterIds || [],
          notes: facultyData.notes || '',
          createdAt: now,
          updatedAt: now,
        };
        this.cache.faculties.push(saved);
      }
    } else {
      const id = 'fac-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
      saved = {
        id,
        name: facultyData.name || 'Faculty Member',
        phone: phoneNorm,
        place: facultyData.place || '',
        qualification: facultyData.qualification || '',
        status: facultyData.status || 'Approved',
        assignedCenterIds: facultyData.assignedCenterIds || [],
        notes: facultyData.notes || '',
        createdAt: now,
        updatedAt: now,
      };
      this.cache.faculties.push(saved);
    }

    this.notifyListeners();
    this.syncDocToFirestore('faculties', saved.id, saved);
    this.logAudit('Faculty Saved', `Faculty ${saved.name} (${saved.phone || 'No phone'}) saved by ${performedBy}`, performedBy);
    return saved;
  }

  public approveFaculty(facultyId: string, performedBy: string = 'Super Admin'): boolean {
    this.init();
    const faculty = this.cache.faculties.find((f) => f.id === facultyId);
    if (!faculty) return false;

    faculty.status = 'Approved';
    faculty.updatedAt = new Date().toISOString();
    this.syncDocToFirestore('faculties', faculty.id, faculty);
    this.logAudit('Faculty Approved', `Faculty ${faculty.name} approved by ${performedBy}`, performedBy);
    return true;
  }

  public deleteFaculty(facultyId: string, performedBy: string = 'Super Admin'): boolean {
    this.init();
    const faculty = this.cache.faculties.find((f) => f.id === facultyId);
    if (!faculty) return false;

    this.cache.faculties = this.cache.faculties.filter((f) => f.id !== facultyId);
    this.deleteDocFromFirestore('faculties', facultyId);
    this.logAudit('Faculty Deleted', `Faculty ${faculty.name} removed by ${performedBy}`, performedBy);
    return true;
  }

  // CENTERS
  public getCenters(): Center[] {
    this.init();
    return this.cache.centers;
  }

  public getCenterById(id: string): Center | undefined {
    this.init();
    return this.cache.centers.find((c) => c.id === id);
  }

  public saveCenter(center: Partial<Center> & { id?: string }): Center {
    this.init();
    const now = new Date().toISOString();
    let target: Center;

    if (center.id) {
      const idx = this.cache.centers.findIndex((c) => c.id === center.id);
      if (idx >= 0) {
        target = {
          ...this.cache.centers[idx],
          ...center,
          updatedAt: now,
        } as Center;
        this.cache.centers[idx] = target;
      } else {
        target = {
          name: center.name || 'CRE Centre',
          place: center.place || '',
          state: center.state || 'Kerala',
          district: center.district || 'Malappuram',
          zoneOrUnit: center.zoneOrUnit || 'Unit',
          regularDay: center.regularDay || 'Sunday',
          startTime: center.startTime || '09:00',
          endTime: center.endTime || '12:00',
          effectiveDate: center.effectiveDate || now.split('T')[0],
          examMode: center.examMode || 'semester',
          contactNumbers: center.contactNumbers || [],
          defaultFee: center.defaultFee || 100,
          status: center.status || 'Active',
          adminPhones: center.adminPhones || [],
          createdAt: now,
          updatedAt: now,
          ...center,
          id: center.id,
        } as Center;
        this.cache.centers.push(target);
      }
    } else {
      const newId = 'center-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
      target = {
        name: center.name || 'CRE Centre',
        place: center.place || '',
        state: center.state || 'Kerala',
        district: center.district || 'Malappuram',
        zoneOrUnit: center.zoneOrUnit || 'Unit',
        regularDay: center.regularDay || 'Sunday',
        startTime: center.startTime || '09:00',
        endTime: center.endTime || '12:00',
        effectiveDate: center.effectiveDate || now.split('T')[0],
        examMode: center.examMode || 'semester',
        contactNumbers: center.contactNumbers || [],
        defaultFee: center.defaultFee || 100,
        status: center.status || 'Active',
        adminPhones: center.adminPhones || [],
        createdAt: now,
        updatedAt: now,
        ...center,
        id: newId,
      } as Center;
      this.cache.centers.push(target);
    }

    this.notifyListeners();
    this.syncDocToFirestore('centers', target.id, target);
    this.logAudit('Center Saved', `Center ${target.name} (${target.place}) updated/created`, 'Admin', target.id);
    return target;
  }

  public deleteCenter(centerId: string, permanent: boolean = false): boolean {
    this.init();
    const center = this.getCenterById(centerId);
    if (!center) return false;

    if (permanent) {
      this.cache.centers = this.cache.centers.filter((c) => c.id !== centerId);
      this.notifyListeners();
      this.deleteDocFromFirestore('centers', centerId);
      this.logAudit('Center Deleted', `Center ${center.name} permanently deleted`, 'Super Admin');
    } else {
      center.status = 'Archived';
      center.updatedAt = new Date().toISOString();
      this.notifyListeners();
      this.syncDocToFirestore('centers', center.id, center);
      this.logAudit('Center Archived', `Center ${center.name} archived`, 'Super Admin', centerId);
    }
    return true;
  }

  public updateCenterStatus(centerId: string, status: CenterStatus): boolean {
    this.init();
    const center = this.getCenterById(centerId);
    if (!center) return false;
    center.status = status;
    center.updatedAt = new Date().toISOString();
    this.notifyListeners();
    this.syncDocToFirestore('centers', center.id, center);
    this.logAudit('Center Status Changed', `Center ${center.name} status updated to ${status}`, 'Super Admin', centerId);
    return true;
  }

  public registerCenterWithAdmin(params: {
    centerData: Omit<Center, 'id' | 'adminPhones' | 'createdAt' | 'updatedAt' | 'contactNumbers' | 'examMode' | 'effectiveDate'> & {
      contactNumbers?: string[];
      effectiveDate?: string;
      examMode?: ExamMode;
    };
    adminPhone: string;
    adminPasswordPlain?: string;
    adminName?: string;
    adminPlace?: string;
  }): { center: Center; admin: AdminUser } {
    this.init();
    const centerId = 'center-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
    const cleanAdminPhone = normalizePhoneNumber(params.adminPhone);

    const center: Center = {
      ...params.centerData,
      id: centerId,
      contactNumbers: params.centerData.contactNumbers || [cleanAdminPhone],
      effectiveDate: params.centerData.effectiveDate || new Date().toISOString().split('T')[0],
      examMode: params.centerData.examMode || 'semester',
      adminPhones: [cleanAdminPhone],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let admin = this.getUserByPhone(cleanAdminPhone);
    if (admin) {
      if (!admin.centerIds.includes(centerId)) {
        admin.centerIds.push(centerId);
      }
      admin.name = params.adminName || admin.name;
      admin.place = params.adminPlace || admin.place || center.place;
      if (params.adminPasswordPlain) admin.passwordPin = params.adminPasswordPlain;
      admin.updatedAt = new Date().toISOString();
    } else {
      admin = {
        uid: 'admin-' + Date.now().toString(36),
        phone: cleanAdminPhone,
        name: params.adminName || 'Centre Admin',
        place: params.adminPlace || center.place,
        role: 'CENTER_ADMIN',
        centerIds: [centerId],
        passwordPin: params.adminPasswordPlain || getDefaultPassword(cleanAdminPhone),
        mustChangePassword: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.cache.users.push(admin);
    }

    this.cache.centers.push(center);
    this.syncDocToFirestore('centers', center.id, center);
    this.syncDocToFirestore('users', admin.uid, admin);

    this.logAudit(
      'Center Registered',
      `New centre ${center.name} registered with Admin ${admin.name} (${admin.phone})`,
      'System',
      centerId
    );

    return { center, admin };
  }

  // STUDENTS
  public getStudents(centerId?: string): Student[] {
    this.init();
    if (centerId && centerId !== 'ALL') {
      return this.cache.students.filter((s) => s.centerId === centerId);
    }
    return this.cache.students;
  }

  public getStudentById(id: string): Student | undefined {
    this.init();
    return this.cache.students.find((s) => s.id === id);
  }

  public getStudentsByPhone(phone: string): Student[] {
    this.init();
    const clean = normalizePhoneNumber(phone);
    return this.cache.students.filter((s) => {
      const p = normalizePhoneNumber(s.parentPhone || '');
      const sp = normalizePhoneNumber(s.studentPhone || '');
      return p === clean || sp === clean;
    });
  }

  public generateAdmissionNumber(centerId: string): string {
    const centerStudents = this.getStudents(centerId);
    let nextNum = centerStudents.length + 1;
    let candidate = `CRE-${String(nextNum).padStart(3, '0')}`;
    while (centerStudents.some((s) => s.admissionNumber === candidate)) {
      nextNum++;
      candidate = `CRE-${String(nextNum).padStart(3, '0')}`;
    }
    return candidate;
  }

  public saveStudent(studentData: Partial<Student> & { centerId: string; name: string }, performedBy: string = 'Admin'): Student {
    this.init();
    const center = this.getCenterById(studentData.centerId);
    const now = new Date().toISOString();
    let student: Student;

    if (studentData.id) {
      const idx = this.cache.students.findIndex((s) => s.id === studentData.id);
      if (idx >= 0) {
        student = {
          ...this.cache.students[idx],
          ...studentData,
          gender: studentData.gender || this.cache.students[idx].gender || 'Boy',
          studentPhone: studentData.studentPhone ? normalizePhoneNumber(studentData.studentPhone) : '',
          parentPhone: studentData.parentPhone ? normalizePhoneNumber(studentData.parentPhone) : '',
          updatedAt: now,
        };
        this.cache.students[idx] = student;
      } else {
        student = {
          id: studentData.id,
          centerId: studentData.centerId,
          admissionNumber: studentData.admissionNumber || this.generateAdmissionNumber(studentData.centerId),
          name: studentData.name,
          gender: studentData.gender || 'Boy',
          parentName: studentData.parentName || '',
          studentPhone: studentData.studentPhone ? normalizePhoneNumber(studentData.studentPhone) : '',
          parentPhone: studentData.parentPhone ? normalizePhoneNumber(studentData.parentPhone) : '',
          place: studentData.place || '',
          admissionDate: studentData.admissionDate || now.split('T')[0],
          defaultFee: studentData.defaultFee ?? (center?.defaultFee ?? 100),
          status: studentData.status || 'Active',
          createdAt: now,
          updatedAt: now,
        };
        this.cache.students.push(student);
      }
    } else {
      const id = 'std-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
      student = {
        id,
        centerId: studentData.centerId,
        admissionNumber: studentData.admissionNumber || this.generateAdmissionNumber(studentData.centerId),
        name: studentData.name,
        gender: studentData.gender || 'Boy',
        parentName: studentData.parentName || '',
        studentPhone: studentData.studentPhone ? normalizePhoneNumber(studentData.studentPhone) : '',
        parentPhone: studentData.parentPhone ? normalizePhoneNumber(studentData.parentPhone) : '',
        place: studentData.place || '',
        admissionDate: studentData.admissionDate || now.split('T')[0],
        defaultFee: studentData.defaultFee ?? (center?.defaultFee ?? 100),
        status: studentData.status || 'Active',
        createdAt: now,
        updatedAt: now,
      };
      this.cache.students.push(student);
    }

    this.notifyListeners();
    this.syncDocToFirestore('students', student.id, student);
    this.logAudit('Student Saved', `Student ${student.name} (${student.admissionNumber}) saved by ${performedBy}`, performedBy, student.centerId);
    return student;
  }

  public setStudentStatus(studentId: string, status: StudentStatus, performedBy: string = 'Admin'): boolean {
    this.init();
    const s = this.cache.students.find((item) => item.id === studentId);
    if (!s) return false;
    s.status = status;
    s.updatedAt = new Date().toISOString();
    this.notifyListeners();
    this.syncDocToFirestore('students', s.id, s);
    this.logAudit('Student Status Changed', `Student ${s.name} status updated to ${status} by ${performedBy}`, performedBy, s.centerId);
    return true;
  }

  public deleteStudent(studentId: string, performedBy?: string): boolean {
    this.init();
    const s = this.cache.students.find((item) => item.id === studentId);
    if (!s) return false;
    this.cache.students = this.cache.students.filter((item) => item.id !== studentId);
    this.notifyListeners();
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
    const list = this.cache.attendance.filter((a) => a.centerId === centerId);
    if (date) return list.filter((a) => a.date === date);
    return list;
  }

  public saveAttendance(
    centerId: string,
    date: string,
    records: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>,
    recordedBy: string
  ): void {
    this.init();
    this.cache.attendance = this.cache.attendance.filter((a) => !(a.centerId === centerId && a.date === date));

    const newRecords: AttendanceRecord[] = records.map((r) => ({
      id: `att-${centerId}-${date}-${r.studentId}`,
      centerId,
      date,
      studentId: r.studentId,
      status: r.status,
      remarks: r.remarks,
      recordedBy,
      recordedAt: new Date().toISOString(),
    }));

    this.cache.attendance.push(...newRecords);
    this.notifyListeners();
    newRecords.forEach((nr) => this.syncDocToFirestore('attendance', nr.id, nr));
    this.logAudit('Attendance Recorded', `Attendance for ${date} (${newRecords.length} students) saved`, recordedBy, centerId);
  }

  // CLASS NOT HELD
  public saveClassNotHeld(params: {
    centerId: string;
    date: string;
    reason: string;
    remarks?: string;
    recordedBy: string;
  }): ClassNotHeld {
    this.init();
    const id = `cnh-${params.centerId}-${params.date}`;
    const record: ClassNotHeld = {
      id,
      centerId: params.centerId,
      date: params.date,
      reason: params.reason,
      remarks: params.remarks,
      recordedBy: params.recordedBy,
      createdAt: new Date().toISOString(),
    };
    const idx = this.cache.classNotHeld.findIndex((c) => c.id === id);
    if (idx >= 0) {
      this.cache.classNotHeld[idx] = record;
    } else {
      this.cache.classNotHeld.push(record);
    }
    this.notifyListeners();
    this.syncDocToFirestore('classNotHeld', id, record);
    this.logAudit('Class Not Held Marked', `Class on ${params.date} marked as Not Held (${params.reason}) by ${params.recordedBy}`, params.recordedBy, params.centerId);
    return record;
  }

  public deleteClassNotHeld(id: string, recordedBy: string = 'Admin'): boolean {
    this.init();
    const existing = this.cache.classNotHeld.find((c) => c.id === id);
    if (!existing) return false;
    this.cache.classNotHeld = this.cache.classNotHeld.filter((c) => c.id !== id);
    this.notifyListeners();
    this.deleteDocFromFirestore('classNotHeld', id);
    this.logAudit('Class Not Held Reverted', `Class Not Held reverted for ${existing.date} by ${recordedBy}`, recordedBy, existing.centerId);
    return true;
  }

  public getClassNotHeld(centerId?: string, date?: string): ClassNotHeld[] {
    this.init();
    let list = this.cache.classNotHeld;
    if (centerId && centerId !== 'ALL') {
      list = list.filter((c) => c.centerId === centerId);
    }
    if (date) {
      list = list.filter((c) => c.date === date);
    }
    return list;
  }

  public isClassNotHeld(centerId: string, date: string): ClassNotHeld | undefined {
    this.init();
    return this.cache.classNotHeld.find((c) => c.centerId === centerId && c.date === date);
  }

  public calculateStudentAttendance(studentId: string, centerId: string, month?: string): { totalConducted: number; present: number; absent: number; leave: number; percentage: number; records: AttendanceRecord[] } {
    this.init();
    let records = this.cache.attendance.filter((a) => a.centerId === centerId && a.studentId === studentId);
    if (month) {
      records = records.filter((a) => a.date.startsWith(month));
    }
    const centerAtt = this.cache.attendance.filter((a) => a.centerId === centerId);
    const monthAtt = month ? centerAtt.filter((a) => a.date.startsWith(month)) : centerAtt;
    const uniqueDates = Array.from(new Set(monthAtt.map((a) => a.date)));
    // Filter out dates where class was marked as not held
    const validConductedDates = uniqueDates.filter((d) => !this.isClassNotHeld(centerId, d));
    const totalConducted = validConductedDates.length;
    // Also ignore attendance records on dates where class was not held
    const validRecords = records.filter((r) => !this.isClassNotHeld(centerId, r.date));
    const present = validRecords.filter((r) => r.status === 'Present').length;
    const absent = validRecords.filter((r) => r.status === 'Absent').length;
    const leave = validRecords.filter((r) => r.status === 'Leave').length;
    const percentage = totalConducted > 0 ? Math.round((present / totalConducted) * 100) : 100;
    return { totalConducted, present, absent, leave, percentage, records: validRecords };
  }

  // FEES
  public getMonthlyFees(centerId?: string, month?: string): MonthlyFeeRecord[] {
    this.init();
    const students = this.getStudents(centerId).filter((s) => s.status === 'Active');
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    return students.map((st) => {
      const existing = this.cache.monthlyFees.find(
        (f) => f.studentId === st.id && f.month === targetMonth
      );
      if (existing) return existing;

      const payments = this.cache.feePayments.filter(
        (p) => p.studentId === st.id && p.month === targetMonth
      );
      const paidAmount = payments.reduce((acc, p) => acc + p.amount, 0);
      const expectedFee = st.defaultFee;
      let status: FeeStatus = 'Unpaid';
      let outstandingAmount = 0;
      let advanceCredit = 0;

      if (paidAmount === 0) {
        status = 'Unpaid';
        outstandingAmount = expectedFee;
      } else if (paidAmount < expectedFee) {
        status = 'Partially Paid';
        outstandingAmount = expectedFee - paidAmount;
      } else if (paidAmount === expectedFee) {
        status = 'Paid';
        outstandingAmount = 0;
      } else {
        status = 'Advance / Excess';
        advanceCredit = paidAmount - expectedFee;
      }

      return {
        id: `fee-${st.centerId}-${targetMonth}-${st.id}`,
        centerId: st.centerId,
        studentId: st.id,
        month: targetMonth,
        expectedFee,
        paidAmount,
        outstandingAmount,
        advanceCredit,
        status,
      };
    });
  }

  public getMonthlyFeeRecord(centerId: string, studentId: string, month: string): MonthlyFeeRecord | undefined {
    this.init();
    return this.cache.monthlyFees.find((f) => f.centerId === centerId && f.studentId === studentId && f.month === month);
  }

  public getFeePayments(centerId?: string, month?: string): FeePayment[] {
    this.init();
    let list = this.cache.feePayments;
    if (centerId && centerId !== 'ALL') {
      list = list.filter((p) => p.centerId === centerId);
    }
    if (month) return list.filter((p) => p.month === month);
    return list;
  }

  public recordFeePayment(params: {
    centerId: string;
    studentId: string;
    month: string;
    amount: number;
    paymentDate: string;
    remarks?: string;
    recordedBy: string;
  }): FeePayment {
    this.init();
    const student = this.getStudentById(params.studentId);
    const expected = student ? student.defaultFee : 100;

    const payment: FeePayment = {
      id: 'pay-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      centerId: params.centerId,
      studentId: params.studentId,
      month: params.month,
      amount: params.amount,
      paymentDate: params.paymentDate,
      remarks: params.remarks,
      recordedBy: params.recordedBy,
      createdAt: new Date().toISOString(),
    };

    this.cache.feePayments.push(payment);
    this.syncDocToFirestore('feePayments', payment.id, payment);

    const existingPayments = this.cache.feePayments.filter(
      (p) => p.centerId === params.centerId && p.studentId === params.studentId && p.month === params.month
    );
    const totalPaid = existingPayments.reduce((acc, cur) => acc + cur.amount, 0);

    let feeStatus: FeeStatus = 'Unpaid';
    let outstanding = 0;
    let advanceCredit = 0;

    if (totalPaid === 0) {
      feeStatus = 'Unpaid';
      outstanding = expected;
    } else if (totalPaid < expected) {
      feeStatus = 'Partially Paid';
      outstanding = expected - totalPaid;
    } else if (totalPaid === expected) {
      feeStatus = 'Paid';
      outstanding = 0;
    } else {
      feeStatus = 'Advance / Excess';
      advanceCredit = totalPaid - expected;
    }

    const feeRecordId = `fee-${params.centerId}-${params.month}-${params.studentId}`;
    const feeRecord: MonthlyFeeRecord = {
      id: feeRecordId,
      centerId: params.centerId,
      studentId: params.studentId,
      month: params.month,
      expectedFee: expected,
      paidAmount: totalPaid,
      outstandingAmount: outstanding,
      advanceCredit,
      status: feeStatus,
      lastPaymentDate: params.paymentDate,
      remarks: params.remarks,
    };

    const feeIdx = this.cache.monthlyFees.findIndex((f) => f.id === feeRecordId);
    if (feeIdx >= 0) {
      this.cache.monthlyFees[feeIdx] = feeRecord;
    } else {
      this.cache.monthlyFees.push(feeRecord);
    }
    this.notifyListeners();
    this.syncDocToFirestore('monthlyFees', feeRecord.id, feeRecord);

    this.logAudit('Fee Payment Recorded', `Payment of ₹${params.amount} for ${student?.name || params.studentId} (${params.month})`, params.recordedBy, params.centerId);
    return payment;
  }

  public updateFeePayment(
    paymentId: string,
    updates: { amount: number; paymentDate: string; remarks?: string },
    recordedBy: string = 'Admin'
  ): FeePayment | null {
    this.init();
    const idx = this.cache.feePayments.findIndex((p) => p.id === paymentId);
    if (idx < 0) return null;
    const old = this.cache.feePayments[idx];
    const updated: FeePayment = {
      ...old,
      amount: updates.amount,
      paymentDate: updates.paymentDate,
      remarks: updates.remarks !== undefined ? updates.remarks : old.remarks,
    };
    this.cache.feePayments[idx] = updated;
    this.syncDocToFirestore('feePayments', paymentId, updated);
    this.recalculateMonthlyFee(updated.centerId, updated.studentId, updated.month);
    this.notifyListeners();
    this.logAudit('Fee Payment Updated', `Payment ${paymentId} updated to ₹${updates.amount}`, recordedBy, updated.centerId);
    return updated;
  }

  public deleteFeePayment(paymentId: string, recordedBy: string = 'Admin'): boolean {
    this.init();
    const p = this.cache.feePayments.find((item) => item.id === paymentId);
    if (!p) return false;
    this.cache.feePayments = this.cache.feePayments.filter((item) => item.id !== paymentId);
    this.deleteDocFromFirestore('feePayments', paymentId);
    this.recalculateMonthlyFee(p.centerId, p.studentId, p.month);
    this.notifyListeners();
    this.logAudit('Fee Payment Deleted', `Fee payment of ₹${p.amount} deleted for student ${p.studentId}`, recordedBy, p.centerId);
    return true;
  }

  public resetStudentFeeToUnpaid(centerId: string, studentId: string, month: string, recordedBy: string = 'Admin'): boolean {
    this.init();
    const toDelete = this.cache.feePayments.filter(
      (p) => p.centerId === centerId && p.studentId === studentId && p.month === month
    );
    toDelete.forEach((p) => {
      this.deleteDocFromFirestore('feePayments', p.id);
    });
    this.cache.feePayments = this.cache.feePayments.filter(
      (p) => !(p.centerId === centerId && p.studentId === studentId && p.month === month)
    );
    this.recalculateMonthlyFee(centerId, studentId, month);
    this.notifyListeners();
    this.logAudit('Fee Reset to Unpaid', `Fee status reset to Unpaid for student ${studentId} in ${month}`, recordedBy, centerId);
    return true;
  }

  private recalculateMonthlyFee(centerId: string, studentId: string, month: string) {
    const student = this.getStudentById(studentId);
    const existingFeeRecord = this.cache.monthlyFees.find(
      (f) => f.centerId === centerId && f.studentId === studentId && f.month === month
    );
    const expected = existingFeeRecord ? existingFeeRecord.expectedFee : (student ? student.defaultFee : 100);
    const payments = this.cache.feePayments.filter(
      (p) => p.centerId === centerId && p.studentId === studentId && p.month === month
    );
    const paidAmount = payments.reduce((acc, p) => acc + p.amount, 0);

    let status: FeeStatus = 'Unpaid';
    let outstandingAmount = expected;
    let advanceCredit = 0;

    if (paidAmount === 0) {
      status = 'Unpaid';
      outstandingAmount = expected;
    } else if (paidAmount < expected) {
      status = 'Partially Paid';
      outstandingAmount = expected - paidAmount;
    } else if (paidAmount === expected) {
      status = 'Paid';
      outstandingAmount = 0;
    } else {
      status = 'Advance / Excess';
      outstandingAmount = 0;
      advanceCredit = paidAmount - expected;
    }

    const feeRecordId = `fee-${centerId}-${month}-${studentId}`;
    const feeRecord: MonthlyFeeRecord = {
      id: feeRecordId,
      centerId,
      studentId,
      month,
      expectedFee: expected,
      paidAmount,
      outstandingAmount,
      advanceCredit,
      status,
      lastPaymentDate: payments.length > 0 ? payments[payments.length - 1].paymentDate : undefined,
    };

    const idx = this.cache.monthlyFees.findIndex((f) => f.id === feeRecordId);
    if (idx >= 0) {
      this.cache.monthlyFees[idx] = feeRecord;
    } else {
      this.cache.monthlyFees.push(feeRecord);
    }
    this.syncDocToFirestore('monthlyFees', feeRecordId, feeRecord);
  }

  public updateStudentMonthlyFee(params: {
    centerId: string;
    studentId: string;
    month: string;
    expectedFee: number;
    remarks?: string;
  }): MonthlyFeeRecord {
    this.init();
    const feeRecordId = `fee-${params.centerId}-${params.month}-${params.studentId}`;
    const payments = this.cache.feePayments.filter(
      (p) => p.centerId === params.centerId && p.studentId === params.studentId && p.month === params.month
    );
    const paidAmount = payments.reduce((acc, p) => acc + p.amount, 0);
    const expected = params.expectedFee;

    let feeStatus: FeeStatus = 'Unpaid';
    let outstanding = 0;
    let advanceCredit = 0;

    if (paidAmount === 0) {
      feeStatus = 'Unpaid';
      outstanding = expected;
    } else if (paidAmount < expected) {
      feeStatus = 'Partially Paid';
      outstanding = expected - paidAmount;
    } else if (paidAmount === expected) {
      feeStatus = 'Paid';
      outstanding = 0;
    } else {
      feeStatus = 'Advance / Excess';
      advanceCredit = paidAmount - expected;
    }

    const feeRecord: MonthlyFeeRecord = {
      id: feeRecordId,
      centerId: params.centerId,
      studentId: params.studentId,
      month: params.month,
      expectedFee: expected,
      paidAmount,
      outstandingAmount: outstanding,
      advanceCredit,
      status: feeStatus,
      remarks: params.remarks,
    };

    const idx = this.cache.monthlyFees.findIndex((f) => f.id === feeRecordId);
    if (idx >= 0) {
      this.cache.monthlyFees[idx] = { ...this.cache.monthlyFees[idx], ...feeRecord };
    } else {
      this.cache.monthlyFees.push(feeRecord);
    }

    this.notifyListeners();
    this.syncDocToFirestore('monthlyFees', feeRecordId, feeRecord);
    this.logAudit('Fee Adjusted', `Monthly expected fee adjusted to ₹${expected} for ${params.studentId}`, 'Admin', params.centerId);
    return feeRecord;
  }

  // DONATIONS & EXPENSES
  public getDonations(centerId?: string, month?: string): Donation[] {
    this.init();
    let list = this.cache.donations;
    if (centerId && centerId !== 'ALL') {
      list = list.filter((d) => d.centerId === centerId);
    }
    if (month) {
      list = list.filter((d) => d.date.startsWith(month));
    }
    return list;
  }

  public saveDonation(donationData: Omit<Donation, 'id' | 'createdAt'>): Donation {
    this.init();
    const donation: Donation = {
      ...donationData,
      id: 'don-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString(),
    };
    this.cache.donations.push(donation);
    this.notifyListeners();
    this.syncDocToFirestore('donations', donation.id, donation);
    this.logAudit('Donation Recorded', `Donation of ₹${donation.amount} received from ${donation.donorName || 'Well-wisher'}`, donation.recordedBy, donation.centerId);
    return donation;
  }

  public addDonation(donationData: Omit<Donation, 'id' | 'createdAt'>): Donation {
    return this.saveDonation(donationData);
  }

  public updateDonation(id: string, updates: Partial<Donation>, recordedBy: string = 'Admin'): Donation | null {
    this.init();
    const idx = this.cache.donations.findIndex((d) => d.id === id);
    if (idx < 0) return null;
    const updated: Donation = {
      ...this.cache.donations[idx],
      ...updates,
    };
    this.cache.donations[idx] = updated;
    this.notifyListeners();
    this.syncDocToFirestore('donations', id, updated);
    this.logAudit('Donation Updated', `Donation ${id} updated to ₹${updated.amount} from ${updated.donorName || 'Well-wisher'}`, recordedBy, updated.centerId);
    return updated;
  }

  public deleteDonation(id: string, recordedBy: string = 'Admin'): boolean {
    this.init();
    const existing = this.cache.donations.find((d) => d.id === id);
    if (!existing) return false;
    this.cache.donations = this.cache.donations.filter((d) => d.id !== id);
    this.notifyListeners();
    this.deleteDocFromFirestore('donations', id);
    this.logAudit('Donation Deleted', `Donation of ₹${existing.amount} deleted`, recordedBy, existing.centerId);
    return true;
  }

  public getExpenses(centerId?: string, month?: string): Expense[] {
    this.init();
    let list = this.cache.expenses;
    if (centerId && centerId !== 'ALL') {
      list = list.filter((e) => e.centerId === centerId);
    }
    if (month) {
      list = list.filter((e) => e.date.startsWith(month));
    }
    return list;
  }

  public saveExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Expense {
    this.init();
    const expense: Expense = {
      ...expenseData,
      id: 'exp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString(),
    };
    this.cache.expenses.push(expense);
    this.notifyListeners();
    this.syncDocToFirestore('expenses', expense.id, expense);
    this.logAudit('Expense Recorded', `Expense ₹${expense.amount} under category ${expense.category}`, expense.recordedBy, expense.centerId);
    return expense;
  }

  public addExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Expense {
    return this.saveExpense(expenseData);
  }

  public updateExpense(id: string, updates: Partial<Expense>, recordedBy: string = 'Admin'): Expense | null {
    this.init();
    const idx = this.cache.expenses.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    const updated: Expense = {
      ...this.cache.expenses[idx],
      ...updates,
    };
    this.cache.expenses[idx] = updated;
    this.notifyListeners();
    this.syncDocToFirestore('expenses', id, updated);
    this.logAudit('Expense Updated', `Expense ${id} updated to ₹${updated.amount} (${updated.category})`, recordedBy, updated.centerId);
    return updated;
  }

  public deleteExpense(expenseId: string, recordedBy: string = 'Admin'): boolean {
    this.init();
    const exp = this.cache.expenses.find((e) => e.id === expenseId);
    if (!exp) return false;
    this.cache.expenses = this.cache.expenses.filter((e) => e.id !== expenseId);
    this.notifyListeners();
    this.deleteDocFromFirestore('expenses', expenseId);
    this.logAudit('Expense Deleted', `Expense of ₹${exp.amount} deleted`, recordedBy, exp.centerId);
    return true;
  }

  public getFinancialSummary(centerId?: string, month?: string): {
    totalFees: number;
    totalDonations: number;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    totalFeeIncome: number;
    totalDonationIncome: number;
    totalWeeklyExpense: number;
    totalOtherExpense: number;
    netBalance: number;
  } {
    this.init();
    const fees = (centerId && centerId !== 'ALL'
      ? this.getFeePayments(centerId, month)
      : this.cache.feePayments.filter((p) => !month || p.month === month)
    ).reduce((a, b) => a + b.amount, 0);

    const donations = this.getDonations(centerId, month).reduce((a, b) => a + b.amount, 0);
    const allExpenses = this.getExpenses(centerId, month);
    const expenses = allExpenses.reduce((a, b) => a + b.amount, 0);
    const weeklyExp = allExpenses.filter((e) => e.type === 'weekly').reduce((a, b) => a + b.amount, 0);
    const otherExp = allExpenses.filter((e) => e.type === 'other').reduce((a, b) => a + b.amount, 0);
    const totalIncome = fees + donations;
    const balance = totalIncome - expenses;
    return {
      totalFees: fees,
      totalDonations: donations,
      totalIncome,
      totalExpenses: expenses,
      balance,
      totalFeeIncome: fees,
      totalDonationIncome: donations,
      totalWeeklyExpense: weeklyExp,
      totalOtherExpense: otherExp,
      netBalance: balance,
    };
  }

  public getExams(centerId?: string): Exam[] {
    this.init();
    if (centerId && centerId !== 'ALL') {
      return this.cache.exams.filter((e) => e.centerId === centerId);
    }
    return this.cache.exams;
  }

  public getExamById(id: string): Exam | undefined {
    this.init();
    return this.cache.exams.find((e) => e.id === id);
  }

  public saveExam(examData: Omit<Exam, 'id' | 'createdAt'> & { id?: string }): Exam {
    this.init();
    const now = new Date().toISOString();
    let exam: Exam;
    if (examData.id) {
      const idx = this.cache.exams.findIndex((e) => e.id === examData.id);
      if (idx >= 0) {
        exam = { ...this.cache.exams[idx], ...examData };
        this.cache.exams[idx] = exam;
      } else {
        exam = { ...examData, id: examData.id, createdAt: now };
        this.cache.exams.push(exam);
      }
    } else {
      exam = {
        ...examData,
        id: 'exam-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
        createdAt: now,
      };
      this.cache.exams.push(exam);
    }
    this.syncDocToFirestore('exams', exam.id, exam);
    this.logAudit('Exam Saved', `Exam ${exam.name} scheduled for ${exam.date}`, 'Admin', exam.centerId);
    return exam;
  }

  public deleteExam(examId: string): boolean {
    this.init();
    const exam = this.cache.exams.find((e) => e.id === examId);
    if (!exam) return false;
    this.cache.exams = this.cache.exams.filter((e) => e.id !== examId);
    this.deleteDocFromFirestore('exams', examId);
    this.cache.examMarks = this.cache.examMarks.filter((m) => m.examId !== examId);
    this.logAudit('Exam Deleted', `Exam ${exam.name} deleted`, 'Admin', exam.centerId);
    return true;
  }

  public getExamMarks(centerId: string, examId?: string, studentId?: string): ExamMark[] {
    this.init();
    let list = this.cache.examMarks.filter((m) => m.centerId === centerId);
    if (examId) list = list.filter((m) => m.examId === examId);
    if (studentId) list = list.filter((m) => m.studentId === studentId);
    return list;
  }

  public saveExamMarks(centerId: string, examId: string, marks: Array<{ studentId: string; subjectId: string; marksObtained: number; maxMarks: number; isPassed: boolean; remarks?: string }>, recordedBy: string = 'Admin'): void {
    this.init();
    this.cache.examMarks = this.cache.examMarks.filter((m) => !(m.centerId === centerId && m.examId === examId));

    const newMarks: ExamMark[] = marks.map((m) => ({
      id: `mark-${examId}-${m.studentId}-${m.subjectId}`,
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

    this.cache.examMarks.push(...newMarks);
    newMarks.forEach((nm) => this.syncDocToFirestore('examMarks', nm.id, nm));
    this.logAudit('Exam Marks Recorded', `Marks recorded for exam ${examId}`, recordedBy, centerId);
  }

  // DONATED CONTACTS
  public getDonatedContacts(centerId?: string): DonatedContact[] {
    this.init();
    if (centerId && centerId !== 'ALL') {
      return this.cache.donatedContacts.filter((c) => c.centerId === centerId);
    }
    return this.cache.donatedContacts;
  }

  public saveDonatedContact(contactData: Omit<DonatedContact, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: ContactStatus }): { success: boolean; contact?: DonatedContact; error?: string; warningDuplicate?: boolean } {
    this.init();
    const cleanPhone = normalizePhoneNumber(contactData.phone);
    const existing = this.cache.donatedContacts.find((c) => normalizePhoneNumber(c.phone) === cleanPhone);
    const warningDuplicate = !!existing;

    const contact: DonatedContact = {
      ...contactData,
      status: contactData.status || 'New',
      phone: cleanPhone,
      id: 'dc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.cache.donatedContacts.push(contact);
    this.syncDocToFirestore('donatedContacts', contact.id, contact);
    return { success: true, contact, warningDuplicate };
  }

  public addDonatedContact(contactData: Omit<DonatedContact, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: ContactStatus }): { success: boolean; contact?: DonatedContact; error?: string; warningDuplicate?: boolean } {
    return this.saveDonatedContact(contactData);
  }

  public updateContactStatus(contactId: string, status: ContactStatus): boolean {
    this.init();
    const contact = this.cache.donatedContacts.find((c) => c.id === contactId);
    if (!contact) return false;
    contact.status = status;
    contact.updatedAt = new Date().toISOString();
    this.syncDocToFirestore('donatedContacts', contact.id, contact);
    return true;
  }

  public updateDonatedContactStatus(contactId: string, status: ContactStatus, performedBy: string = 'Super Admin'): boolean {
    const res = this.updateContactStatus(contactId, status);
    if (res) {
      this.logAudit('Contact Status Updated', `Donated contact status changed to ${status}`, performedBy);
    }
    return res;
  }

  public deleteDonatedContact(contactId: string, performedBy: string = 'Super Admin'): boolean {
    this.init();
    const contact = this.cache.donatedContacts.find((c) => c.id === contactId);
    if (!contact) return false;
    this.cache.donatedContacts = this.cache.donatedContacts.filter((c) => c.id !== contactId);
    this.deleteDocFromFirestore('donatedContacts', contactId);
    this.logAudit('Contact Deleted', `Donated contact ${contact.name} deleted`, performedBy);
    return true;
  }
}

export const dataService = new DataService();
