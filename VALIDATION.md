# Validation

Read this document before validating, committing, pushing, or publishing a repository change. Run the checks that match the changed files and behavior. Record every check that ran. If a required check cannot run, state why.

## Every change

- Run `git diff --check`.
- Review `git status` and the complete diff.
- Confirm that only files required by the issue or task changed.
- Check that examples describe behavior that exists.
- Do not claim that an unexecuted check passed.

Before pushing, run the full project pipeline:

```sh
mise run validate
```

This cleans generated output, builds packages and generated presets, checks formatting and lint, runs tests and the dependency audit, and builds the documentation site.

## Focused project checks

Run focused checks while developing, then run the full pipeline before pushing.

| Changed area                   | Applicable checks                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| JavaScript or TypeScript       | `mise run build`, `mise run lint:check`, relevant package tests                     |
| Package source                 | `mise run duplicate-check`                                                          |
| Documentation                  | `mise run format:check`, `mise run docs`                                            |
| Dependencies                   | `mise run audit` and affected builds/tests                                          |
| `.github/actions/release/src/` | `pnpm run build:release-action`, `mise run test`; verify the tracked `dist/` bundle |
| TSConfig generator             | `mise run build`; verify generated presets                                          |

Do not run broad automatic fixes without approval. Inspect every automatic edit before keeping it.

## Skill changes

When a change adds or modifies a skill:

- Verify that every `SKILL.md` has valid `name` and `description` frontmatter.
- Verify that each skill directory name matches its declared `name`.
- Verify that Pi and OpenCode can discover the changed skill from `.agents/skills/`.
- Check relative references, supporting files, and command examples.
- Confirm that harness-specific behavior is explicit and does not masquerade as portable Agent Skills behavior.

## Coding-family changes

When a change adds or modifies `coding` or a `coding-*` skill:

- Confirm that all coding skills are sibling directories directly under `.agents/skills/`.
- Confirm that language skills require `coding` and extension skills require both `coding` and their language skill.
- Confirm that dependencies resolve through advertised skill names and paths without a harness-specific Skill tool.
- Test generic-to-language-to-extension load order, missing-dependency stops, and dependency-cycle rejection when those relationships exist.
- Confirm that wrappers contain only extension-specific differences and do not duplicate generic or language instructions.
- Confirm that project configuration takes precedence over fallback tools.
- Confirm that no skill installs, replaces, or reconfigures tools without human approval.
- Confirm that every language uses jscpd as the fallback duplicate detector while honoring project-configured alternatives.
- Confirm that numeric thresholds come only from project configuration.
- Check source links and maintenance-status notes for external guidance.
- Verify flat discovery in Pi and OpenCode.

## Workspace-skill changes

When a change adds or modifies `isolated-workspace` or `cleanup-workspaces`:

- Run their Bun test suites in disposable repositories.
- Exercise the Git and Jujutsu procedures when those tools are available.
- Test relevant safety stops, not only successful paths.
- Confirm that `AGENTS.md` provides the required project workspace configuration.
- Confirm that callers must select `git` or `jj` explicitly and colocated repositories do not trigger VCS inference.
- Confirm that automation detects the primary local repository and derives the sibling `<repository>--workspaces` directory without hosted-repository identity.
- Confirm that planning is non-destructive, mutation requires `--apply --confirm --plan-id <approved-id>`, and cleanup rechecks state immediately before removal.
- Confirm that active, primary, dirty, locked, conflicted, and unmerged workspaces remain protected.
- Confirm that workspace commands remain in the skills and are not duplicated in project policy files.

## Instruction-adaptation changes

When an instruction adaptation uses the `instruction-maintenance` workflow:

- Confirm that recorded human approval follows the exact proposal.
- Confirm that changed files and rules stay within the approved scope.
- Confirm that changed evidence, scope, or protected rules caused a new proposal and approval.
- Distinguish required dependencies from later-phase handoffs and informational references.
- Check for missing targets, stale names or paths, conflicts, duplication, ambiguity, and dependency cycles.
- Confirm that skill routing metadata states what each affected skill does and when it applies.
- Confirm that security boundaries, mandatory gates, validation requirements, and owner authority are unchanged unless separately proposed and explicitly approved.
- Confirm that detailed imported skill behavior remains unchanged.

## Markdown and instruction changes

When Markdown changes:

- Review heading order and section structure.
- Check local and external links.
- Review code fences, commands, paths, and examples manually.
- Use sentence-case headings and clear, concrete language.

When an instruction file changes:

- Confirm that `AGENTS.md` contains only startup routing, project configuration, always-on security, and owner authority.
- Confirm that every deferred document or mandatory skill has a clear trigger in `AGENTS.md`.
- Confirm that read-only analysis does not require deferred contributor instructions unless it needs repository identity.
- Confirm that planning or performing a repository change requires `CONTRIBUTING.md`.
- Confirm that mutation requires `isolated-workspace`.
- Confirm that validation, commits, pushes, or publication require `VALIDATION.md`.
- Confirm that workspace cleanup requires `cleanup-workspaces`.
- Confirm that instruction drift requires `instruction-maintenance` before an adaptation proposal.
- Confirm that instruction mutation requires explicit human approval of the exact proposal.
- Confirm that missing required instructions stop the gated phase.
- Check for conflicting or duplicated policy across instruction files.

## Publication report

Before pushing or opening a pull request, summarize:

- changed files
- checks that passed
- checks that failed
- checks that did not run and why
- remaining risks or follow-up work
