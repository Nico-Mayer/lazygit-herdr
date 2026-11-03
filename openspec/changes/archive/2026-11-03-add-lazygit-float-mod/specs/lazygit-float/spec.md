# Spec Delta

## Purpose

Lets herdr-app users open lazygit in a floating dialog for the repo of the active pane, on this computer or a remote machine, toggle it with one shortcut, and have unused instances cleaned up.

## ADDED Requirements

### Requirement: Toggle shortcut
The mod SHALL provide a `keys.json` that binds a shortcut (default `ctrl-shift-g`) to the mod in both the global and terminal key contexts, so it works whether a herdr pane or the lazygit dialog has focus.

#### Scenario: Shortcut from a terminal pane
- **WHEN** the user has merged the mod's `keys.json` and presses `ctrl-shift-g` while a terminal pane has focus
- **THEN** the mod runs its toggle

#### Scenario: Shortcut from the lazygit dialog
- **WHEN** the lazygit dialog has focus and the user presses `ctrl-shift-g`
- **THEN** the mod runs its toggle instead of lazygit receiving the key

### Requirement: Open lazygit in the active pane's repo
When triggered and no lazygit dialog is shown, the mod SHALL open a floating dialog running lazygit, on the machine of the focused space, with its working directory set to the git repo root of the focused pane's folder. The dialog SHALL take keyboard focus.

#### Scenario: Local pane in a repo subfolder
- **WHEN** the focused pane is on this computer, its folder is `<repo>/src/lib`, and the user presses the shortcut
- **THEN** a dialog opens with lazygit running in `<repo>`, and typed keys go to lazygit without a click

#### Scenario: Remote pane
- **WHEN** the focused space is on a remote machine that has git and lazygit, the pane's folder is inside a repo there, and the user presses the shortcut
- **THEN** a dialog opens with lazygit running on that machine in the repo root

#### Scenario: Esc reaches lazygit
- **WHEN** the lazygit dialog has focus and the user presses Esc
- **THEN** lazygit receives Esc and the dialog stays open

### Requirement: Configurable lazygit executable
The mod SHALL read `~/.config/herdr-app/lazygit.json` on each press. A `machines.<name>` entry SHALL set the executable for that remote machine, and `path` SHALL set it for this computer. Without a matching entry, the mod SHALL find `lazygit` on that machine's PATH.

#### Scenario: Path set for this computer
- **WHEN** `lazygit.json` contains `{"path": "C:/tools/lazygit.exe"}` and the user opens lazygit for a local space
- **THEN** lazygit starts from `C:/tools/lazygit.exe`

#### Scenario: Path set for a remote machine
- **WHEN** `lazygit.json` contains `{"machines": {"macbook": "/opt/homebrew/bin/lazygit"}}` and the user opens lazygit for a space on `macbook`
- **THEN** lazygit starts from `/opt/homebrew/bin/lazygit` on `macbook`

#### Scenario: Configured path cannot start
- **WHEN** the configured path for the machine does not exist
- **THEN** an error notification names the path and `lazygit.json`, and no dialog opens

#### Scenario: Invalid settings file
- **WHEN** `lazygit.json` is not valid JSON
- **THEN** an error notification says `lazygit.json` is invalid, and no dialog opens

### Requirement: Fail gracefully before opening
The mod SHALL check preconditions before opening any dialog. On failure it SHALL show one notification and open nothing.

#### Scenario: Folder unknown
- **WHEN** the focused pane has no known folder
- **THEN** a warning notification says the folder is unknown and no dialog opens

#### Scenario: lazygit not installed
- **WHEN** no path is configured for the machine and `lazygit` is not on that machine's PATH
- **THEN** an error notification says lazygit is not installed there and mentions `lazygit.json`, and no dialog opens

#### Scenario: Not a git repo
- **WHEN** the focused pane's folder is not inside a git repo
- **THEN** a warning notification names the folder and says it is not a git repo, and no dialog opens

#### Scenario: Machine unreachable
- **WHEN** the focused space's machine cannot be reached
- **THEN** an error notification names the machine, and no dialog opens

### Requirement: Toggle keeps lazygit running
When a lazygit dialog is shown, pressing the shortcut or clicking outside the dialog SHALL hide it without ending lazygit, and focus SHALL return to the pane that had it before. Pressing the shortcut again for the same repo and space SHALL show the same lazygit instance with its state intact.

#### Scenario: Hide and show with the shortcut
- **WHEN** a lazygit dialog is shown and the user presses the shortcut, then presses it again from a pane in the same repo and space
- **THEN** the dialog hides and focus returns to the previous pane, then the same lazygit instance shows again

#### Scenario: Hide with a click outside
- **WHEN** a lazygit dialog is shown and the user clicks outside it, then presses the shortcut
- **THEN** the dialog hides with lazygit still running, and the one press shows it again

### Requirement: One instance per repo per space
The mod SHALL keep at most one lazygit instance for each pair of repo root and space. Different repos or different spaces SHALL get separate instances. On this computer, paths that differ only in letter case or slash style on Windows SHALL count as the same repo.

#### Scenario: Different repo in same space
- **WHEN** lazygit for repo A is running hidden and the user presses the shortcut in a pane in repo B
- **THEN** a new lazygit opens for repo B and the repo A instance keeps running

#### Scenario: Same repo in another space
- **WHEN** lazygit for repo A runs in space 1 and the user presses the shortcut in a pane in repo A in space 2
- **THEN** a separate lazygit opens for space 2

#### Scenario: Quick double press
- **WHEN** the user presses the shortcut twice quickly in a pane in a repo without a running instance
- **THEN** at most one lazygit instance exists for that repo and space afterwards

### Requirement: Quitting lazygit closes its dialog
When lazygit exits, its dialog SHALL close and the instance SHALL be removed from herdr-core.

#### Scenario: User quits lazygit
- **WHEN** the user presses `q` in lazygit
- **THEN** the dialog closes and no terminal for that instance remains in herdr-core

### Requirement: Clean up stale instances on each press
On each shortcut press, the mod SHALL end every lazygit instance it started whose space no longer exists, and every one hidden for 30 minutes or more. It SHALL NOT end any terminal it did not start or that was moved into a herdr tab, and SHALL skip instances on machines that are not ready.

#### Scenario: Space closed
- **WHEN** a space with lazygit instances was closed and the user presses the shortcut anywhere
- **THEN** those instances end

#### Scenario: Hidden for 30 minutes
- **WHEN** an instance has been hidden for 30 minutes or more and the user presses the shortcut anywhere
- **THEN** that instance ends, unless it is the one this press shows

#### Scenario: Shown again before timeout
- **WHEN** an instance hidden for 20 minutes is shown again and then hidden
- **THEN** its 30 minutes count from the new hide

#### Scenario: Machine not ready
- **WHEN** a remote machine is offline or herdr is still loading its spaces, and the user presses the shortcut
- **THEN** no instance on that machine is ended by cleanup

#### Scenario: Other terminals untouched
- **WHEN** cleanup runs and a terminal not started by the mod, or one moved into a herdr tab, belongs to a closed space
- **THEN** that terminal is not ended
