# Security Specification for AT5 Guitar Tone Designer

## Data Invariants
1. A gear item must have a unique GUID as its document ID.
2. A verified mapping must have its GUID as its document ID.
3. Every write must include `updatedAt` set to server time.
4. `updatedBy` must match the authenticated user's UID.

## The Dirty Dozen Payloads (Targeting PERMISSION_DENIED)
1. **Unauthenticated Write**: Attempting to add gear without signing in.
2. **Unverified Email**: Attempting to write with a non-verified email account.
3. **ID Poisoning**: Using a 1MB string as a GUID.
4. **Shadow Field**: Adding `isAdmin: true` to a gear item.
5. **Identity Spoofing**: Setting `updatedBy` to a different user's UID.
6. **Temporal Fraud**: Providing a client-side `updatedAt` timestamp from 2000.
7. **Type Poisoning**: Sending `knobs` as a string instead of an array.
8. **Resource Exhaustion**: Sending a 10MB JSON payload.
9. **Collection Scavenging**: Attempting a blanket `list` operation without filters (if applicable).
10. **Immutable Violation**: Attempting to change the `guid` of an existing item.
11. **Protocol Injection**: Adding a verified mapping with an invalid GUID format.
12. **Knob Corruption**: Adding a knob with a `min` value greater than `max`.

## Red Team Table

| Attack | Target | Goal | Expected Outcome |
| :--- | :--- | :--- | :--- |
| Shadow Update | `/catalogue/vlib` | Inject `isApproved: true` | **REJECTED** (Strict Schema) |
| Email Spoof | All Writes | Write with `email_verified: false` | **REJECTED** (Email Verification required) |
| ID Poisoning | Path IDs | Inject 1KB string as GUID | **REJECTED** (isValidId check) |
| Value Poisoning | `knobs.default` | Inject Malicious Script string | **REJECTED** (Type/Size checks) |
| Query Scrape | `allow list` | List all verified GUIDs | **ALLOWED** (for verified users only) |
