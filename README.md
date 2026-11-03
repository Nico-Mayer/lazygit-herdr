# lazygit-herdr

A [herdr-app](https://github.com/herdrdev/herdr-app) mod that opens [lazygit](https://github.com/jesseduffield/lazygit) in a floating dialog for the git repo of the active pane. Press the shortcut again to hide it. lazygit keeps running, so the next press shows it as you left it.

- Works on this computer and in remote spaces (`hc machine`), when the remote machine has git and lazygit.
- One lazygit per repo per space.
- Shows a notification instead of opening when the folder is unknown, lazygit is missing, or the folder is not a git repo.

## Requirements

- herdr-app 0.1.12 or newer, with herdr-core (`hc`).
- `git` and `lazygit` on each machine you use it on.

## Install

1. Copy `mods/lazygit/` to `~/.config/herdr-app/mods/lazygit/`.
2. Merge the entries from `keys.json` into `~/.config/herdr-app/keys.json`:

   ```json
   {
     "global": { "ctrl-shift-g": "mod.open:lazygit" },
     "terminal": { "ctrl-shift-g": "mod.open:lazygit" }
   }
   ```

   Keep both sections. The `terminal` entry lets the shortcut hide lazygit while lazygit has focus.

To use another shortcut, change the key in both sections. Avoid `ctrl-alt-*` on Windows (it acts as AltGr) and keys that lazygit uses.

## Settings

Optional: `~/.config/herdr-app/lazygit.json`. Without it, the mod finds `lazygit` on each machine's PATH.

```json
{
  "path": "C:/Users/me/AppData/Local/mise/installs/lazygit/0.66.2/lazygit.exe",
  "machines": {
    "macbook": "/opt/homebrew/bin/lazygit"
  }
}
```

- `path`: lazygit on this computer.
- `machines`: lazygit per remote machine, by its name in `hc machine ls`.

The file is read on each press. Changes apply on the next press.

Setting the real executable helps when lazygit is on PATH only as a shim (for example from mise). On Windows, a mise shim adds about 2 seconds to each start.

## Behavior

- **Hide:** press the shortcut, or click outside the dialog. lazygit keeps running.
- **Esc** goes to lazygit, not to herdr.
- **Quit:** `q` in lazygit ends it and closes the dialog.
- **Cleanup on each press:** the mod ends its lazygits whose space was closed, and those hidden for 30 minutes or more. It skips machines that are offline or still loading. Cleanup only runs when you press the shortcut, so a hidden lazygit can live longer until your next press.

## Development

```sh
npm test        # unit tests for mods/lazygit/model.js
npm run check   # herdr-app check mods/lazygit
```

For live development, link the folder instead of copying it. On Windows:

```powershell
New-Item -ItemType Junction -Path "$HOME\.config\herdr-app\mods\lazygit" -Target "$PWD\mods\lazygit"
```

Saving a file reloads the mod.
