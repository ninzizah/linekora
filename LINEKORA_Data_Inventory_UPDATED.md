# LINEKORA — Data Inventory & International Data Flow Map

*UPDATED: September 8, 2026 — Added Company as Data Subject*

---

## 1. CONTROLLER INFORMATION

| Field | Details |
|-------|---------|
| **Data Controller Name** | LINEKORA |
| **Registration Number (RDB)** | [RDB CERTIFICATE NUMBER] |
| **Date of Registration** | [DATE] |
| **DPO Name** | [DPO Name] |
| **DPO Contact** | [DPO Email / Phone] |
| **Legal Status** | Company registered in Rwanda |

---

## 2. DATA SUBJECTS & PERSONAL DATA INVENTORY

### 2.1 Worker (Individual — "Iyi Truka")

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| Full Name | Identity | Direct (Worker) | Registration, Identification, KYC | Vercel → NeonDB | Consent |
| Phone Number | Identity | Direct (Worker) | Contact, SMS notifications, Verification | Vercel → NeonDB, Twilio | Consent |
| Gender | Descriptive | Direct (Worker) | Demographics, Service matching | Vercel → NeonDB | Consent |
| District | Address | Direct (Worker) | Task localization, Service matching | Vercel → NeonDB | Consent |
| Sector | Address | Direct (Worker) | Task localization, Service matching | Vercel → NeonDB | Consent |
| Village | Address | Direct (Worker) | Task localization, Service matching | Vercel → NeonDB | Consent |
| National ID Number | ID Document | Direct (Worker) | KYC verification | Vercel → NeonDB | Consent + Legal Obligation |
| Photo | Biometric | Direct (Worker) | Identification, Profile | Vercel → NeonDB | Consent |
| Skills/Qualifications | Occupational | Direct (Worker) | Task matching | Vercel → NeonDB | Consent |

### 2.2 Employer (Individual/Entity)

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| Full Name | Identity | Direct (Employer) | Registration, Identification | Vercel → NeonDB | Consent |
| Phone Number | Identity | Direct (Employer) | Contact, SMS notifications | Vercel → NeonDB, Twilio | Consent |
| Company Name | Organizational | Direct (Employer) | Profile, Invoicing | Vercel → NeonDB | Consent |
| Company Location | Address | Direct (Employer) | Service delivery | Vercel → NeonDB | Consent |
| Payment Details | Financial | Direct (Employer) | Payment processing | Vercel → Stripe | Contractual Necessity |
| Card Details | Financial | Direct (Employer) | Payments | Stripe | Contractual Necessity |
| Billing Info | Financial | Direct (Employer) | Invoicing | Vercel → NeonDB | Contractual Necessity |

### 2.3 Company (LINEKORA as Data Subject / Controller Entity) — NEW

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| RDB Registration Certificate | Official Document | RDB | Legal registration, Data controller compliance | LINEKORA Records | Legal Obligation |
| DPO Appointment | Official Document | DPO | Data protection compliance | LINEKORA Records | Legal Obligation |
| Data Controller Registration | Official Document | RDB | Regulatory compliance | LINEKORA Records | Legal Obligation |
| Beneficial Owner Information | Identity | Company | Corporate governance | LINEKORA Records | Legal Obligation |
| Business Registration Details | Administrative | RDB | Legal compliance | LINEKORA Records | Legal Obligation |
| Data Processing Agreements | Contractual | Company/Processors | Processor compliance | LINEKORA Records | Contractual Necessity |
| DPIA Documentation | Compliance | DPO | Risk assessment | LINEKORA Records | Legal Obligation |

### 2.4 User Activity Data (Auto-collected)

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| IP Address | Technical | Auto-collected | Security, Fraud prevention | Vercel Logs | Legitimate Interest |
| Device ID | Technical | Auto-collected | Session management, Security | Vercel Logs | Legitimate Interest |
| Geolocation | Technical | Auto-collected | Task localization | Vercel → NeonDB | Legitimate Interest |
| Browser/OS Info | Technical | Auto-collected | UX optimization | Vercel Logs | Legitimate Interest |
| Usage Patterns | Behavioral | Auto-collected | Analytics, Service improvement | Vercel → NeonDB | Legitimate Interest |

### 2.5 Service Notifications

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| Phone Number | Identity | Worker/Employer | SMS alerts | Vercel → Twilio | Contractual Necessity |
| Transaction ID | Financial | LINEKORA | Transaction confirmation | Vercel → Twilio | Contractual Necessity |
| Notification Content | Behavioral | LINEKORA | Service updates | Twilio Logs | Contractual Necessity |

### 2.6 Support Requests

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| Full Name | Identity | Direct (User) | Support resolution | LINEKORA Email | Consent |
| Phone Number | Identity | Direct (User) | Support contact | LINEKORA Email | Consent |
| Issue Description | Behavioral | Direct (User) | Support resolution | LINEKORA Email | Consent |

### 2.7 Authentication Data (Firebase)

| Data Element | Data Category | Source | Purpose | Storage Location | Lawful Basis |
|---|---|---|---|---|---|
| UID | Technical | Auto-generated | Unique user identification | Firebase Auth | Contractual Necessity |
| Phone Number | Identity | Direct (User) | Phone-based authentication | Firebase Auth | Contractual Necessity |
| Role | Technical | LINEKORA | Access control | Firebase Auth | Contractual Necessity |
| Auth Token | Technical | Auto-generated | Session management | Firebase Auth | Contractual Necessity |

---

## 3. PROCESSORS & ROLES

| Processor | Location | Role | Data Processed | Type of Agreement |
|-----------|----------|------|----------------|-------------------|
| Vercel | US/EU | Web hosting, CDN | Activity logs, IP, Device ID | DPA Required — [Status] |
| NeonDB | US | Primary database | All PII, Task data, Transactions | DPA Required — [Status] |
| Firebase (Google) | US | Authentication | UID, Phone, Role, Token | DPA Required — [Status] |
| Stripe | US | Payment processing | Card details, Billing | DPA Required — [Status] |
| Twilio | US | SMS notifications | Phone, Transaction ID | DPA Required — [Status] |

---

## 4. INTERNATIONAL DATA FLOW MAP

```
 Workers/Employers/Company
           │
           ▼
 ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
 │   LINEKORA     │───►│    VERCEL      │───►│    NEONDB      │
 │   Web App      │    │ (Hosting/CDN)  │    │ (Database)     │
 │   (Next.js)    │    │                │    │                │
 └───────┬────────┘    └────────────────┘    └───────┬────────┘
         │                                           │
         │        ┌────────────────┐                 │
         ├───────►│   FIREBASE     │─────────────────┤
         │        │    (Auth)      │                 │
         │        └────────────────┘                 │
         │                                           │
         ├────────────────────────────────────────────┤
         ▼                                           ▼
 ┌────────────────┐                          ┌────────────────┐
 │     STRIPE     │                          │    TWILIO      │
 │  (Payments)    │                          │ (SMS/Notify)   │
 └────────────────┘                          └────────────────┘

 Data Origin: Rwanda
 Data Storage: US/EU (International — requires DPO approval)
```

### International Transfer Justification

| Destination | Data | Lawful Basis for Transfer | Safeguards |
|-------------|------|---------------------------|------------|
| US (Vercel) | Activity logs | Legitimate Interest | SCCs + Encryption |
| US (NeonDB) | All PII | Consent + Contract | SCCs + Encryption |
| US (Firebase) | Auth data | Contractual Necessity | SCCs + Encryption |
| US (Stripe) | Payment data | Contractual Necessity | SCCs + PCI DSS |
| US (Twilio) | SMS data | Contractual Necessity | SCCs + Encryption |

---

## 5. DATA RETENTION SCHEDULE

| Data Category | Retention Period | Deletion Method |
|---------------|------------------|-----------------|
| Worker PII | Active account + 2 years | Secure deletion |
| Employer PII | Active account + 2 years | Secure deletion |
| Company Records | Business lifetime | Archive |
| Transaction Records | 7 years (legal) | Archive then delete |
| Support Tickets | Resolution + 1 year | Secure deletion |
| Analytics Data | 1 year | Automatic purge |
| Auth Tokens | Session end | Automatic expiry |
| SMS Logs | 30 days | Automatic purge |

---

## 6. DATA SUBJECT RIGHTS

LINEKORA shall ensure data subjects (Workers, Employers, and Company representatives) can exercise:

| Right | Description | Implementation |
|-------|-------------|----------------|
| Access | View collected data | Account dashboard + request |
| Rectification | Correct inaccurate data | Profile editing |
| Erasure | Request deletion | Support ticket / DPO contact |
| Restrict | Limit processing | DPO request |
| Portability | Export data | Data export feature |
| Object | Object to processing | DPO request |

---

## 7. SECURITY MEASURES

- [x] Encryption at rest (AES-256) — NeonDB, Firebase
- [x] Encryption in transit (TLS 1.2+) — All connections
- [x] Access controls — Role-based (RBAC)
- [x] Audit logging — All data access logged
- [x] Incident response — 72-hour breach notification
- [ ] Data Protection Agreements — PENDING (Vercel, NeonDB, Firebase, Stripe, Twilio)
- [x] DPO oversight — Regular compliance reviews

---

## 8. COMPLIANCE STATUS — MILESTONE TRACKER

| # | Milestone | Status | Target Date | Notes |
|---|-----------|--------|-------------|-------|
| 1 | Data Controller Registration (RDB) | ✅ Completed | — | Certificate obtained, pickup pending |
| 2 | Data Inventory & Flow Map | ✅ Completed | — | Updated with Company as data subject |
| 3 | DPIA (Personal Data Impact Assessment) | ⏳ In Progress | — | Form prepared from PDPB No. 3/2021 |
| 4 | DPA — Vercel | ⏳ Pending | — | Template ready |
| 5 | DPA — NeonDB | ⏳ Pending | — | Template ready |
| 6 | DPA — Firebase | ⏳ Pending | — | Template ready |
| 7 | DPA — Stripe | ⏳ Pending | — | Template ready |
| 8 | DPA — Twilio | ⏳ Pending | — | Template ready |
| 9 | DPO Approval — International Storage | ⏳ Blocked | — | Requires DPAs (#4-8) first |
| 10 | Storage License Outside Rwanda | ⏳ Pending | — | Requires DPO approval (#9) |

---

## 9. STATUS LEGEND

| Status | Meaning |
|--------|---------|
| ✅ Completed | Milestone finalized |
| ⏳ In Progress | Actively being worked on |
| ⏳ Pending | Prepared, waiting to be completed |
| ⏳ Blocked | Cannot proceed until prerequisite met |

---

*Document prepared for LINEKORA Data Protection Compliance*
*Pursuant to Rwanda's Data Protection Law No. 3/2021 & PDPB No. 3/2021*
*Last Updated: September 8, 2026*