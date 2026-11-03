# Tasks

## 1. Tools

- [x] 1.1 Add `git-cliff = "2.14.2"` and `gh = "2.103.3"` to `[tools]` in `mise.toml`, and verify that `mise install` succeeds and `mise exec -- git-cliff --version` prints 2.14.2

## 2. Release task

- [x] 2.1 Add `[tasks.release]` to `mise.toml` with `shell = "bash -c"`, a `usage` flag `-y --yes`, and the flow from design.md. Verify that `mise run release --help` shows the flag
- [x] 2.2 Verify the stop paths without publishing: with an uncommitted change it stops on "dirty tree"; on a clean HEAD at `v0.1.1` it stops with "nothing to release"; after a local test commit, answering `n` stops with no new commit, tag or push (`git status`, `git tag -l`). Drop the test commit afterwards
- [x] 2.3 Verify the printed notes for the test commit from 2.2: grouped by type, no `## [v…]` heading line, no `chore: release` line

## 3. Agent guide

- [x] 3.1 Add a short "Release" section to `AGENTS.md` (update README and RECIPE first, then `mise run release`, `--yes` for agents), and add `mise run release` to its Commands list. Verify that both files are committed and that `npm run check` and `npm test` still pass

## Workflow follow-up

- The first real use of `mise run release` (next version) is the end-to-end check: the tag and the GitHub release match, and the notes look right.
- Archive the change after the review the project requires (`/subagent-review` after apply).
