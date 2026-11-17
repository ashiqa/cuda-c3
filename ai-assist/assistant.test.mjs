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
  assert.ok(answer.text.includes(answer.results[0].details));
  assert.doesNotMatch(answer.text, /dummy|synthetic|fictional|sample/i);
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

// Regressions for natural prompts and the actual shared map dataset.
for (const [query, kind] of [
  ['Where are the bathrooms?', 'bathroom'],
  ['I need somewhere for studying', 'study'],
  ['I am hungry', 'food'],
  ['Any activities on campus?', 'event'],
  ['Are there printers in Hunt?', 'printer'],
]) test(query, async () => {
  const answer = await askAssistant(query);
  assert.equal(answer.results[0].kind, kind);
  assert.ok(answer.text.includes(answer.results[0].details));
});
test('study location and floor constraints are respected', async () => {
  const answer = await askAssistant('Study in Wean floor 4');
  assert.equal(answer.results[0].buildingId, 'wean');
  assert.equal(answer.results[0].floor, 4);
});
test('location follow-up retains the previous service', async () => {
  const answer = await askAssistant('What about Gates?', { previousQuery: 'Where are the bathrooms?' });
  assert.equal(answer.results[0].kind, 'bathroom');
  assert.equal(answer.results[0].buildingId, 'gates');
});
test('route origin follow-up completes the pending request', async () => {
  const pending = await askAssistant('Take me to Gates');
  let called = false;
  await askAssistant('From Hunt', { pendingDestination: pending.destination, route: async (from, to) => {
    called = true;
    assert.equal(from, 'hunt');
    assert.equal(to.buildingId, 'gates');
    return { destination: to };
  } });
  assert.ok(called);
});
test('origin and destination order are parsed correctly', async () => {
  await askAssistant('Directions from Gates to Hunt', { route: async (from, to) => {
    assert.equal(from, 'gates');
    assert.equal(to.buildingId, 'hunt');
    return { destination: to };
  } });
});
test('canonical map data supports string floors, attributes and exact IDs', async () => {
  const { readFile } = await import('node:fs/promises');
  const { runInNewContext } = await import('node:vm');
  const sandbox = { window: {} };
  runInNewContext(await readFile(new URL('../3d-map/data.js', import.meta.url), 'utf8'), sandbox);
  const pins = sandbox.window.CAMPUS_DATA.pins;
  for (const [query, id] of [
    ['Closest bathroom to Hunt Library 2nd floor', 'bathroom-hunt'],
    ['Where can I print in colour near Wean?', 'printer-wean'],
    ['Anything interesting related to robotics today?', 'event-tepper'],
  ]) {
    const answer = await askAssistant(query, { pins });
    assert.equal(answer.results[0].id, id);
    assert.ok(answer.actions.some(action => action.type === 'open_pin' && action.payload.pinId === id));
  }
});
