# CRE Management Portal
### Continuing Religious Education | Wisdom Islamic Students Organization

A complete, modern, fully functional web application engineered for managing the Continuing Religious Education (CRE) programme conducted by Wisdom Islamic Students Organization.

---

## 🎨 Branding & Official Identity

- **Primary Green:** `#2fb44b`
- **Primary Navy Blue:** `#1c346f`
- **Typography:** **Montserrat** font applied fully across the application
- **Theme:** Clean, spacious, modern light theme only
- **Official Logos:**
  - `public/cre-logo.png`
  - `public/wisdom-students-logo.png`

---

## 👥 User Roles & Quick Access Credentials

### 1. Super Admin
- **Role:** Full statewide control and governance
- **Login:** Accessible via Admin Login using registered mobile number
- **Initial Password:** First 8 digits of registered mobile number

### 2. Centre Admin
- **Login:** Registered individual mobile number and password
- **Quota Rule:** Maximum of **3** administrator logins allowed per centre
- **Mandatory First Login:** Prompted to change password upon first sign-in

### 3. Student / Parent
- **No Password Required!** Phone-number-only access.
- **Single Student Demo Phone:** `9847333444` (Ameen Bilal)
- **Multi-Child Demo Parent Phone:** `9847000111`
  - Displays selection: *"Whose information would you like to view?"*
  - Select between **Muhammed Rayan** or **Fathima Zoya**
- **Restricted Read-Only Access:** View attendance %, monthly fee payments, examination marks, and public centre information.

---

## 🚀 Key Modules & Functional Features

1. **Super Admin Dashboard (`/super-admin`)**
   - Statewide metrics: Total centres, active, pending, suspended, student enrolment, fee collection, donations, expenses, and net balance.
   - Interactive Recharts trends for monthly financials and active student distribution.
   - Filter by centre and month.

2. **CRE Centres (`/super-admin/centers`)**
   - Register new centres with Kerala 17 districts dropdown or Other State options.
   - Zone / Unit distinction ("CRE is conducted by Zone / Unit").
   - Class day and schedule in Asia/Kolkata timezone.
   - Approval modes: **Automatic Approval** vs **Manual Approval Required**.
   - Suspend / activate centres. Safe archiving by default, protected permanent deletion option.

3. **Centre Administrators (`/super-admin/admins`)**
   - Statewide directory of administrators.
   - Enforces 3-admin quota per centre.
   - Secure password resets to default first 8 digits.

4. **Class Attendance Management (`/center-admin/attendance`)**
   - Select class date.
   - Mark All Present / Mark All Absent / Individual marking (Present, Absent, Leave).
   - Overwrite confirmation alert when editing previously saved dates.
   - Automatic percentage formula: `(Present Classes / Total Conducted Classes) × 100`.

5. **Monthly Fee Register (`/center-admin/fees`)**
   - Custom default monthly fee per student.
   - Supports full, partial, excess, advance credit, and fee adjustments.
   - Automatically posts transactions to the centre's income ledger without duplicate entry.

6. **Examinations & Scorecards (`/center-admin/exams`)**
   - Supports **Semester-wise** (Semester 1, Semester 2...) and **Non-semester** (Portions) modes.
   - Dynamic subject and maximum mark setup.
   - Interactive scorecard calculation (Total marks, Percentage, Pass/Fail).

7. **Income & Expense Accounts (`/center-admin/finance`)**
   - Income: Auto-linked fees and voluntary donations.
   - Expenses: Weekly class session expenses (Faculty TA, Refreshment Drink, Refreshment Snack) and Other operational expenses.
   - Real-time Net Balance calculation: `Total Income - Total Expenses`.

8. **WhatsApp Reports & PDF Generation (`/center-admin/reports` & `/super-admin/reports`)**
   - On-screen report view.
   - Formatted WhatsApp text with `*bold*` headings and INR (`₹`) formatting.
   - Direct click-to-chat WhatsApp sharing (`https://wa.me/?text=...`).
   - High-resolution, branded PDF downloads with official logos generated client-side using `jspdf` and `jspdf-autotable`.

9. **Donate a Contact (`/student/donate-contact`)**
   - Community admission recommendations submitted by students and parents.
   - Warns about duplicate phone numbers within the same centre.

10. **Data Backup & Export (`/super-admin/settings` & `/center-admin/settings`)**
    - One-click export of complete database records or centre-specific records as JSON.

---

## 🛠 Technology Stack (Zero-Cost Spark Plan Compliant)

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom branded `#2fb44b` and `#1c346f`, pure light mode)
- **Font:** Montserrat
- **Icons:** Lucide React
- **Charts:** Recharts
- **PDF Export:** jsPDF + jsPDF-AutoTable (Browser client-side generation)
- **Backend & Database:** Firebase Authentication + Cloud Firestore

---

## 📦 How to Run

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start the development server
npm run dev

# 3. Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the portal.
Detailed deployment instructions are documented in [DEPLOYMENT.md](file:///c:/CRE%20Portal/DEPLOYMENT.md).
