# LINEKORA — Data Inventory & International Data Flow Map

*UPDATED: September 14, 2026 — Corrected to reflect the confirmed production architecture (verified from production config files)*

---

## 1. CONTROLLER INFORMATION

| Field | Details |
|-------|---------|
| **Data Controller Name (Legal Entity)** | NDIVE LABS LTD |
| **Platform (trading name)** | LINEKORA |
| **Registration Number (RDB)** | [RDB CERTIFICATE NUMBER] |
| **Date of Registration** | [DATE] |
| **DPO Name** | [DPO Name] |
| **DPO Contact** | [DPO Email / Phone] |
| **Legal Status** | Private company registered in Rwanda |

---

## 2. CONFIRMED PRODUCTION ARCHITECTURE (VERIFIED SEPT 14, 2026)

| Component | Provider | Confirmed detail |
|-----------|----------|------------------|
| Frontend (Web App) | **Vercel** | `linekora/vercel.json`, SPA on Vercel |
| Backend / API | **Vercel** | `linekora-backend/vercel.json` (`@vercel/node`); API at `linekora-backend.vercel.app/api` |
| Database (PostgreSQL) | **Neon** | Host `ep-tiny-lab-at67jz3u.c-9.us-east-1.aws.neon.tech`, database `neondb` — **AWS us-east-1, N. Virginia, USA** |
| Database connection security | **Neon** | `sslmode=require` (TLS in transit) confirmed |
| Authentication | **Firebase / Google** | Project `linekora-7dd3e` — email/password auth only |
| File/storage of uploads (ID images, selfies, CVs, photos, attachments) | **Neon (PostgreSQL)** | Stored as base64 strings inside PostgreSQL columns (`verificationData`, `cvFile`, `avatarUrl`, `Message.attachments`, `Job.photos`) |
| SMS / Email provider | **None** | No SMS or email service integrated. Notifications are in-app (Neon `Notification` table) |
| Payment provider | **None** | Wallet is a local simulation (`localStorage`); MTN MoMo / Airtel / card are planned, not integrated |

> **Stripe and Twilio are NOT integrated. Do NOT list them as data processors.** This document only lists services that actually process personal data today.

---

## 3. DATA SUBJECTS & PERSONAL DATA INVENTORY

### 3.1 Worker (Individual — "Iyi Truka")

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| Full Name | Identity | Direct (Worker) | Registration, Identification, KYC | Neon (AWS us-east-1) | Consent |
| Email | Identity | Direct (Worker) | Login, account | Firebase Auth + Neon | Consent |
| Phone Number | Identity | Direct (Worker) | Contact, notifications | Neon | Consent |
| Gender | Descriptive | Direct (Worker) | Demographics, service matching | Neon | Consent |
| District / Sector / Village | Address | Direct (Worker) | Task localization, service matching | Neon | Consent |
| National ID Number | ID Document | Direct (Worker) | KYC verification | Neon (sensitive) | Consent + Legal Obligation |
| National ID front image | ID Document | Direct (Worker) | KYC verification | Neon (base64) (sensitive) | Consent |
| National ID back image | ID Document | Direct (Worker) | KYC verification | Neon (base64) (sensitive) | Consent |
| Selfie (biometric) | Biometric | Direct (Worker) | KYC — matches identity | Neon (base64) (sensitive) | Consent |
| Profile photo | Visual | Direct (Worker) | Profile display | Neon (base64) | Consent |
| Skills / experience / education / CV / certificates | Occupational | Direct (Worker) | Task matching, recruitment | Neon | Consent |

### 3.2 Employer / Company (Individual/Entity)

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| Full Name | Identity | Direct (Employer) | Registration, Identification | Neon | Consent |
| Email | Identity | Direct (Employer) | Login, account | Firebase Auth + Neon | Consent |
| Phone Number | Identity | Direct (Employer) | Contact | Neon | Consent |
| Company Name | Organizational | Direct (Employer) | Profile, invoicing | Neon | Consent |
| Company Location | Address | Direct (Employer) | Service delivery | Neon | Consent |
| TIN / Reg. Number | Official | Direct (Employer) | Verification (where collected) | Neon | Consent + Legal Obligation |
| Business registration documents | Official | Direct (Employer) | Company verification (where collected) | Neon (base64) | Consent |
| Payment details (planned) | Financial | — | Not yet collected (no payment integration) | — | — |

### 3.3 Admin / Staff — Platform Administration

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| Name | Identity | Direct (Admin) | Platform administration | Neon | Contractual necessity |
| Email | Identity | Direct (Admin) | Admin authentication | Firebase Auth + Neon | Contractual necessity |

### 3.4 User Activity Data (auto-collected)

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| IP Address | Technical | Auto-collected | Security, fraud prevention | Vercel access logs | Legitimate Interest |
| Browser/OS info | Technical | Auto-collected | Analytics | Vercel access logs | Legitimate Interest |
| Usage patterns | Behavioral | Auto-collected | Service improvement | Neon | Legitimate Interest |
| Auth tokens / session | Technical | Auto-generated | Session management | Firebase Auth | Contractual Necessity |

### 3.5 Communications & Notifications (in-app only — no SMS)

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| Message content | Behavioral | Worker/Employer | In-app chat | Neon | Contractual Necessity |
| Message attachments (images/PDF, base64) | User content | Worker/Employer | In-app chat | Neon | Contractual Necessity |
| Notification records | Behavioral | LINEKORA | In-app alerts | Neon | Contractual Necessity |

> **No SMS/email service is used.** When an SMS or email provider is integrated, this inventory must be updated before it processes personal data.

### 3.6 Support Requests

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| Name | Identity | Direct (User) | Support resolution | LINEKORA Email / Neon | Consent |
| Phone Number | Identity | Direct (User) | Support contact | LINEKORA Email / Neon | Consent |
| Issue Description | Behavioral | Direct (User) | Support resolution | LINEKORA Email / Neon | Consent |

---

## 4. PROCESSORS & ROLES (ACTUAL — NO OTHERS)

| Processor | Confirmed Location | Role | Data Processed | Agreement |
|-----------|--------------------|------|----------------|-----------|
| **Neon** (NeonDB Inc.) | AWS **us-east-1, N. Virginia, USA** | Primary PostgreSQL database — all PII, KYC documents, base64 uploads | All personal data, transaction records | Neon official DPA — [SAVE ON FILE] |
| **Vercel** Inc. | USA (global edge, data centers in US) | Frontend hosting + serverless backend/API | App code, API traffic, access logs (IP, browser info) | Vercel official DPA — [SAVE ON FILE] |
| **Google LLC / Firebase** | USA | Authentication (email/password) | UID, email, auth session data | Google Cloud DPA — [SAVE ON FILE] |

> **⚠️ Stripe and Twilio are NOT processors today.** They must NOT be listed in the DPO registration form or the outside-Rwanda authorization. They are planned integrations only.

---

## 5. INTERNATIONAL DATA FLOW MAP (CONFIRMED)

![LINEKORA Data Flow Map](diagrams/data_flow_map.png)

![LINEKORA International Data Flow](diagrams/international_data_flow.png)

**Origin:** Rwanda → **Storage/Processing:** USA (AWS us-east-1 & Vercel/Google US).
⚠️ **Payment, SMS and Email services are planned only — NO data flows to them today.**

> Diagram sources (re-generate with `dot -Tpng ...`): `diagrams/data_flow_map.dot`, `diagrams/international_data_flow.dot`

### International Transfer Justification

| Destination | Data | Lawful Basis for Transfer | Safeguards |
|-------------|------|---------------------------|------------|
| USA — Neon (AWS us-east-1) | All PII, KYC docs, messages | Consent + Contract | Neon DPA + Encryption (TLS `sslmode=require`) |
| USA — Vercel | App traffic, access logs | Legitimate Interest | Vercel DPA + Transmission encryption |
| USA — Google/Firebase | Auth data | Contractual Necessity | Google Cloud DPA |

---

## 6. DATA SUBJECT RIGHTS

LINEKORA shall ensure data subjects (Workers, Employers, Admin staff) can exercise:

| Right | Description | Implementation |
|-------|-------------|----------------|
| Access | View collected data | Account dashboard + DPO request (`Data_Subject_Rights_Policy.md`) |
| Rectification | Correct inaccurate data | Profile editing |
| Erasure | Request deletion | Account deletion endpoint + DPO request |
| Restrict | Limit processing | DPO request |
| Portability | Export data | Data export (planned) |
| Object | Object to processing | DPO request |
| Not subject to automated decisions | Trust score does not produce legal effects | Policy + DPIA |

---

## 7. DATA RETENTION SCHEDULE (SUMMARY)

| Data Category | Retention Period | Deletion Method |
|---------------|------------------|-----------------|
| Worker/Employer PII | Active account + 2 years | Secure deletion |
| National ID images + selfie (sensitive) | Active account + 2 years | Secure deletion (account deletion endpoint) |
| Messages & attachments | Account deletion + 2 years | Secure deletion |
| Job/application data | 7 years (legal) | Archive then delete |
| Transaction records | 7 years (legal) | Archive then delete |
| Support tickets | Resolution + 1 year | Secure deletion |
| Vercel access logs | 1 year | Automatic purge |
| Firebase sessions/auth tokens | Session end | Automatic expiry |
| Notifications | Account deletion + 2 years | Secure deletion |

*Full policy: `Data_Retention_and_Deletion_Policy.md`*

---

## 8. SECURITY MEASURES (CURRENT STATUS)

| Measure | Status |
|---------|--------|
| Encryption in transit (TLS) — DB confirmed (`sslmode=require`); Vercel HTTPS | ✅ Confirmed |
| Access controls — role checks (`WORKER/COMPANY/EMPLOYER/ADMIN`); verification docs admin-only | ✅ In code |
| Data Protection Agreements on file | ⏳ Pending — download official DPAs (Neon, Vercel, Google) |
| Encryption at rest (AES-256) — confirm Neon/Google settings | ⏳ To confirm in dashboards |
| Audit logging of data access | ⚠️ Not implemented — action required |
| Incident response / 72-hour breach notification | ⏳ Policy drafted (`Data_Breach_Response_Policy.md`) — build contact list |

---

## 9. COMPLIANCE STATUS — MILESTONE TRACKER

| # | Milestone | Status | Target Date | Notes |
|---|-----------|--------|-------------|-------|
| 1 | Data Controller Registration (RDB/NCSA) | ✅ Completed | — | Certificate obtained |
| 2 | Data Inventory & Flow Map (real architecture) | ✅ Completed | — | Verified from production config (Sept 14, 2026) |
| 3 | DPIA | ⏳ Draft complete | — | `DPIA_LINEKORA.md` — needs DPO sign-off |
| 4 | DPA — Neon (official, on file) | ⏳ Pending | — | Download from Neon |
| 5 | DPA — Vercel (official, on file) | ⏳ Pending | — | Download from Vercel |
| 6 | DPA — Google/Firebase (official, on file) | ⏳ Pending | — | Download from Google Cloud |
| 7 | DPO Authorization — transfer outside Rwanda | ⏳ Blocked | — | Requires DPAs (#4-6) + current inventory |
| 8 | DPO Authorization — storage outside Rwanda | ⏳ Blocked | — | Requires DPO Authorization (#7) |

---

## 10. STATUS LEGEND

| Status | Meaning |
|--------|---------|
| ✅ Completed | Milestone finalized |
| ⏳ In Progress | Actively being worked on |
| ⏳ Pending | Prepared, waiting to be completed |
| ⏳ Blocked | Cannot proceed until prerequisite met |

---

*Document prepared for LINEKORA Data Protection Compliance*
*Pursuant to Rwanda's Data Protection Law No. 058/2021 of 13/10/2021 & PDPB No. 3/2021*
*Last Updated: September 14, 2026*
*Verified against: `linekora-backend/.env` (Neon us-east-1), `linekora-backend/vercel.json` (Vercel backend), `linekora/firebase-applet-config.json` (Firebase), `linekora/vercel.json` (Vercel frontend)*