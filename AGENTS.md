# AGENTS.md

herdr-app mod: lazygit in a floating dialog. Code in `mods/lazygit/`, pure logic in `model.js` (tested), herdr calls in `main.js`.

## Herdr references

- `herdr-app --skill` - driving the app window.
- `hc --skill` - herdr-core terminals, labels, remote machines.
- `~/.config/herdr-app/AGENTS.md` - mod guide.
- `~/.config/herdr-app/herdr.d.ts` and `gpui-kit.d.ts` - mod API.

## Commands

- `npm test` - unit tests.
- `npm run check` - `herdr-app check mods/lazygit`.
- `herdr-app status`, `herdr-app shot <file>`, `hc ls --json --label herdr.mod=lazygit` - inspect a live run.

## Gotchas

- Mods run only while shown. The shortcut opens a 1x1 runner copy that does one toggle and closes.
- `kind:"window"` overlays and `pane.focus` cannot give an overlay terminal focus. Use `kind:"dialog"`.
- `focused()` and `herdr-app status` do not report focus inside overlays. Check focus by hand.
- Do not restart the user's herdr-app or herdr-core. This session may run inside it.
- Specs and plan: `openspec/changes/add-lazygit-float-mod/`.
