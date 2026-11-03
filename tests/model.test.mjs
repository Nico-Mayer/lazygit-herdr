import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeRoot, firstLine, machineOf, findInstance, planCleanup, parseSettings, executableFor, IDLE_LIMIT_MS } from "../mods/lazygit/model.js";

const owned = (address, repo, space, state = "live") => ({
  address, state, labels: { "herdr.mod": "lazygit", "lazygit.repo": repo, "lazygit.space": space },
});

test("normalizeRoot unifies Windows slashes and case", () => {
  assert.equal(normalizeRoot("C:\\Users\\Nico\\Repo\\", true), "c:/users/nico/repo");
  assert.equal(normalizeRoot("C:/Users/nico/repo\n", true), "c:/users/nico/repo");
  assert.equal(normalizeRoot("c:/users/NICO/repo", true), normalizeRoot("C:\\Users\\nico\\Repo", true));
});

test("normalizeRoot keeps drive and POSIX roots", () => {
  assert.equal(normalizeRoot("C:\\", true), "c:/");
  assert.equal(normalizeRoot("/", false), "/");
});

test("normalizeRoot keeps POSIX case", () => {
  assert.equal(normalizeRoot("/Users/Me/Repo/", false), "/Users/Me/Repo");
});

test("firstLine returns the first non-empty line", () => {
  assert.equal(firstLine("\r\nC:\\a\\lazygit.exe\r\nC:\\b\\lazygit.exe\r\n"), "C:\\a\\lazygit.exe");
  assert.equal(firstLine(""), null);
});

test("findInstance matches repo and space", () => {
  const list = [owned("t1", "c:/a", "s1"), owned("t2", "c:/b", "s1"), owned("t3", "c:/a", "s2")];
  assert.equal(findInstance(list, "c:/a", "s1").address, "t1");
  assert.equal(findInstance(list, "c:/b", "s1").address, "t2");
  assert.equal(findInstance(list, "c:/a", "s2").address, "t3");
  assert.equal(findInstance(list, "c:/c", "s1"), null);
});

test("findInstance skips dead and foreign terminals", () => {
  const foreign = { address: "t9", state: "live", labels: { "lazygit.repo": "c:/a", "lazygit.space": "s1" } };
  assert.equal(findInstance([owned("t1", "c:/a", "s1", "finished"), foreign], "c:/a", "s1"), null);
});

const base = { spaceIds: ["s1", "mac/s2"], readyMachines: [null, "mac"], hiddenAt: {}, keep: null, now: 1_000_000_000 };

test("planCleanup kills instances of closed spaces", () => {
  const plan = planCleanup({ ...base, terminals: [owned("t1", "c:/a", "gone"), owned("t2", "c:/a", "s1")] });
  assert.deepEqual(plan.kill, ["t1"]);
});

test("planCleanup kills instances hidden for the idle limit", () => {
  const hiddenAt = { t1: base.now - IDLE_LIMIT_MS, t2: base.now - IDLE_LIMIT_MS + 1 };
  const plan = planCleanup({ ...base, hiddenAt, terminals: [owned("t1", "c:/a", "s1"), owned("t2", "c:/b", "s1")] });
  assert.deepEqual(plan.kill, ["t1"]);
  assert.deepEqual(plan.hiddenAt, { t2: hiddenAt.t2 });
});

test("planCleanup spares the instance this press shows", () => {
  const old = base.now - 2 * IDLE_LIMIT_MS;
  const plan = planCleanup({ ...base, keep: "t1", hiddenAt: { t1: old }, terminals: [owned("t1", "c:/a", "s1")] });
  assert.deepEqual(plan, { kill: [], hiddenAt: {} });
});

test("planCleanup starts the clock for hidden instances without a time", () => {
  const plan = planCleanup({ ...base, terminals: [owned("t1", "c:/a", "s1")] });
  assert.deepEqual(plan.hiddenAt, { t1: base.now });
  assert.deepEqual(plan.kill, []);
});

test("planCleanup prunes times of terminals that are gone", () => {
  const plan = planCleanup({ ...base, hiddenAt: { t7: base.now - 5 }, terminals: [] });
  assert.deepEqual(plan.hiddenAt, {});
});

test("planCleanup does nothing for local terminals while this computer is loading", () => {
  const hiddenAt = { t1: 0 };
  const plan = planCleanup({ ...base, readyMachines: ["mac"], spaceIds: [], hiddenAt, terminals: [owned("t1", "c:/a", "gone")] });
  assert.deepEqual(plan, { kill: [], hiddenAt });
});

test("planCleanup keeps instances and times on a machine that is not ready", () => {
  const hiddenAt = { "pi/t3": 0 };
  const plan = planCleanup({ ...base, hiddenAt, terminals: [owned("pi/t3", "/home/a", "pi/s9")] });
  assert.deepEqual(plan, { kill: [], hiddenAt });
});

test("planCleanup handles ready remote instances like local ones", () => {
  const plan = planCleanup({ ...base, hiddenAt: { "mac/t4": 0 },
    terminals: [owned("mac/t4", "/Users/a", "mac/s2"), owned("mac/t5", "/Users/b", "mac/gone")] });
  assert.deepEqual(plan.kill, ["mac/t4", "mac/t5"]);
});

test("planCleanup never kills a terminal herdr adopted into a tab", () => {
  const adopted = owned("t6", "c:/a", "gone");
  adopted.labels["herdr.space"] = "s1";
  const plan = planCleanup({ ...base, hiddenAt: { t6: 0 }, terminals: [adopted] });
  assert.deepEqual(plan, { kill: [], hiddenAt: {} });
});

test("planCleanup ignores an empty space list", () => {
  const plan = planCleanup({ ...base, spaceIds: [], terminals: [owned("t1", "c:/a", "s1")] });
  assert.deepEqual(plan.kill, []);
});

test("planCleanup never touches terminals the mod did not start", () => {
  const foreign = { address: "t9", state: "live", labels: { "lazygit.space": "gone" } };
  const plan = planCleanup({ ...base, hiddenAt: { t9: 0 }, terminals: [foreign] });
  assert.deepEqual(plan, { kill: [], hiddenAt: {} });
});

test("machineOf reads the address prefix", () => {
  assert.equal(machineOf("t7"), null);
  assert.equal(machineOf("macbook/t7"), "macbook");
});

test("parseSettings accepts a missing or empty file", () => {
  assert.deepEqual(parseSettings(null), {});
  assert.deepEqual(parseSettings("  "), {});
});

test("parseSettings reads path and machines", () => {
  const settings = parseSettings('{"path": "C:/lg.exe", "machines": {"mac": "/opt/lg"}}');
  assert.equal(executableFor(settings, null), "C:/lg.exe");
  assert.equal(executableFor(settings, "mac"), "/opt/lg");
  assert.equal(executableFor(settings, "pi"), null);
  assert.equal(executableFor(parseSettings('{"machines": {"mac": "/opt/lg"}}'), null), null);
});

test("parseSettings rejects invalid content", () => {
  assert.throws(() => parseSettings("{"), /not valid JSON/);
  assert.throws(() => parseSettings("[]"), /JSON object/);
  assert.throws(() => parseSettings('{"path": 3}'), /"path"/);
  assert.throws(() => parseSettings('{"machines": {"mac": 1}}'), /"machines"/);
  assert.throws(() => parseSettings('{"machines": ["x"]}'), /"machines"/);
});
