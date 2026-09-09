# LINEKORA Data Flow Diagram

## Visual Data Flow Map

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           LINEKORA DATA FLOW MAP                                    │
│                    Personal Data Inventory & International Flow                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

DATA SUBJECTS                    LINEKORA PLATFORM                PROCESSORS / SERVICES
═══════════════                   ═══════════════                  ══════════════════════

┌──────────────┐
│   WORKER     │──┐
│  (Iyi Truka) │  │  Registration Data         ┌──────────────────┐
│              │  │  - Name, Phone, Gender     │                  │
│  Data:       │  ├─── (Direct Input) ────────►│   LINEKORA       │
│  - Name      │  │  - District, Sector, Village│   Web App        │
│  - Phone     │  │  - ID, Photo, Skills       │                  │
│  - Gender    │  │                            │  (Next.js)       │
│  - District  │  │                            │                  │
│  - Sector    │  │                            └────────┬─────────┘
│  - Village   │  │                                     │
│  - ID        │  │                                     │
│  - Photo     │  │                                     │
│  - Skills    │  │                                     │
└──────────────┘  │                                     │
                  │                                     │
┌──────────────┐  │                                     │
│  EMPLOYER    │  │  Registration Data                  │
│              │──┤  - Name, Phone, Company             │
│  Data:       │  ├─── (Direct Input) ────────────────►│
│  - Name      │  │  - Location, Payment Details        │
│  - Phone     │  │                                     │
│  - Company   │  │  Task Creation Data                 │
│  - Location  │  │  - Task Details, Requirements       │
│  - Payment   │  │  - Budget, Timeline                 │
│    Details   │  │                                     │
└──────────────┘  │                                     │
                  │                                     │
┌──────────────┐  │  Auto-Collected Data                │
│   COMPANY    │  │  - IP, Device ID, Location          │
│  (Data       │──┤  ─────────────────────────────────►│
│  Controller) │  │                                     │
│              │  │  Support Requests                   │
│  - RDB Cert  │  │  - Name, Phone, Issue Description   │
│  - DPO Info  │  │  ─────────────────────────────────►│
│  - Legal Basis│ │                                     │
└──────────────┘  │                                     │
                                                       │
                          ┌────────────────────────────┤
                          │                            │
                          ▼                            ▼
            ┌──────────────────────┐    ┌──────────────────────┐
            │     VERCEL           │    │    FIREBASE AUTH     │
            │  (Hosting/CDN)       │    │  (Authentication)    │
            │                      │    │                      │
            │  - User Activity     │    │  - UID               │
            │  - IP, Device ID     │    │  - Phone             │
            │  - Location          │    │  - Role              │
            │  - Analytics Logs    │    │  - Auth Token        │
            │                      │    │                      │
            │  Lawful Basis:       │    │  Lawful Basis:       │
            │  Legitimate Interest │    │  Contractual Nec.    │
            └──────────┬───────────┘    └──────────┬───────────┘
                       │                           │
                       │       ┌───────────────────┘
                       │       │
                       ▼       ▼
            ┌──────────────────────┐
            │      NEONDB          │
            │  (Database)          │
            │                      │
            │  All PII:            │
            │  - Worker Records    │
            │  - Employer Records  │
            │  - Task Data         │
            │  - Transaction Logs  │
            │  - Support Tickets   │
            │                      │
            │  Location: US/EU     │
            │  (International)     │
            │                      │
            │  Lawful Basis:       │
            │  Consent + Contract  │
            └──────────┬───────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
   ┌─────────────────┐  ┌─────────────────┐
   │    STRIPE       │  │     TWILIO      │
   │  (Payments)     │  │  (SMS/Notif.)   │
   │                 │  │                 │
   │ - Card Details  │  │ - Name          │
   │ - Billing Info  │  │ - Phone         │
   │ - Transaction ID│  │ - Transaction ID│
   │                 │  │                 │
   │ Lawful Basis:   │  │ Lawful Basis:   │
   │ Contractual Nec.│  │ Contractual Nec.│
   └─────────────────┘  └─────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                              DATA FLOW SUMMARY
═══════════════════════════════════════════════════════════════════════════════════════

  Worker/Employer/Company
         │
         ▼
   ┌────────────┐     ┌────────────┐     ┌────────────┐
   │  LINEKORA  │────►│   VERCEL   │────►│   NEONDB   │
   │  Web App   │     │  (CDN +    │     │ (Database) │
   │  (Next.js) │     │   Logs)    │     │            │
   └─────┬──────┘     └────────────┘     └─────┬──────┘
         │                                      │
         │         ┌────────────┐               │
         ├────────►│  FIREBASE  │───────────────┤
         │         │   AUTH     │               │
         │         └────────────┘               │
         │                                      │
    ┌────┴──────────────────────────────────────┴────┐
    │                                                │
    ▼                                                ▼
┌────────────┐                                 ┌────────────┐
│   STRIPE   │                                 │   TWILIO   │
│ (Payments) │                                 │ (SMS/Notif)│
└────────────┘                                 └────────────┘


═══════════════════════════════════════════════════════════════════════════════════════
                              INTERNATIONAL DATA FLOWS
═══════════════════════════════════════════════════════════════════════════════════════

  Rwanda (Origin)          International (Storage/Processing)
  ───────────────          ───────────────────────────────────
  Worker Data       ───►   Vercel (US/EU CDN)
  Employer Data     ───►   NeonDB (US - Primary Database)
  Company Data      ───►   Firebase Auth (US)
  Task Data         ───►   Stripe (US - Payment Processing)
  Transaction Data  ───►   Twilio (US - SMS Delivery)

  ✅ Lawful Basis for International Transfer:
     - Data Protection Agreements (DPAs) with all processors
     - Standard Contractual Clauses (SCCs) where applicable
     - Consent from data subjects
     - DPO Approval for international storage license


═══════════════════════════════════════════════════════════════════════════════════════
                              DATA RETENTION POLICY
═══════════════════════════════════════════════════════════════════════════════════════

  Data Category          Retention Period              Deletion Method
  ─────────────          ────────────────              ────────────────
  Worker PII             Active account + 2 years      Secure deletion
  Employer PII           Active account + 2 years      Secure deletion
  Transaction Records    7 years (legal requirement)   Archive then delete
  Support Tickets        Resolution + 1 year           Secure deletion
  Analytics Data         1 year                        Automatic purge
  Auth Tokens            Session end                   Automatic expiry


═══════════════════════════════════════════════════════════════════════════════════════
                              SECURITY MEASURES
═══════════════════════════════════════════════════════════════════════════════════════

  ✅ Encryption at rest (AES-256) - NeonDB, Firebase
  ✅ Encryption in transit (TLS 1.2+) - All connections
  ✅ Access controls - Role-based (RBAC)
  ✅ Audit logging - All data access logged
  ✅ Incident response plan - 72-hour breach notification
  ✅ Data Protection Agreements - With all processors
  ✅ DPO oversight - Regular compliance reviews


═══════════════════════════════════════════════════════════════════════════════════════
                              COMPLIANCE STATUS
═══════════════════════════════════════════════════════════════════════════════════════

  ✅ Data Controller Certificate - Obtained (RDB)
  ✅ Data Inventory - Completed
  ⏳ Data Protection Agreements - PENDING (Vercel, NeonDB, Firebase, Stripe, Twilio)
  ⏳ DPO Approval for International Storage - PENDING (requires DPAs)
  ⏳ DPIA - In Progress
  ✅ RDB Certificate - Available

  ⚠️  CRITICAL: DPAs must be signed before applying for international storage license
```

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `───►` | Data flow direction |
| `┌───┐` | Entity / Service boundary |
| `✅` | Completed |
| `⏳` | Pending / In Progress |
| `⚠️` | Critical / Action Required |

---

## Processors & Their Roles

| Processor | Role | Data Handled | Location |
|-----------|------|-------------|----------|
| **Vercel** | Web Hosting & CDN | Activity logs, IP, Device ID | US/EU |
| **NeonDB** | Primary Database | All PII, Task data, Transactions | US |
| **Firebase** | Authentication | UID, Phone, Role, Auth Token | US |
| **Stripe** | Payment Processing | Card details, Billing, Transaction ID | US |
| **Twilio** | SMS Notifications | Name, Phone, Transaction ID | US |

---

*Document prepared for LINEKORA Data Protection Compliance*
*Lawful Basis: Consent + Contractual Necessity*
*Prepared: September 8, 2026*
