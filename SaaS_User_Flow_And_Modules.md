# SaaS User Flow & Module Documentation

This document outlines the end-to-end journey of a user interacting with the HR & Payroll system and provides a detailed breakdown of every module available in the application.

---

## 1. The Initial User Flow (Step-by-Step)

How a brand new company starts using the platform, from registration to daily operations.

### Step 1: Registration (The "Pending" state)
1. A prospective client visits the public `/register` page.
2. They fill out their company details, name, work email, and create a strong password.
3. Upon submission, they do **not** get immediate access. Their account is created with a `status: "pending"` and `isActive: false`.
4. They see a confirmation message stating their request is under review.

### Step 2: Super Admin Approval (The "Global" level)
1. The platform owner logs in via `/login` using their overriding `super_admin` credentials.
2. The system routes them to the exclusive `/super-admin` global dashboard.
3. The Super Admin reviews the pending company request.
4. Upon clicking "Approve", the system dynamically generates a new, isolated `Organization` record and links the requesting user to it as the primary `admin`. The user's status becomes "Active".

### Step 3: First Login & Setup Wizard (The "Configuration" state)
1. The newly approved Company Admin logs into `/login`.
2. The system detects it is their first time logging in and immediately hooks them into the rigid **Setup Wizard**.
3. The Admin *must* complete this wizard before accessing the dashboard. They configure:
   - **Company Details:** Legal name, tax IDs (PAN/TAN), logo, and website.
   - **Locations:** Primary headquarters and any branch offices.
   - **Departments:** Creating initial departments (e.g., Engineering, HR).
   - **Tax Settings:** Configuring PF, ESIC applicability, and PT policies.

### Step 4: Daily Operations (The "Active" state)
1. **The Admin Dashboard:** The Admin arrives at their main control panel. They begin onboarding employees, assigning managers, and setting up payroll structures.
2. **The Employee Dashboard:** When the Admin creates an Employee, that worker receives login access. They log in via the same `/login` portal but are routed to a restricted dashboard where they can only view their own attendance, request leaves, download payslips, and manage their assigned tasks.

---

## 2. Detailed Module Breakdown

The application is segregated into distinct, highly secure modules. All modules are strictly isolated by `organizationId`—meaning Company A can never access Company B's data.

### 2.1 Core HR & Employee Management
*Provides the central directory and structural hierarchy for the organization.*
* **Employees:** Handles the complete lifecycle of a worker. Stores personal details (addresses, bank info), job details (department, reporting manager, shift), compensation structure, and compliance applicability (PF/ESIC).
* **Departments & Teams:** Allows the organization to build standard operational hierarchies. 
* **Document Management:** Tracks mandatory KYC documents (Aadhaar, PAN, Bank Proofs) and triggers reminders for incomplete profiles.

### 2.2 Attendance & Leaves Management
*Tracks worker availability and enforces time-off policies.*
* **Leave Requests:** Employees can request time off (Paid, Unpaid, Sick). Requests enter a pending state for their reporting manager to approve or reject. 
* **Attendance Tracking:** Logs daily punch-ins, punch-outs, and calculates total working hours.
* **Attendance Thresholds:** Automatically flags anomalies if an employee drops below mandatory working hours or exceeds leave limits without formal approval.

### 2.3 Payroll & Compensation
*The financial engine of the organization, processing salaries and adjustments.*
* **Dynamic Net Salary Calculation:** Employee salaries are calculated on the fly. If an Admin updates an employee's base pay, Mongoose pre-save hooks automatically recalculate PF, ESIC, and Net Salary based on the new amounts.
* **Payslip Generation:** Admins can generate monthly payslips natively. The system uses atomic race-condition-free ID generation (e.g., `PSL-123456`) to ensure safe bulk processing.
* **Bonuses:** Admins can issue variable pay (fixed amounts or percentages of base salary). Bonuses can be targeted at individuals, specific departments, or broadcasted to the entire organization.
* **Loans & Advances:** Admins can issue and track company loans to employees, automatically deducting installments from upcoming payroll runs.
* **Full & Final Settlement (FnF):** Handles the complex calculation of exiting employees, computing pending salaries, encashing un-availed leaves, and recovering outstanding loan balances.

### 2.4 Taxes & Compliance
*Ensures the organization meets legal and regulatory frameworks.*
* **Taxes:** Computes individual income tax (TDS) based on the employee's declared tax regime (Old vs New), investments (80C, 80D), and HRA rent receipts.
* **Compliance Reports:** Generates structured legal reporting (PF Challans, ESIC returns) scoped strictly to the Admin's organization.

### 2.5 Task & Project Management
*An integrated productivity suite negating the need for third-party tools like Jira.*
* **Projects:** Defines high-level client deliverables, budgets, and timelines. Projects are locked to the organization and assigned to specific project managers.
* **Tasks:** Granular action items assigned to specific employees. Tasks feature priority levels, due dates, progress tracking sliders (0-100%), and comment-based collaboration. 
* Tasks are strictly scoped so employees only see their assigned work, while Admins have an oversight view.

### 2.6 Super Admin Global Module
*The overriding management portal for the platform owners.*
* **Dashboard:** Tracks global metrics across the entire SaaS platform (total organizations, total platform users, active subscriptions).
* **Onboarding Queue:** Approves or rejects incoming company registrations.
* **System Settings:** Controls global application configurations overriding standard organization behavior, managed entirely outside of the standard `/dashboard` routing structure via Edge-compatible authorization.
