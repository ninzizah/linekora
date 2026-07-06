# LINEKORA Security Specification

## 1. Data Invariants
- **User Integrity**: A user document must match the authenticated UID. Role cannot be changed after creation. Trust score is system-only.
- **Verification Invariant**: Only an admin can approve/reject verification requests. Users can only create their own requests.
- **Job Ownership**: Only the creator of a job can update or close it.
- **Financial Safety**: Wallets can only be read by the owner or an admin. Balance updates are strictly controlled.
- **Relational Sync**: A job application must reference a real Job ID and a real Worker ID.

## 2. The "Dirty Dozen" Payloads (Denial Expected)

1. **Identity Spoofing**: Attempt to create a user profile with a different UID in the document path than the `auth.uid`.
2. **Role Escalation**: Attempt to update `role` from 'worker' to 'admin' via client SDK.
3. **Trust Score Poisoning**: Attempt to increment own `trustScore` by +500.
4. **Shadow Verification**: Attempt to update own `verificationStatus` to 'verified' without going through the admin queue.
5. **Orphaned Job**: Attempt to create a job with a `postedBy` ID that doesn't match the current user.
6. **Ghost Application**: Attempt to apply for a job using someone else's worker ID.
7. **Negative Balance Hack**: Attempt to "withdraw" a negative amount to effectively deposit funds.
8. **Wallet Drain**: Attempt to read the `wallet` document of another user.
9. **Illegal Status Jump**: Attempt to update a job status directly from 'open' to 'filled' without selecting an applicant.
10. **Admin notes Injection**: Attempt to write to `adminNotes` in a `verificationRequest`.
11. **Excessive Resource Usage**: Attempt to save a 1MB string into the `displayName` field to cause Denial of Wallet.
12. **Future Deadline Hack**: Attempt to set a job deadline to the year 2099 to bypass system cleanup.

## 3. Test Runner Concept (firestore.rules.test.ts)
Verification will be performed by ensuring the `firestore.rules` block these payloads using `isValidUser()`, `isValidJob()`, and `isValidWallet()` helpers.
