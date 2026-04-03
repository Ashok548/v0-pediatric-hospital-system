# Pediatric Hospital App Implementation Plan

## Purpose

This document turns the production readiness findings into an execution plan.

It is designed to answer:

1. What must be fixed first
2. What each workstream needs to deliver
3. What order the changes should ship in
4. What must be verified before release

Source document:

- `docs/production-readiness-plan.md`

---

## Implementation Goal

Make the following flows production-safe, role-correct, auditable, and testable:

1. Appointment creation and OP queue entry
2. OP visit creation from appointment or walk-in
3. Doctor encounter progression
4. Consultation sign-off and encounter completion
5. Prescription creation and pharmacy handoff
6. Pharmacy dispense, partial dispense, and return
7. Billing side-effects for OP and prescriptions
8. Auth and role-based access hardening
9. Auditability, idempotency, and failure recovery

---

## Delivery Principles

### Patient Safety First

Clinical completion must remain doctor-driven. Billing must not be allowed to close an encounter.

### Billing Correctness First

Every OP and prescription side-effect must be deterministic, transactional where possible, and idempotent where retries are expected.

### Incremental Rollout

Do not rewrite all flows at once. Stabilize auth and attribution first, then repair core workflows, then harden payments and billing edge cases.

### One Canonical Flow Per Action

If multiple UI paths can start the same OP workflow, they must route through one backend-safe orchestration path.

---

## Success Criteria

The implementation is complete only when all of the following are true:

1. Prescription creation works from the real doctor workflow without DTO rejection.
2. Consultation signing is the only way to clinically complete an OP encounter.
3. Every audit-sensitive action records the real acting user.
4. PHI-sensitive reads are role-restricted and scope-validated.
5. All OP-start paths produce exactly one OP visit and one correct bill.
6. Payment retries do not double-collect.
7. OP and IP prescription billing behavior is explicit and tested.
8. Integration, negative, and concurrency tests exist for the release-critical flows.

---

## Delivery Workstreams

### Workstream A: Auth and Access Control

Goal:

- Remove mock-role leakage from production paths.
- Enforce real session and least-privilege access.

Primary outcomes:

- All production-facing screens use real auth state.
- All PHI and financial endpoints have explicit access rules.

### Workstream B: Clinical Workflow Integrity

Goal:

- Make encounter lifecycle doctor-driven and state-machine safe.

Primary outcomes:

- Doctor can take up OP, document consultation, sign, and complete safely.
- Billing cannot close an encounter clinically.

### Workstream C: OP Registration and Billing Orchestration

Goal:

- Standardize all OP-start behavior behind one backend transaction boundary.

Primary outcomes:

- No orphan OP visits.
- No missing default consultation charges.
- No duplicate OP bills.

### Workstream D: Prescription and Pharmacy Workflow

Goal:

- Align doctor ordering, pharmacy fulfillment, and billing side-effects.

Primary outcomes:

- Doctor ordering payload is valid.
- Dispense and return are correctly attributed.
- OP and IP billing behavior is explicit.

### Workstream E: Audit, Idempotency, and Resilience

Goal:

- Make the system operationally safe under retries and partial failures.

Primary outcomes:

- Actor attribution is correct.
- Payment submission is idempotent.
- Outbox remains replayable and observable.

### Workstream F: QA and Release Gating

Goal:

- Prevent regressions in clinical and financial flows.

Primary outcomes:

- Happy path, negative, role, and concurrency tests cover release-critical workflows.

---

## Phase Plan

## Phase 0: Alignment and Guardrails

### Objective

Define the target flow rules before changing implementation.

### Tasks

1. Confirm the canonical outpatient encounter model.
   Decision needed:
   Is OP ordering anchored to `appointmentId`, `opVisitId`, or both?

2. Confirm outpatient pharmacy billing behavior.
   Decision needed:
   Should OP prescription billing happen at order time, dispense time, or bill finalization?

3. Freeze unsafe shortcut behavior.
   Action:
   Document which UI entrypoints remain active during the transition and which must be routed to the new canonical flow.

### Deliverables

- Confirmed flow contract for OP encounter, prescription linkage, and OP pharmacy charging
- Approved rollout sequence

### Exit Criteria

- Product, backend, frontend, and QA agree on the target workflow states and side-effects

---

## Phase 1: Security and Attribution Stabilization

### Objective

Fix the highest-risk auth and audit issues first.

### Backend Tasks

1. Standardize request user handling.
   Change all controllers and services to use the same authenticated user shape.
   Preferred target: `req.user.id`

2. Fix actor propagation for:
   - Appointment status updates
   - Bill finalize
   - Bill payment collection
   - Pharmacy stock adjustment
   - Prescription dispense
   - Prescription return

3. Add explicit `@Roles()` protection for all sensitive read endpoints.
   Minimum set:
   - Consultation reads
   - Pharmacy inventory and prescription reads
   - Pharmacy stats and clearance reads
   - Bill by ID reads

4. Add per-record scope checks where role-based access alone is not enough.

### Frontend Tasks

1. Replace production usage of mock auth state with real session state.

2. Limit the mock role switcher and mock auth store to demo-only or development-only use.

3. Ensure route gating and UI-level role gating match backend role policies.

### QA Tasks

1. Add tests that verify unauthorized roles cannot read protected financial or clinical data.

2. Add tests that verify audit-sensitive actions write the real acting user.

### Deliverables

- Real-user actor attribution across all release-critical flows
- Role-safe PHI and billing read endpoints
- Production screens using real auth state

### Exit Criteria

- No controller in the targeted flows depends on inconsistent user claims
- No PHI-sensitive read endpoint is left as authenticated-only by accident

---

## Phase 2: Canonical OP Encounter Orchestration

### Objective

Eliminate split browser-side orchestration for OP encounter start.

### Backend Tasks

1. Create a single orchestration endpoint or service operation for OP initiation.

Expected behavior:

- Validate patient and source context
- Reuse or create OP visit safely
- Create or reuse draft bill safely
- Add default OP consultation services
- Return one consistent response object for the UI

2. Enforce duplicate protection inside the transaction boundary.

3. Ensure all OP-start flows capture department consistently so auto-add service logic always works.

### Frontend Tasks

1. Migrate these screens to the new orchestration flow:
   - Appointment screen OP generation
   - Patient detail OP generation
   - Patient list OP generation
   - OP billing visit selection

2. Remove direct two-step browser logic where OP visit and bill are created separately.

3. Standardize navigation after OP initiation so the user always lands on one canonical encounter or billing page.

### QA Tasks

1. Add integration coverage for:
   - Appointment to OP bill
   - Walk-in to OP bill
   - Duplicate OP start retry

2. Add failure tests where the second half of the flow used to fail, proving no orphan OP visit remains.

### Deliverables

- One canonical OP-start path
- No missing default OP charges
- No orphan visit from split client-side requests

### Exit Criteria

- All OP entrypoints route through the same backend-safe orchestration path

---

## Phase 3: Doctor Encounter Workflow Implementation

### Objective

Make the clinical progression path real and doctor-driven.

### Backend Tasks

1. Keep consultation sign-off as the source of truth for encounter completion.

2. Remove or restrict billing-side status changes that currently advance clinical state.

3. Ensure OP state transitions follow the state machine only.

4. Validate that pending orders drive `ORDERS_PLACED` versus `COMPLETED` correctly.

### Frontend Tasks

1. Implement a real doctor encounter screen or workflow entry from the doctor dashboard.

Required actions:

- Take up encounter
- Create or continue consultation
- Update clinical notes
- Sign consultation
- Show encounter state and pending-order status

2. Wire doctor dashboard actions so `Start`, `Continue`, and `View` do real work.

3. Ensure the doctor can only sign their own consultation notes.

### QA Tasks

1. Add tests for:
   - Doctor starts encounter
   - Doctor edits draft consultation
   - Doctor signs consultation
   - Encounter becomes `ORDERS_PLACED` when orders are pending
   - Encounter becomes `COMPLETED` when no orders are pending

2. Add a negative test proving billing finalization cannot complete a not-yet-signed encounter.

### Deliverables

- Real doctor workflow
- Clinical completion no longer controlled by billing

### Exit Criteria

- A doctor can complete the full encounter without any manual data patching or hidden admin route

---

## Phase 4: Prescription Contract and Pharmacy Flow Repair

### Objective

Make prescription creation and pharmacy execution valid, attributable, and financially correct.

### Backend Tasks

1. Finalize prescription linkage model.
   Pick one of:
   - `opVisitId` as required outpatient anchor
   - `appointmentId` supported explicitly in DTO and service
   - both, with validation rules

2. Update `CreatePrescriptionDto` and service validation accordingly.

3. Validate doctor, patient, admission, and OP context consistency before insert.

4. Add audit logging for prescription creation if required for compliance.

5. Define OP billing side-effects for pharmacy dispense and return.

### Frontend Tasks

1. Update medication order dialog payload to match the final DTO exactly.

2. Stop using mock doctor IDs in prescription payloads.

3. If outpatient ordering requires `opVisitId`, ensure the doctor workflow has access to it before enabling order submission.

4. Ensure UI handles DTO validation and stock errors clearly.

### QA Tasks

1. Add tests for:
   - IP prescription create
   - OP prescription create
   - Partial dispense
   - Full dispense
   - Return
   - Insufficient stock
   - Invalid payload rejection

2. Add billing verification checks for both IP and OP pharmacy scenarios.

### Deliverables

- Prescription creation works from production UI
- Pharmacy actions are attributable and contract-safe
- OP and IP billing side-effects are explicit

### Exit Criteria

- The medication-order UI succeeds against the real backend without DTO rejection

---

## Phase 5: Payment Idempotency and Financial Hardening

### Objective

Prevent duplicate payment and financial drift under retries.

### Backend Tasks

1. Add a payment idempotency strategy.

Recommended approach:

- Introduce an `idempotencyKey` on payment submission
- Enforce uniqueness at the database level
- Return the existing payment result on safe retry

2. Decide whether `transactionRef` also needs uniqueness constraints.

3. Ensure payment status recalculation remains correct under retry and partial-payment scenarios.

### Frontend Tasks

1. Send a stable idempotency key for payment submission.

2. Prevent accidental double-submit in the UI.

3. Surface retry-safe results to users without collecting twice.

### QA Tasks

1. Add duplicate payment retry tests.

2. Add concurrent payment tests for the same bill.

3. Validate partial-payment and full-payment transitions remain correct.

### Deliverables

- Retry-safe payment collection
- No duplicate collection under normal client or network retry behavior

### Exit Criteria

- Payment retries cannot create duplicate payment rows or double-reduce due amount

---

## Phase 6: Resilience, Outbox, and Operational Visibility

### Objective

Strengthen failure recovery and post-release supportability.

### Backend Tasks

1. Add metrics or structured operational logging for:
   - OrdersSigned processing
   - FinancialClearanceGranted processing
   - Dead-letter accumulation
   - Replay operations

2. Verify replay and failure handling for all critical event listeners.

3. Confirm no business-critical side-effect bypasses the outbox where retry is required.

### QA Tasks

1. Force listener failure and confirm retry and dead-letter behavior.

2. Replay dead-lettered events and confirm successful recovery.

### Deliverables

- Supportable outbox operations
- Verified replay flow

### Exit Criteria

- Critical event-driven billing side-effects can be retried and recovered safely

---

## Phase 7: Release Gating and Production Rollout

### Objective

Ship safely with low regression risk.

### Pre-Release Gate

All of the following must pass:

1. Integration tests for appointment, OP, consultation, billing, and pharmacy flows
2. Negative tests for authorization, validation, and stock insufficiency
3. Concurrency tests for duplicate OP, duplicate billing, duplicate payment, and stock race
4. Role-permission tests for all protected read and write paths
5. Manual clinical walkthrough by product or domain owner

### Rollout Strategy

1. Ship auth and audit fixes first
2. Ship OP orchestration behind a feature flag if needed
3. Migrate UI entrypoints one by one to the canonical backend path
4. Ship doctor workflow and prescription contract fix together
5. Ship payment idempotency before broad release of billing collection changes
6. Monitor outbox failures, audit attribution, and billing anomalies in staging before production enablement

### Post-Release Monitoring

Monitor immediately after release:

1. Payment duplication incidents
2. Missing OP consultation charges
3. Prescription create failures
4. Unauthorized access attempts
5. Outbox dead-letter growth
6. Pharmacy stock discrepancy reports

---

## Suggested Ownership Model

### Backend Team

- Auth claim normalization
- Route authorization hardening
- OP orchestration endpoint
- Consultation workflow rules
- Prescription DTO and validation updates
- Payment idempotency
- Outbox instrumentation

### Frontend Team

- Replace mock auth in production paths
- Migrate OP start entrypoints
- Implement doctor encounter workflow
- Align prescription order payloads
- Add safe payment submission behavior

### Database Team

- Payment idempotency schema changes
- Any uniqueness or indexing changes for concurrency safety
- Migration review for billing and audit tables

### QA Team

- Integration test coverage
- Concurrency and race validation
- Role-permission matrix validation
- Release-gate checklist ownership

---

## Dependency Map

### Must Happen Before Doctor Workflow Repair

1. Auth claim normalization
2. Real auth usage in frontend production paths
3. Final decision on OP encounter anchor and prescription linkage

### Must Happen Before Payment Hardening Sign-Off

1. Canonical OP orchestration
2. Billing side-effect contract finalization

### Must Happen Before Release

1. Sensitive route authorization hardening
2. Prescription contract repair
3. Billing-clinical decoupling
4. Payment idempotency
5. Release-critical integration and concurrency test coverage

---

## Minimum Viable Release Sequence

If the team needs the smallest safe sequence, implement in this order:

1. Fix actor attribution and route authorization
2. Replace mock auth in production screens
3. Introduce canonical OP orchestration and migrate OP entrypoints
4. Remove billing-driven clinical completion
5. Repair prescription contract and doctor workflow
6. Add payment idempotency
7. Validate OP and IP pharmacy billing side-effects
8. Run full regression, concurrency, and role-permission suite

---

## Done Definition

This plan is complete when:

1. The release-critical flows work end to end from the visible production UI.
2. No flow depends on mock identity or mock roles.
3. Clinical completion is doctor-controlled.
4. Financial collection is idempotent.
5. PHI reads are least-privilege protected.
6. Outbox-driven side-effects are recoverable.
7. QA sign-off is backed by automated integration and concurrency evidence.
