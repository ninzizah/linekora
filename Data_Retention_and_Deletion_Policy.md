# DATA RETENTION & DELETION POLICY
# LINEKORA — NDIVE LABS LTD

**Reference:** LINEKORA-POL-001
**Version:** 1.0 — DRAFT
**Effective Date:** [Date approved by DPO]
**Owner:** Data Protection Officer (DPO)
**Review Date:** Annually or upon material change

---

## 1. PURPOSE

This policy sets out how long LINEKORA keeps personal data and how it is securely deleted once it is no longer required. It applies to all personal data processed by LINEKORA, including sensitive data (National ID images, selfies).

This policy is required by:
- Rwanda Data Protection Law No. 058/2021 of 13/10/2021
- Personal Data Protection Policy (PDPB) No. 3/2021

---

## 2. SCOPE

This policy applies to:
- All personal data processed by LINEKORA's platform (LINEKORA Web App)
- Data stored in NeonDB (PostgreSQL), Firebase Auth, and Vercel access logs
- All data subjects: Workers, Employers/Companies, Admin staff
- All staff and contractors of NDIVE LABS LTD who have access to personal data

---

## 3. RETENTION PERIODS

### 3.1 Data subject account data

| Data category | Retention period | Starts when | Legal basis |
|--------------|-----------------|-------------|-------------|
| Worker profile (name, phone, email, location, skills) | **Active account + 2 years** | Account deletion request | PDPB — proportionality |
| Employer profile (name, phone, company info) | **Active account + 2 years** | Account deletion request | PDPB — proportionality |
| Admin account data | **While employed + 2 years** | End of employment | PDPB |

### 3.2 Sensitive / identity data (KYC)

| Data category | Retention period | Starts when | Legal basis |
|--------------|-----------------|-------------|-------------|
| National ID number | **Active account + 2 years** | Account deletion request | Consent + KYC obligation |
| National ID front image | **Active account + 2 years** | Account deletion request | Consent + KYC obligation |
| National ID back image | **Active account + 2 years** | Account deletion request | Consent + KYC obligation |
| **Selfie photo (biometric)** | **Active account + 2 years** | Account deletion request | Consent + data minimisation |

> **Important:** If a user requests account deletion, all KYC documents (NID + selfie) must be deleted within **30 days** of receiving the request.

### 3.3 Transaction & financial data

| Data category | Retention period | Legal basis |
|--------------|-----------------|-------------|
| Transaction records | **7 years** after transaction | Legal obligation (Rwanda financial regulations) |
| Commission records | **7 years** after transaction | Legal obligation |
| Payment method references | **Until account closure + 2 years** | Contractual necessity |

### 3.4 Communications & support

| Data category | Retention period | Legal basis |
|--------------|-----------------|-------------|
| In-app messages | **Until account deletion + 2 years** | Contractual necessity |
| Message attachments | **Until account deletion + 2 years** | Contractual necessity |
| Support tickets | **Resolution + 1 year** | Legitimate interest |

### 3.5 Technical / logs

| Data category | Retention period | Legal basis |
|--------------|-----------------|-------------|
| Vercel access logs (IP, device, location) | **1 year** | Legitimate interest (security) |
| Firebase session logs | **30 days** | Legitimate interest |
| Error/crash logs | **90 days** | Legitimate interest |

### 3.6 Other data

| Data category | Retention period | Legal basis |
|--------------|-----------------|-------------|
| Auth tokens (Firebase) | **Session end** | Automatic expiry |
| Analytics/aggregated data | **2 years** (anonymised) | Legitimate interest |
| DPIA documents | **10 years** | Legal obligation |
| Data Protection Agreements | **10 years** | Legal obligation |

---

## 4. DELETION METHODS

### 4.1 Automated deletion

| System | Trigger | Method |
|--------|---------|--------|
| Firebase Auth tokens | Session timeout | Automatic expiry by Firebase |
| Vercel access logs | 1 year | Automatic purge (Vercel default) |
| Firebase session logs | 30 days | Automatic purge |
| Error/crash logs | 90 days | Automatic purge |

### 4.2 Manual / process-driven deletion

| Trigger | Method | Owner | Timeframe |
|---------|--------|-------|-----------|
| User requests account deletion | `DELETE /api/users/:id` endpoint — removes user record + all linked data (jobs, applications, messages, notifications, verification data) | Developer (backend) | Within **30 days** of request |
| Retention period expires (non-automated) | Scheduled query to identify and delete expired records | Developer + DPO | Quarterly review |
| Data-subject erasure request (not account deletion) | Process documented in `Data_Subject_Rights_Policy.md` | DPO + Developer | Within **30 days** |
| Employee departure | Admin manually deletes staff account (if not retained) | Management + DPO | Within **30 days** |

### 4.3 Secure deletion standards

- **Database records:** DELETE from PostgreSQL + verify deletion by confirming the record no longer appears in query results. Deleted data must not be recoverable from backups within **90 days** (confirm Neon backup rotation policy).
- **Base64 document data** (stored as JSON in DB columns): Deleting the User record cascades to deletion of `verificationData`, and related Message attachments — but confirm cascade behaviour for each column.
- **Object storage** (if adopted in future): Use provider-specific deletion + versioning purge.

---

## 5. ACCOUNT DELETION PROCESS

When a user requests account deletion:

1. **Identity verification** — confirm the requester is the account owner (logged-in session or verified email/phone)
2. **Check for active obligations** — if the user has an active job/contract in escrow, inform the user that deletion will be processed after the transaction is complete
3. **Execute deletion** — run the backend deletion endpoint which removes:
   - User record (all fields including `verificationData`, `avatarUrl`)
   - All Job records posted by this user (and their Applications)
   - All Application records where this user is the worker
   - All Messages sent or received by this user
   - All Notifications for this user
   - All Reviews given or received by this user
   - All Team memberships for this user
4. **Log the deletion** — record the date, requestor, and action taken (do not record the deleted data)
5. **Notify the user** — confirm deletion is complete within 30 days

---

## 6. BACKUP RETENTION

| Backup type | Retention | Notes |
|-------------|-----------|-------|
| NeonDB automated backups | Per Neon's default policy (confirm: typically 7–30 days) | User data in backups will be purged on rotation |
| Manual backups (if any) | Must not be retained beyond 90 days for any deleted record | Developer responsibility |

---

## 7. EXCEPTIONS

Data may be retained beyond the standard retention period if:
- Required by law, regulation, or court order (document the exception)
- Required for ongoing legal proceedings
- Required for fraud investigation (document the exception and limit scope)

---

## 8. ROLES & RESPONSIBILITIES

| Role | Responsibility |
|------|---------------|
| **DPO** | Oversees retention compliance; reviews quarterly; handles data-subject requests |
| **Developer** | Implements automated deletion; builds deletion endpoints; verifies cascade deletes |
| **Management** | Ensures resourcing for retention tools; approves exceptions |
| **All staff** | Do not retain personal data beyond this policy; report accidental retention |

---

## 9. NON-COMPLIANCE

Failure to comply with this policy may result in:
- Regulatory action by the Rwanda Data Protection & Privacy Office (DPO/NCSA)
- Fines under Law No. 058/2021
- Disciplinary action against staff responsible

---

## 10. REVIEW

This policy must be reviewed:
- Annually (next review: [Date + 1 year])
- Upon any material change to the platform's data processing
- After any data breach involving personal data
- Upon change in Rwandan data protection law or DPO guidance

---

*Document prepared for LINEKORA Data Protection Compliance*
*Pursuant to Rwanda Data Protection Law No. 058/2021 of 13/10/2021 and PDPB No. 3/2021*
*Version 1.0 — DRAFT — September 14, 2026*