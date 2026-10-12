# DATA BREACH RESPONSE POLICY
# LINEKORA — NDIVE LABS LTD

**Reference:** LINEKORA-POL-002
**Version:** 1.0 — DRAFT
**Effective Date:** [Date approved by DPO]
**Owner:** Data Protection Officer (DPO)
**Review Date:** Annually or after any incident

---

## 1. PURPOSE

This policy establishes LINEKORA's procedure for responding to personal data breaches in a timely and effective manner, in compliance with Rwanda's Data Protection Law No. 058/2021 and PDPB No. 3/2021.

A **personal data breach** is any breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data.

---

## 2. LEGAL REQUIREMENTS

Under Rwanda's PDPB, LINEKORA must:
- Notify the **Data Protection & Privacy Office (DPO/NCSA)** within **72 hours** of becoming aware of a breach
- Notify **affected data subjects** without undue delay where the breach is likely to result in a high risk to their rights
- Document every breach (even those not reported externally) in the breach register

---

## 3. BREACH CLASSIFICATION

| Severity | Description | Examples | Reporting requirement |
|----------|-------------|----------|----------------------|
| **Critical** | Large-scale breach of sensitive data (NID, selfie, financial data) | Database dump exposed; ransomware attack; large-scale credential leak | DPO/NCSA within 72h + affected data subjects immediately |
| **High** | Unauthorised access to personal data of identifiable individuals | Staff member accesses records without authorisation; API endpoint exposes user data | DPO/NCSA within 72h + affected data subjects |
| **Medium** | Limited breach with low risk to individuals | Accidental email to wrong recipient; single user's email exposed | DPO/NCSA within 72h (may not need individual notification) |
| **Low** | Near-miss or security incident with no actual data exposure | Failed login attempt; blocked intrusion attempt; misconfigured firewall rule (no data exposed) | Internal log only; review required |

---

## 4. INCIDENT RESPONSE TEAM

| Role | Person | Responsibilities |
|------|--------|-----------------|
| **Incident Lead** | DPO / Designated staff member | Coordinates response; liaises with NCSA/DPO |
| **Technical Lead** | Lead Developer | Technical investigation; containment; remediation |
| **Management** | NDIVE LABS LTD director | Authorises external communications; legal advice |
| **Communications** | DPO or designated person | Data-subject notification; regulator notification |

> **Primary contacts (fill in):**
> - DPO Name: [FILL IN]
> - DPO Phone: [FILL IN]
> - DPO Email: [FILL IN]
> - Developer Lead: [FILL IN]
> - NDIVE LABS LTD Director: Ndizeye Yves — 0793980268

---

## 5. RESPONSE PROCEDURE

### Step 1: DETECTION & INITIAL ASSESSMENT (0–4 hours)

1. Any staff member who suspects or discovers a potential breach must report it immediately to the Incident Lead (DPO).
2. The Incident Lead records the initial report in the **Breach Register** (see Appendix A).
3. The Technical Lead performs initial investigation:
   - What happened?
   - What data is affected? (type, volume, data subjects)
   - When did it happen / was it detected?
   - How was it discovered?
   - Is the breach ongoing?

4. **Classify severity** (Critical / High / Medium / Low) using the table in Section 3.

### Step 2: CONTAINMENT (4–24 hours)

| Action | Owner |
|--------|-------|
| Isolate affected systems (e.g. block IP, revoke compromised credentials, take down affected endpoint) | Technical Lead |
| Preserve evidence (logs, snapshots) — do not delete anything | Technical Lead |
| If data was exposed externally: request removal/takedown (e.g. from paste sites, search engines) | Communications |
| Change all affected passwords, API keys, database credentials | Technical Lead |
| If ransomware: do NOT pay ransom; isolate and restore from backup | Technical Lead |

### Step 3: NOTIFICATION TO DPO/NCSA (within 72 hours of awareness)

The Incident Lead submits the following to the **Rwanda Data Protection & Privacy Office (DPO/NCSA)** via their prescribed channel (email or online form at dpo.gov.rw):

**Required information:**
1. Nature of the breach (what happened)
2. Categories and approximate number of data subjects affected
3. Categories and approximate number of records affected
4. Likely consequences of the breach
5. Measures taken or proposed to address the breach (including mitigation)
6. Contact details for further information

> Use the NCSA breach reporting template if available, or the format in Appendix B.

### Step 4: NOTIFICATION TO AFFECTED DATA SUBJECTS (without undue delay)

If the breach is **High or Critical** and is likely to result in a **high risk to the rights and freedoms** of individuals, notify affected data subjects:

**Notification must include:**
1. Description of the breach in clear, plain language (Kinyarwanda and/or English)
2. Name and contact details of the DPO
3. Description of the likely consequences
4. Description of measures taken to address the breach
5. Advice to data subjects on steps they can take to protect themselves (e.g. change passwords, monitor accounts)

**Notification method:** Email (if available) + in-app notification + public notice on linekora.com

### Step 5: INVESTIGATION & REMEDIATION (1–4 weeks)

| Action | Owner |
|--------|-------|
| Full root-cause analysis | Technical Lead + DPO |
| Implement technical fixes to prevent recurrence | Developer |
| Update security controls (RBAC, encryption, logging) | Developer |
| Update this DPIA if processing has changed | DPO |
| Review and update policies if needed | DPO |
| Staff retraining if human error was involved | Management |

### Step 6: DOCUMENTATION & REVIEW (within 30 days)

1. Complete the Breach Register entry with final details
2. Document lessons learned
3. Brief management on findings and recommendations
4. Review and update this policy if gaps were identified

---

## 6. BREACH REGISTER

Every security incident must be recorded in the Breach Register, even if it does not require external notification.

**Format:**

| Field | Description |
|-------|-------------|
| Incident ID | Unique reference (e.g. BR-2026-001) |
| Date/time discovered | When the breach was identified |
| Date/time occurred | When the breach actually occurred (if known) |
| Reported by | Name of person who reported |
| Description | What happened |
| Data affected | Types and volume of data |
| Data subjects affected | Categories and number of individuals |
| Severity | Critical / High / Medium / Low |
| Containment actions taken | What was done immediately |
| Notification to NCSA | Date + reference number of submission |
| Notification to data subjects | Date + method of notification |
| Root cause | Why it happened |
| Remediation | What was done to prevent recurrence |
| Review date | When the incident was reviewed |
| Status | Open / Closed |

> **Retention:** Breach Register records must be retained for **10 years**.

---

## 7. COMMUNICATION TEMPLATES

### 7.1 Notification to DPO/NCSA (summary)

> **Date:** [Date]
> **To:** Data Protection & Privacy Office, National Cyber Security Authority (NCSA)
> **From:** NDIVE LABS LTD (LINEKORA) — Data Protection Officer
> **Re:** Personal Data Breach Notification
>
> [Describe the incident using the fields in Step 3 above]

### 7.2 Notification to affected data subjects

> **Subject:** Important Notice — Data Security Incident Affecting Your LINEKORA Account
>
> Dear [Name],
>
> We are writing to inform you of a security incident that may have affected your personal data on the LINEKORA platform.
>
> **What happened:** [Plain-language description]
>
> **What data was affected:** [Categories — e.g. name, email, phone number]
>
> **What we have done:** [Steps taken to contain and remediate]
>
> **What you can do:** [Advice — e.g. change your password, monitor your accounts]
>
> **Contact us:** If you have questions, contact our Data Protection Officer at [DPO email/phone].
>
> We take the protection of your data very sincerely and apologise for this incident.

---

## 8. ROLES & RESPONSIBILITIES

| Role | Responsibility |
|------|---------------|
| All staff | Report suspected breaches immediately to DPO |
| DPO / Incident Lead | Lead response; notify NCSA; maintain Breach Register |
| Technical Lead | Investigate; contain; remediate; preserve evidence |
| Management | Authorise resources; approve external communications |
| Developer | Implement technical fixes; verify remediation |

---

## 9. TRAINING

All staff must receive training on:
- How to recognise a data breach
- How to report a suspected breach (internal process)
- Their obligations under this policy

Training must be conducted:
- On onboarding (within 30 days of joining)
- Annually thereafter
- After any significant incident

---

## 10. REVIEW

This policy must be reviewed:
- Annually
- After every breach (within 30 days of incident closure)
- Upon change in law or DPO guidance

---

*Document prepared for LINEKORA Data Protection Compliance*
*Pursuant to Rwanda Data Protection Law No. 058/2021 of 13/10/2021 and PDPB No. 3/2021*
*Version 1.0 — DRAFT — September 14, 2026*