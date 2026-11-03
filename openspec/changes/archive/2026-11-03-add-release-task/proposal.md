# Proposal

## Why

The v0.1.1 release took about ten manual steps: bump, commit, tag, push, write notes by hand, then two doc updates that each moved the tag again. A single command removes the typing, and a prompt before publishing stops docs from landing after the tag.

## What Changes

- New `mise run release` task: picks the next version from conventional commits, bumps `package.json`, commits, tags, pushes, and creates the GitHub release with generated notes.
- The task stops when the working tree is dirty or there is nothing to release, and asks for confirmation (skippable with `--yes`) before it writes anything.
- Pin `git-cliff` and `gh` in the project `mise.toml`, so the task does not depend on global installs.
- New "Release" section in `AGENTS.md`: update README and RECIPE first, then run the task.

## Capabilities

### New Capabilities

None. This is developer tooling; the mod's behavior does not change, so `skip_specs: true` is set.

### Modified Capabilities

None.

## Impact

- `mise.toml`: two pinned tools, one task.
- `AGENTS.md`: one short section.
- No change to `mods/lazygit/`. No `CHANGELOG.md`; GitHub release notes are the only changelog.
- Releases still go straight to `main`, as today.
