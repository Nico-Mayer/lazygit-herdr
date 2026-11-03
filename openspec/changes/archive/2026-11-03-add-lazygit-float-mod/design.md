# Design

## Context

See proposal.md for motivation and specs/lazygit-float/spec.md for behavior.

herdr-app (0.1.12) mods are JavaScript in `~/.config/herdr-app/mods/<name>/`, drawn with gpui-kit. The API is in `~/.config/herdr-app/herdr.d.ts`, `gpui-kit.d.ts` and `AGENTS.md`. herdr-core (`hc`) owns terminals, so they outlive overlays and herdr-app restarts.

Constraints found in docs and spikes:
- A mod copy only runs while it is shown, and `<mod>.<command>` reaches shown copies only (`AGENTS.md:755-767`).
- `kind:"window"` overlays don't take the keyboard. `pane.focus {terminal}` fails with "no such pane" for terminals inside overlays. `agent.focus` was unreliable. `kind:"dialog"` overlays take focus, pass Esc to their terminal, and close on a click outside while the terminal keeps running.
- `focused()` and `herdr-app status` don't report focus inside overlays, so focus can only be checked by hand.
- The local `hc` reaches remote machines: `hc run --on <machine>` returns `machine/tN`. `hc ls --label`, `hc get` and `hc kill` work on those addresses. An overlay terminal block can show a remote address.
- A View's `async close(cx)` is called when its overlay goes and on app quit, with a 250 ms budget (`AGENTS.md:848`).

## Goals / Non-Goals

**Goals:**
- All checks run before any visible overlay opens.
- herdr-core labels are the source of truth for which instances exist.

**Non-Goals:**
- Background cleanup between presses. No mod copy lives long enough to run a timer.
- Remote Windows machines. Remote lookups use `sh`.

## Decisions

### Trigger: `mod.open` with a self-closing runner copy
`keys.json` binds the shortcut to `mod.open:lazygit` in `global` and `terminal`. `mod.json` is `place:"none"` with `overlay:{kind:"window", frame:"none", width:1, height:1}`. The opened copy renders nothing, runs one toggle, then calls `closeOverlay(props().overlay)`.
Alternative: a named command (`lazygit.open`) to a background copy. Rejected: no copy is shown to receive it.

### Container: dialog with a sentinel block
`openOverlay({kind:"dialog", width:0.9, height:0.9, layout:{type:"column", children:[{type:"block", size:{px:0}, content:{mod:"lazygit", props:{role:"sentinel", terminal}}}, {type:"block", content:{terminal}}]}})`.
- A dialog takes focus and fits herdr's look. There is no title bar and it cannot be dragged.
- The sentinel copy's `close()` runs however the dialog goes (shortcut, click outside, layout switch). It clears the shown-dialog state and records `hiddenAt`, so the next press sees the truth.
Alternatives: `kind:"window"` (no focus), `terminal.peek` (gets focus, but gives no overlay id for the toggle and has a keep-as-tab button we don't want).

### Process-wide state and lease
State that must outlive copies lives on `globalThis.__lazygitFloat`: the shown dialog `{overlay, terminal, previousPane}` and a lease `{owner, at}`. Each runner takes the lease (wait while another live owner holds it, expire after 15 s) and releases it in `finally`. A fast double press then runs two toggles one after another, and the second sees the first one's instance.
Durable data (`hiddenAt` per terminal address) lives in `shared("lazygit.v1")`.

### Toggle decision
1. If a dialog is recorded: close it, record `hiddenAt = now`, focus `previousPane`, then run cleanup. The sentinel clears the record whenever the dialog goes, so no live check is needed first. This keeps hide at a few ms.
2. Otherwise list instances and locate the target in parallel, run cleanup, then show the existing instance or start a new one.

### Settings file
`readTextFile(appHome() + "/lazygit.json")` on each press. Missing -> `{}`. Invalid JSON -> error. Shape: `{ "path"?: string, "machines"?: { [name]: string } }`. The executable for a press is `machines[space.machine]` for remote spaces, else `path` for local ones, else a PATH lookup.

### Preconditions (open path)
`on = space.machine` (null for this computer) for every `exec`.
1. `focused().cwd` is missing -> warning "folder unknown".
2. In parallel: read `lazygit.json`, and run `exec("git", ["-C", cwd, "rev-parse", "--show-toplevel"], {on})`. Non-zero -> warning "<cwd> is not a git repo".
3. Only when no instance exists for the repo and space, choose the executable: the configured one, else on Windows locally `exec("where.exe", ["lazygit"])`, elsewhere `exec("sh", ["-c", "command -v lazygit"], {on})`. Nothing found -> error "lazygit not installed on <machine>" that mentions `lazygit.json`. The first line is kept as the executable. Skipping this when reusing an instance saves the `where.exe` call (about 50 ms) on every show.
`exec` rejects when a program cannot start or the machine is unreachable. Each call is wrapped: a rejection on a remote machine names the command and the machine (missing program or offline machine look the same), and a local one reports the program as missing. The runner also releases its lease in `close()`, because a second `mod.open` can close a busy runner before its `finally` runs.
A configured path is not checked in advance. If `hc run` fails to start it, the error names the path and `lazygit.json`.

### Instance identity via labels
Lookup: `hc ls --json --label herdr.mod=lazygit` (fresh from core, includes remote `machine/tN`), then `hc get` for each to read its labels. Filter on `lazygit.repo=<root>` and `lazygit.space=<app space id>`, live only.
Start: `hc run --json --bg --rm --no-parent [--on <machine>] --cwd <root> --label herdr.mod=lazygit --label lazygit.repo=<root> --label lazygit.space=<space> -- <executable>`.
- `--rm` removes the terminal when lazygit exits. `--keep` only covers core crashes and is not needed.
- `--no-parent`: lazygit must not die with the shell of the pane it was started from.
- The space label holds the app's full space id (with `machine/` prefix for remote), so cleanup compares it to `spaces()` directly.

### Repo root normalization
One function makes both the label value and the lookup key. It converts backslashes to forward slashes and strips any trailing slash. Only for this computer on Windows, it also lowercases the whole path. Remote paths keep their case.

### Cleanup on each press
Runs inside the lease, on both the hide and the open path, and also when a precondition fails:
- A candidate's machine is the prefix of its address (`macbook/t7` -> `macbook`, no prefix -> local). Skip candidates whose machine is not `layout === "ready"` in `machines()`, and keep their `hiddenAt`.
- Skip terminals with a `herdr.space` label. herdr adopted them as tab panes, so they are not ours to end.
- Kill (`hc kill`) candidates whose `lazygit.space` is not in `spaces()`. Skip this rule when `spaces()` is empty.
- Kill candidates that are not the shown or about-to-show terminal and have been hidden for 30 minutes or more.
- A live, hidden candidate without `hiddenAt` (for example after a restart) gets `hiddenAt = now`. Entries for terminals that are gone are removed.

## Risks / Trade-offs

- [Focus inside overlays is invisible to code] -> Checked by hand in the end-to-end task.
- [The 1x1 runner copy may flash] -> `frame:"none"` and an empty render.
- [Cleanup only runs on presses] -> A hidden lazygit can live past 30 minutes, or past its space, until the next press. Accepted by the user.
- [A mod reload calls the sentinel's `close()`] -> State is cleared while the dialog may still be open. Only affects development.
- [The mise shim adds about 2 s at start] -> Users can set the real executable in `lazygit.json`. Measured mod work per press: new about 170 ms, show about 140 ms before this change. The rest is herdr opening the runner copy and lazygit drawing.
- [Shortcut conflicts] -> Only `ctrl-shift-*`. No `ctrl-alt` (AltGr on Windows).

## Migration Plan

New mod, no migration. Install: copy `mods/lazygit/` into `~/.config/herdr-app/mods/` and merge `keys.json`. Optionally create `~/.config/herdr-app/lazygit.json`. Remove: delete the folder, the bindings and the settings file.
