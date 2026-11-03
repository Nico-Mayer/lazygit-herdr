# lazygit for Herdr

A [Herdr](https://herdr.dev) mod that opens [lazygit](https://github.com/jesseduffield/lazygit) in a floating dialog for the repo you are working in. Press your shortcut to show it, press again to hide it. lazygit stays open in the background, so you come back to where you left off.

![lazygit in a floating dialog over Herdr](preview.png)

- **Follows your focus.** Opens the repo of the terminal you are in, even from a subfolder.
- **Keeps your place.** One lazygit per repo per space. Hide and show it as often as you like.
- **Works on remote machines.** Also in spaces on another Linux or macOS machine, if it has `git` and `lazygit`.
- **Stays out of the way.** `Esc` goes to lazygit. Click outside to hide it. `q` closes it.
- **Cleans up.** Closes lazygit when its space is closed, or after 30 minutes hidden.
- **Clear errors.** Tells you when the folder is not a git repo or lazygit is missing.

## Install

You need Herdr app 0.1.12 or newer, and `git` and `lazygit` on each machine you use it on.

Clone this repository and link the mod into Herdr's home, so a `git pull` updates it:

```sh
git clone https://github.com/Nico-Mayer/lazygit-herdr.git
ln -s "$PWD/lazygit-herdr/mods/lazygit" ~/.config/herdr-app/mods/lazygit
```

On Windows (PowerShell):

```powershell
git clone https://github.com/Nico-Mayer/lazygit-herdr.git
New-Item -ItemType Junction -Path "$HOME\.config\herdr-app\mods\lazygit" -Target "$PWD\lazygit-herdr\mods\lazygit"
```

Then add a shortcut. Merge [`keys.json`](keys.json) into `~/.config/herdr-app/keys.json` and change the key to the one you want:

```json
{
  "global": { "ctrl-shift-g": "mod.open:lazygit" },
  "terminal": { "ctrl-shift-g": "mod.open:lazygit" }
}
```

Use the same key in both entries, so it also hides lazygit while lazygit has focus. Avoid keys lazygit uses, and `ctrl-alt-*` on Windows (it acts as AltGr).

## Settings

Optional. Without settings, the mod finds `lazygit` on each machine's `PATH`. To point it at a specific binary, create `~/.config/herdr-app/lazygit.json`:

```json
{
  "path": "/usr/local/bin/lazygit",
  "machines": {
    "my-server": "/home/me/.local/bin/lazygit"
  }
}
```

- `path`: lazygit on this computer.
- `machines`: lazygit per remote machine, by its name in `hc machine ls`.

Changes apply the next time you open lazygit. A fixed path helps when lazygit on `PATH` is a slow shim, for example from mise.

## What it runs

The mod runs `git` and `lazygit` on the machine of the focused space, and uses `hc` to start and close its own terminals. It reads only `lazygit.json`, and makes no network requests.

## Development

```sh
npm test        # unit tests for mods/lazygit/model.js
npm run check   # herdr-app check mods/lazygit
```

With the mod linked as above, saving a file reloads it.

## License

[MIT](LICENSE). [RECIPE.md](RECIPE.md) is the brief to build it from scratch.
