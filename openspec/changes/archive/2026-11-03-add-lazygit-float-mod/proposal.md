# Proposal

## Why

Opening lazygit in herdr-app now means splitting a pane or opening a tab and typing `cd` plus `lazygit`. A herdr mod can open lazygit in a floating dialog on a keyboard shortcut, in the folder of the active pane, on this computer or on a remote machine. It can then hide and show it without losing state.

## What Changes

- New herdr-app mod `lazygit` in `mods/lazygit/` (`main.js`, `model.js`, `mod.json`) and a `keys.json` that users merge into their herdr keybindings.
- One shortcut (default `ctrl-shift-g`, set in `keys.json`) toggles a floating lazygit dialog that takes keyboard focus. A click outside the dialog also hides it.
- lazygit starts in the git repo root of the active pane's folder, on the machine of the active space (local or remote).
- An optional `~/.config/herdr-app/lazygit.json` sets the lazygit executable, globally and per machine. Without it, lazygit is found on that machine's PATH.
- When the folder is unknown, lazygit cannot be found, or the folder is not in a git repo, the mod shows a notification and opens nothing.
- One lazygit per repo per space. Hiding keeps lazygit running. Pressing the shortcut again shows the same instance.
- Cleanup: lazygit ends when the user quits it. On each shortcut press, the mod also ends instances whose space is closed and instances hidden for 30 minutes or more.
- Dialog size is fixed.

## Capabilities

### New Capabilities

- `lazygit-float`: opening, toggling, configuring, and cleaning up floating lazygit dialogs from herdr-app, tied to the repo, space and machine of the active pane.

### Modified Capabilities

None.

## Impact

- New files only: `mods/lazygit/`, `keys.json`, `package.json`, tests, README with install steps.
- Runtime dependencies: herdr-app (tested with 0.1.12), herdr-core `hc`, `git` and `lazygit` on each machine that is used.
- Uses herdr mod APIs: `focused`, `spaces`, `machines`, `exec` (with `on`), `hc`, `run`, `openOverlay`, `closeOverlay`, `notify`, `shared`, `readTextFile`, `appHome`, and the View `close()` hook.
- Platforms: Windows is the main local target. macOS and Linux remote machines tested. Local Linux and macOS should work but are untested.
- Out of scope: other settings, a cap on instance count, background cleanup between presses, remote Windows machines.
