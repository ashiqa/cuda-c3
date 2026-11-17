# Campus assistant

Serve the repository root with `python3 -m http.server 4173`, then visit `/ai-assist/`.
No build step, API key, or backend is required. External fonts are optional; system fonts work offline.

The standalone page reads campus listings from `../3d-map/data.js` and adds study
spaces from `demo-data.mjs`. The query module falls back to 20 synthetic listings
when used without injected pins. Provenance remains in the data rather than being
repeated in each answer or card. See the
[colors and demo-data README](./README-colors.md) for the warm palette, supporting
colors, measured contrast ratios, and fixture details.

`node --test ai-assist/assistant.test.mjs` runs 20 checks covering natural-language
variants, location follow-ups, route origin follow-ups, action payloads, exact floor
matching, provider failures, and the canonical map dataset.

## Integration

Import `askAssistant` and `searchPins` from `assistant.mjs`. `askAssistant(text, context)`
returns a promise for `{text, actions, results, technique, needsOrigin?, destination?}`.
The parser is deterministic, not an LLM. Fixtures are synthetic and never claim live
events, verified facilities, walking distances, or room geometry.

Context accepts:

- `pins`: canonical pin array; replaces all demo fixtures. Fields: `id`, `kind`, `name`,
  `buildingId`, optional `floor`, `tags`, `details`, `occupancy`, `dataStatus`.
- `origin`: navigation provider's starting point. Missing origins trigger clarification.
- `rain`: current scenario boolean.
- `previousQuery`: previous user text, used to carry a service into a location follow-up.
- `pendingDestination`, `pendingMode`: preserve a route while asking for its origin.
- `route(from, destination, {mode, stepFree})`: async route provider. Must enforce
  verified accessibility if `stepFree` is requested; null/rejection produces a retry message.
- `getCrowd(buildingId)`: optional async provider returning `{occupancy}` in percent 0–100.

The standalone page reads `window.campusAssistantContext` for every request (overriding
its campus pins and conversation defaults) and emits
`window` CustomEvent `campus-pulse:assistant-actions` with the entire answer as `detail`.
It only previews actions; a host must subscribe and execute them. This event does not
cross iframe boundaries. For a combined app, import the module directly.

Proposed action payloads (pending confirmation from the map owner):

```js
{ type: 'fly_to', payload: { buildingId, floor? } }
{ type: 'highlight', payload: { pinIds: [...] } }
{ type: 'open_pin', payload: { pinId } }
{ type: 'set_layer', payload: { layer: 'event', visible: true } }
{ type: 'set_scenario', payload: { rain: true } }
{ type: 'draw_route', payload: { route } }
```

The map owner owns canonical pins and shared contracts. This module edits no shared
files. “Closest” searches currently apply building/floor constraints and disclose that
distance ranking requires navigation integration. Event results are sample listings,
not date-aware live events. Emergency queries do not produce evacuation routes.
