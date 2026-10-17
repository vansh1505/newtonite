# Newtonite Ops — Internal Operations & Work-Item Management

**Newtonite Ops** is a full-stack internal operations application designed to replace disjointed spreadsheet, email, and chat-based workflows with a reliable, concurrent work-item management control plane.

Built for the **Newtonite Software Engineering Challenge: Operations Under Pressure**.

---

## Key Features

1. **Operational Work Item Lifecycle:**
   - Detailed operational context: what the item is, why it exists (root-cause/alert reference), priority, team routing, and active owner.
   - Comprehensive, immutable audit log timeline tracking all transitions, claims, reassignments, and approvals.
2. **Critical Concurrency & Integrity Protections (More than simple CRUD):**
   - **Atomic Claim Race Condition Handling:** Database-level conditional update prevents two operators from claiming the same ticket concurrently. The second operator receives HTTP 409 Conflict with full details of who claimed it.
   - **Optimistic Concurrency Control (OCC):** Work items maintain a monotonically increasing integer `version`. Stale form submissions return HTTP 409 Conflict and alert the operator with state comparison and reload options.
   - **Idempotency Key Deduplication:** API operations support `Idempotency-Key` headers with a 24-hour TTL index, preventing duplicate ticket creation and double transitions on network retries.
   - **State Machine Workflow Rules:** Strict transitions prevent invalid jumps (e.g. `open` cannot jump directly to `resolved` without investigation; items in `awaiting_approval` require signed approvals).
   - **Resource-Level Authorization:** Roles (`Admin`, `Manager`, `Member`) enforced on API routes. Only Managers/Admins can approve governance requests; operators cannot approve their own requests.
3. **Multi-Operator Demonstration:**
   - Built-in **Active Operator Switcher** in the top-right header allowing instant switching between:
     - **Alex Rivera** (Platform Ops Admin)
     - **Sarah Chen** (Customer Support Manager)
     - **Elena Rostova** (Security & Compliance Manager)
     - **Marcus Vance** (Infrastructure Member)

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (clean, minimal SaaS palette with restrained blue accent)
- **Database:** MongoDB via Mongoose
- **Testing:** Vitest with `mongodb-memory-server` (self-contained, zero-external-service testing)

---

## Setup & Running the Application

### 1. Prerequisites
- Node.js 20+ (Node 22 recommended)
- MongoDB instance (local `mongodb://localhost:27017` or MongoDB Atlas URI)

### 2. Environment Configuration
Create a `.env.local` file (already copied from `.env.example`):
```bash
MONGODB_URI=mongodb://localhost:27017/newtonite_ops
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Seed Database with Realistic Data
Populate the database with initial teams, members, work items, audit events, and pending approvals:
```bash
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. (Root automatically redirects to `/dashboard`).

---

## Running Automated Tests

Run the Vitest test suite covering the 5 critical behaviors (concurrency, OCC, idempotency, state machine, and authorization):
```bash
npm test
```
*Note: The test suite runs against an isolated, in-memory MongoDB server via `mongodb-memory-server` and requires no running external database process.*

---

## Verification & Manual Testing Walkthrough

### 1. Test Concurrent Claim Collision
1. Open [http://localhost:3000/dashboard/work-items](http://localhost:3000/dashboard/work-items).
2. Filter or open unassigned item `WI-1043` or `WI-1049`.
3. In one tab/browser as **Sarah Chen**, click **Claim Work**.
4. In another tab or after switching user to **Marcus Vance**, attempt to claim the same item.
5. **Result:** Marcus is blocked with an alert: `Concurrent Claim Collision: Work item was already claimed by Sarah Chen.`

### 2. Test Stale Data OCC Conflict
1. Open ticket `WI-1042` and click **Edit** (`/dashboard/work-items/WI-1042/edit`). Keep this tab open (it holds version 1).
2. In a second tab, open `WI-1042` and change its priority or description (advancing server to version 2).
3. Return to the first tab and click **Save Changes** (submitting version 1).
4. **Result:** Server rejects the save with **HTTP 409 Conflict**. The UI displays an OCC warning banner with a **"Reload Latest Server State"** button.

### 3. Test Authorization Enforcement
1. In the top-right header, switch operator to **Marcus Vance (Infrastructure - Member)**.
2. Navigate to [http://localhost:3000/dashboard/approvals](http://localhost:3000/dashboard/approvals).
3. Attempt to click **Approve** on a pending change request.
4. **Result:** Blocked with HTTP 403: `Authorization Error: Regular Members cannot sign off on operational approvals. Only Managers and Admins are permitted.`
5. Switch operator to **Sarah Chen (Manager)** and approve the request. It succeeds.

---

## Application Route Map

| Route | Page | Purpose |
|---|---|---|
| `/dashboard` | Overview | Metrics (Open, In Progress, Urgent, Approvals), Needs Attention queue, My Work, Live Activity timeline |
| `/dashboard/work-items` | All Work Items | Search, multi-criteria filtering, pagination, preset views (`?view=assigned`, `?view=urgent`) |
| `/dashboard/work-items/[id]` | Work Item Details | Full context, reason, owner, OCC status, claim button, workflow transitions, timeline |
| `/dashboard/work-items/new` | Create Work Item | Creation form with client-side validation and Idempotency-Key support |
| `/dashboard/work-items/[id]/edit` | Edit Work Item | Pre-populated edit form protected by Optimistic Concurrency Control |
| `/dashboard/approvals` | Approvals | Pending approvals table, approve/reject actions with role enforcement and empty-state demo |
| `/dashboard/teams` | Teams & Members | Team overview cards with dynamic active task counts, members directory with role assignments |
| `/login` | Login | Operator authentication UI portal |
| `/register` | Register | Operator registration UI portal |

---

## Documentation

- [`ENGINEERING_DECISIONS.md`](file:///Users/vansh1505/Desktop/project/newtonite/ENGINEERING_DECISIONS.md): In-depth discussion of 5 key architectural decisions, concurrency models, trade-offs, and what was intentionally deferred.
