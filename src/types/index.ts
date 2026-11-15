export type UserRole = 'SUPER_ADMIN' | 'CENTER_ADMIN' | 'STUDENT';

export type CenterStatus = 'Active' | 'Pending Approval' | 'Suspended' | 'Archived';
export type StudentStatus = 'Active' | 'Inactive';
export type AttendanceStatus = 'Present' | 'Absent' | 'Leave';
export type FeeStatus = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Advance / Excess';
export type ContactStatus = 'New' | 'Contacted' | 'Registered' | 'Not Interested';
export type ExamMode = 'semester' | 'non-semester';

export interface AdminUser {
  uid: string;
  phone: string;
  name: string;
  email?: string;
  place?: string;
  role: 'SUPER_ADMIN' | 'CENTER_ADMIN';
  centerIds: string[]; // Center IDs assigned to this admin
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Center {
  id: string;
  name: string;
  place: string;
  state: string; // 'Kerala' | 'Other State'
  district: string;
  otherStateName?: string;
  otherDistrictName?: string;
  zoneOrUnit: 'Zone' | 'Unit';
  zoneName: string;
  unitName?: string;
  regularDay: string; // Monday, Tuesday, ... Sunday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  effectiveDate: string;
  facultyName?: string;
  contactNumbers: string[]; // max 3
  status: CenterStatus;
  defaultFee: number;
  examMode: ExamMode;
  adminPhones: string[]; // max 3
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  centerId: string;
  admissionNumber: string; // auto-generated e.g. CRE-101
  name: string;
  parentName: string;
  studentPhone?: string;
  parentPhone?: string;
  place: string;
  admissionDate: string;
  defaultFee: number;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  centerId: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface MonthlyFeeRecord {
  id: string;
  centerId: string;
  studentId: string;
  month: string; // e.g. "2026-11" (YYYY-MM)
  expectedFee: number;
  paidAmount: number;
  outstandingAmount: number;
  advanceCredit: number;
  status: FeeStatus;
  lastPaymentDate?: string;
  remarks?: string;
}

export interface FeePayment {
  id: string;
  centerId: string;
  studentId: string;
  month: string; // YYYY-MM
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  remarks?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Donation {
  id: string;
  centerId: string;
  donorName?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  remarks?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  centerId: string;
  type: 'weekly' | 'other';
  sessionDate?: string; // for weekly expenses
  category: string; // 'Faculty TA' | 'Refreshment – Drink' | 'Refreshment – Snack' | Custom
  title?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description?: string;
  recordedBy: string;
  createdAt: string;
}

export interface ExamSubject {
  id: string;
  name: string;
  maxMarks: number;
  passMarks?: number;
}

export interface Exam {
  id: string;
  centerId: string;
  name: string;
  mode: ExamMode;
  semesterName?: string; // 'Semester 1', 'Semester 2', etc.
  portion?: string; // for non-semester mode
  date: string; // YYYY-MM-DD
  subjects: ExamSubject[];
  createdAt: string;
}

export interface ExamMark {
  id: string;
  centerId: string;
  examId: string;
  subjectId: string;
  studentId: string;
  marksObtained: number;
  maxMarks: number;
  isPassed: boolean;
  remarks?: string;
  enteredAt: string;
}

export interface DonatedContact {
  id: string;
  centerId: string;
  name: string;
  phone: string;
  place: string;
  remarks?: string;
  status: ContactStatus;
  submittedByStudentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  newCenterApprovalMode: 'automatic' | 'manual';
  studentQuickAccessEnabled: boolean;
  superAdminPhone: string;
  superAdminResetWhatsapp: string;
  districts: string[];
}

export interface AuditLog {
  id: string;
  centerId?: string;
  action: string;
  details: string;
  performedBy: string;
  timestamp: string;
}
