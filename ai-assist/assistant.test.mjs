import test from 'node:test';
import assert from 'node:assert/strict';
import { askAssistant, searchPins } from './assistant.mjs';

for (const [query, id] of [
  ['Anything interesting related to robotics today?', 'demo-robotics'],
  ['Closest bathroom to Hunt Library 2nd floor', 'demo-hunt-bathroom'],
  ['Where can I print in colour near Wean?', 'demo-wean-printer'],
  ['Where can I study on a rainy day?', 'demo-hunt-study'],
]) test(query, async () => {
  const answer = await askAssistant(query);
  assert.equal(answer.results[0].id, id);
  assert.ok(answer.actions.some(action => action.type === 'open_pin' && action.payload.pinId === id));
  assert.match(answer.text, /synthetic/);
});
test('Calm route asks for origin, then uses connected provider', async () => {
  assert.equal((await askAssistant('Avoid crowds getting to Gates')).needsOrigin, true);
  let called = false;
  const answer = await askAssistant('Avoid crowds getting to Gates', { origin: 'hunt', route: async (from, to, options) => {
    called = true;
    assert.equal(from, 'hunt');
    assert.equal(to.buildingId, 'gates');
    assert.equal(options.mode, 'calm');
    return { nodes: ['hunt', 'gates'] };
  } });
  assert.ok(called);
  assert.equal(answer.actions[0].type, 'draw_route');
});
test('rain query returns scenario action', async () => assert.equal((await askAssistant('Study in the rain')).actions[0].type, 'set_scenario'));
test('unavailable floors and colour printers never silently substitute', async () => {
  assert.equal((await askAssistant('Bathroom Hunt floor 9')).results.length, 0);
  assert.equal((await askAssistant('Colour printer', { pins: [{ id: 'p', kind: 'printer', tags: ['monochrome'] }] })).results.length, 0);
});
test('empty and unknown queries do not move map', async () => {
  for (const query of ['', 'tell me a joke']) assert.equal((await askAssistant(query)).actions.length, 0);
});
test('route provider failure is recoverable', async () => {
  const result = await askAssistant('Navigate to Gates', { origin: 'hunt', route: () => { throw Error('offline'); } });
  assert.equal(result.actions.length, 0);
  assert.match(result.text, /could not calculate/);
});
test('injected canonical data replaces demo fixtures', async () => {
  const pins = [{ id: 'real', kind: 'bathroom', name: 'Verified restroom', buildingId: 'hunt', floor: 2, dataStatus: 'verified' }];
  assert.equal((await askAssistant('Hunt bathroom', { pins })).results[0].id, 'real');
  assert.equal(searchPins({ kind: 'event' }, pins).length, 0);
});
