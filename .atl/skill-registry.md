# Skill Registry — designli-challenge

> Generated: 2026-05-28 by sdd-init
> Mode: hybrid

## User Skills

### branch-pr

- **Trigger**: creating, opening, or preparing PRs for review.
- **Path**: `~/.config/opencode/skills/branch-pr/SKILL.md`
- **Compact Rules**:
  - Every PR MUST link an approved issue with `status:approved` label
  - Every PR MUST have exactly one `type:*` label
  - Branch format: `type/description` (types: feat/fix/chore/docs/style/refactor/perf/test/build/ci/revert)
  - Conventional commits: `type(scope): description` with types matching PR labels
  - PR body MUST include: linked issue, PR type, summary, changes table, test plan, contributor checklist
  - Run shellcheck on modified scripts before pushing
  - Automated checks must pass before merge
  - No blank PRs without issue linkage

### chained-pr

- **Trigger**: PRs over 400 lines, stacked PRs, review slices.
- **Path**: `~/.config/opencode/skills/chained-pr/SKILL.md`
- **Compact Rules**:
  - Split PRs over 400 changed lines unless maintainer accepts `size:exception`
  - Keep each PR reviewable in ≤60 minutes
  - One deliverable work unit per PR; tests/docs with the unit
  - State start/end/dependencies/follow-up/out-of-scope in every chained PR
  - Every child PR includes a dependency diagram marking current PR with 📍
  - Feature Branch Chain: draft/no-merge tracker PR; children target parent branch
  - No mixing chain strategies after user chooses one
  - Polluted diffs: retarget or rebase until only current work unit appears

### cognitive-doc-design

- **Trigger**: writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs.
- **Path**: `~/.config/opencode/skills/cognitive-doc-design/SKILL.md`
- **Compact Rules**:
  - Lead with the answer: decision/action/outcome first, context after
  - Progressive disclosure: happy path first, then details, edge cases, references
  - Chunking: group related info into small sections
  - Signposting: headings, labels, callouts, summaries
  - Recognition over recall: tables, checklists, examples, templates
  - Review empathy: docs so reviewers verify intent without reconstructing full story
  - Default doc structure: outcome title → quick path → details table → checklist → next step

### comment-writer

- **Trigger**: PR feedback, issue replies, reviews, Slack messages, or GitHub comments.
- **Path**: `~/.config/opencode/skills/comment-writer/SKILL.md`
- **Compact Rules**:
  - Be useful fast: start with actionable point, not recap
  - Be warm and direct: thoughtful teammate, not corporate bot
  - Keep it short: 1-3 paragraphs or tight bullet list
  - Explain why: give technical reason when asking for a change
  - Avoid pile-ons: comment on highest-value issue, not every preference
  - Match thread language (Rioplatense Spanish voseo when applicable)
  - No em dashes; use commas, periods, or parentheses instead

### go-testing

- **Trigger**: Go tests, go test coverage, Bubbletea teatest, golden files.
- **Path**: `~/.config/opencode/skills/go-testing/SKILL.md`
- **Compact Rules**:
  - Prefer table-driven tests for multiple cases; use `t.Run(tt.name, ...)`
  - Test behavior and state transitions, not implementation trivia
  - Use `t.TempDir()` for filesystem tests; never real home directory
  - Integration tests skippable with `testing.Short()` when they run external commands
  - Golden files must be deterministic; update only through repo's `-update` path
  - Use small mocks/interfaces around system or command execution boundaries

### issue-creation

- **Trigger**: creating GitHub issues, bug reports, or feature requests.
- **Path**: `~/.config/opencode/skills/issue-creation/SKILL.md`
- **Compact Rules**:
  - Blank issues disabled — MUST use template (bug report or feature request)
  - Every issue gets `status:needs-review` automatically on creation
  - Maintainer MUST add `status:approved` before any PR can be opened
  - Questions go to Discussions, not issues
  - Bug Report: pre-flight checks, description, steps, expected vs actual, OS, agent, shell
  - Feature Request: pre-flight checks, problem, proposed solution, affected area
  - Labels: bug, enhancement, status:needs-review, status:approved, priority:high/medium/low

### judgment-day

- **Trigger**: judgment day, dual review, adversarial review, juzgar.
- **Path**: `~/.config/opencode/skills/judgment-day/SKILL.md`
- **Compact Rules**:
  - Dual blind review: launch two judges in parallel; never review code yourself
  - Wait for both judges before synthesis; never accept partial verdict
  - Classify warnings: WARNING (real) only if normal intended use triggers them; otherwise INFO
  - Ask before fixing Round 1 confirmed issues
  - After fix agent runs, re-launch both judges before commit/push/done
  - Terminal states: JUDGMENT: APPROVED or JUDGMENT: ESCALATED
  - After 2 fix iterations with remaining issues, ask user whether to continue

### skill-creator

- **Trigger**: new skills, agent instructions, documenting AI usage patterns.
- **Path**: `~/.config/opencode/skills/skill-creator/SKILL.md`
- **Compact Rules**:
  - Skill is LLM runtime instruction contract, not human documentation
  - References MUST point to local files
  - Target 180-450 tokens body; hard max 1000
  - Required sections: Activation Contract, Hard Rules, Decision Gates, Execution Steps, Output Contract, References
  - Description: one physical line, YAML-safe, ≤250 chars, trigger-first
  - No Keywords section; preserve essential triggers in description
  - Supporting material in assets/ or references/, not main skill body

### work-unit-commits

- **Trigger**: implementation, commit splitting, chained PRs, keeping tests and docs with code.
- **Path**: `~/.config/opencode/skills/work-unit-commits/SKILL.md`
- **Compact Rules**:
  - Commit by work unit: one deliverable behavior, fix, migration, or docs unit per commit
  - Do not commit by file type (models then services then tests)
  - Keep tests with code they verify; keep docs with user-visible change
  - Tell a story: reviewer understands why each commit exists from diff and message
  - SDD workload guard: if >400-line forecast, group commits into chained PRs before implementation
  - Pre-commit checklist: one clear purpose, repo makes sense after commit, rollback reasonable, message explains outcome

## Project Conventions

- **AGENTS.md** (user-level): `~/.config/opencode/AGENTS.md`
  - Conventional commits only; no Co-Authored-By or AI attribution
  - Senior Architect persona: SOLID, Clean Architecture, testing, atomic design
  - Spanish: Rioplatense voseo; short responses; verify before agreeing
  - Contextual Skill Loading: check `<available_skills>` before each response
  - Engram Persistent Memory protocol

## Notes

- No project-level skills detected (repo is greenfield)
- No project-level convention files detected
- User-level skills fully resolved and registered above
