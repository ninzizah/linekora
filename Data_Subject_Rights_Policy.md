# DATA SUBJECT RIGHTS POLICY
# LINEKORA — NDIVE LABS LTD

**Reference:** LINEKORA-POL-003
**Version:** 1.0 — DRAFT
**Effective Date:** [Date approved by DPO]
**Owner:** Data Protection Officer (DPO)
**Review Date:** Annually or upon material change

---

## 1. PURPOSE

This policy describes how LINEKORA honours the rights of data subjects (Workers, Employers, and Company representatives) under Rwanda's Data Protection Law No. 058/2021 of 13/10/2021 and the Personal Data Protection Policy (PDPB) No. 3/2021.

Every individual whose personal data LINEKORA processes has the following rights.

---

## 2. DATA SUBJECT RIGHTS

### 2.1 Right of Access (Article 16, Law No. 058/2021)

**What it means:** You have the right to ask whether LINEKORA is processing your personal data and to obtain a copy of that data.

**How to exercise it:**
- Log in to your LINEKORA account → Dashboard → Settings → "Download My Data" (planned feature)
- Or email: [DPO email — FILL IN]
- Or in-app support ticket referencing "Data Access Request"

**What LINEKORA provides:**
- A copy of your personal data in a readable format (JSON or PDF)
- Information about: what data is processed, why, who it is shared with, how long it is kept

**Timeframe:** Within **30 days** of receiving the request (extendable by 30 days for complex requests — data subject will be notified).

**Verification:** LINEKORA must verify the requester's identity before releasing data. Accept: logged-in session verification, or verified email/phone confirmation.

---

### 2.2 Right to Rectification (Article 17, Law No. 058/2021)

**What it means:** You have the right to have inaccurate personal data corrected and incomplete data completed.

**How to exercise it:**
- Log in to your LINEKORA account → Dashboard → Settings → Edit Profile
- Or email: [DPO email — FILL IN]
- Or in-app support ticket

**What LINEKORA does:**
- Updates the data within **14 days** of the request
- Confirms the update to the data subject

**Note:** Some fields (role, email, firebaseUid) are not editable by the user for security reasons. To change these, contact the DPO with supporting evidence.

---

### 2.3 Right to Erasure / "Right to be Forgotten" (Article 18, Law No. 058/2021)

**What it means:** You have the right to request the deletion of your personal data.

**How to exercise it:**
- Email: [DPO email — FILL IN] with subject "Erasure Request"
- Or in-app support ticket

**When LINEKORA must comply:**
- The data is no longer necessary for the original purpose
- You withdraw consent (and there is no other legal basis)
- You object to processing and there are no overriding legitimate grounds
- The data has been unlawfully processed

**When LINEKORA may refuse:**
- Legal obligation requires retention (e.g. financial records must be kept for 7 years)
- Active legal proceedings or dispute
- Active job/contract with financial obligations (escrow in progress)

**Process:**
1. DPO verifies identity of requester
2. DPO checks for legal retention obligations or active contracts
3. If approved: backend deletion runs within **30 days** (see `Data_Retention_and_Deletion_Policy.md`)
4. DPO confirms deletion to the data subject in writing
5. Deletion is logged (date, requestor, records deleted) — but the deleted data itself is not retained

---

### 2.4 Right to Restrict Processing (Article 19, Law No. 058/2021)

**What it means:** You have the right to request that LINEKORA stops processing your data (while still storing it) in certain circumstances.

**When to exercise it:**
- You contest the accuracy of your data (while it is being verified)
- Processing is unlawful but you prefer restriction over deletion
- LINEKORA no longer needs the data but you need it for legal claims
- You have objected to processing (pending verification of LINEKORA's grounds)

**How to exercise it:**
- Email: [DPO email — FILL IN] with subject "Restriction Request" + reason

**What LINEKORA does:**
- Marks the account as "restricted" in the database
- The data is retained but not processed (no job matching, no notifications)
- Notifies the data subject when restriction is lifted
- Restriction is reviewed every **6 months**

---

### 2.5 Right to Data Portability (Article 20, Law No. 058/2021)

**What it means:** You have the right to receive your personal data in a structured, commonly used, machine-readable format (e.g. JSON or CSV).

**How to exercise it:**
- Same process as Right of Access (Section 2.1)

**What LINEKORA provides:**
- A JSON or CSV file containing your profile data, job history, applications, and messages (your own data only)

---

### 2.6 Right to Object (Article 21, Law No. 058/2021)

**What it means:** You have the right to object to processing based on legitimate interests, including profiling.

**How to exercise it:**
- Email: [DPO email — FILL IN] with subject "Objection Request" + specific processing you object to

**What LINEKORA does:**
- Evaluates the objection within **14 days**
- If valid: stops the specific processing
- If LINEKORA has compelling legitimate grounds that override your rights, it will explain why processing continues

---

### 2.7 Right Not to Be Subject to Automated Decision-Making (Article 22, Law No. 058/2021)

**What it means:** You have the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal or similarly significant effects.

**LINEKORA's position:**
- LINEKORA computes a **Trust Score** based on verification status and activity — this is used to rank workers in search results but does **not** produce legal effects (no automatic rejection or acceptance of jobs)
- LINEKORA does **not** use automated decision-making for any legally significant outcome
- If this changes, this policy and the DPIA will be updated and data subjects will be notified

---

## 3. HOW TO SUBMIT A REQUEST

Data subjects may submit requests through any of the following channels:

| Channel | Details |
|---------|---------|
| **Email** | [DPO email — FILL IN] |
| **Phone** | [DPO phone — FILL IN] |
| **In-app** | Support ticket / Help section (when implemented) |
| **In person** | NDIVE LABS LTD office — [FILL IN address] |

**All requests must include:**
1. Full name of the data subject
2. Account email address (or user ID)
3. Clear description of the right being exercised
4. Any supporting information (for rectification/erasure requests)

---

## 4. IDENTITY VERIFICATION

Before acting on any request, LINEKORA must verify the requester's identity to prevent unauthorised access.

**Accepted verification methods (in order of preference):**
1. Logged-in session (user is authenticated via Firebase)
2. Email verification — send a verification link to the registered email
3. Phone verification — OTP or callback to the registered phone number (when SMS is implemented)

**If identity cannot be verified:** LINEKORA will not action the request and will inform the requester of the reason.

---

## 5. RESPONSE TIMEFRAMES

| Right | Response timeframe | Extension |
|-------|-------------------|-----------|
| Access | 30 days | +30 days (complex requests — notify data subject) |
| Rectification | 14 days | None |
| Erasure | 30 days | +30 days (complex requests — notify data subject) |
| Restriction | 14 days | None |
| Portability | 30 days | +30 days (complex requests — notify data subject) |
| Objection | 14 days | None |

All timeframes start from the date the request is received and identity is verified.

---

## 6. FEES

LINEKORA will process all data-subject requests **free of charge**.

If a request is manifestly unfounded or excessive (e.g. repetitive requests), LINEKORA may:
- Charge a reasonable fee to cover administrative costs
- Refuse the request — providing written reasons

---

## 7. RECORD-KEEPING

LINEKORA maintains a **Data Subject Rights Register** recording:
- Date request received
- Data subject name (or pseudonymised reference)
- Right exercised
- Action taken
- Date response sent
- Outcome (complied / refused + reasons)

This register is maintained by the DPO and is available for inspection by the NCSA/DPO.

**Retention:** Rights register records retained for **10 years**.

---

## 8. TRAINING

All staff who interact with data subjects must be trained on:
- How to recognise a data-subject rights request
- How to escalate it to the DPO
- Their obligation to respond within the legal timeframe
- Never to disclose personal data to unverified requesters

---

## 9. ROLES & RESPONSIBILITIES

| Role | Responsibility |
|------|---------------|
| DPO | Receives and evaluates all rights requests; responds to data subjects; maintains register |
| Developer | Implements technical mechanisms (data export, deletion, account restriction) |
| Management | Resourcing; approves decisions to refuse manifestly unfounded requests |
| All staff | Recognise and escalate any rights request received through any channel |

---

## 10. REVIEW

This policy must be reviewed:
- Annually (next review: [Date + 1 year])
- Upon change in law or DPO guidance
- After any material change to the platform's data processing

---

*Document prepared for LINEKORA Data Protection Compliance*
*Pursuant to Rwanda Data Protection Law No. 058/2021 of 13/10/2021 and PDPB No. 3/2021*
*Version 1.0 — DRAFT — September 14, 2026*