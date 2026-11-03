# Tasks

## 1. Spikes

- [x] 1.1 Build a throwaway mod with `place:"none"` and a 1x1 `frame:"none"` window overlay, bound to `mod.open:<spike>` in `global` and `terminal`. Verify the runner copy runs, closes itself, and the key works from a terminal pane.
- [x] 1.2 Test focus for an overlay terminal: `pane.focus` (fails, "no such pane"), `agent.focus` (unreliable), `terminal.peek` and `kind:"dialog"` (both take focus). Record the result in design.md.
- [x] 1.3 From the spike, run `exec("where.exe", ["lazygit"])` and `hc run` with the result. Verify the lookup works once the executable is on herdr's PATH, and record the shim start cost in design.md.
- [x] 1.4 Log `focused().cwd`, `git rev-parse --show-toplevel` and `machines()` for the same folder. Record the path forms in design.md.
- [x] 1.5 Test remote: `exec(..., {on})` for `command -v lazygit` and `git rev-parse`, `hc run --on`, `hc ls --label`/`hc get`/`hc kill` on `machine/tN`, and an overlay showing a remote terminal. Record the results in design.md.

## 2. Scaffold

- [x] 2.1 Add `package.json` (`type: module`, scripts `test: node --test tests/*.test.mjs`, `check: herdr-app check mods/lazygit`), `mods/lazygit/mod.json` (`place:"none"`, 1x1 window overlay), an empty default-exported `View` in `mods/lazygit/main.js`, and `mise.toml` entries for node and lazygit. Verify `npm run check` reports no errors.
- [x] 2.2 Add root `keys.json` binding `ctrl-shift-g` to `mod.open:lazygit` in `global` and `terminal`. Verify that after merging it into `~/.config/herdr-app/keys.json`, the key opens the runner copy, also while the lazygit dialog has focus.

## 3. Pure logic (`mods/lazygit/model.js`)

- [x] 3.1 Implement repo root normalization (slashes, trailing slash, full lowercase on Windows). Verify with `tests/model.test.mjs` cases for Windows, mixed case, and POSIX paths.
- [x] 3.2 Implement instance lookup by `lazygit.repo` and `lazygit.space` labels over `hc ls` output (live only). Verify with tests: match, other repo, other space, dead terminal.
- [x] 3.3 Implement the cleanup decision with kills and `hiddenAt` updates. Verify with tests: closed space, 30-min idle, shown and kept instances not killed, re-hide resets the timer, missing `hiddenAt` set to now, stale entries pruned, empty `spaces` means no space kills.
- [x] 3.4 Implement the toggle decision. Replaced by the sentinel-tracked dialog record (see design "Toggle decision"), so there is no pure function to test. Verified live: hide, show, and reopen after `q`.
- [x] 3.5 Make cleanup machine-aware and skip adopted terminals: take the set of ready machines instead of one flag, derive a candidate's machine from its address prefix, keep `hiddenAt` for candidates on machines that are not ready, and skip terminals with a `herdr.space` label. Verify with tests: offline machine keeps its instances and times, local loading keeps local ones, adopted terminal is never killed.
- [x] 3.6 Implement settings parsing and executable choice `(settingsText, machine) -> {path | null}` with errors for invalid JSON or wrong types. Verify with tests: no file, local `path`, per-machine entry, missing machine entry falls back to PATH, invalid JSON, non-string values.
- [x] 3.7 Limit Windows lowercasing to this computer: the normalization takes "local Windows" as input, so remote roots keep their case. Verify with tests for a remote POSIX root on a Windows host.

## 4. Runner and dialog (`mods/lazygit/main.js`)

- [x] 4.1 Implement the runner copy: `globalThis` state, lease with 15 s expiry, `closeOverlay(props().overlay)` in `finally`, errors shown via `notify`. Verify manually: a double press leaves at most one instance, and the runner copy always closes (`herdr-app status` shows no leftover `lazygit` overlay).
- [x] 4.2 Implement the preconditions in design order with `on: space.machine`, the settings file, and each `exec` in try/catch. Verify manually: unknown folder, lazygit missing (bad path in `lazygit.json`), invalid `lazygit.json`, non-repo folder. Each shows one notification and opens no dialog.
- [x] 4.3 Implement start-or-reuse with `hc run` (`--on`, labels, `--rm`, chosen executable) and the dialog with the sentinel block. Verify manually: lazygit opens at the repo root from a subfolder pane, local and on a remote machine, typed keys reach it without a click, Esc reaches lazygit, and `q` closes the dialog and removes the terminal (`hc ls`).
- [x] 4.4 Implement hide: shortcut closes the overlay, the sentinel `close()` clears state and records `hiddenAt`, focus returns to `previousPane`. Verify manually: state is kept across hide/show, a click outside hides and one press shows again, a second repo gets its own instance, and the same repo in another space gets its own instance.

## 5. Cleanup

- [x] 5.1 Wire the cleanup decision into the runner on every press (hide, open, and failed preconditions), with kills via `hc kill`. Verify manually: after closing a space, the next press ends its lazygits. With the timeout set to 1 minute for the test, a hidden instance ends on the next press. A terminal with a `lazygit.space` label but no `herdr.mod=lazygit` label survives.
- [x] 5.2 Verify the restart case: close herdr-app with a hidden lazygit, start it, and press the shortcut at once. Nothing is killed while machines are loading, and the instance gets a fresh `hiddenAt`.

## 6. Docs and release

- [x] 6.1 Write `README.md`: what it does, requirements, install (copy `mods/lazygit/`, merge `keys.json`), rebinding, `lazygit.json` with examples, remote spaces, behavior notes (Esc goes to lazygit, click outside hides, cleanup on press, 30-minute idle rule, shim start cost). Verify a fresh install following only the README works.
- [x] 6.2 Fill `AGENTS.md` with pointers to `herdr-app --skill`, `hc --skill`, `~/.config/herdr-app/AGENTS.md`, `herdr.d.ts`, `npm test` and `npm run check`. Verify the paths exist.
- [x] 6.3 Run all spec scenarios once end to end on Windows with one remote machine. Verify each passes and note results in the change.
- [x] 6.4 Remove the spike: delete `spike/`, the `lazygit-spike` junction in `~/.config/herdr-app/mods`, and its labeled terminals. Verify `hc ls --label herdr.mod=lazygit-spike` is empty.

## End-to-end results (Windows 11, herdr-app 0.1.12, remote macOS `macbook`)

- Passed live: open from a subfolder, typing without a click, Esc to lazygit, shortcut from the dialog, hide and focus return, click outside then one press, show again with the same instance, `q` removes the terminal, reopen after `q`, double press leaves one instance, not a git repo, invalid `lazygit.json`, bad configured path, configured path used, remote open on `macbook`, cleanup of an instance in a closed space, foreign terminal survives, idle cleanup (limit lowered for the test), restart check.
- Covered by unit tests only: same repo in two spaces, machine not ready, terminal adopted into a tab.
- Not tested: machine unreachable notification.
