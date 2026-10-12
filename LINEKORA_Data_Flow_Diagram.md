# LINEKORA Data Flow Diagram

## Visual Data Flow Map — Confirmed Production Architecture (Sept 14, 2026)

![LINEKORA Data Flow Map](diagrams/data_flow_map.png)

> **How to read this diagram:** Data subjects (Workers, Employers, Admin) interact with the LINEKORA Web App hosted on Vercel. All personal data is stored in Neon (PostgreSQL, AWS us-east-1). Firebase handles authentication only. ⚠️ **Payment and SMS/Email boxes are dashed = planned, NOT active — no data flows to them today.**

---

## International Data Flow (Confirmed)

![LINEKORA International Data Flow](diagrams/international_data_flow.png)

**Origin:** Rwanda → **Storage & processing:** USA (Neon AWS us-east-1, Vercel, Google/Firebase).

---

## Legend

| Symbol / Element | Meaning |
|------------------|---------|
| Solid arrow | Active data flow (today) |
| Dashed arrow / red box | Planned only — NOT integrated |
| `cylinder` shape | Database |
| `component` shape | Service / external provider |
| `box3d` shape | Platform / hosting |

Diagram source files (re-generate with `dot -Tpng ...`): `diagrams/data_flow_map.dot`, `diagrams/international_data_flow.dot`

---

## Processors & Their Roles (ACTUAL)

| Processor | Role | Data Handled | Confirmed Location |
|-----------|------|-------------|--------------------|
| **Vercel** | Web hosting + serverless backend/API | App code, API traffic, access logs (IP, Browser/OS) | USA (global edge) |
| **Neon** | Primary PostgreSQL database | All PII, KYC docs (base64), tasks, messages, notifications | **AWS us-east-1, N. Virginia, USA** |
| **Firebase (Google)** | Authentication (email/password) | UID, email, auth token | USA |

> ⚠️ **Stripe and Twilio are NOT processors today.** Payments use an in-app/Wallet simulation stored in `localStorage`; there is no SMS or payment service. These are planned integrations only and must NOT appear in the DPO registration.

---

## International Data Flows — Safeguards

| Destination | Data | Lawful Basis | Safeguard |
|-------------|------|--------------|-----------|
| Neon (USA) | All PII, KYC docs, messages | Consent + Contract | Neon DPA + SCCs + TLS (`sslmode=require`) |
| Vercel (USA) | App traffic, access logs | Legitimate Interest | Vercel DPA + HTTPS |
| Firebase (USA) | Auth data | Contractual Necessity | Google Cloud DPA + HTTPS |

---

## Data Retention Policy (SUMMARY)

| Data Category | Retention Period | Deletion Method |
|---------------|------------------|-----------------|
| Worker/Employer PII | Active account + 2 years | Secure deletion |
| NID images + selfie (sensitive) | Active account + 2 years | Secure deletion |
| Messages & attachments | Account deletion + 2 years | Secure deletion |
| Job / application data | 7 years (legal) | Archive then delete |
| Transaction records | 7 years (legal) | Archive then delete |
| Vercel access logs | 1 year | Automatic purge |
| Firebase auth tokens | Session end | Automatic expiry |

*Full policy: `Data_Retention_and_Deletion_Policy.md`*

---

## Security Measures (CURRENT)

| Measure | Status |
|---------|--------|
| Encryption in transit — Neon `sslmode=require` + Vercel HTTPS | ✅ Confirmed |
| Access controls — RBAC roles; KYC docs admin-only | ✅ In code |
| Encryption at rest (AES-256) | ⏳ Confirm Neon/Google dashboard settings |
| Audit logging of data access | ⚠️ Not implemented — action required |
| Incident response / 72-hour breach notification | ⏳ Policy drafted |
| Data Protection Agreements (official) on file | ⏳ Pending — download |

---

## Compliance Status

| Item | Status |
|------|--------|
| ✅ Data Controller Registration | Obtained (RDB / NCSA) |
| ✅ Data Inventory — real architecture | Verified from production config (Sept 14, 2026) |
| ✅ Data Flow Diagram — real architecture | Verified (this document) |
| ⏳ DPIA | Draft complete — DPO sign-off pending |
| ⏳ DPAs (official) — Neon, Vercel, Google | Download & file |
| ⏳ DPO/NCSA authorization — transfer outside Rwanda | Blocked until DPAs on file |
| ⏳ DPO/NCSA authorization — storage outside Rwanda | Blocked until transfer authorization |

⚠️ **CRITICAL:** Do NOT submit Stripe or Twilio as processors — they are not in production.

---

*Document prepared for LINEKORA Data Protection Compliance*
*Pursuant to Rwanda Data Protection Law No. 058/2021 of 13/10/2021 & PDPB No. 3/2021*
*Last Updated: September 14, 2026*