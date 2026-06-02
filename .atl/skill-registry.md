# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| creating, opening, or preparing PRs for review. | branch-pr | `C:\Users\Mauricio_Alcalde\.config\opencode\skills\branch-pr\SKILL.md` |
| PRs over 400 lines, stacked PRs, review slices. | chained-pr | `C:\Users\Mauricio_Alcalde\.config\opencode\skills\chained-pr\SKILL.md` |
| writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs. | cognitive-doc-design | `C:\Users\Mauricio_Alcalde\.config\opencode\skills\cognitive-doc-design\SKILL.md` |
| PR feedback, issue replies, reviews, Slack messages, or GitHub comments. | comment-writer | `C:\Users\Mauricio_Alcalde\.config\opencode\skills\comment-writer\SKILL.md` |
| Go tests, go test coverage, Bubbletea teatest, golden files. | go-testing | `C:\Users\Mauricio_Alcalde\.config\opencode\skills\go-testing\SKILL.md` |
| creating GitHub issues, bug reports, or feature requests. | issue-creation | `C:\Users\Mauricio_Alcalde\.config\opencode\skills\issue-creation\SKILL.md` |
| judgment day, dual review, adversarial review, juzgar. | judgment-day | `C:\Users\Mauricio_Alcalde\.config\opencode\skills\judgment-day\SKILL.md` |
| new skills, agent instructions, documenting AI usage patterns. | skill-creator | `C:\Users\Mauricio_Alcalde\.config\opencode\skills\skill-creator\SKILL.md` |
| implementation, commit splitting, chained PRs, or keeping tests and docs with code. | work-unit-commits | `C:\Users\Mauricio_Alcalde\.config\opencode\skills\work-unit-commits\SKILL.md` |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR MUST link an approved issue, no exceptions.
- Every PR MUST have exactly one `type:*` label.
- Branches MUST use `type/description` with lowercase `a-z0-9._-` only.
- Commits MUST follow conventional commit format.
- PR body MUST include linked issue, PR type, summary, file changes, and test plan.
- Run shellcheck on changed scripts before pushing.
- Do not open blank PRs without issue linkage.
- Merge only after automated checks pass.

### chained-pr
- Split PRs above 400 changed lines unless maintainer grants `size:exception`.
- Keep each PR reviewable in about 60 minutes or less.
- Use one deliverable work unit per PR, keep tests and docs with it.
- Each chained PR MUST state dependencies, follow-up work, and out-of-scope items.
- Child PRs MUST include a dependency diagram and mark the current PR with `📍`.
- In feature-branch chains, start with a draft tracker PR and target parent branches correctly.
- Treat polluted diffs as base bugs, retarget or rebase until clean.
- Do not mix chain strategies after one is chosen.

### cognitive-doc-design
- Lead with the answer, decision, action, or outcome first.
- Use progressive disclosure: happy path first, details second.
- Chunk related content into small sections.
- Add signposts with headings, labels, summaries, and callouts.
- Prefer tables, checklists, and templates over recall-heavy prose.
- Write review-facing docs so intent is easy to verify.
- Default flow: outcome title, quick path, details table, checklist, next step.

### comment-writer
- Start with the actionable point, not a long recap.
- Keep tone warm, direct, and human.
- Keep comments short, usually 1-3 short paragraphs or tight bullets.
- Explain the technical why when requesting change.
- Focus on the highest-value issue, avoid pile-ons.
- Match the thread language, use Rioplatense voseo in Spanish.
- Do not use em dashes.

### go-testing
- Prefer table-driven tests for multiple scenarios.
- Test behavior and state transitions, not implementation trivia.
- Use `t.TempDir()` for filesystem tests.
- Skip slow or external integration tests in `testing.Short()`.
- For Bubbletea, test `Model.Update()` directly before using `teatest`.
- Golden files MUST be deterministic and updated only through the repo update path.
- Use small mocks around command and system boundaries.

### issue-creation
- Blank issues are disabled, always use the proper template.
- New issues get `status:needs-review`; PRs wait for `status:approved`.
- Questions belong in Discussions, not Issues.
- Search for duplicates before creating a new issue.
- Bug reports MUST include reproduction, expected vs actual, environment, and logs when available.
- Feature requests MUST describe the problem, proposed solution, and affected area.
- Respect the repo label system for status and priority.

### judgment-day
- Resolve project standards from registry before launching judges.
- Run two blind judges in parallel, never self-review.
- Wait for both judges before synthesis.
- Mark warnings as real only when normal intended use can trigger them.
- Ask before applying Round 1 fixes.
- Re-judge in parallel after any fix round.
- End only with `JUDGMENT: APPROVED` or `JUDGMENT: ESCALATED`.
- After two fix rounds with remaining issues, ask the user whether to continue.

### skill-creator
- Treat skills as LLM runtime contracts, not human docs.
- Follow repo skill style guide first when it exists.
- Keep the main skill concise, move detail to local references or assets.
- Frontmatter MUST include `name`, `description`, `license`, and metadata.
- `description` MUST be one line, YAML-safe, trigger-first, and at most 250 chars.
- Required sections: Activation Contract, Hard Rules, Decision Gates, Execution Steps, Output Contract, References.
- Do not add a Keywords section.

### work-unit-commits
- Commit by deliverable work unit, not by file type.
- Keep tests with the code they verify.
- Keep docs with the user-visible behavior they explain.
- Each commit should tell a reviewer why it exists.
- Each commit should be rollback-friendly on its own.
- If work may exceed 400 lines, plan chained PR slices before implementation.
- Check purpose, repo coherence, verification, rollback, and commit message before committing.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| — | — | No project-level convention files detected (`AGENTS.md`, `agents.md`, `CLAUDE.md`, `.cursorrules`, `GEMINI.md`, `copilot-instructions.md`). |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted, no need to read index files to discover more.
