# DATA PROTECTION AGREEMENT (DPA)
# Firebase — LINEKORA

**Between:**
- **Data Controller:** LINEKORA (hereinafter "the Company")
- **Data Processor:** Google LLC (Firebase) (hereinafter "Firebase")

**Effective Date:** _______________
**Agreement Reference:** LINEKORA-DPA-FIREBASE-2026

---

## 1. PURPOSE

This DPA sets out the terms that apply when Personal Data is processed by Firebase on behalf of LINEKORA in the course of providing authentication and session management services. This DPA is required for compliance with the **Rwanda Data Protection Law No. 3/2021**.

---

## 2. SCOPE OF PROCESSING

### 2.1 Data Categories Processed by Firebase

| Data Category | Data Elements | Purpose |
|---------------|---------------|---------|
| Auth Data | UID, Phone Number, Role | User authentication |
| Session Data | Auth Token, Session ID, Expiry | Session management |
| User Profile | Name, Email (if provided) | Account management |
| Device Data | FCM Token, Device Type | Push notifications |

### 2.2 Purpose of Processing

Firebase shall process Personal Data solely for:
- User authentication and session management
- Push notification delivery (FCM)
- Security and fraud prevention
- Account management

### 2.3 Duration of Processing

This DPA shall remain in effect for the duration of the Firebase service agreement.

---

## 3. OBLIGATIONS OF FIREBASE

### 3.1 Processing Instructions

- Process Personal Data only on documented instructions from LINEKORA
- Immediately inform LINEKORA if an instruction infringes on data protection laws
- Not process Personal Data for any purpose other than the agreed services

### 3.2 Confidentiality

- All persons authorized to process Personal Data are bound by confidentiality obligations
- Access to Personal Data is limited to authorized personnel only
- Personal Data is not disclosed to unauthorized third parties

### 3.3 Security Measures

Firebase shall implement:

- [ ] **Encryption** — AES-256 encryption at rest; TLS 1.2+ in transit
- [ ] **Access Controls** — Role-based access control (RBAC)
- [ ] **Audit Logging** — All access to Personal Data is logged
- [ ] **Vulnerability Management** — Regular security assessments
- [ ] **Incident Response** — Documented breach notification procedures
- [ ] **SOC 2 Type II Compliance** — Annual audit
- [ ] **ISO 27001 Compliance** — Information security management

### 3.4 Sub-Processors

Firebase maintains a list of sub-processors at: https://firebase.google.com/support/privacy/subprocessors

LINEKORA must be notified of any changes to the sub-processor list.

### 3.5 Data Breach Notification

- Notify LINEKORA **within 48 hours** of becoming aware of a Personal Data breach
- Provide all information necessary for LINEKORA to comply with the **72-hour breach notification** requirement under Rwanda's PDPB
- Take immediate steps to contain and remediate the breach

---

## 4. CROSS-BORDER DATA TRANSFERS

### 4.1 Processor Location

| Processor | Location | Data Stored | Transfer Mechanism |
|-----------|----------|-------------|-------------------|
| Google LLC (Firebase) | USA | Auth data, Session data, Profile | Standard Contractual Clauses (SCCs) |

### 4.2 Safeguards

Firebase shall ensure that any cross-border transfer of Personal Data is protected by:
- Standard Contractual Clauses (SCCs)
- Encryption at rest (AES-256) and in transit (TLS 1.2+)
- Google Cloud's data processing terms
- Regular security audits

### 4.3 International Storage Authorization

Firebase acknowledges that Personal Data is stored and processed **outside of Rwanda** and that such transfer requires authorization from the **Rwanda Data Protection Authority**.

---

## 5. DATA RETENTION AND DELETION

| Data Type | Retention Period | Deletion Method |
|-----------|------------------|-----------------|
| Auth tokens | Session end | Automatic expiry |
| User profiles | Active account + 2 years | Secure deletion |
| FCM tokens | Until device logout | Automatic purge |
| Session logs | 30 days | Automatic purge |

---

## 6. AUDIT RIGHTS

LINEKORA (or its authorized auditor) shall have the right to:
- Conduct audits of Firebase's data processing activities
- Request documentation and evidence of compliance (SOC 2, ISO 27001)
- Inspect security measures and facilities

---

## 7. SIGNATURES

### Data Controller: LINEKORA

| Field | Details |
|-------|---------|
| Name | _________________________ |
| Title | _________________________ |
| Date | _________________________ |
| Signature | _________________________ |

### Data Processor: Google LLC (Firebase)

| Field | Details |
|-------|---------|
| Name | _________________________ |
| Title | _________________________ |
| Date | _________________________ |
| Signature | _________________________ |

---

*Document prepared for LINEKORA Data Protection Compliance*
*Pursuant to Rwanda Data Protection Law No. 3/2021*