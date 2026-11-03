import assert from "node:assert/strict";
import test from "node:test";
import { WaveDefense } from "../wave-defense.mjs";

test("神殿防衛では補給を終えた波だけを開始し、全波を撃退した時点で勝利する", () => {
  const monsters = {
    monsters: [],
    count() { return this.monsters.length; },
  };
  const spawned = [];
  function spawnRaider(manager, world, type) {
    const monster = { def: {}, raid: true };
    manager.monsters.push(monster);
    spawned.push(type);
    return monster;
  }
  const raid = new WaveDefense(monsters, {}, spawnRaider, { raidHorn() {} });
  const ui = { toast() {} };
  let permittedWave = 0;
  const results = [];
  raid.onEnd = (won) => results.push(won);
  raid.start({
    gates: [{ x: 10, z: 10 }],
    waves: ["scout", "breaker", "guard"].map(type => ({ label: type, spawns: [[type, 1]] })),
    canStartWave: (wave) => wave <= permittedWave,
  });
  raid.update(5, ui);
  assert.deepEqual(spawned, ["scout"]);

  for (const type of ["breaker", "guard"]) {
    monsters.monsters.length = 0;
    raid.update(1, ui);
    raid.update(60, ui);
    assert.equal(spawned.includes(type), false);
    assert.deepEqual(results, []);
    permittedWave++;
    raid.update(5, ui);
    assert.equal(spawned.at(-1), type);
  }
  monsters.monsters.length = 0;
  raid.update(1, ui);
  assert.deepEqual(spawned, ["scout", "breaker", "guard"]);
  assert.deepEqual(results, [true]);
});
