# CRE Management Portal – Deployment & Setup Guide
### Continuing Religious Education (CRE) | Wisdom Islamic Students Organization

This document provides a beginner-friendly, step-by-step guide to deploying the **CRE Management Portal** on the **Free Firebase Spark Plan** and **Vercel's Free Tier** with **Zero Operational Cost**.

---

## Brand Colors & Official Identity
- **Primary Green:** `#2fb44b`
- **Primary Navy Blue:** `#1c346f`
- **Logos:**
  - `/public/cre-logo.png`
  - `/public/wisdom-students-logo.png`
- **Typography:** Fully set to **Montserrat** across all headings, body, labels, tables, and buttons.
- **Theme:** Clean light theme only (no dark mode).

---

## 1. Firebase Free Spark Plan Setup

### Step 1.1: Create Firebase Project
1. Visit the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it (e.g., `cre-portal`).
3. Google Analytics is optional (you can disable it to keep setup minimal).
4. Click **Create Project**.
5. Ensure the billing plan is set to **Spark (Free)**. Do not upgrade to Blaze.

### Step 1.2: Enable Firebase Authentication
1. In the left navigation, click **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Enable **Email/Password** (keep "Email link" disabled).
5. Click **Save**.
> *Note:* The portal automatically creates internal aliases from administrator phone numbers so that you have zero SMS/OTP costs on the free Spark tier.

### Step 1.3: Create Cloud Firestore Database
1. In the left navigation, click **Build > Firestore Database**.
2. Click **Create Database**.
3. Choose your database location (e.g., `asia-south1` for Mumbai, India).
4. Start in **Production mode**.
5. Click **Create**.

### Step 1.4: Apply Firestore Security Rules
1. In Firestore Database, go to the **Rules** tab.
2. Copy the entire contents of [`firestore.rules`](file:///c:/CRE%20Portal/firestore.rules) from the repository.
3. Paste into the editor and click **Publish**.

### Step 1.5: Register Web Application
1. In the Firebase Console, click the **Settings Gear > Project Settings**.
2. In the "Your apps" section, click the **Web icon (</>)**.
3. App nickname: `CRE Management Web`.
4. Click **Register App**.
5. Copy your `firebaseConfig` object values.

---

## 2. Local Environment Configuration

1. In the project root, create a file named `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in the values from your Firebase Project Settings:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cre-portal.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cre-portal
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cre-portal.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...
```

---

## 3. Super Admin & Centre Admin Credentials

### Role 1: Super Admin
- **Role:** Statewide platform management and governance.
- **Mobile Number:** Registered administrator phone number.
- **Initial Password:** First 8 digits of registered mobile number.
- **First Login Requirement:** Compulsory redirect to `/change-password` to establish a new confidential password.

### Role 2: Centre Admin
- **Max Admins per Centre:** Exactly 3 administrator accounts allowed per centre.
- **Username / Mobile Number:** Registered individual mobile number (e.g., `9999999999` or `9876543210`).
- **Initial Password:** First 8 digits of mobile number.
- **First Login Requirement:** Compulsory redirect to `/change-password`.

### Role 3: Student / Parent
- **No Password Required!**
- Parents / students enter their registered mobile number.
- If multiple children are associated with the same parent number, the portal asks:
  *"Whose information would you like to view?"*
- Restricted read-only view of attendance %, fee records, and exam results.

---

## 4. Running Locally

```bash
# Run the Next.js development server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 5. Free Deployment on Vercel

1. Push your code to a GitHub repository:
```bash
git init
git add .
git commit -m "Initial release of CRE Management Portal"
git branch -M main
git remote add origin https://github.com/your-username/cre-portal.git
git push -u origin main
```

2. Visit [Vercel](https://vercel.com/) and sign in.
3. Click **Add New > Project** and import your `cre-portal` repository.
4. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
5. Click **Deploy**.
6. Your portal will be live immediately at `https://cre-portal.vercel.app` (default free subdomain).

---

## 6. Verification & Quality Checklist

1. **Administrator Login:** Sign in with `9999999999` and `99999999`. Verify dashboard routing.
2. **Centre Creation:** Register a centre under **CRE Centres**. Test approval mode (Automatic vs Manual).
3. **Admin Limit:** Add up to 3 administrators per centre and verify the quota block on the 4th attempt.
4. **Attendance Marking:** Mark Present, Absent, and Leave. Verify that percentage = `(Present / Conducted) * 100`.
5. **Fee Payment:** Record full, partial, and excess fee payments. Check that student monthly status and financial income register update automatically.
6. **WhatsApp Reports:** Click "Share on WhatsApp" to verify pre-formatted bold text messages.
7. **Branded PDF:** Click "Download PDF" to check that PDFs generate in the browser with CRE and Wisdom logos.
8. **Student Portal:** Log in with parent phone `9847000111` to verify multi-child selection and read-only statements.
9. **Donate a Contact:** Submit an admission referral and verify duplicate phone detection.
