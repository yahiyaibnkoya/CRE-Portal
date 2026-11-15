export const BRAND_COLORS = {
  primaryGreen: '#2fb44b',
  primaryNavy: '#1c346f',
  white: '#ffffff',
  lightBg: '#f7f9fc',
  lightGreenBg: '#eaf7ed',
  lightBlueBg: '#edf2fa',
  border: '#e2e8f0',
  textDark: '#1e293b',
  textMuted: '#64748b',
  danger: '#dc2626',
  warning: '#d97706',
  success: '#16a34a',
};

export const SUPER_ADMIN_DEFAULT_PHONE = '9644889944';
export const SUPER_ADMIN_DEFAULT_PASSWORD = '96448899';
export const SUPER_ADMIN_WHATSAPP_RESET = '9644889944';
export const DEMO_ADMIN_PHONE = '9999999999';

export const KERALA_DISTRICTS: string[] = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram North',
  'Malappuram West',
  'Malappuram East',
  'Kozhikode South',
  'Kozhikode North',
  'Wayanad',
  'Kannur',
  'Kasaragod',
];

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DEFAULT_WEEKLY_EXPENSE_CATEGORIES = [
  'Faculty TA',
  'Refreshment – Drink',
  'Refreshment – Snack',
];

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Normalizes an Indian phone number: removes +91, 0 prefix, spaces, dashes, parentheses.
 * Ensures a clean 10-digit phone string.
 */
export function normalizePhoneNumber(input: string): string {
  if (!input) return '';
  // Remove spaces, dashes, brackets, plus
  let cleaned = input.replace(/[\s\-\(\)\+]/g, '');
  // Remove leading 91 if length is 12
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  }
  // Remove leading 0 if length is 11
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Derives the initial default password for any admin:
 * The first 8 digits of their normalized phone number.
 */
export function getDefaultPassword(phone: string): string {
  const norm = normalizePhoneNumber(phone);
  return norm.substring(0, 8);
}

/**
 * Formats a number into Indian Rupee currency format (e.g. ₹2,500)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
