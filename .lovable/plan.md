

# Club Attendance Management System

## Overview
A full-stack Club Attendance Management System with role-based dashboards, GPS-based live tracking, biometric authentication (WebAuthn), and email OTP verification. Built with React + Supabase Cloud backend.

---

## Phase 1: Authentication & Roles

### Login & Registration Pages
- **Super Admin Login**: College ID + Password only (hardcoded credentials stored securely server-side)
- **Club Admin Login**: Name + College ID/Email + Password + WebAuthn biometric prompt
- **Member Login**: Same as Club Admin flow
- **Member Registration**: Name, College ID, Email, Club selection, Password with email OTP verification before activation
- Role-based redirects after login

### Database & Roles
- **profiles** table (name, college_id, email, club assignment)
- **user_roles** table (separate from profiles for security — admin, club_admin, member)
- **clubs** table (name, boundary coordinates, admin assignment)
- Row-Level Security policies per role
- Fingerprint/WebAuthn credential storage for biometric login

---

## Phase 2: Dashboards

### Super Admin Dashboard
- **Clubs Overview**: Cards showing club name, admin name, total members — clickable to drill into attendance
- **Club Attendance View**: Expandable table with Day columns, session breakdowns (start/end times), total hours
- **Admin Account Management**: Create/delete club admin accounts, enroll fingerprints
- **Club Management**: Create/delete clubs, assign admins

### Club Admin Dashboard
- **Attendance Dashboard**: Same table format but filtered to their club only
- **Members Management**: List members with remove capability
- **Location Boundary**: Set GPS boundary coordinates using browser Geolocation API
- **Day Control**: Open/Close day buttons to enable/disable attendance tracking

### Member Dashboard
- **Zone Status**: Live 🟢 In Zone / 🔴 Out of Zone indicator using GPS
- **Today's Attendance**: Current day's total hours and session list
- **Overall Summary**: Total hours and total days attended
- **Attendance History**: Expandable table with all past sessions
- **Profile Page**: View profile details + change password

---

## Phase 3: GPS Attendance Tracking

- Browser Geolocation API for continuous location tracking
- Automatic session start when member enters club boundary
- Automatic session end when member leaves boundary
- Support for multiple sessions per day
- Attendance only counted when: day is open + member belongs to club + member inside boundary
- **attendance_sessions** table (member_id, club_id, day, start_time, end_time)
- **day_status** table (club_id, date, is_open)

---

## Phase 4: Biometric & OTP

- **WebAuthn Integration**: Fingerprint/Face ID/device PIN enrollment during first login; required for Club Admin and Member login
- **Email OTP**: Supabase Auth email verification during member registration with clean OTP input UI

---

## Phase 5: Responsive Design & Polish

- Mobile-first responsive layout across all pages
- Tables convert to stacked cards on mobile
- Sidebar navigation (collapsible on mobile)
- Loading states, error handling, toast notifications
- Professional dashboard UI with cards, charts, and modals

---

## Technical Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase Cloud (Database, Auth, Edge Functions, RLS)
- **Auth**: Supabase Auth + WebAuthn API + Email OTP
- **GPS**: Browser Geolocation API (requires HTTPS, user permission, foreground only)
- **State**: React Query for server state, Context for auth state

