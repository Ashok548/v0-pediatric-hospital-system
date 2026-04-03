# Pediatric Hospital App Production Readiness Plan

## Document Purpose

This document converts the static validation review into a readable execution plan for making the outpatient, prescription, pharmacy, billing, and authorization flows production-grade.

Scope covered:

1. Appointment creation and patient joining OP queue
2. OP visit creation from appointment
3. Doctor taking up OP and progressing clinical status
4. Marking OP or consultation as resolved or completed
5. Prescription creation and sending
6. Pharmacy dispense, partial dispense, and return
7. Billing side-effects tied to OP and prescriptions
8. Auth and role-based access
9. Auditability, idempotency, and failure recovery

Review type: deep static validation only

---

## Executive Verdict

**Verdict: No-Go**

The repo contains several strong building blocks:

- Global JWT and role guards are enabled by default in `apps/api/src/app.module.ts`.
- A transactional outbox with retry and dead-letter handling exists in `apps/api/src/events/outbox.service.ts`.
- OrdersSigned billing creation includes row-lock-based duplicate protection in `apps/api/src/events/billing-events.service.ts`.
- Pharmacy stock deduction uses atomic conditional SQL in `apps/api/src/pharmacy/pharmacy.service.ts`.

The application is still not production-grade for the requested flows because several core paths are either broken, clinically unsafe, or insufficiently protected.

The highest-risk blockers are:

1. The medication-order UI submits a payload the backend rejects.
2. Billing finalization is allowed to drive clinical completion.
3. Audit actor attribution is broken in multiple controllers.
4. Several PHI-sensitive read endpoints are only authenticated, not role-scoped.
5. Some OP-start flows are split across multiple browser calls and can miss billing side-effects.

---

## Flow Coverage Matrix

| Flow | Current State | Entry UI | API Endpoints | Service Methods | DB Models | Statuses / Side-effects |
|---|---|---|---|---|---|---|
| Appointment creation and OP queue join | Partial | `apps/web/components/hospital/appointments-content.tsx` | `POST /appointments`, `PATCH /appointments/:id/status`, `POST /op-visits`, `POST /billing` | `AppointmentsService.create`, `AppointmentsService.updateStatus`, `OPVisitsService.create`, `BillingService.create` | `Appointment`, `OPVisit`, `Bill`, `AuditLog` | Appointment transitions: `SCHEDULED -> IN_PROGRESS -> COMPLETED`, with cancel/no-show cascade to OP cancel and audit |
| OP visit creation from appointment | Partial to Broken | `apps/web/components/hospital/appointments-content.tsx`, `apps/web/components/billing/op/OPBillingForm.tsx` | `POST /op-visits`, `POST /billing` | `OPVisitsService.createWithTx`, `BillingService.create` | `OPVisit`, `Bill`, `AuditLog` | Registered OP encounter exists, but some UI paths skip department-driven default charges |
| Doctor takes up OP and progresses clinical status | Broken | `apps/web/components/hospital/doctor-dashboard-content.tsx` | `PATCH /op-visits/:id/status`, `POST /consultations`, `PUT /consultations/:id`, `POST /consultations/:id/sign` | `OPVisitsService.updateStatus`, `ConsultationsService.create`, `ConsultationsService.update`, `ConsultationsService.signConsultation` | `OPVisit`, `Consultation`, `AuditLog`, `OutboxEvent` | Service state machine exists, but UI is not wired to it |
| Mark OP / consultation resolved or completed | Broken and Unsafe | No confirmed end-user sign flow found | `POST /consultations/:id/sign` | `ConsultationsService.signConsultation`, `BillingEventsService.handleOrdersSigned` | `Consultation`, `OPVisit`, `Bill`, `OutboxEvent`, `AuditLog` | Intended close path is consultation sign; billing finalization currently also advances encounter state |
| Prescription creation and sending | Broken | `apps/web/components/hospital/dialogs/create-medication-order-dialog.tsx` | `POST /pharmacy/prescriptions` | `PharmacyService.createPrescription` | `Prescription`, `PrescriptionItem`, `Medication` | UI payload and backend DTO are misaligned |
| Pharmacy dispense / partial / return | Partial | `apps/web/components/hospital/pharmacy-content.tsx` | `POST /pharmacy/prescriptions/:id/dispense`, `POST /pharmacy/prescriptions/:id/return`, `POST /pharmacy/inventory/:medicationId/adjust` | `PharmacyService.dispensePrescription`, `PharmacyService.returnPrescription`, `PharmacyService.adjustStock` | `Prescription`, `PrescriptionItem`, `Medication`, `StockAdjustment`, `Bill`, `BillItem` | Strong stock logic exists; actor attribution is broken |
| Billing side-effects tied to OP and prescriptions | Broken and Unsafe | `apps/web/components/billing/op/OPBillingForm.tsx`, plus multiple OP shortcut screens | `POST /billing`, `POST /billing/:id/finalize`, `POST /billing/:id/payments` | `BillingService.create`, `BillingService.finalizeBill`, `BillingService.recordPayment`, `BillingEventsService.handleOrdersSigned` | `Bill`, `BillItem`, `Payment`, `OutboxEvent` | OP consultation charging is inconsistent; payment is not idempotent; OP pharmacy billing is incomplete |
| Auth and role-based access | Broken | `apps/web/middleware.ts`, `apps/web/hooks/use-auth.ts` | Global JWT + route-specific roles | `JwtStrategy`, `RolesGuard`, middleware gate | JWT session, route decorators | Several sensitive read endpoints lack role decorators |
| Auditability, idempotency, and failure recovery | Partial to Broken | N/A | Outbox admin replay exists | `OutboxService.processOutboxEvents` | `AuditLog`, `OutboxEvent`, `Payment` | Outbox exists, but actor IDs and payment idempotency are not production-safe |

---

## Critical Gaps (P0 and P1)

### P0. Prescription creation path is currently broken

**Issue**

The medication-order dialog sends `appointmentId` and a mock `doctorId`, but the backend prescription DTO only allows `patientId`, `admissionId`, `opVisitId`, and a UUID `doctorId`.

Because the API runs with `forbidNonWhitelisted: true`, the request is rejected.

**Impact**

- Doctors cannot reliably create prescriptions from the current UI.
- Pharmacy flow cannot be considered release-ready.
- Clinical ordering path is broken at the contract level.

**Evidence**

- `apps/web/components/hospital/dialogs/create-medication-order-dialog.tsx:214-324`
- `apps/api/src/pharmacy/dto/pharmacy.dto.ts:25-45`
- `apps/web/lib/store/auth-store.ts:8-24`
- `apps/api/src/main.ts:21-27`

### P0. Billing finalization can complete the encounter clinically

**Issue**

`BillingService.finalizeBill()` changes appointment status to `COMPLETED` and pushes OP visit to `BILLED`.

The intended clinical completion path is already defined in `ConsultationsService.signConsultation()`, where the doctor signs the consultation and the system decides whether the visit becomes `ORDERS_PLACED` or `COMPLETED` based on pending orders.

**Impact**

- Finance can effectively close the clinical encounter.
- Clinical state can become inconsistent with actual doctor workflow.
- Patient safety risk: visit may appear completed before clinical work is actually complete.

**Evidence**

- `apps/api/src/billing/billing.service.ts:537-575`
- `apps/api/src/op-visits/op-visits.service.ts:127-137`
- `apps/api/src/consultations/consultations.service.ts:144-225`

### P0. Audit actor attribution is broken

**Issue**

The JWT strategy returns `{ id, email, role }`, but multiple controllers read `req.user?.sub`.

As a result, `userId` can be null in audit logs and business records.

**Impact**

- Audit trail is incomplete.
- Payment, stock, and status actions may not be attributable to a real user.
- Compliance and forensic traceability are weakened.

**Evidence**

- `apps/api/src/auth/strategies/jwt.strategy.ts:14-29`
- `apps/api/src/appointments/appointments.controller.ts:69-76`
- `apps/api/src/billing/billing.controller.ts:65-91`
- `apps/api/src/pharmacy/pharmacy.controller.ts:52-104`

### P0. Sensitive read endpoints are not role-scoped

**Issue**

The roles guard explicitly allows any authenticated user when no `@Roles()` decorator is present.

Several sensitive routes return PHI or financial data without route-level role restrictions.

**Impact**

- Overexposure of consultations, pharmacy data, and bill details.
- Least-privilege failure.
- Production privacy and compliance risk.

**Evidence**

- `apps/api/src/auth/guards/roles.guard.ts:8-24`
- `apps/api/src/consultations/consultations.controller.ts:13-26`
- `apps/api/src/pharmacy/pharmacy.controller.ts:12-23`
- `apps/api/src/pharmacy/pharmacy.controller.ts:67-114`
- `apps/api/src/billing/billing.controller.ts:28-45`

### P1. Some OP-start flows are non-transactional and can miss charges

**Issue**

Several UI flows create OP visit first and then create bill in a second browser request.

Those paths also omit `department` when creating the bill, so default OP consultation services may not be auto-added.

**Impact**

- Orphan OP visits if the second request fails.
- Missing consultation charges.
- Duplicate or inconsistent OP billing behavior depending on which UI entrypoint is used.

**Evidence**

- `apps/web/components/hospital/appointments-content.tsx:663-684`
- `apps/web/components/hospital/patient-detail-content.tsx:856-867`
- `apps/web/components/hospital/patients-list-content.tsx:132-144`
- `apps/api/src/billing/billing.service.ts:56-150`

### P1. Payment recording is not idempotent

**Issue**

`recordPayment()` inserts a new payment row directly. There is no idempotency key, no dedupe logic, and no uniqueness constraint on `transactionRef`.

**Impact**

- Double payment collection on retry.
- Billing correctness risk.
- Reconciliation risk.

**Evidence**

- `apps/api/src/billing/dto/billing.dto.ts:70-83`
- `apps/api/src/billing/billing.service.ts:584-650`
- `packages/database/prisma/schema.prisma:765-776`

### P1. OP prescription dispense does not create OP billing side-effects

**Issue**

Pharmacy billing side-effects are only applied when `rx.admissionId` exists.

Outpatient prescriptions can therefore be dispensed with no billing update.

**Impact**

- OP prescription revenue leakage.
- Incomplete billing correctness for requested flows.

**Evidence**

- `apps/api/src/pharmacy/pharmacy.service.ts:171-275`
- `packages/database/prisma/schema.prisma:902-949`

### P1. Doctor-side progression UI is not functionally wired

**Issue**

The doctor dashboard renders `Start`, `Continue`, and `View` actions, but there is no confirmed web usage of the consultation APIs beyond the client wrapper.

**Impact**

- Doctor workflow is visually present but not operable.
- Clinical progression and completion cannot be trusted as end-to-end production flow.

**Evidence**

- `apps/web/components/hospital/doctor-dashboard-content.tsx:352-417`
- `apps/web/lib/api/consultations.ts:1-24`

**Inference**

A targeted scan across `apps/web/components`, `apps/web/app`, and `apps/web/lib` did not find a real consultation UI consumer beyond the API wrapper.

---

## Medium and Low Gaps (P2 and P3)

### P2. OP visit frontend contract mismatch

`useOPVisits()` expects a raw array, but the backend returns a paginated object.

**Evidence**

- `apps/web/lib/api/op-visits.ts:1-53`
- `apps/api/src/op-visits/op-visits.service.ts:82-118`

### P2. Mock-role store is mixed into production-facing screens

Real auth exists in `useAuth()`, but several screens still use the mock role store.

**Evidence**

- `apps/web/hooks/use-auth.ts:11-85`
- `apps/web/lib/store/auth-store.ts:8-69`
- `apps/web/components/hospital/doctor-dashboard-content.tsx:89-97`
- `apps/web/components/hospital/pharmacy-content.tsx:177-186`
- `apps/web/components/hospital/dialogs/create-medication-order-dialog.tsx:214-220`

### P2. Middleware has insecure fallback JWT secret and verbose request logging

**Evidence**

- `apps/web/middleware.ts:18-28`
- `apps/web/middleware.ts:29-64`
- `apps/api/src/auth/auth.module.ts:8-18`

### P2. Pharmacy return reason is ignored by the backend

The client sends `reason`, but the controller does not read it.

**Evidence**

- `apps/web/lib/api/pharmacy.ts:147-149`
- `apps/api/src/pharmacy/pharmacy.controller.ts:99-103`

### P2. Appointment token generation may race under concurrency

`nextToken` is derived from the current maximum token and is not protected by a unique token constraint.

**Evidence**

- `apps/api/src/appointments/appointments.service.ts:84-120`
- `packages/database/prisma/schema.prisma:652-680`

**Inference**

Concurrent bookings for the same doctor and date but different slots can still race on token generation.

### P3. Observability is mostly log-based

Outbox retry and dead-letter handling exist, but no metrics or tracing were found for these flows.

**Evidence**

- `apps/api/src/events/outbox.service.ts:20-88`
- `apps/api/src/events/billing-events.service.ts:23-104`

### P3. Automated test coverage does not protect the requested release

**Evidence**

- `apps/web/e2e/hospital-workflow.spec.ts:1-176`
- `apps/api/test/app.e2e-spec.ts:1-20`
- `apps/api/src/app.controller.spec.ts:1-21`

---

## Concrete Fix Plan

### PR 1. Replace mock auth usage in production screens

Scope:

- Migrate doctor, pharmacy, billing-adjacent, and role-sensitive screens from `useAuthStore()` to `useAuth()`.
- Remove mock IDs from API payloads.
- Restrict mock-role tooling to explicit demo mode only.

### PR 2. Fix user identity propagation and audit attribution

Scope:

- Standardize controllers on `req.user.id`.
- Update any service or audit paths still expecting `sub`.
- Add regression tests that verify `AuditLog.userId`, `Payment.processedBy`, `dispensedBy`, and stock adjustment actor IDs.

### PR 3. Introduce an atomic OP encounter creation endpoint

Scope:

- Create one server-side endpoint that creates or reuses OP visit plus draft bill plus default OP services in a single transaction.
- Migrate appointment, patient list, and patient detail OP shortcut flows onto that endpoint.

### PR 4. Make consultation sign the only clinical-close path

Scope:

- Remove appointment completion from bill finalization.
- Prevent billing from driving OP state completion.
- Add a real doctor encounter workflow page that uses OP status updates plus consultation sign.

### PR 5. Align prescription contract for OP and IP use cases

Scope:

- Decide whether outpatient ordering is `opVisitId`-based or `appointmentId`-based.
- Update DTO, service validation, and UI payload to match.
- Validate ownership and consistency across patient, visit, admission, and doctor IDs.

### PR 6. Harden route authorization

Scope:

- Add `@Roles()` decorators to all PHI-sensitive read endpoints.
- Add ownership or scope checks where role alone is insufficient.
- Verify alignment between API roles and frontend route middleware.

### PR 7. Add payment idempotency protection

Scope:

- Introduce `idempotencyKey` or a unique dedupe rule on payment submissions.
- Add DB uniqueness for the chosen key.
- Ensure retries do not create duplicate payment rows.

### PR 8. Complete pharmacy-to-billing behavior for OP prescriptions

Scope:

- Define OP dispense charging behavior explicitly.
- Ensure dispense and return create corresponding OP bill side-effects where required.
- Add tests for OP and IP billing differences.

---

## Suggested Rollout Order

### Phase 1: Safety and security stabilization

Ship first:

1. PR 2 - actor attribution
2. PR 6 - route authorization hardening

### Phase 2: Flow integrity and correctness

Ship next:

3. PR 3 - atomic OP encounter creation
4. PR 5 - prescription contract alignment
5. PR 4 - clinical-close path correction

### Phase 3: Financial hardening

Ship after core correctness is stable:

6. PR 7 - payment idempotency
7. PR 8 - OP pharmacy billing completion

### Phase 4: Regression protection

After the above:

8. Expand automated integration and concurrency coverage

---

## Verification Test Plan

### Critical Happy-Path Tests

1. Receptionist creates appointment, patient joins OP, doctor signs consultation, bill is created, payment is recorded, audit trail is complete.
2. Walk-in OP billing through `OPBillingForm` creates OP visit and bill in one consistent flow with default consultation charge.
3. Inpatient prescription create, partial dispense, full dispense, and return all update stock and billing correctly.
4. OrdersSigned event creates one OP bill only and survives retry safely.

### Critical Negative Tests

1. Prescription create with invalid doctor ID or unsupported payload fields fails with validation.
2. Bill finalization before clinical completion is rejected.
3. Dispense with insufficient stock fails without partial stock or billing mutation.
4. Invalid appointment and OP visit state transitions are rejected.
5. A doctor cannot sign another doctor's consultation.

### Concurrency Tests

1. Double-book same doctor, same date, same slot.
2. Duplicate OP creation for same appointment.
3. Duplicate OrdersSigned processing for same OP visit.
4. Duplicate payment retries for same idempotency key.
5. Competing stock deduction against low inventory.

### Role-Permission Tests

1. Pharmacist cannot create prescriptions.
2. Receptionist cannot read unauthorized consultation data.
3. Doctor cannot perform dispense or return.
4. Billing user cannot access pharmacist-only stock adjustment routes.
5. Unauthorized roles cannot fetch bill details by ID.

### Release Gate Checklist

1. No production flow depends on mock auth state.
2. All appointment, OP, billing, payment, dispense, and return actions record real user IDs.
3. All OP entry points create exactly one OP visit and one correct draft bill.
4. Consultation signing is the only path to clinical completion.
5. Payment retries are idempotent.
6. Outbox dead-letter queue is empty after staging validation.
7. PHI-sensitive reads are least-privilege protected.

---

## Test Coverage Status Today

Current automated coverage is not sufficient for production release of the requested flows.

What exists:

- Basic app e2e scaffold: `apps/api/test/app.e2e-spec.ts`
- Basic app controller unit test: `apps/api/src/app.controller.spec.ts`
- One web workflow spec covering login, patient registration, appointment booking, and appointment status updates: `apps/web/e2e/hospital-workflow.spec.ts`

What is missing:

- Appointment to OP creation integration tests
- Doctor consultation workflow tests
- Prescription create and sign-off tests
- Pharmacy concurrency tests
- Payment idempotency tests
- Role-permission coverage for PHI-sensitive reads

---

## Open Questions and Assumptions

### Assumptions

1. This review is static only and was not validated against a running seeded environment.
2. Outpatient prescription billing is expected, because requested scope explicitly includes OP and prescription-linked billing.
3. The patient-list and patient-detail OP shortcut actions are treated as production flows because they are present in live UI components.

### Open Questions

1. Should OP prescriptions be linked to `appointmentId`, `opVisitId`, or both?
2. Should OP pharmacy charges be posted at prescription creation, dispense time, or bill finalization?
3. Is there an intended doctor encounter page not currently wired into the visible web app?
4. Are patient-list and patient-detail OP shortcuts meant to remain, or should all OP initiation route through billing form only?

---

## Immediate Recommendation

Do not ship these flows as production-grade until the P0 items are resolved and the P1 financial and workflow integrity items have at least integration and concurrency test coverage.
