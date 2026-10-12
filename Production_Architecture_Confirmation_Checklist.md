# LINEKORA — Production Architecture Confirmation Checklist

**Purpose:** Record the confirmed production architecture used in the Data Inventory, Data Flow Map, DPIA and DPO application.
**Status as of:** September 14, 2026 — most items confirmed from production config files in the repo.

---

## 1. HOSTING & DEPLOYMENT — CONFIRMED

| # | Question | Confirmed answer | Evidence |
|---|----------|------------------|----------|
| 1.1 | Where is the **frontend** hosted? | ✅ **Vercel** | `linekora/vercel.json` (SPA rewrites) |
| 1.2 | Where is the **backend/API** hosted? | ✅ **Vercel** | `linekora-backend/vercel.json` (`@vercel/node`); API URL `linekora-backend.vercel.app/api` (frontend `.env.example`) |
| 1.3 | Is the API URL deployed as `linekora-backend.vercel.app`? | ✅ Yes | Frontend `VITE_API_URL=https://linekora-backend.vercel.app/api` |
| 1.4 | Note | ⚠️ A `render.yaml` (Render) config also exists in the repo root but the deployed config is Vercel. **Confirm in the Vercel dashboard** that the backend has no Render deployment live. | — |
| 1.5 | Other hosts? | ✅ None found | Code + configs |

## 2. DATABASE (PostgreSQL) — CONFIRMED

| # | Question | Confirmed answer | Evidence |
|---|----------|------------------|----------|
| 2.1 | Which PostgreSQL provider? | ✅ **Neon** | `linekora-backend/.env` |
| 2.2 | Exact region? | ✅ **AWS us-east-1 (N. Virginia, USA)** | Host: `ep-tiny-lab-at67jz3u.c-9.us-east-1.aws.neon.tech` |
| 2.3 | Database name / user | ✅ `neondb` / `neondb_owner` | `.env` |
| 2.4 | Connection security | ✅ **TLS enforced** — `sslmode=require` | `.env` |
| 2.5 | Backups enabled & region? | ⏳ **REMOVE this item:** verify in Neon dashboard (backup schedule + storage region) | — |

## 3. FILE / DOCUMENT STORAGE — CONFIRMED (No object storage)

| # | Question | Confirmed answer | Evidence |
|---|----------|------------------|----------|
| 3.1 | Verification documents (NID front/back, selfie) | ✅ **Stored as base64 in Neon PostgreSQL** (`User.verificationData` JSON) | `prisma/schema.prisma` |
| 3.2 | Profile photos | ✅ Neon (`User.avatarUrl` — data URL) | schema |
| 3.3 | Chat attachments | ✅ Neon (`Message.attachments` — base64 JSON) | schema |
| 3.4 | Job photos | ✅ Neon (`Job.photos` — base64 JSON) | schema |
| 3.5 | Any object storage (S3/Cloudinary/Firebase Storage/Vercel Blob)? | ✅ **None** | Search of repo |
| 3.6 | DB size limits | ✅ API body limit 50MB (`express.json`); ⏳ add DB-level/size warnings if needed | `backend/src/index.ts` |

## 4. AUTHENTICATION — CONFIRMED

| # | Question | Confirmed answer | Evidence |
|---|----------|------------------|----------|
| 4.1 | Auth provider | ✅ **Firebase (Google)** — project `linekora-7dd3e` | `firebase-applet-config.json`, `src/lib/firebase.ts` |
| 4.2 | Methods enabled | ✅ **Email/password** (no phone/OTP, no SMS) | Code search |
| 4.3 | Firestore used? | ✅ **No** — Firestore rules are drafts only; data lives in Neon | `DRAFT_firestore.rules`, blueprint only |
| 4.4 | Firebase project region | ⏳ Confirm in Firebase console (default US) | — |

## 5. PAYMENTS — CONFIRMED (No payment integration)

| # | Question | Confirmed answer | Evidence |
|---|----------|------------------|----------|
| 5.1 | Any payment provider integrated? | ✅ **None.** Wallet is a `localStorage` simulation; "Payments Under Development" shown in UI | `src/pages/worker/Wallet.tsx`, `company/Dashboard.tsx` |
| 5.2 | Planned providers | MTN MoMo / Airtel Money / bank transfer (UI labels only) | Code search |
| 5.3 | Does real money move today? | ✅ **No** (localStorage only) | Code |

## 6. SMS / EMAIL / NOTIFICATIONS — CONFIRMED (None)

| # | Question | Confirmed answer | Evidence |
|---|----------|------------------|----------|
| 6.1 | Any SMS provider? | ✅ **None.** Notifications are in-app (Neon `Notification` model) | `prisma/schema.prisma`, code search |
| 6.2 | Any email service? | ✅ **None** beyond Firebase auth emails | Code search |
| 6.3 | Planned SMS/email provider | To be decided — when chosen, update Inventory + DPO docs | — |

## 7. SECURITY CONTROLS — PARTIALLY CONFIRMED

| # | Claimed | Status | Action |
|---|---------|--------|--------|
| 7.1 | Encryption at rest (AES-256) | ⚠️ Confirm in **Neon dashboard** (PITR/SSD encryption) and **Google Cloud** (default) | Tick when verified |
| 7.2 | Encryption in transit (TLS) | ✅ **Confirmed** — Neon `sslmode=require`; Vercel HTTPS | Done |
| 7.3 | RBAC access controls | ✅ In code — `WORKER/COMPANY/EMPLOYER/ADMIN`; KYC routes admin-only (`requireAdmin`) | Done |
| 7.4 | Audit logging of data access | ❌ **Not implemented** (no audit-log model in Prisma schema) — **ACTION REQUIRED** | Build audit log |
| 7.5 | Incident response (72h) | ⏳ Policy drafted; ⏳ fill DPO/dev contact list | `Data_Breach_Response_Policy.md` |

## 8. DATA SUBJECTS / PROCESSORS — CONFIRMED LIST (NO OTHERS)

- Data subjects: **Workers, Employers/Companies, Admin staff**
- Processors (only these): **Neon (us-east-1, USA), Vercel (USA), Google/Firebase (USA)**
- **Stripe, Twilio, SMS, email, Firestore — NOT in production. Do not list.**

## 9. FINAL CHECK BEFORE DPO SUBMISSION

- [x] Data Inventory updated with confirmed architecture (Sept 14, 2026)
- [x] Data Flow Diagram updated — only real services shown
- [x] Stripe / Twilio removed from processors (flagged "planned only")
- [ ] Download official DPAs: Neon, Vercel, Google/Firebase → save to compliance folder
- [ ] Confirm Neon backup schedule + at-rest encryption in dashboards (items 2.5, 4.4, 7.1)
- [ ] Close "Render" ambiguity (item 1.4) — confirm no live Render deployment
- [ ] DPO sign-off on DPIA
- [ ] Fill [FILL IN] fields: RDB number, DPO name/contact, address

---
*Prepared for LINEKORA Data Protection Compliance — Law No. 058/2021 of 13/10/2021*
*Last updated: September 14, 2026*