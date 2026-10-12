# DATA PROTECTION IMPACT ASSESSMENT (DPIA)
# LINEKORA — Identity Verification & Job Matching Platform

**Pursuant to:** Rwanda Data Protection Law No. 058/2021 of 13/10/2021 and Personal Data Protection Policy (PDPB) No. 3/2021

---

| Field | Details |
|-------|---------|
| **Document Reference** | LINEKORA-DPIA-001 |
| **Version** | 1.0 — DRAFT |
| **Data Controller** | NDIVE LABS LTD, trading as LINEKORA |
| **Data Protection Officer** | [FILL IN — Name / Phone / Email] |
| **RDB Registration Number** | [FILL IN] |
| **Assessment Date** | September 14, 2026 |
| **Review Date** | September 14, 2027 (or upon material change to processing) |

---

## 1. OVERVIEW & SCOPE

### 1.1 What is LINEKORA?

LINEKORA is a web-based job-matching platform operated in Rwanda by NDIVE LABS LTD. It connects:
- **Workers** (job seekers, called "Iyi Truka") with **Employers** and **Companies**
- Workers register, create a profile, and apply to tasks/jobs posted by employers
- LINEKORA earns commissions on completed hires

### 1.2 Why this DPIA is mandatory

This DPIA is required because LINEKORA processes:

- **Biometric data** — selfies submitted as part of identity verification (selfie photo used to match against National ID), which is classified as *sensitive personal data* under Rwanda law
- **National Identity Card data** — ID number, front image, back image (also sensitive)
- **Large-scale processing** — the platform is intended for mass use by workers and employers across Rwanda
- **Automated profiling** — trust scores and verification tiers are computed from user data and verification documents

A DPIA is mandatory under the PDPB when processing involves sensitive data, biometric data, automated decision-making, or large-scale processing of personal data.

### 1.3 Scope of this assessment

This DPIA covers all personal data processing activities of the LINEKORA platform as of September 2026.

---

## 2. DATA CONTROLLER & DPO INFORMATION

| Field | Details |
|-------|---------|
| Legal entity name | NDIVE LABS LTD |
| Trading name | LINEKORA |
| Country of registration | Rwanda |
| RDB Registration Number | [FILL IN] |
| Data Controller Certificate No. | [FILL IN] |
| DPO Name | [FILL IN] |
| DPO Phone | [FILL IN] |
| DPO Email | [FILL IN] |
| Website | linekora.com |
| Physical address | [FILL IN — Province, District, Sector] |

---

## 3. DESCRIPTION OF PROCESSING

### 3.1 Data subjects

| Data subject category | Description | Estimated number |
|----------------------|-------------|------------------|
| Workers ("Iyi Truka") | Individuals seeking manual/skilled work in Rwanda | Up to 100,000 |
| Employers / Companies | Individuals and businesses posting jobs/tasks | Up to 10,000 |
| Admin / LINEKORA staff | Platform administrators | Under 10 |

### 3.2 Personal data collected

#### Sensitive personal data

| Data element | Data subject | Purpose | Storage |
|-------------|--------------|---------|---------|
| National ID number | Worker & Employer | KYC identity verification | NeonDB (PostgreSQL) — AWS us-east-1 |
| National ID front image (base64) | Worker & Employer | KYC identity verification | NeonDB (PostgreSQL) |
| National ID back image (base64) | Worker & Employer | KYC identity verification | NeonDB (PostgreSQL) |
| **Selfie photo** (biometric) | Worker & Employer | KYC — matches against National ID photo to confirm identity | NeonDB (PostgreSQL) |
| Gender | Worker | Demographics, service matching | NeonDB (PostgreSQL) |

#### Personal data (non-sensitive)

| Data element | Purpose | Storage |
|-------------|---------|---------|
| Full name | Account creation, identification | NeonDB + Firebase Auth |
| Phone number | Contact, account recovery | NeonDB |
| Email | Account creation, login, notifications | NeonDB + Firebase Auth |
| Profile photo | Profile display | NeonDB (data URL) |
| Location (district, sector, village) | Task localization, matching | NeonDB |
| Skills, education, experience, CV, certificates | Job matching, recruitment | NeonDB |
| IP address, device info, browser/OS | Security, fraud prevention, analytics | Vercel access logs |
| Messages, attachments | In-app communication | NeonDB |
| Payment records (in development) | Escrow, commission tracking | [Planned — localStorage at present] |
| Notifications | In-app alerts | NeonDB |

### 3.3 Lawful basis for processing

| Processing activity | Lawful basis |
|---------------------|-------------|
| Account registration | Consent of data subject |
| Identity verification (KYC) — NID + selfie | Consent of data subject + Legal obligation (platform trust) |
| Job matching & recruitment | Consent + Contractual necessity |
| Payment processing (in development) | Contractual necessity |
| Security logs, fraud prevention | Legitimate interest |
| Compliance with regulatory requests (RURA, BNR, Ministry of Labour) | Legal obligation |

### 3.4 Recipients of data

| Recipient | Purpose | Legal basis for disclosure |
|-----------|---------|---------------------------|
| Vercel (US) | Frontend hosting, CDN, access logs | DPA (contractual) |
| NeonDB / Neon (US — AWS us-east-1) | Primary database — all PII | DPA (contractual) |
| Google LLC / Firebase (US) | Authentication (UID, email, phone, role) | DPA (contractual) |
| RURA / BNR / Ministry of Labour (Rwanda) | Regulatory compliance — when required by law | Legal obligation |

> **Note:** Stripe and Twilio are NOT currently integrated and are NOT recipients. Payments use in-app simulation with MoMo; notifications are in-app only.

### 3.5 International transfers

| Destination country | Provider | Data transferred | Transfer mechanism |
|---------------------|----------|------------------|-------------------|
| USA | NeonDB (AWS us-east-1, N. Virginia) | All PII, transaction records | Data Processing Agreement + Standard Contractual Clauses (SCCs) |
| USA | Vercel | Frontend code, access logs, IP | DPA + SCCs |
| USA | Google (Firebase Auth) | Authentication data | DPA + SCCs (Google Cloud DPA) |

> This DPIA and the corresponding DPAs form part of the application for **authorization to transfer and store personal data outside Rwanda** per Section 5 of the NCSA/DPO Registration Form.

### 3.6 Data retention periods

| Data category | Retention period | Deletion method | Legal basis |
|---------------|------------------|-----------------|-------------|
| Worker PII (name, phone, location, skills) | Active account + 2 years after deletion request | Secure deletion from NeonDB | PDPB / legitimate interest |
| National ID images + selfie (sensitive) | Active account + 2 years, or immediately upon account deletion request | Secure deletion; verified that no other copies exist | Consent + Data minimization |
| Job & application data | 7 years after transaction | Archive then secure deletion | Legal obligation (financial records) |
| Transaction records | 7 years | Archive then secure deletion | Legal obligation (financial regulations) |
| Support tickets | Resolution + 1 year | Secure deletion | Legitimate interest |
| IP/device logs | 1 year | Automatic purge | Legitimate interest |
| Auth tokens (Firebase) | Session end | Automatic expiry | Contractual necessity |

> **Implementation note:** In the current codebase, verification documents are stored as base64 strings in PostgreSQL columns. No automated deletion process exists yet. A data deletion routine must be built to honour retention periods and data-subject erasure requests. See `Data_Retention_and_Deletion_Policy.md`.

---

## 4. NECESSITY & PROPORTIONALITY

### 4.1 Is the processing necessary?

| Question | Assessment |
|----------|-----------|
| Is identity verification necessary? | **Yes.** The platform involves real economic transactions (hiring, escrow, commissions). Without verification, the platform is vulnerable to fraud and impersonation. |
| Is biometric (selfie) matching necessary? | **Yes.** A selfie matched against the National ID photo is the only practical way to verify that the person is who they claim to be, at scale and remotely. |
| Is collection of National ID necessary? | **Yes.** The National ID is Rwanda's primary identity document; collection is the industry standard for KYC in Rwanda. |
| Are all data elements collected actually needed? | See 4.2. |

### 4.2 Data minimisation review

| Data element | Needed for KYC? | Assessment | Recommendation |
|-------------|----------------|-----------|----------------|
| Full name | Yes | Matches National ID | Keep |
| Phone number | Yes | Contact + account security | Keep |
| Email | Yes | Account creation, login | Keep |
| National ID number | Yes | Unique ID for verification | Keep |
| NID front + back images | Yes | Visual proof of identity | Keep |
| Selfie (biometric) | Yes | Match against NID photo | Keep |
| Gender | Partial | Used in matching but not essential for KYC | Keep (optional field) |
| District / Sector / Village | Yes | Task localisation | Keep |
| CV, certificates, portfolio | Optional — not KYC | Worker profile enrichment; not required for account | Mark clearly as optional |
| Profile photo | Optional — not KYC | Display only; could be removed without affecting core service | Mark clearly as optional |

### 4.3 Proportionality

The processing is **proportionate** given:
- The platform involves real employment and financial transactions
- Fraud and impersonation would cause direct harm to both workers and employers
- Less-invasive alternatives (e.g. name-only verification) are insufficient for a trust-based platform
- The controller has implemented data minimisation (only essential fields collected for KYC)
- Retention periods are defined and deletion procedures will be enforced

---

## 5. RISK ASSESSMENT

### 5.1 Risk matrix

| | Negligible (1) | Minor (2) | Moderate (3) | Major (4) | Maximum (5) |
|---|---|---|---|---|---|
| **Almost certain (5)** | Medium | Medium | High | Critical | Critical |
| **Likely (4)** | Low | Medium | Medium | High | Critical |
| **Possible (3)** | Low | Medium | Medium | High | High |
| **Unlikely (2)** | Low | Low | Medium | Medium | High |
| **Rare (1)** | Low | Low | Low | Medium | Medium |

- **Risk level** = Likelihood × Severity
- **Tolerable:** Low, Medium
- **Requires mitigation:** High
- **Unacceptable:** Critical — must be eliminated before processing begins

### 5.2 Identified risks

#### Risk 1: Unauthorised access to sensitive data (NID, selfie)

| Parameter | Assessment |
|-----------|-----------|
| **What could go wrong?** | Hacker or unauthorised staff gains access to National ID images, selfie, or NID number stored in the database |
| **Who is affected?** | Workers and Employers who submitted KYC documents |
| **Potential harm** | Identity theft, fraud, personal safety risk, reputational damage |
| **Likelihood** | Possible (3) — database is a high-value target |
| **Severity** | Major (4) — sensitive/biometric data at stake |
| **Pre-mitigation risk** | **HIGH** |

#### Risk 2: Accidental or intentional disclosure by staff

| Parameter | Assessment |
|-----------|-----------|
| **What could go wrong?** | LINEKORA admin or staff member with access to admin dashboard views or downloads verification documents without authorisation |
| **Who is affected?** | Any worker/employer whose verification is reviewed |
| **Potential harm** | Privacy breach, discrimination, personal safety risk |
| **Likelihood** | Possible (3) |
| **Severity** | Major (4) |
| **Pre-mitigation risk** | **HIGH** |

#### Risk 3: International data transfer without safeguards

| Parameter | Assessment |
|-----------|-----------|
| **What could go wrong?** | Data transferred to US servers without DPA/SCCs; or DPA lapses |
| **Who is affected?** | All users |
| **Potential harm** | Loss of protection under Rwandan law; inability to enforce rights abroad |
| **Likelihood** | Unlikely (2) — DPAs in place, DPO authorization being sought |
| **Severity** | Major (4) |
| **Pre-mitigation risk** | **MEDIUM** |

#### Risk 4: Data breach (external attack)

| Parameter | Assessment |
|-----------|-----------|
| **What could go wrong?** | SQL injection, API exploit, or infrastructure breach exposes database contents |
| **Who is affected?** | All users — potentially full database |
| **Potential harm** | Identity theft, fraud, financial loss, reputational harm |
| **Likelihood** | Possible (3) |
| **Severity** | Maximum (5) — massive scale of sensitive data |
| **Pre-mitigation risk** | **HIGH** |

#### Risk 5: No data deletion mechanism (retention failure)

| Parameter | Assessment |
|-----------|-----------|
| **What could go wrong?** | Data subjects request deletion, or retention period expires, but data is never deleted because no deletion routine exists |
| **Who is affected** | Users who close accounts, or users whose data has been held beyond retention period |
| **Potential harm** | Continued exposure risk; legal non-compliance |
| **Likelihood** | Almost certain (5) — current code has no auto-deletion |
| **Severity** | Moderate (3) |
| **Pre-mitigation risk** | **HIGH** |

#### Risk 6: Excessive base64 data in DB — denial of service / performance

| Parameter | Assessment |
|-----------|-----------|
| **What could go wrong?** | Large base64-encoded images (5 MB limit per attachment; potentially many records) stored in PostgreSQL row data could cause DB bloat and slow queries |
| **Who is affected?** | System availability for all users |
| **Potential harm** | Service outage; inability to process jobs |
| **Likelihood** | Possible (3) |
| **Severity** | Moderate (3) |
| **Pre-mitigation risk** | **MEDIUM** |

---

## 6. MITIGATING MEASURES

### Risk 1 & 2 & 4 — Unauthorised access / disclosure / breach

| Measure | Status | Owner |
|---------|--------|-------|
| **Encryption in transit (TLS 1.2+)** — all connections use HTTPS via Vercel/Neon | ✅ Implemented (Vercel default + Neon SSL) | Developer |
| **Encryption at rest (AES-256)** — Neon database encryption; Firebase Auth encryption | ⏳ Confirm in Neon/Firebase dashboards | Developer (see Checklist) |
| **Role-based access control (RBAC)** — only admins can view verification documents | ✅ Implemented: `requireAdmin` middleware on `/api/verification/*` routes | Developer |
| **Access logging** — all data access is logged | ⚠️ **Not implemented in code** — no audit-log table exists | **Action required** |
| **Vulnerability scanning / penetration testing** | ⏳ No evidence of formal testing | Developer / Management |
| **Incident response plan** | ⏳ Not yet documented | DPO / Management |
| **72-hour breach notification procedure** | ⏳ Policy drafted (`Data_Breach_Response_Policy.md`) | DPO |
| **Staff confidentiality agreements** | ⏳ Not yet implemented | Management |
| **Secure base64 handling** — verify DB column limits, rate limits on verification upload | ⏳ Partial: `express.json({ limit: '50mb' })` set | Developer |

### Risk 3 — International transfer safeguards

| Measure | Status | Owner |
|---------|--------|-------|
| DPA with Neon (NeonDB) | ✅ Internal template + official DPA on file | DPO |
| DPA with Vercel | ✅ Internal template + official DPA on file | DPO |
| DPA with Google/Firebase | ✅ Internal template + official DPA on file | DPO |
| Standard Contractual Clauses (SCCs) | ⏳ Confirm within official DPAs (Google includes SCCs) | DPO |
| DPO authorization for outside-Rwanda transfer | ⏳ Pending — application to submit | DPO |
| DPO authorization for outside-Rwanda storage | ⏳ Pending — application to submit | DPO |

### Risk 5 — Retention / deletion failure

| Measure | Status | Owner |
|---------|--------|-------|
| Retention periods defined | ✅ (see section 3.6 and `Data_Retention_and_Deletion_Policy.md`) | DPO |
| **Automated data-deletion routine** — cron job or scheduled task to purge expired records | ❌ **Not implemented — CRITICAL** | **Developer (action required)** |
| Account-deletion API endpoint that also removes verification data | ⏅ `DELETE /api/users/:id` exists and deletes related records including `verificationData` — verify it also handles base64 docs in Messages and Jobs | Developer |
| Process for handling manual data-subject erasure requests | ⏳ Policy drafted (`Data_Subject_Rights_Policy.md`) | DPO |

### Risk 6 — DB bloat / performance

| Measure | Status | Owner |
|---------|--------|-------|
| Consider moving base64 images to object storage (e.g. S3, GCS, Vercel Blob) | ⏳ Not implemented | Developer |
| Set row-size warnings / limits | ⏳ `express.json({ limit: '50mb' })` exists but no DB-level limit | Developer |

---

## 7. RESIDUAL RISK ASSESSMENT

After applying mitigations:

| Risk | Residual risk level | Rationale |
|------|---------------------|-----------|
| R1: Unauthorised access to sensitive data | **Medium** | TLS + RBAC in place; at-rest encryption needs confirmation; access logging needs implementation |
| R2: Staff disclosure | **Medium** | RBAC limits access; staff agreements + audit logging still needed |
| R3: International transfer without safeguards | **Low** | DPAs in place; SCCs within provider DPAs; authorization application in progress |
| R4: External data breach | **Medium** | RBAC + TLS limit exposure; no penetration test yet; 72h notification policy drafted |
| R5: Retention / deletion failure | **Medium** | Retention periods defined; deletion policy drafted; automated deletion not yet built |
| R6: DB bloat | **Low** | Manageable with size limits; object-storage migration can reduce risk over time |

**All residual risks are at or below MEDIUM — acceptable, subject to completing the action items above.**

---

## 8. CONSULTATION

| Consultation | Status |
|-------------|--------|
| Internal DPO review | ⏳ Pending — DPO to review and approve |
| Data subjects — user feedback on data collection | ⏳ Not consulted (pre-launch) — will include privacy notice at launch |
| Legal counsel review | ⏳ Recommended — engage Rwandan data protection lawyer before DPO submission |
| NCSA / DPO pre-consultation | ⏳ Optional — may request informal guidance before formal application |

---

## 9. DPO OPINION & APPROVAL

### DPO opinion

I have reviewed this Data Protection Impact Assessment for the LINEKORA platform.

**☐ APPROVED** — The processing may proceed, subject to the implementation of all mitigating measures listed in Section 6.

**☐ NOT APPROVED** — The processing may NOT proceed. Reasons: ___________________________________

**☐ APPROVED WITH CONDITIONS** — The processing may proceed subject to: ___________________________________

---

| Field | Details |
|-------|---------|
| DPO Name | _________________________ |
| DPO Signature | _________________________ |
| Date | _________________________ |

---

## 10. REVIEW SCHEDULE

| Trigger | Review required? |
|---------|-----------------|
| Annual review | Yes — next review September 2027 |
| Material change to processing (new data type, new processor, new jurisdiction) | Yes — immediate review |
| Data breach involving personal data | Yes — review within 14 days |
| Change in law or DPO guidance | Yes — as advised |

---

*Document prepared for LINEKORA Data Protection Compliance*
*Pursuant to Rwanda Data Protection Law No. 058/2021 of 13/10/2021 and PDPB No. 3/2021*
*Version 1.0 — DRAFT — September 14, 2026*