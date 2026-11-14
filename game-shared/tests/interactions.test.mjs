import assert from "node:assert/strict";
import test from "node:test";
import { chooseFacingTarget } from "../interactions.mjs";

const pos = { x: 0, y: 0, z: 0 };
const target = (key, x, z) => ({ key, point: { x, y: 0.6, z } });
const visible = () => true;

test("Fの対象は向きベクトルの長さに依存せず、近い正面の相手を選ぶ", () => {
  const candidates = [target("far", 0, 2.5), target("near", 0, 1), target("side", 1, 0)];
  for (const length of [0.05, 1, 5]) {
    assert.equal(chooseFacingTarget(candidates, pos, { x: 0, y: length }, visible)?.key, "near");
  }
});

test("Fでは壁越し・背後・範囲外を除き、正面に残った対象を選ぶ", () => {
  const candidates = [target("wall", 0, 0.5), target("behind", 0, -0.5), target("far", 0, 3), target("chest", 0.5, 1)];
  assert.equal(chooseFacingTarget(candidates, pos, { x: 0, y: 1 }, t => t.key !== "wall")?.key, "chest");
  assert.equal(chooseFacingTarget(candidates.slice(0, 3), pos, { x: 0, y: 1 }, t => t.key !== "wall"), null);
});

test("寝た人物とベッドが重なるときは姿勢の高さで人物を除外しない", () => {
  const patient = { key: "patient", point: { x: 0, y: 0.3, z: 1 } };
  const bed = { key: "bed", point: { x: 0, y: 0.5, z: 1 } };
  assert.equal(chooseFacingTarget([patient, bed], pos, { x: 0, y: 1 }, visible)?.key, "patient");
});
