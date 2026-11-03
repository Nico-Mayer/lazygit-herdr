# Design

## Context

See proposal.md - Why. The repo already has what the task needs: conventional commits enforced by the hk `commit-msg` hook, `node` in `mise.toml`, and one existing tag (`v0.1.1`). There is no CI. `git-cliff` 2.14 with no config was tried on this repo:

- `--bumped-version` reads the commits since the last tag and returns the next tag (`v0.1.1` at HEAD today, because nothing is new).
- The default notes group commits by type ("Performance", "Documentation", ...). The group headers include emojis.
- With `--latest`, the `chore: release` commit appears in the notes. The output starts with a `## [version]` heading.

## Goals / Non-Goals

**Goals:**
- One command from a clean `main` to a published GitHub release.
- Nothing is written (commit, tag, push, release) until the user confirms or passes `--yes`.

**Non-Goals:**
- Writing README or RECIPE. That needs judgment; `AGENTS.md` puts it before the task.
- CI, release PRs, a `CHANGELOG.md`, a `cliff.toml`.
- Recovering from a half-finished run. The task stops at the first failure, and the user finishes the remaining steps by hand.

## Decisions

**Flow** (`set -euo pipefail`, stop at the first failure):

```
clean tree? --no--> stop
on main, in sync with origin? --no--> stop
gh auth status fails? --> stop
v = git cliff --bumped-version
v == latest tag? --yes--> stop "nothing to release"
notes = git cliff --unreleased --tag v --strip all, minus the heading line
print v + notes
--yes given? or answer y? --no--> stop
npm version v -m "chore: release v%s"
git push --follow-tags
gh release create v --title v --notes-file - --verify-tag   (notes on stdin)
```

- **git-cliff for version and notes.** It reads conventional commits, which hk already enforces. Alternatives: `svu` only picks the version; GitHub `--generate-notes` lists merged PRs, and this repo commits straight to `main`, so it lists almost nothing.
- **Default git-cliff config, no `cliff.toml`.** The default groups are good enough. Two problems from the trial are handled by the flow, not by config: notes are made before the release commit exists, so it cannot show up, and the first line (the `## [vX]` heading) is dropped because the release title already has the version.
- **`npm version` for the bump.** It updates `package.json`, commits and creates the annotated tag in one step, and refuses to run on a dirty tree. The hk hooks still run on that commit. The alternative (edit the JSON, `git commit`, `git tag`) is three steps that do the same thing.
- **mise task in `mise.toml`, run by bash.** `shell = "bash -c"`, because mise on Windows does not use bash by default, and this project's shell code is POSIX. mise picks Git Bash and skips the WSL launcher. `--yes` is a `usage` flag (`usage_yes`), so an agent can run the task without a prompt.
- **Notes go to `gh` on stdin** (`--notes-file -`), not as an argument. Bytes on a pipe stay UTF-8. An argument passed from Git Bash to `gh.exe` might not keep the emoji group headers intact.
- **Pinned tools.** Add `git-cliff = "2.14.2"` and `gh = "2.103.3"` (the versions installed today) to `[tools]`. A new git-cliff version could change the default notes format or the bump rules, so the version is fixed. `node` is already listed, and it gives `npm`.

## Risks / Trade-offs

- [mise is broken in this shell: the shims point to a missing `WinGet/Links/mise.exe`] -> The user must check that `mise run` works in their own terminal before applying.
- [git-cliff picks a minor bump for `feat` and a major bump for a breaking change, even before 1.0] -> The version is printed before the prompt. Answer `n` and tag by hand if it is wrong.
- [The push succeeds but `gh release create` fails (for example, not logged in)] -> The tag is already on GitHub. Run the printed `gh release create` command again. The `gh auth status` check before the bump catches the common case.
- [Docs forgotten anyway] -> The prompt text asks "README and RECIPE updated?". With `--yes`, the caller (an agent) follows the `AGENTS.md` order.
