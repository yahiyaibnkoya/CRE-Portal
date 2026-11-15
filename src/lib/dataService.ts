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

// Initial Seed Data to ensure instant functionality out-of-the-box
function getInitialSeedData() {
  const superAdmin: AdminUser = {
    uid: 'super-admin-01',
    phone: SUPER_ADMIN_DEFAULT_PHONE,
    name: 'Wisdom Super Admin',
    role: 'SUPER_ADMIN',
    centerIds: [],
    mustChangePassword: true, // As required: must change initial default password on first login
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleCenter: Center = {
    id: 'center-manjeri-01',
    name: 'Manjeri CRE Centre',
    place: 'Manjeri Town',
    state: 'Kerala',
    district: 'Malappuram West',
    zoneOrUnit: 'Zone',
    zoneName: 'Manjeri Zone',
    regularDay: 'Sunday',
    startTime: '09:00',
    endTime: '11:30',
    effectiveDate: '2026-01-01',
    facultyName: 'Usthad Abdul Rasheed Salafi',
    contactNumbers: ['9847012345', '9447123456'],
    status: 'Active',
    defaultFee: 150,
    examMode: 'semester',
    adminPhones: ['9876543210', '9999999999'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleCenterAdmin: AdminUser = {
    uid: 'admin-manjeri-01',
    phone: '9876543210',
    name: 'Farooq K.',
    place: 'Manjeri',
    role: 'CENTER_ADMIN',
    centerIds: ['center-manjeri-01'],
    mustChangePassword: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const demoCenterAdmin: AdminUser = {
    uid: 'admin-demo-99',
    phone: '9999999999',
    name: 'Wisdom Demo Admin',
    place: 'Kozhikode',
    role: 'CENTER_ADMIN',
    centerIds: ['center-manjeri-01'],
    mustChangePassword: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleStudents: Student[] = [
    {
      id: 'std-001',
      centerId: 'center-manjeri-01',
      admissionNumber: 'CRE-MNJ-001',
      name: 'Muhammed Rayan',
      parentName: 'Rayees K.',
      studentPhone: '9847111222',
      parentPhone: '9847000111',
      place: 'Kizhakkethala',
      admissionDate: '2026-01-10',
      defaultFee: 150,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'std-002',
      centerId: 'center-manjeri-01',
      admissionNumber: 'CRE-MNJ-002',
      name: 'Fathima Zoya',
      parentName: 'Rayees K.', // Same parent phone to test multi-child selection!
      studentPhone: '',
      parentPhone: '9847000111',
      place: 'Kizhakkethala',
      admissionDate: '2026-01-15',
      defaultFee: 150,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'std-003',
      centerId: 'center-manjeri-01',
      admissionNumber: 'CRE-MNJ-003',
      name: 'Ameen Bilal',
      parentName: 'Bilal M.',
      studentPhone: '9847222333',
      parentPhone: '9847333444',
      place: 'Pandikkad Road',
      admissionDate: '2026-02-01',
      defaultFee: 150,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'std-004',
      centerId: 'center-manjeri-01',
      admissionNumber: 'CRE-MNJ-004',
      name: 'Aisha Haneen',
      parentName: 'Usman V.',
      studentPhone: '',
      parentPhone: '9847555666',
      place: 'Melakam',
      admissionDate: '2026-02-15',
      defaultFee: 150,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'std-005',
      centerId: 'center-manjeri-01',
      admissionNumber: 'CRE-MNJ-005',
      name: 'Salman Faris',
      parentName: 'Musthafa P.',
      studentPhone: '9847777888',
      parentPhone: '9847888999',
      place: 'Kacherippadi',
      admissionDate: '2026-03-01',
      defaultFee: 150,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Attendance for last 4 weeks (Sundays: Nov 1, Nov 8, Nov 15, Nov 22)
  const sampleAttendance: AttendanceRecord[] = [
    // Nov 1
    { id: 'att-1-1', centerId: 'center-manjeri-01', date: '2026-11-01', studentId: 'std-001', status: 'Present', recordedBy: 'Farooq K.', recordedAt: '2026-11-01T11:45:00' },
    { id: 'att-1-2', centerId: 'center-manjeri-01', date: '2026-11-01', studentId: 'std-002', status: 'Present', recordedBy: 'Farooq K.', recordedAt: '2026-11-01T11:45:00' },
    { id: 'att-1-3', centerId: 'center-manjeri-01', date: '2026-11-01', studentId: 'std-003', status: 'Present', recordedBy: 'Farooq K.', recordedAt: '2026-11-01T11:45:00' },
    { id: 'att-1-4', centerId: 'center-manjeri-01', date: '2026-11-01', studentId: 'std-004', status: 'Absent', recordedBy: 'Farooq K.', recordedAt: '2026-11-01T11:45:00' },
    { id: 'att-1-5', centerId: 'center-manjeri-01', date: '2026-11-01', studentId: 'std-005', status: 'Present', recordedBy: 'Farooq K.', recordedAt: '2026-11-01T11:45:00' },
    // Nov 8
    { id: 'att-2-1', centerId: 'center-manjeri-01', date: '2026-11-08', studentId: 'std-001', status: 'Present', recordedBy: 'Farooq K.', recordedAt: '2026-11-08T11:40:00' },
    { id: 'att-2-2', centerId: 'center-manjeri-01', date: '2026-11-08', studentId: 'std-002', status: 'Present', recordedBy: 'Farooq K.', recordedAt: '2026-11-08T11:40:00' },
    { id: 'att-2-3', centerId: 'center-manjeri-01', date: '2026-11-08', studentId: 'std-003', status: 'Leave', remarks: 'Family event', recordedBy: 'Farooq K.', recordedAt: '2026-11-08T11:40:00' },
    { id: 'att-2-4', centerId: 'center-manjeri-01', date: '2026-11-08', studentId: 'std-004', status: 'Present', recordedBy: 'Farooq K.', recordedAt: '2026-11-08T11:40:00' },
    { id: 'att-2-5', centerId: 'center-manjeri-01', date: '2026-11-08', studentId: 'std-005', status: 'Present', recordedBy: 'Farooq K.', recordedAt: '2026-11-08T11:40:00' },
  ];

  // Fee payments for Nov 2026
  const sampleFeePayments: FeePayment[] = [
    { id: 'pay-001', centerId: 'center-manjeri-01', studentId: 'std-001', month: '2026-11', amount: 150, paymentDate: '2026-11-01', remarks: 'Cash', recordedBy: 'Farooq K.', createdAt: '2026-11-01T11:30:00' },
    { id: 'pay-002', centerId: 'center-manjeri-01', studentId: 'std-002', month: '2026-11', amount: 150, paymentDate: '2026-11-01', remarks: 'Cash', recordedBy: 'Farooq K.', createdAt: '2026-11-01T11:30:00' },
    { id: 'pay-003', centerId: 'center-manjeri-01', studentId: 'std-003', month: '2026-11', amount: 100, paymentDate: '2026-11-08', remarks: 'Partial payment', recordedBy: 'Farooq K.', createdAt: '2026-11-08T11:35:00' },
  ];

  const sampleMonthlyFees: MonthlyFeeRecord[] = [
    { id: 'fee-001', centerId: 'center-manjeri-01', studentId: 'std-001', month: '2026-11', expectedFee: 150, paidAmount: 150, outstandingAmount: 0, advanceCredit: 0, status: 'Paid', lastPaymentDate: '2026-11-01' },
    { id: 'fee-002', centerId: 'center-manjeri-01', studentId: 'std-002', month: '2026-11', expectedFee: 150, paidAmount: 150, outstandingAmount: 0, advanceCredit: 0, status: 'Paid', lastPaymentDate: '2026-11-01' },
    { id: 'fee-003', centerId: 'center-manjeri-01', studentId: 'std-003', month: '2026-11', expectedFee: 150, paidAmount: 100, outstandingAmount: 50, advanceCredit: 0, status: 'Partially Paid', lastPaymentDate: '2026-11-08' },
    { id: 'fee-004', centerId: 'center-manjeri-01', studentId: 'std-004', month: '2026-11', expectedFee: 150, paidAmount: 0, outstandingAmount: 150, advanceCredit: 0, status: 'Unpaid' },
    { id: 'fee-005', centerId: 'center-manjeri-01', studentId: 'std-005', month: '2026-11', expectedFee: 150, paidAmount: 200, outstandingAmount: 0, advanceCredit: 50, status: 'Advance / Excess', lastPaymentDate: '2026-11-08' },
  ];

  const sampleDonations: Donation[] = [
    { id: 'don-001', centerId: 'center-manjeri-01', donorName: 'Well-wisher', amount: 1000, date: '2026-11-05', remarks: 'General support for books', recordedBy: 'Farooq K.', createdAt: '2026-11-05T10:00:00' },
  ];

  const sampleExpenses: Expense[] = [
    { id: 'exp-001', centerId: 'center-manjeri-01', type: 'weekly', sessionDate: '2026-11-01', category: 'Faculty TA', amount: 300, date: '2026-11-01', description: 'Faculty traveling allowance', recordedBy: 'Farooq K.', createdAt: '2026-11-01T12:00:00' },
    { id: 'exp-002', centerId: 'center-manjeri-01', type: 'weekly', sessionDate: '2026-11-01', category: 'Refreshment – Drink', amount: 120, date: '2026-11-01', description: 'Tea and drinking water', recordedBy: 'Farooq K.', createdAt: '2026-11-01T12:00:00' },
    { id: 'exp-003', centerId: 'center-manjeri-01', type: 'weekly', sessionDate: '2026-11-08', category: 'Faculty TA', amount: 300, date: '2026-11-08', description: 'Faculty traveling allowance', recordedBy: 'Farooq K.', createdAt: '2026-11-08T12:00:00' },
    { id: 'exp-004', centerId: 'center-manjeri-01', type: 'weekly', sessionDate: '2026-11-08', category: 'Refreshment – Snack', amount: 150, date: '2026-11-08', description: 'Biscuits for students', recordedBy: 'Farooq K.', createdAt: '2026-11-08T12:00:00' },
    { id: 'exp-005', centerId: 'center-manjeri-01', type: 'other', category: 'Printing', title: 'Exam Question Papers', amount: 250, date: '2026-11-10', description: 'Photocopy and binding', recordedBy: 'Farooq K.', createdAt: '2026-11-10T16:00:00' },
  ];

  const sampleExam: Exam = {
    id: 'exam-001',
    centerId: 'center-manjeri-01',
    name: 'Mid-Term Evaluation',
    mode: 'semester',
    semesterName: 'Semester 1',
    date: '2026-10-25',
    subjects: [
      { id: 'sub-01', name: 'Quran Recitation & Tajweed', maxMarks: 50, passMarks: 20 },
      { id: 'sub-02', name: 'Aqeedah & Fiqh', maxMarks: 50, passMarks: 20 },
    ],
    createdAt: '2026-10-20T10:00:00',
  };

  const sampleMarks: ExamMark[] = [
    { id: 'mrk-1', centerId: 'center-manjeri-01', examId: 'exam-001', subjectId: 'sub-01', studentId: 'std-001', marksObtained: 46, maxMarks: 50, isPassed: true, enteredAt: '2026-10-26' },
    { id: 'mrk-2', centerId: 'center-manjeri-01', examId: 'exam-001', subjectId: 'sub-02', studentId: 'std-001', marksObtained: 44, maxMarks: 50, isPassed: true, enteredAt: '2026-10-26' },
    { id: 'mrk-3', centerId: 'center-manjeri-01', examId: 'exam-001', subjectId: 'sub-01', studentId: 'std-002', marksObtained: 48, maxMarks: 50, isPassed: true, enteredAt: '2026-10-26' },
    { id: 'mrk-4', centerId: 'center-manjeri-01', examId: 'exam-001', subjectId: 'sub-02', studentId: 'std-002', marksObtained: 49, maxMarks: 50, isPassed: true, enteredAt: '2026-10-26' },
  ];

  const sampleDonatedContacts: DonatedContact[] = [
    {
      id: 'dc-001',
      centerId: 'center-manjeri-01',
      name: 'Nihad Paravakkal',
      phone: '9847999000',
      place: 'Manjeri',
      remarks: 'Interested in Sunday morning batch',
      status: 'New',
      submittedByStudentId: 'std-001',
      createdAt: '2026-11-12T14:30:00',
      updatedAt: '2026-11-12T14:30:00',
    },
  ];

  return {
    users: [superAdmin, sampleCenterAdmin, demoCenterAdmin],
    centers: [sampleCenter],
    students: sampleStudents,
    attendance: sampleAttendance,
    monthlyFees: sampleMonthlyFees,
    feePayments: sampleFeePayments,
    donations: sampleDonations,
    expenses: sampleExpenses,
    exams: [sampleExam],
    examMarks: sampleMarks,
    donatedContacts: sampleDonatedContacts,
    settings: DEFAULT_SETTINGS,
    auditLogs: [],
  };
}

class DataService {
  private inited = false;

  public init() {
    if (this.inited || typeof window === 'undefined') return;
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
    const idx = users.findIndex(u => u.uid === user.uid || normalizePhoneNumber(u.phone) === normalizePhoneNumber(user.phone));
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user, updatedAt: new Date().toISOString() };
    } else {
      users.push({ ...user, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    setLocal('users', users);
  }

  public updateUserPassword(phone: string, newPasswordPlain: string): boolean {
    this.init();
    const users = this.getUsers();
    const norm = normalizePhoneNumber(phone);
    const user = users.find(u => normalizePhoneNumber(u.phone) === norm);
    if (!user) return false;

    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();
    setLocal('users', users);

    // Save custom password hash / tracker locally (or Firebase Auth)
    setLocal(`pwd_${norm}`, newPasswordPlain);
    this.logAudit('Password Changed', `User ${user.phone} (${user.role}) changed their password`, user.name);
    return true;
  }

  public checkUserPassword(phone: string, passwordInput: string): boolean {
    this.init();
    const norm = normalizePhoneNumber(phone);
    const user = this.getUserByPhone(norm);
    if (!user || !user.isActive) return false;

    // Check if custom password has been set
    const savedCustom = getLocal<string | null>(`pwd_${norm}`, null);
    if (savedCustom) {
      return savedCustom === passwordInput;
    }

    // Default password rule: first 8 digits of normalized phone
    const defaultPwd = getDefaultPassword(norm);
    return passwordInput === defaultPwd;
  }

  public resetUserPassword(phone: string, performedBy: string): boolean {
    this.init();
    const norm = normalizePhoneNumber(phone);
    const users = this.getUsers();
    const user = users.find(u => normalizePhoneNumber(u.phone) === norm);
    if (!user) return false;

    user.mustChangePassword = true;
    user.updatedAt = new Date().toISOString();
    setLocal('users', users);
    // Remove custom password so it falls back to first 8 digits default password
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getKey(`pwd_${norm}`));
    }
    this.logAudit('Password Reset', `Password for ${user.phone} reset to default by ${performedBy}`, performedBy);
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
    this.logAudit('Admin Profile Updated', `Admin details updated for ${phone}`, user.name);
    return user;
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
      this.saveUser(admin);
    } else {
      admin = {
        uid: 'admin-' + Date.now().toString(36),
        phone: normPhone,
        name: params.adminName,
        place: params.adminPlace,
        role: 'CENTER_ADMIN',
        centerIds: [savedCenter.id],
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
      this.logAudit('Center Permanently Deleted', `Center ${centerId} permanently deleted`, 'Super Admin');
    } else {
      centers[idx].status = 'Archived';
      centers[idx].updatedAt = new Date().toISOString();
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
    this.logAudit('Student Status Changed', `Student ${s.name} status updated to ${status}`, 'Admin', s.centerId);
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

    if (idx >= 0) {
      monthlyFees[idx] = {
        ...monthlyFees[idx],
        paidAmount: totalPaid,
        outstandingAmount: outstanding,
        advanceCredit: advance,
        status,
        lastPaymentDate: params.paymentDate,
        remarks: params.remarks || monthlyFees[idx].remarks,
      };
    } else {
      monthlyFees.push({
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
      });
    }
    setLocal('monthlyFees', monthlyFees);

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

    if (idx >= 0) {
      const rec = monthlyFees[idx];
      rec.expectedFee = params.expectedFee;
      rec.outstandingAmount = Math.max(0, params.expectedFee - rec.paidAmount);
      rec.advanceCredit = Math.max(0, rec.paidAmount - params.expectedFee);
      if (params.status) rec.status = params.status;
      if (params.remarks) rec.remarks = params.remarks;
    } else {
      monthlyFees.push({
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
      });
    }
    setLocal('monthlyFees', monthlyFees);
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
