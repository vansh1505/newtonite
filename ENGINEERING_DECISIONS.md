# Engineering Decisions: Newtonite Ops

This document outlines five core architectural decisions made during the design and implementation of **Newtonite Ops**, detailing the problem context, chosen solution, trade-offs, and failure mode considerations.

---

## Decision 1: Optimistic Concurrency Control (OCC) for Work Item Updates

### Context & Problem
In an operations environment with hundreds of concurrent operators, multiple users frequently view or edit the same incident or maintenance ticket simultaneously. If Operator A and Operator B both open ticket `WI-1042`, and Operator A changes the priority while Operator B rewrites the description, a standard `PUT`/`UPDATE` would cause a "last-write-wins" silent overwrite, destroying Operator A's changes without warning.

### Solution
We implemented **Optimistic Concurrency Control (OCC)** using a monotonically increasing integer `version` attribute on the `WorkItem` schema:
```typescript
const updated = await WorkItem.findOneAndUpdate(
  { id, version: clientVersion },
  { $set: updates, $inc: { version: 1 } },
  { returnDocument: 'after' }
);
```
- If `updated` is `null`, the server detects that the document version changed between when the client fetched it and when the mutation arrived.
- The server responds with **HTTP 409 Conflict** (`code: STALE_DATA_CONFLICT`), returning the latest server version and data payload.
- The UI catches HTTP 409, halts form submission, renders a prominent alert with the conflict details, and provides a 1-click **"Reload Latest Server State"** button so operators can reconcile their work without losing uncommitted input.

### Trade-offs & Alternatives Considered
- **Pessimistic Locking (e.g., Redis distributed lock or DB row locks):** Rejected. If an operator opens an edit form and walks away or loses network connectivity, tickets become locked indefinitely or require complex lease-renewal heartbeats.
- **Operational Merging (CRDTs):** Overkill for structured operational forms where business decisions (status, priority) are discrete states rather than collaborative text documents.
- **OCC Decision:** Zero lock overhead, high read throughput, completely resilient to dropped client connections, and provides explicit visibility when conflicts occur.

---

## Decision 2: Atomic Conditional Claim Race Prevention

### Context & Problem
When an urgent unassigned work item appears in the queue, multiple on-call engineers often rush to claim responsibility at the exact same moment. If assignment logic relies on `check-then-set` (`if (!item.assignee) { item.assignee = user; item.save(); }`), a race condition occurs where both operators are told they own the work, causing duplicated triage effort or confusion.

### Solution
We enforced atomic ownership claiming directly at the database engine level using an atomic conditional update:
```typescript
const updated = await WorkItem.findOneAndUpdate(
  {
    id,
    $or: [{ assigneeId: null }, { 'assignee.name': 'Unassigned' }],
  },
  {
    $set: {
      assigneeId: user.id,
      assignee: { name: user.name, email: user.email, ... },
      status: current.status === 'open' ? 'in_progress' : current.status,
      claimedAt: new Date(),
    },
    $inc: { version: 1 },
  },
  { returnDocument: 'after' }
);
```
- The database guarantees that only one concurrent query matches `{ assigneeId: null }`.
- The winning operator succeeds with **HTTP 200**.
- The second operator immediately receives **HTTP 409 Conflict** (`code: CLAIM_RACE_LOST`) with information on who won the claim and at what timestamp.

### Trade-offs
- Eliminates any possibility of duplicate assignment without needing external coordination services (like ZooKeeper or Redis Redlock).
- Low latency: Single round-trip to MongoDB.

---

## Decision 3: Server-Enforced Workflow State Machine & Resource-Level Authorization

### Context & Problem
Operations software must enforce compliance boundaries:
1. High-impact operational changes (e.g. root cert renewals, database index rebuilds) require managerial sign-off.
2. A regular operator (`Member`) must not be able to bypass approval gates or arbitrarily resolve tickets without sign-off.
3. Operators must not be allowed to approve their own requests (separation of concerns).

### Solution
Authorization and state transitions are validated on the backend API layer (`lib/workflow.ts` and `lib/auth/session.ts`), completely independent of UI visibility:
1. **State Machine Transitions:**
   - `open` ➔ `in_progress` | `blocked` | `awaiting_approval` (cannot jump directly to `resolved` without investigation).
   - `awaiting_approval` ➔ `resolved` only allowed if a verified `ApprovalRequest` with `status: 'approved'` exists.
   - `resolved` ➔ `in_progress` (reopening) restricted strictly to `Admin` and `Manager` roles.
2. **Resource-Level Authorization:**
   - Approval endpoints verify `user.role === 'Admin' || user.role === 'Manager'`. Requests by `Member` return **HTTP 403 Forbidden**.
   - If `approval.requestedBy.email === user.email`, the action is blocked with **HTTP 403 Forbidden** (`SELF_APPROVAL_FORBIDDEN`).

### Trade-offs
- Moving business logic from the UI into pure domain functions ensures direct API requests (via scripts, cURL, or Postman) cannot violate business invariants.

---

## Decision 4: Idempotency Key Architecture for Network Resilience

### Context & Problem
In unstable network environments, mobile networks, or high-stress operational incidents, an engineer submitting a ticket or status change may experience a client timeout before receiving the server's response. The user naturally clicks the button again, risking duplicate ticket creation, repeated billing audits, or conflicting notifications.

### Solution
We implemented client-generated `Idempotency-Key` headers coupled with a TTL-indexed storage model (`models/IdempotencyRecord.ts`):
1. The client generates a unique UUID `Idempotency-Key: idemp-xxx` on creation or sensitive mutations.
2. The server middleware (`lib/idempotency.ts`) checks whether `IdempotencyRecord` already contains `{ key, path }`.
3. If already processed, the server immediately returns the cached HTTP status code and response payload with header `X-Idempotent-Replay: true`, bypassing re-execution.
4. MongoDB TTL index (`expires: 86400`) automatically purges expired idempotency records after 24 hours.

### Trade-offs
- Minimal database footprint (keys auto-expire after 24 hours).
- Provides safety against double-clicking and network timeouts.

---

## Decision 5: Scalable Query Architecture vs What Was Intentionally Left Unbuilt

### Scalability Considerations (Expected Scale: Tens of thousands of active tickets)
- **Index Strategy:** Created compound indexes on `(status, priority)`, `(team, status)`, and `(assigneeId, status)`.
- **Server-Side Pagination:** Never loading full tables into browser memory. `GET /api/work-items` strictly uses `skip` / `limit` (max 50 per page) with total count estimation.
- **Append-Only Audit Log (`WorkItemEvent`):** Changes write an immutable event record containing actor, action, timestamp, and delta details.

### What We Intentionally Chose Not to Build (and Why)
1. **WebSockets / Server-Sent Events (SSE):**
   - *Rationale:* Maintaining persistent full-duplex socket connections across thousands of client instances introduces stateful server clustering requirements and reconnection storms. For v1, optimistic UI updates with debounced REST polling and stale-data OCC conflict detection achieve reliable correctness with significantly lower infrastructure complexity.
2. **Heavy Distributed Queue Brokers (Kafka/RabbitMQ):**
   - *Rationale:* Asynchronous notifications and audit logging are reliably persisted directly in MongoDB collections within the request lifecycle. Adding an external broker would require Kafka cluster maintenance without tangible benefit at current scale.
