# UI Device Adaptiveness — Task List & Machine-check Cases

**Purpose:** Make the application adapt automatically and correctly by device type, pointer/input capability, screen size and browser features. Tasks are outcome-oriented (what must change) and include **machine-check cases** so multiple AIs can safely coordinate work and validate progress.

---

## Coordination rules (important)
These rules are **required** for every AI/agent working on the repo to avoid duplicate work and to give clear machine-readable evidence.

### Basic metadata (per task)
Each task must have an entry in the repository file `UI_Device_Adaptiveness_Tasks_STATUS.yaml` (or the root `UI_Device_Adaptiveness_Tasks.md`) with the following fields **when claimed or updated**:

```yaml
task_id: C1
status: IN_PROGRESS | TODO | BLOCKED | REVIEW | DONE
owner: agent-identifier-or-email
branch: <branch-name>
claim_time: 2026-02-02T12:34:56Z
updated_time: 2026-02-02T13:00:00Z
pr_url: https://github.com/...
evidence_summary: short-text
block_reason: optional text
```

- `task_id` must match the task name in this document.
- `owner` is a short agent identifier (e.g., `ai/codex-1`).
- `branch` must follow the pattern `task/<TASKID>/<OWNER>/<short>` (e.g., `task/C1/ai-codex-1/initial`).

### Locking / claiming rules
1. **Claim**: Before starting, create a claim by writing the metadata with `status: IN_PROGRESS` and `claim_time`. Also create a lock artifact at `.task_locks/<TASKID>.lock` containing JSON with the same metadata. Presence of this lock signals the task is claimed.
2. **Respect locks**: If `.task_locks/<TASKID>.lock` exists and is less than 24 hours old and `status: IN_PROGRESS`, other agents **must not** claim the same task. They may post proposals in `.task_work_proposals/<TASKID>.txt`.
3. **Stale locks**: If the lock is older than 24 hours and owner last-updated time is older, an agent may mark the lock `stale` and create a new claim, but must record the previous metadata into `.task_locks/<TASKID>.lock.history`.
4. **Unclaim / release**: If an agent aborts, update the lock with `status: TODO` or `status: BLOCKED` and a `block_reason`.

### Branch & PR rules
- Branch name must follow `task/<TASKID>/<OWNER>/<short>`.
- Create a single PR for the task when ready, include the `task_id` in the PR title.
- Put the metadata `pr_url` into the YAML entry and into the lock file.

### Status transitions
- `TODO` → `IN_PROGRESS` (owner creates lock & updates metadata).
- `IN_PROGRESS` → `BLOCKED` (owner sets `status: BLOCKED` + `block_reason`).
- `IN_PROGRESS` → `REVIEW` (owner opens PR and sets `status: REVIEW`).
- `REVIEW` → `DONE` (PR merged into main/develop and evidence added).
- `BLOCKED` → `IN_PROGRESS` (owner resolves block or a new owner claims after lock rules).

### Evidence and validation
For `REVIEW` or `DONE`, the owner must include **evidence**:
- PR URL.
- CI job summary (unit tests, visual tests, accessibility tests).
- Short text stating which acceptance criteria passed.
- Any artifacts (screenshot URLs, accessibility report, test reports).
All of this is recorded in `evidence_summary` in metadata and the lock file.

---

## Machine-check cases (per task)
Each task below includes **Machine-check Cases**: conditions an AI or CI can evaluate to categorize the task into one of the statuses. Use these rules to programmatically detect the status. **Do not** change the status without updating the YAML metadata and lock file.

**Status definitions**
- `TODO` — not claimed/started.
- `IN_PROGRESS` — claimed and actively worked on (lock file present and branch exists).
- `BLOCKED` — claimed but blocked, with `block_reason`.
- `REVIEW` — PR opened for review and tests are running/passed.
- `DONE` — merged and acceptance criteria satisfied.

---

---

## CRITICAL

### Task C1 — Primary navigation must be present on initial render (all devices)
**Files / locations:** `components/BottomNavMobile.tsx`, `app/layout.tsx`.

**Issue summary:** Primary navigation is missing while client fetches permissions; causes navigation to be absent from initial render and inaccessible to assistive tech.

**Change required (what):** Ensure primary navigation HTML is present in initial render (or render an accessible placeholder) for all device sizes.

**Acceptance criteria (human-readable):**
- DOM contains a primary `<nav ...>` element on initial page load for all devices, or a clearly-labeled accessible placeholder is present until final nav data loads.
- Screen reader can discover a primary navigation element before the permissions fetch completes.

**Tests to add:** Unit/E2E verifying nav element presence on first paint.

#### Machine-check Cases
- **TODO**
  - Condition: No metadata claim file exists AND nav element is absent from initial HTML responses.
  - Evidence: `UI_Device_Adaptiveness_Tasks_STATUS.yaml` has no `status` or `status: TODO` for `C1`.
- **IN_PROGRESS**
  - Condition: `.task_locks/C1.lock` exists with `status: IN_PROGRESS` and a branch `task/C1/...` exists on remote.
  - Evidence: lock file JSON, branch present.
- **BLOCKED**
  - Condition: lock exists and metadata `status: BLOCKED` with `block_reason`.
  - Evidence: `.task_locks/C1.lock` shows `status: BLOCKED`.
- **REVIEW**
  - Condition: `pr_url` present in task metadata and PR is open.
  - Evidence: `pr_url` field set and PR is in "open" state.
- **DONE**
  - Condition: PR merged into `main` or target integration branch AND acceptance criteria validated (automated test reports or snapshots show `<nav>` present in server-rendered HTML or skeleton). Metadata `status: DONE`.
  - Evidence: `pr_url` shows merged; tests/Axe report attached; `UI_Device_Adaptiveness_Tasks_STATUS.yaml` `status: DONE`.

---

### Task C2 — Active navigation state must be exposed to assistive tech
**Files / locations:** `components/BottomNavMobile.tsx`, `TopNavDesktop`.

**Issue summary:** Active tab indicated visually but not exposed to assistive tech.

**Change required (what):** Navigation links need an explicit machine-readable current-state indicator.

**Acceptance criteria:**
- Assistive tech can detect which nav item is current (page-level).
- Active detection is correct for root & nested routes.

**Tests to add:** Unit tests and accessibility checks.

#### Machine-check Cases
- **TODO**
  - Condition: No task metadata claim and nav links have no current-state attribute in server or client HTML.
- **IN_PROGRESS**
  - Condition: Lock created & branch exists.
- **BLOCKED**
  - Condition: Lock exists with `status: BLOCKED`.
- **REVIEW**
  - Condition: PR open with changes; tests run.
- **DONE**
  - Condition: PR merged and both:
    - Server-rendered or client-rendered DOM contains an explicit current indicator on the correct nav item (screen-readable evidence).
    - Accessibility scan shows current-state rule satisfied.
  - Evidence: merged PR, test reports, automated accessibility output confirming the rule.

---

### Task C3 — Interactive components must expose ARIA semantics and keyboard patterns
**Files / locations:** `components/Accordion.tsx` and other interactive components.

**Issue summary:** Interactive components lack required ARIA semantics and keyboard navigation.

**Change required (what):** Add ARIA attributes and keyboard interaction semantics.

**Acceptance criteria:**
- Accessibility checks pass for ARIA/controls relationships and keyboard navigation is present for relevant components.

**Tests to add:** Accessibility (axe/pa11y) and keyboard interaction tests.

#### Machine-check Cases
- **TODO**: No claim & components fail ARIA checks.
- **IN_PROGRESS**: Lock exists and branch present.
- **BLOCKED**: Lock exists with `status: BLOCKED`.
- **REVIEW**: PR open with tests running.
- **DONE**:
  - Condition: PR merged AND automated accessibility testing reports no missing ARIA-controls/expanded/label violations for the components in scope; keyboard tests pass.
  - Evidence: merged PR + accessibility/keyboard test artifacts.

---

### Task C4 — Replace `100vh` usage that breaks mobile viewport and remove destructive overflow
**Files / locations:** `app/globals.css` ( `.shell`, `.app-body`, `.content` ).

**Issue summary:** `100vh` and `overflow: hidden` cause mobile layout and keyboard problems.

**Change required (what):** Use mobile-safe sizing and ensure content scrolls normally on mobile.

**Acceptance criteria:**
- Mobile browsers do not clip content; keyboard & address bar changes do not hide inputs.

**Tests to add:** Playwright or manual verifications.

#### Machine-check Cases
- **TODO**: No claim & CSS still uses blocking `100vh` and `overflow: hidden`.
- **IN_PROGRESS**: Lock exists + branch.
- **BLOCKED**: Lock exists with `status: BLOCKED`.
- **REVIEW**: PR open.
- **DONE**:
  - Condition: PR merged AND playbook/test evidence that mobile keyboard interactions and address-bar resizing do not clip content. CSS no longer uses `height: 100vh` on app shell in merged `main`.
  - Evidence: merged PR + test artifact (e.g., screenshot or automated test log).

---

## HIGH

### Task H1 — Add desktop navigation and hide mobile bottom nav on large screens
**Files / locations:** `components/TopNavDesktop` (new), `app/layout.tsx`, `components/BottomNavMobile.tsx`.

**Issue summary:** Lack of desktop top navigation.

**Change required (what):** Provide desktop top nav; hide mobile bottom nav on large screens.

**Acceptance criteria:** Desktop view shows top nav and no bottom nav.

**Tests to add:** Visual tests on wide viewport.

#### Machine-check Cases
- **TODO**: No claim & top nav absent in server HTML at desktop viewport.
- **IN_PROGRESS**: Lock+branch present.
- **BLOCKED**: Lock `BLOCKED`.
- **REVIEW**: PR open.
- **DONE**: PR merged and desktop HTML/CSS/visual tests show top nav present and bottom nav hidden at large viewport; evidence recorded.

---

### Task H2 — Safe area and viewport adaptation for modern mobile devices
**Files / locations:** `app/globals.css` (`.content`, bottom nav), `app/layout.tsx`.

**Issue summary:** No handling for safe-area / dynamic `dvh`.

**Change required (what):** Respect safe-area insets and dynamic viewport metrics.

**Acceptance criteria:** On iOS/modern mobile, bottom nav & content do not overlap with system UI.

**Tests to add:** Manual/automated device checks.

#### Machine-check Cases
- **TODO**: No claim & safe-area entries missing.
- **IN_PROGRESS**: Lock+branch present.
- **BLOCKED**: Lock `BLOCKED`.
- **REVIEW**: PR open.
- **DONE**: PR merged and evidence includes device screenshots or emulation logs showing safe-area respected.

---

### Task H3 — Pointer and hover capability awareness
**Files / locations:** `app/globals.css`, interactive components.

**Issue summary:** Hover/pointer behaviors applied without pointer detection.

**Change required (what):** Use pointer/hover detection to adapt UX/animations.

**Acceptance criteria:** Hover effects active on mouse devices; not applied on touch.

**Tests to add:** Emulated pointer tests.

#### Machine-check Cases
- **TODO**: No claim & hover rules global.
- **IN_PROGRESS**: Lock+branch exists.
- **BLOCKED**: Lock `BLOCKED`.
- **REVIEW**: PR open.
- **DONE**: PR merged and tests show pointer-aware CSS is in place; evidence: CSS contains `@media (hover: hover) and (pointer: fine)` rules and pointer-coarse behavior.

---

### Task H4 — Touch target enforcement and minimum sizes
**Files / locations:** `app/globals.css` and icon-only controls.

**Issue summary:** Controls may be too small for touch.

**Change required (what):** Ensure tappable controls meet minimum sizes.

**Acceptance criteria:** All interactive elements meet touch-size guidelines (`>=44px`).

**Tests to add:** Automated checks verifying bounding boxes.

#### Machine-check Cases
- **TODO**: No claim & some tappables < 44px.
- **IN_PROGRESS**: Lock + branch.
- **BLOCKED**: Lock `BLOCKED`.
- **REVIEW**: PR open.
- **DONE**: PR merged and automated bounding-box checks pass.

---

## MEDIUM

### Task M1 — Device-aware image delivery
**Files / locations:** image-rendering locations or `components/ResponsiveImage`.

**Issue summary:** Images not delivered responsively.

**Change required (what):** Serve responsive and DPR-appropriate images.

**Acceptance criteria:** Images appear crisp on high-DPR devices and not oversized on low-DPR.

**Tests to add:** Visual/dpr tests.

#### Machine-check Cases
- **TODO**: No claim.
- **IN_PROGRESS**: Lock+branch.
- **BLOCKED**: Lock `BLOCKED`.
- **REVIEW**: PR open.
- **DONE**: PR merged and visual tests for DPR pass.

---

### Task M2 — Centralize icons and reduce duplication
**Files / locations:** `components/BottomNavMobile.tsx`, other inline SVGs.

**Issue summary:** Icons duplicated inline.

**Change required (what):** Add centralized icon system and replace duplicates.

**Acceptance criteria:** No repeated inline SVGs; icon component used.

**Tests to add:** Snapshot tests.

#### Machine-check Cases
- **TODO**: No claim.
- **IN_PROGRESS**: Lock+branch.
- **BLOCKED**: Lock `BLOCKED`.
- **REVIEW**: PR open.
- **DONE**: PR merged and repo no longer contains duplicated inline SVG strings for common icons.

---

### Task M3 — Reduced-motion respect
**Files / locations:** `app/globals.css` and animated components.

**Issue summary:** Animations not disabled for reduced-motion users.

**Change required (what):** Honor `prefers-reduced-motion`.

**Acceptance criteria:** Animations suppressed under reduced-motion.

**Tests to add:** Visual/regression checks with reduced-motion preference.

#### Machine-check Cases
- **TODO**: No claim.
- **IN_PROGRESS**: Lock+branch.
- **BLOCKED**: Lock `BLOCKED`.
- **REVIEW**: PR open.
- **DONE**: PR merged and tests show animations suppressed when `prefers-reduced-motion` is enabled.

---

## LOW

### Task L1 — Cross-browser graceful degradation and feature detection
**Files / locations:** `app/globals.css`, documentation.

**Issue summary:** New CSS features used without fallback.

**Change required (what):** Add fallbacks, `@supports` guards, and a short compatibility doc.

**Acceptance criteria:** App usable in supported older browsers; doc added.

**Tests to add:** Cross-browser smoke tests.

#### Machine-check Cases
- **TODO**: No claim.
- **IN_PROGRESS**: Lock+branch.
- **BLOCKED**: Lock `BLOCKED`.
- **REVIEW**: PR open.
- **DONE**: PR merged and compatibility doc present.

---

### Task L2 — Add responsive and accessibility testing to CI
**Files / locations:** CI config & tests.

**Issue summary:** No automated responsive & accessibility tests in CI.

**Change required (what):** Add Playwright visual tests & accessibility checks.

**Acceptance criteria:** CI runs visual & accessibility tests; failures block merge.

**Tests to add:** Playwright + axe integration.

#### Machine-check Cases
- **TODO**: No claim.
- **IN_PROGRESS**: Lock+branch.
- **BLOCKED**: Lock `BLOCKED`.
- **REVIEW**: PR open.
- **DONE**: PR merged, CI configured and green for new tests.

---

## General: Evidence required for `DONE`
When marking `status: DONE` for any task, the following **evidence** must be present in task metadata and recorded in the lock file:
- `pr_url` referencing the merged PR.
- A short `evidence_summary` describing which acceptance criteria passed.
- Test artifacts or logs (unit tests, Playwright, visual snapshots, accessibility reports).
- For layout/visual tasks: at least one representative screenshot per target viewport showing expected behavior.
- For accessibility tasks: an accessibility report (axe or equivalent) showing no critical failures for relevant pages.

---

## Notes about automated checks
- The Machine-check Cases are **conditions** an AI or CI runner should evaluate. Each condition must be checked based on repository state (files, branches, PRs, lock files, test results).
- Agents must update the YAML metadata (or the MD) whenever they change `status`, `owner` or `branch`.
- Agents must **never** override another agent's `IN_PROGRESS` lock unless the lock is stale (no updates for 24 hours) and the previous owner is recorded in `.task_locks/<TASKID>.lock.history`.

---

## Change log
- This file augments the prior task list with: coordination rules, lock/claim protocol, machine-check cases per task, and required evidence for DONE.
- Keep this file under version control and update `UI_Device_Adaptiveness_Tasks_STATUS.yaml` when claiming or completing tasks.

---
