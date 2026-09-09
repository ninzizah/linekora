# DATA PROTECTION AGREEMENT (DPA)
# NeonDB — LINEKORA

**Between:**
- **Data Controller:** LINEKORA (hereinafter "the Company")
- **Data Processor:** Neon (NeonDB Inc.) (hereinafter "Neon")

**Effective Date:** _______________
**Agreement Reference:** LINEKORA-DPA-NEONDB-2026

---

## 1. PURPOSE

This DPA sets out the terms that apply when Personal Data is processed by Neon on behalf of LINEKORA in the course of providing database hosting services. This DPA is required for compliance with the **Rwanda Data Protection Law No. 3/2021** and authorization for international storage.

---

## 2. SCOPE OF PROCESSING

### 2.1 Data Categories Processed by Neon

| Data Category | Data Elements | Purpose |
|---------------|---------------|---------|
| Worker PII | Name, Phone, Gender, District, Sector, Village, ID, Photo, Skills | Registration, KYC, Task Matching |
| Employer PII | Name, Phone, Company, Location, Payment Details | Registration, Task Creation, Payments |
| User Activity Data | IP Address, Device ID, Geolocation | Security, Analytics |
| Task Data | Task descriptions, Requirements, Budgets | Service delivery |
| Transaction Logs | Transaction references, Timestamps | Record keeping |
| Support Tickets | Name, Phone, Issue Description | Customer support |

### 2.2 Purpose of Processing

Neon shall process Personal Data solely for:
- Primary database hosting for LINEKORA applications
- Data storage, retrieval, and management
- Backups and disaster recovery

### 2.3 Duration of Processing

This DPA shall remain in effect for the duration of the Neon service agreement.

---

## 3. OBLIGATIONS OF NEON

### 3.1 Processing Instructions

- Process Personal Data only on documented instructions from LINEKORA
- Immediately inform LINEKORA if an instruction infringes on data protection laws
- Not process Personal Data for any purpose other than the agreed services

### 3.2 Confidentiality

- All persons authorized to process Personal Data are bound by confidentiality obligations
- Access to Personal Data is limited to authorized personnel only
- Personal Data is not disclosed to unauthorized third parties

### 3.3 Security Measures

Neon shall implement:

- [ ] **Encryption** — AES-256 encryption at rest; TLS 1.2+ in transit
- [ ] **Access Controls** — Role-based access control (RBAC)
- [ ] **Audit Logging** — All access to Personal Data is logged
- [ ] **Vulnerability Management** — Regular security assessments
- [ ] **Incident Response** — Documented breach notification procedures
- [ ] **SOC 2 Type II Compliance** — Annual audit
- [ ] **PCI DSS Compliance** — For payment-related data

### 3.4 Sub-Processors

Neon maintains a list of sub-processors. LINEKORA must be notified of any changes to the sub-processor list.

### 3.5 Data Breach Notification

- Notify LINEKORA **within 48 hours** of becoming aware of a Personal Data breach
- Provide all information necessary for LINEKORA to comply with the **72-hour breach notification** requirement under Rwanda's PDPB
- Take immediate steps to contain and remediate the breach

---

## 4. CROSS-BORDER DATA TRANSFERS

### 4.1 Processor Location

| Processor | Location | Data Stored | Transfer Mechanism |
|-----------|----------|-------------|-------------------|
| NeonDB | US / EU (multi-region) | All PII, Task data, Transactions | Standard Contractual Clauses (SCCs) |

### 4.2 Safeguards

Neon shall ensure that any cross-border transfer of Personal Data is protected by:
- Standard Contractual Clauses (SCCs)
- Encryption at rest (AES-256) and in transit (TLS 1.2+)
- Regional data isolation options
- Regular security audits

### 4.3 International Storage Authorization

Neon acknowledges that Personal Data is stored and processed **outside of Rwanda** and that such transfer requires authorization from the **Rwanda Data Protection Authority**. LINEKORA shall obtain this authorization before activating Neon services.

---

## 5. DATA RETENTION AND DELETION

| Data Type | Retention Period | Deletion Method |
|-----------|------------------|-----------------|
| Worker PII | Active account + 2 years | Secure deletion |
| Employer PII | Active account + 2 years | Secure deletion |
| Task data | 7 years (legal requirement) | Archive then delete |
| Transaction records | 7 years (legal requirement) | Archive then delete |
| Support tickets | Resolution + 1 year | Secure deletion |

---

## 6. AUDIT RIGHTS

LINEKORA (or its authorized auditor) shall have the right to:
- Conduct audits of Neon's data processing activities
- Request documentation and evidence of compliance
- Inspect security measures and facilities
- Request backup and recovery records

---

## 7. SIGNATURES

### Data Controller: LINEKORA

| Field | Details |
|-------|---------|
| Name | _________________________ |
| Title | _________________________ |
| Date | _________________________ |
| Signature | _________________________ |

### Data Processor: Neon (NeonDB Inc.)

| Field | Details |
|-------|---------|
| Name | _________________________ |
| Title | _________________________ |
| Date | _________________________ |
| Signature | _________________________ |

---

*Document prepared for LINEKORA Data Protection Compliance*
*Pursuant to Rwanda Data Protection Law No. 3/2021*