# CMU Campus Pulse: 3D Campus Map PRD

*Working name · PRD v0.3 · 6-hour build · Four people, each supported by one Codex agent*

## 1. Vision and one-liner

A gorgeous, real-time 3D map of CMU that answers three questions for any student: **"What's happening and where?"**, **"How do I get there?"**, and **"Where will it be crowded, and what should I do instead?"**

The hackathon wow-moment is the combination: a beautiful 3D campus that is *alive* (crowds, food, events), *conversational* (ask the AI anything), and *predictive* (it tells you Sorrells will be full in 20 minutes and routes you to Hunt).

## 2. Decisions and open questions (v0.3)

The team has a **6-hour build window**. Use relative time (`T+0` through `T+6`) until the actual start and submission times are confirmed. Anything that needs a fragile external integration is replaced by verified static, seeded, or simulated data.

| Topic | Decision |
| --- | --- |
| Time | Six hours total. Core integration by T+4:15, feature freeze at T+5:00, and the final hour is protected for visual polish, QA, recording, and submission. |
| Food and events | No GroupMe connection. Free food and events are **pins on the 3D map** (a food icon, an event icon). Tapping an event opens its photos. They are part of the map, not a separate module. |
| Printers and bathrooms | Use a small verified list where possible. Any invented coordinates or attributes must carry a visible `Demo data` label. |
| Event data | Real events copied in by hand. No scraping. |
| Crowd data | Pure simulation, labelled as simulated in the UI. |
| Accessibility | In scope: a step-free routing toggle (elevator and ramp flags on the nav graph). |
| Privacy and safety | Low data risk for this prototype: no accounts or real location tracking. Synthetic and verified data must remain distinguishable. |
| APIs and keys | Free tiers and open-source tools only (Section 9). |
| Cut | Time slider and night mode (earlier questions 12 and 13), GroupMe, scraping, accounts, extra buildings. |

Still open (the italic default applies until answered):

1. **Rules and submission.** What exactly is submitted at T+6: repo, video, slides, hosted link, or a combination? *Default: public repo, hosted link, and 2-minute video.*
2. **Human strengths.** Assign the four people to P1 through P4 in Section 10 before the timer starts. Each person operates one Codex agent and reviews every change in their owned folders.
3. **Pre-work.** Confirm whether accounts, API keys, data collection, and image preparation are allowed before the official build starts. *Default: accounts, roles, and keys only.*
4. **Runtime LLM.** Which optional free LLM key is available for the in-app assistant? *Default: local deterministic intent parser first; Gemini only if tested.*
5. **Pitch format.** Is there a live judge demo? *Default: 2-minute live demo plus a locally stored backup video.*

Confirmed campus fact: **Sorrells Library is on the fourth floor of Wean Hall.** The two hero buildings are Wean Hall/Sorrells and Hunt Library.

## 3. Brainstorm: how it all fits together

The simplest build that still wows is **one map, one pin type, one simulated world, and one assistant that drives the map.**

- **Everything is a pin.** Food, events, bathrooms, printers, and study spots share one data shape and one detail card, so it is built once and every kind comes free. Event and food cards add a photo gallery.
- **Food feels live without GroupMe.** Seed each food pin with a timestamp relative to now ('posted 12 min ago, about 25 min left'). Pins pulse, count down, and disappear during the demo, which imitates a live feed.
- **One simulated world drives four features.** A single state (time of day, rain on or off, event nearby) feeds the crowd map, the forecast, Calm routing, and evacuation load. Build it once in P4's module; everyone reads it.
- **The Rain toggle is the wow button.** It darkens the sky, adds rain, shifts crowds indoors, moves the forecast, and changes the recommendation from one switch. If time allows, Open-Meteo can set it from real weather.
- **The AI operates the map, not just a chat box.** Every answer returns map actions. Show three distinct techniques: structured language intent extraction, occupancy forecasting, and congestion-aware routing. A small "How this works" chip explains each technique without overclaiming synthetic results.
- **Indoor on a budget.** Two buildings, with floors drawn as simple room blocks from a hand-written schematic file. It proves the idea without accurate blueprints.
- **Reliable demo.** A Tour button replays the demo script automatically from deterministic seeds, and we record a backup video before submitting.
- **Visual quality is protected work, not leftover polish.** The map must look cinematic by T+1:30. Later features reuse a fixed palette, motion system, glass panels, lighting, and camera choreography instead of introducing ad hoc UI.

## 4. Users and top jobs-to-be-done

| Persona | Job to be done |
| --- | --- |
| Hungry student (Maya, sophomore) | "Is there free food near me right now?" |
| Late-for-class student (Dev) | "Fastest route from Gates to a classroom in Baker, including the indoor part." |
| Studier (Priya) | "It's raining. Where can I study without a crowd?" |
| Club organizer (Sam) | "Put my event on the map with a photo." |
| Campus safety staff (admin demo role) | "Trigger an evacuation drill and see load distributed across exits." |

## 5. User flows and shared screens

The map is home, the assistant is a bar that moves the map (not a separate chat screen), and every navigation flow ends in one shared **Route** screen. An evacuation-planning sandbox is a stretch feature and never presents itself as operational emergency guidance.

### 5.1 Late for class (about 20 seconds from opening the app to walking)

1. **Open the app.** Map Home centred on you, a large 'Where to?' bar, and quick chips (recent places, Food, Bathroom, Print).
2. **Say where.** Two equal doors: tap or type a place ('Gates 5th floor'), or type naturally ('late for 15-122 in Gates 5th floor'). The assistant parses it and fills in the route; it does not answer with a wall of text, it lands you on the next screen.
3. **Route Preview.** Fast and Calm side by side with ETAs ('arrive 2:28, 2 min early'), a Step-free toggle, and one big **Start** button.
4. **Route Follow.** The camera follows you with the route glowing ahead. One banner shows the current step ('Enter Gates, elevator to floor 5') and time left; a floor switcher appears when you go inside. If a crowd builds ahead, it re-routes and says so in one line.
5. **Arrive.** The destination room highlights on its floor and the card closes itself after a few seconds.

The chatbot is a shortcut, not a gate. Typing is for fuzzy asks ('closest bathroom', 'anything happening on robotics'); tapping a place or a pin reaches the same Route Preview.

### 5.2 Evacuation-planning sandbox (stretch only)

This is a visual planning experiment for a hypothetical campus-safety operator, not a student alarm, live routing system, or approved evacuation plan. It uses synthetic occupants, simplified geometry, assumed exit capacities, and an admin-controlled scenario.

1. Select a demo building and a simulated occupancy distribution.
2. Run a nearest-exit baseline.
3. Run a capacity-aware assignment that penalizes overloaded stairs and exits.
4. Animate simulated occupants moving toward exits and assembly points.
5. Compare estimated clearance time and maximum exit load.

A fixed banner must state: **"Planning simulation · Synthetic occupants · Not operational emergency guidance."** The prototype does not claim indoor positioning, alarm integration, blocked-exit awareness, staff notification, offline reliability, individual safety guidance, or accessible evacuation compliance.

### 5.3 Other flows (one line each)

- **Find food, an event, a bathroom, or a printer:** Map Home, then tap a pin or ask, then Place card, then Navigate (into Route Preview).
- **Where should I study on a rainy day:** pin a place, Place card, Forecast card, recommended alternative, Go (into Route Preview).

### 5.4 Shared screens (build once, reuse everywhere)

| Screen | What it is | Used by | Owner |
| --- | --- | --- | --- |
| Map Home | 3D map, layer chips, command bar, Rain toggle | Every flow | P1 |
| Command bar and assistant sheet | Type or tap; answers become map actions | Late, discovery, predict | P2 |
| Place card (bottom sheet) | Pin or building details, photo gallery, actions: Navigate, Ask AI, Pin and predict | Discovery, late, predict | P2 |
| Route Preview | From and to, Fast / Calm / Step-free, ETA, Start | Late, discovery, predict | P3 |
| Route Follow | Follow-along line, step banner, floor switcher, re-route; normal skin and alert skin | Late, discovery, predict, evacuation | P3 (floor drawing by P1) |
| Forecast card | Occupancy chart, scenarios, recommendation | Predict | P4 |
| Alert takeover and exit strip | Full-screen alert, location confirm, exit load strip, check-in | Evacuation | P3 |

So the whole product is **five reusable screens plus one emergency takeover**, and evacuation is mostly Route Follow in a different skin.

**Wireframes: late for class**

```
 ROUTE PREVIEW                       ROUTE FOLLOW
+---------------------------+      +---------------------------+
| Where to? [Gates 5th fl ] |      | > Enter Gates, elevator   |
|                           |      |   to floor 5       0:48   |
|  ( 3D map, route glowing )|      |                           |
|                           |      | ( camera follows you;     |
| Fast  4 min  arrive 2:28 *|      |   floor switcher indoors )|
| Calm  5 min  arrive 2:29  |      |                           |
| [ ] Step-free             |      | Arrive 2:28, 2 min early  |
| [        START          ] |      | [ End ]                   |
+---------------------------+      +---------------------------+
```

**Wireframes: evacuation-planning concept (stretch)**

```
 ALERT TAKEOVER            YOUR EXIT (flat plan, big arrow)
+----------------------+  +------------------------------+
| FIRE ALARM           |  | Hunt Library, Floor 2        |
| Hunt Library         |  |  [room]--[room]---> EAST     |
| Evacuate now         |  |                     stairs   |
|                      |  | EAST STAIRS -> Assembly B    |
| You are on floor 2?  |  | about 90 sec                 |
| [Yes]  [Pick floor]  |  | N 70%   E 28%   S 40%        |
| Follow staff first   |  | [Exit blocked] [I need help] |
+----------------------+  +------------------------------+
```

## 6. Scope tiers and success metrics

| Tier | Includes |
| --- | --- |
| **Must (done by T+5:00)** | Cinematic 3D campus map; unified pins; simulated crowd layer; Rain scenario; forecast card; alternative-location recommendation; one working route; deterministic Tour mode |
| **Should** | Assistant that moves the map; Fast versus Calm routing; one polished indoor floor; step-free route where verified graph data exists; rain particles and environmental lighting |
| **Could** | Second indoor building; event photo gallery; evacuation-planning simulation; live weather from Open-Meteo; share-a-pin link |
| **Cut** | GroupMe, scraping, accounts, real-time user tracking, operational emergency guidance, night-mode toggle, time slider, full indoor coverage, event submission |

**Success metrics:** the opening flyover looks presentation-ready by T+1:30; the full scripted demo works three consecutive times; the hosted link works on the presentation laptop and a phone; five scripted queries return the right pins and map actions; one route computes in under 1 second; toggling Rain visibly changes the environment, forecast, and recommendation; synthetic data is always labelled; a local backup video exists before submission.

### 6.1 Visual north star: "CMU after the rain"

The frontend should feel like a premium spatial product, not a dashboard placed on top of a map. The visual reference is a miniature architectural model of CMU at blue hour: deep navy surroundings, warm windows, wet paths, jewel-toned pins, restrained glass panels, and subtle ambient motion.

**Design language**

- Background: midnight navy `#07111F`; panels: translucent slate with blur and a thin cool-white border.
- Buildings: graphite bases with warm ivory roofs; hero buildings receive a soft cyan rim light.
- Semantic colours: food amber, events magenta, bathrooms cyan, printers violet, calm green, congestion coral/red.
- Typography: one modern sans-serif family; large confident numerals for ETA and occupancy; no more than three text sizes per panel.
- UI chrome stays sparse. The map occupies at least 75% of the viewport during the demo.

**3D and depth requirements**

- Use real building footprints with data-driven `fill-extrusion-height` where available; use a consistent fallback height when absent.
- Add ambient occlusion-like contrast through darker extrusion sides, soft shadows, fog, and a subtle horizon gradient.
- Hero buildings have emissive-looking window bands or edge highlights, but avoid expensive custom 3D models.
- Camera presets are deterministic: Campus Overview, Wean/Sorrells, Hunt, Indoor, and Evacuation Sandbox.
- The route appears as a raised glowing ribbon with a moving dash or travelling pulse, not a flat default polyline.
- Crowd intensity should modify building glow and ground halos without hiding labels or pins.

**Motion requirements**

- Opening camera flyover: 6 to 8 seconds, smooth ease, no user input required.
- Pins rise and settle once; selected pins breathe subtly. Avoid continuous bouncing.
- Rain changes sky/fog, adds lightweight particles, darkens paths, and animates occupancy changes over roughly 800 ms.
- Cards use one consistent spring transition. Respect `prefers-reduced-motion`.
- No animation may block clicking or delay the scripted demo.

**Frontend acceptance test**

At T+1:30, take a full-screen screenshot. It passes only if the campus reads as clearly 3D, Wean and Hunt are visually identifiable, labels remain legible, the palette is cohesive, and the frame could serve as the project thumbnail without additional editing.

## 7. Feature specs

### F1. 3D map and pins (mapping, food, events, bathrooms, printers)

- Extruded campus buildings in a distinct style (palette, soft shadows, sky) with smooth fly-to. Layer chips: Food, Events, Bathrooms, Printers, Crowd, Route.
- One **Pin** type with an icon and colour per kind. Tapping a pin opens a card with name, floor, and details; events and food also show a **photo gallery** (2 to 3 images) and a time ('starts 3:00 PM', 'about 25 min left').
- Food pins pulse and show a countdown computed from seeded timestamps relative to now, so the demo feels live without GroupMe.
- Clicking a hero building opens a **floor switcher** that fades the shell and reveals rooms, corridors, and pins on that floor.
- **Done when:** every pin kind renders, opens a card, and offers 'Navigate here'; the floor switcher works for 2 buildings.

### F2. AI assistant

- Natural-language queries: 'anything interesting related to robotics today?', 'closest bathroom to Hunt Library 2nd floor', 'where can I print in colour near Wean?', 'avoid crowds getting to Gates'.
- An LLM with tool calling (search\_pins, get\_route, get\_crowd, get\_forecast, start\_evac). Each answer returns text **plus map actions**, so the map flies, highlights, or draws a route. A keyword-search fallback covers LLM outages and rate limits.
- **Done when:** the 5 scripted demo queries work and the first token arrives in under 3 seconds.

### F3. Navigation (outdoor, indoor, step-free)

- One graph of outdoor paths, doors, corridors, stairs, and elevators. Edge flags: step-free, indoor. Modes: Fast, Calm (adds a crowd penalty), Step-free.
- The route animates as a line that climbs floors, with a step panel ('Take the elevator to floor 3') and an ETA.
- **Done when:** a route from an outdoor point to a room on a specific floor works; Step-free avoids stairs; Calm differs from Fast when a hotspot exists.

### F4. Simulated crowd map

- Zones (buildings, quads) with occupancy, capacity, and level 0 to 4, updated every few seconds by a simulator (class-change waves, lunch peaks, rain). Drawn as coloured extrusions or a heatmap with a visible 'simulated' badge.
- **Done when:** the crowd layer animates smoothly and responds to the Rain toggle.

### F5. Pin and predict (bottlenecks)

- Pin a place (for example Sorrells) to see a 3-hour occupancy forecast with a p10 to p90 band, the time it hits capacity, and the drivers ('class change 2:20 PM, rain').
- Scenario toggles: Rain, Event nearby, Exam week. Rain pushes people indoors, so indoor study spaces fill sooner.
- The recommendation ranks alternatives by crowd, walking time, and similarity, then explains in one sentence ('Sorrells hits 92% at 2:40 PM; Hunt Library is at 55%, 4 minutes away').
- **Done when:** toggling Rain changes both the forecast and the suggested alternative.

### F6. Evacuation-planning sandbox (stretch)

- An admin-controlled planning scenario assigns synthetic occupants to exits using iterative congestion-weighted routing. It does not connect to alarms or guide real occupants.
- UI: dots flowing toward exits and assembly points, per-exit load gauges, estimated time versus the nearest-exit baseline, and the persistent safety disclaimer from Section 5.2.
- **Done when:** both methods run on identical synthetic conditions, metrics are reproducible from a fixed seed, and the interface never implies operational approval or real-world accuracy.

## 8. Mocks (low-fidelity wireframes)

*v0.3 note: ignore the time slider and night-mode toggle in M1; both are cut. The blue-hour visual theme is fixed for the demo.*

**M1. Main map**

```
+--------------------------------------------------------------+
| [Logo] CMU Campus Pulse    [ Ask anything...        ]  [☾/☀] |
+---------+----------------------------------------------------+
| LAYERS  |                                                    |
| [x]Food |        .-.      3D CAMPUS (tilted, extruded)       |
| [x]Bath |       ( * ) <- pulsing food alert                  |
| [ ]Print|        '-'          ▓▓▓  Hunt                      |
| [x]Event|   ▓▓▓ Gates    [photo]  Robotics Expo 3:00pm       |
| [x]Crowd|                      ░░░ heat column (busy)        |
| [ ]Route|                                                    |
+---------+----------------------------------------------------+
| Time: [-----o--------]  Now  +3h        [Pin a place] [SOS]  |
+--------------------------------------------------------------+
```

**M2. AI assistant and result card**

```
+-------------------------------+   map flies to Hunt Library
| You: closest bathroom to Hunt |   and draws a route
|      Library 2nd floor?       |
| AI : Gender-neutral restroom, |   +------------------------+
|      Hunt 2F near elevators,  |   | Bathroom · Hunt 2F     |
|      ~40 m away.             |   | Gender-neutral, step-  |
|  [Show route] [Next closest]  |   | free · 1 min walk      |
+-------------------------------+   |      [ Navigate ]      |
                                    +------------------------+
```

**M3. Indoor navigation**

```
+-------------------------------------------+-----------------+
|  Floor selector      [ 5 ]                |  ROUTE · 6 min  |
|                      [ 4 ] <- you         |  1. Enter Gates |
|   ___rooms/corridors drawn in 3D___       |  2. Elevator to |
|   o----o----o  (route climbs floors)     |     floor 4     |
|              \_____* destination          |  3. Left, 30 m  |
+-------------------------------------------+-----------------+
```

**M4. Pin and predict (bottleneck)**

```
+------------------------------+
| Sorrells Library      [pin]  |
| Now 71%   [Rain: ON]         |
|  100%|           ___/  <- cap|
|   50%|   ____---/  band      |
|      +-----|-----|-----|---- |
|       now   +1h   +2h   +3h  |
| Full at 2:40 PM (rain, class |
| change). Try Hunt Library:   |
| 55% · 4 min walk  [Go]       |
+------------------------------+
```

**M5. Evacuation mode**

```
+------------------------------------------------------------+
| ⚠ DEMO EVACUATION · Gates-Hillman        Time: 03:12       |
+--------------------------------+---------------------------+
|  3D building, red pulse        | Exit loads                |
|  particles flow to exits       |  North  ▓▓▓▓░░ 68%        |
|  and assembly points           |  East   ▓▓▓▓▓░ 82%        |
|                                |  South  ▓▓░░░░ 35%        |
|                                | Optimized: 4:10 vs 6:55   |
|                                | [Re-balance] [End drill]  |
+--------------------------------+---------------------------+
```

## 9. Architecture and free stack

A static web app where routing, simulation, forecasting, recommendation, and map actions run in the browser, plus one optional serverless function for language-intent extraction. No database is required.

- **Frontend:** Vite + React + TypeScript. Data lives in `/public/data` as JSON. The simulator, router, forecast, and evacuation optimizer are TypeScript modules running in the browser.
- **One optional serverless function** (`/api/chat`) proxies the free LLM so the key never ships to the browser. It returns a structured intent; the browser executes deterministic tools and map actions. It cannot directly call browser-only routing or forecast functions.

| Need | Free choice | Key needed? |
| --- | --- | --- |
| 3D map | MapLibre GL JS (open source) | No |
| Tiles and building heights | OpenFreeMap; fallback MapTiler free tier | No / yes |
| CMU building outlines | OpenStreetMap via Overpass, exported once to static GeoJSON | No |
| Optional intent extraction | Gemini API free tier (alternatives: Groq, OpenRouter free models); deterministic local parser is the required fallback | Optional |
| Weather (optional) | Open-Meteo | No |
| Photos | Hand-picked images in `/public/img`, or placeholder images | No |
| Crowd and route drawing | MapLibre native layers (skip deck.gl to save integration time) | No |
| Charts | Recharts or hand-drawn SVG | No |
| Hosting | Vercel or Netlify free tier (both run the serverless function) | Free account |

Verify in the first 15 minutes: the tile style URL, and the LLM free-tier rate limits and tool-calling support. Free-tier terms change, so check them rather than trusting this table.

**Repo layout (ownership by folder, no overlaps):**

```
/src/app, /src/map, /src/ui, /src/contracts      P1
/public/data/geo (building outlines)             P1
/src/features/pins, /src/features/assistant      P2
/api/chat, /public/data/pins.json, /public/img   P2
/src/features/nav, /src/features/evac            P3
/public/data/nav, /public/data/indoor            P3
/src/features/crowd, /src/features/forecast      P4
/public/data/sim                                 P4
```

**Shared contracts (TypeScript in `/src/contracts`, frozen at T+0:40; only P1/Agent 1 edits them):**

- `Pin {id, kind: food|event|bathroom|printer|study, name, lng, lat, buildingId?, floor?, details, photos[], startsAt?, expiresAt?, tags[], dataStatus: verified|synthetic}`
- `Building {id, name, footprint, heightM, hero}` and `IndoorSchematic {buildingId, floors[{level, rooms[{id, name, rect}], nodes, edges}]}`
- `NavNode {id, lng, lat, buildingId?, floor?, kind}` and `NavEdge {from, to, lengthM, stepFree, indoor}`
- `SimState {minuteOfDay, rain, eventNearby}` and `CrowdZone {id, name, lng, lat, capacity, occupancy, level 0-4}`
- `Forecast {zoneId, minutes[], p10[], p50[], p90[], timeToCapacityMin?, drivers[]}`
- `MapAction` is a discriminated union with a typed payload for each action: `fly_to`, `highlight`, `draw_route`, `open_pin`, `set_layer`, `set_scenario`, and optional `start_evac`.

**Module functions (each owner ships a stub with canned data by T+0:40):**

- P1: `registerLayer(def)`, `dispatchMapAction(action)`, `getMap()`
- P2: `searchPins(filters)`, `askAssistant(text)` returning `{text, actions[]}`
- P3: `route(from, to, {mode, stepFree})`, `planEvac(buildingId, occupancy)`
- P4: `useSimState()`, `setScenario({rain, eventNearby})`, `getCrowd(zoneId)`, `forecast(zoneId)`, `recommend(zoneId)`

## 10. Work breakdown for four people and four Codex agents

Each human owns one workstream and operates one Codex agent. The human is responsible for reviewing diffs, running tests, resolving ambiguity, and communicating interface changes. **An agent edits only its assigned folders.** Shared contracts and integration files belong to P1; other agents request contract changes instead of editing them.

### P1 + Codex Agent 1: Visual system, 3D map, and integration

**Owns:** `/src/app`, `/src/map`, `/src/ui`, `/src/contracts`, `/public/data/geo`

- **T+0:00 to T+0:30:** Scaffold Vite + React + TypeScript, freeze contracts, create module stubs, and deploy the empty shell.
- **T+0:30 to T+1:30:** Build the cinematic MapLibre scene: extruded CMU buildings, palette, fog/sky, labels, lighting, hero-building highlights, responsive glass UI, and the opening camera flyover.
- **T+1:30 visual gate:** capture the thumbnail screenshot and fix visual issues before adding more UI.
- **T+1:30 to T+2:15:** Add layer registry, typed map-action executor, camera presets, layer chips, Rain and Tour controls.
- **T+2:15 to T+4:15:** Integrate P2, P3, and P4 continuously; do not wait for all modules to finish.
- **T+4:15 to T+5:00:** Implement deterministic Tour mode and fix end-to-end blockers.
- **T+5:00 to T+6:00:** Own visual polish, final deployment, README, screenshots, recording, and submission.

**Done when:** the map looks unmistakably 3D at first glance, the demo works without opening developer tools, and every other module can drive it through typed actions.

### P2 + Codex Agent 2: Pins, campus discovery, and assistant

**Owns:** `/src/features/pins`, `/src/features/assistant`, `/api/chat`, `/public/data/pins.json`, `/public/img`

- **T+0:00 to T+0:40:** Create 20 to 30 high-quality pins rather than 60 shallow ones. Include data provenance (`verified` or `synthetic`) and optimized local images only where they improve the demo.
- **T+0:40 to T+1:40:** Build the pin layer, clustering, semantic icons, countdown state, filters, and detail card.
- **T+1:40 to T+2:20:** Implement deterministic local intent parsing and `searchPins`; connect results to typed map actions.
- **T+2:20 to T+3:15:** Optionally add an LLM endpoint that returns structured intents. The browser executes tools; the serverless endpoint does not call browser-only functions.
- **T+3:15 to T+4:15:** Build the assistant sheet, prompt chips, fallbacks, loading/error states, and five scripted queries.
- **T+4:15 to T+5:00:** Cross-browser and mobile QA; help P1 tune labels, cards, and pin density.

**Done when:** the five demo queries work with the runtime LLM disabled and each result produces a correct map action.

### P3 + Codex Agent 3: Routing and spatial logic

**Owns:** `/src/features/nav`, `/public/data/nav`, `/public/data/indoor`; stretch ownership: `/src/features/evac`

- **T+0:00 to T+0:45:** Build the minimal outdoor graph connecting the demo locations and doors.
- **T+0:45 to T+1:30:** Implement and test A* Fast routing; return geometry, ETA, and instructions using the frozen contract.
- **T+1:30 to T+2:30:** Add crowd-weighted Calm routing and the raised glowing route visualization hook.
- **T+2:30 to T+3:30:** Add one polished indoor floor and connect it to the outdoor graph. Add Step-free only where elevator/ramp data is represented.
- **T+3:30 to T+4:30:** Build Route Preview and a lightweight route-follow presentation. Do not implement real location tracking.
- **T+4:30 onward, stretch only:** evacuation-planning sandbox with simulated occupants and a clear non-operational disclaimer.

**Done when:** Fast and Calm visibly differ in the rain scenario, one route reaches a specific destination, and no route relies on invented accessibility claims.

### P4 + Codex Agent 4: Crowd simulation, forecast, and recommendation

**Owns:** `/src/features/crowd`, `/src/features/forecast`, `/src/features/recommendation`, `/public/data/sim`

- **T+0:00 to T+0:40:** Define zones, capacities, scenario state, and contract-valid canned outputs.
- **T+0:40 to T+1:40:** Implement a seeded crowd simulator driven by time, rain, class change, and nearby events.
- **T+1:40 to T+2:30:** Add the map layer definition, legend, high-occupancy glow, tooltips, and visible `Simulated` badge.
- **T+2:30 to T+3:20:** Produce the three-hour forecast and scenario range. Do not call it a statistical confidence interval unless it comes from repeated stochastic runs or a fitted model.
- **T+3:20 to T+4:10:** Rank alternatives using predicted crowding, route time, and resource similarity; provide a deterministic explanation.
- **T+4:10 to T+5:00:** Lock the rainy Sorrells scenario, tune transitions, and help P1 rehearse.

**Done when:** Rain changes the visual environment, Sorrells forecast, recommendation, and Calm route in one coordinated transition.

### Shared Codex agent brief

```text
Project: CMU Campus Pulse, a premium 3D predictive campus map built in six hours.
Team model: four people, each operating one Codex agent. Read the complete PRD.
You are Agent <N> supporting Person <P>. Edit only: <owned folders>.

Rules:
1. Follow /src/contracts exactly. Only P1/Agent 1 edits contracts and integration files.
2. Before implementation, inspect the repository and report any conflict with existing work.
3. Ship a contract-valid stub by T+0:40 so integration never waits on your full feature.
4. Preserve other agents' changes. Never rewrite or reformat files outside your ownership.
5. Mark verified and synthetic data explicitly; never present invented campus details as facts.
6. No secrets in git. Runtime keys live in deployment environment variables.
7. Prefer deterministic demo behavior over fragile network calls.
8. Run the narrowest relevant tests after each task and state exactly what passed or failed.
9. Make small commits labeled with the task ID. Do not claim completion when a Done condition fails.
10. Stop adding features at T+5:00. During the final hour, fix blockers and visual defects only.
11. If blocked by another module, continue against its frozen stub and notify the owning person.
12. Maintain the visual system: reuse tokens, motion, panels, icons, and map actions; do not invent a competing style.
```

## 11. Six-hour schedule

| Relative time | Milestone |
| --- | --- |
| T+0:00 to T+0:15 | Assign P1–P4, confirm submission format, run the app, and open one shared blocker list |
| T+0:15 to T+0:40 | Freeze contracts; every workstream returns a contract-valid stub |
| T+0:40 to T+1:30 | Parallel build; P1 completes the cinematic 3D visual foundation |
| T+1:30 | Visual gate: screenshot review; map must already look judge-ready |
| T+1:30 to T+3:00 | Pins, routing, crowd model, forecast, and map actions built against stubs |
| T+3:00 | First integrated path: open map → select Sorrells → show forecast → recommend Hunt |
| T+3:00 to T+4:15 | Add assistant, Calm route, one indoor floor, transitions, and mobile layout |
| T+4:15 | Full two-minute demo run; cut anything that blocks it |
| T+4:15 to T+5:00 | Tour mode, deterministic seed, bug fixes, performance pass, rehearsal |
| T+5:00 | Feature freeze |
| T+5:00 to T+5:30 | Visual polish, accessibility check, phone QA, and final deployment |
| T+5:30 to T+5:50 | Record backup video, take screenshots, finalize README and pitch |
| T+5:50 to T+6:00 | Submit and verify every submitted link from a clean/incognito session |

## 12. Demo script (2 minutes)

1. **Open (15s):** automatic flyover of the 3D campus with the crowd layer breathing.
2. **Pins (30s):** tap a pulsing food pin ('free pizza, about 20 min left'), then an event pin and swipe its photos.
3. **AI (30s):** ask 'anything interesting related to robotics today?' and 'closest bathroom to Hunt 2nd floor?'; the map reacts, then draw the route through the building with Step-free on.
4. **Predict (30s):** pin Sorrells and switch Rain on. In one coordinated transition the sky darkens, rain appears, Wean glows warmer, the forecast rises, and Hunt becomes the recommended alternative.
5. **Route (10s):** accept Hunt; show the glowing Calm route bend around the simulated hotspot.
6. **Close (5s):** structured language intent, scenario forecasting, and congestion-aware routing. If the evacuation sandbox is complete, mention it after the primary demo rather than risking the core two-minute flow.

## 13. Risks and cut order

- **Free LLM rate limits or outage:** keyword-search fallback in P2-04, and the Tour mode needs no LLM.
- **Free tile service down:** switch to the tested fallback style; verify both at T+0:15 and T+5:00.
- **Indoor data eats time:** stop after one polished floor at T+3:30; never sacrifice the core outdoor demo.
- **Late integration:** stubs by T+0:40, first core end-to-end path by T+3:00, full demo by T+4:15.
- **3D performance:** simplified geometry; test on the demo laptop early.
- **Judges mistake simulation for real data:** keep the 'simulated' badges and say so in the pitch.
- **If we fall behind, cut in this order:** evacuation sandbox, second indoor building, event photo gallery, runtime LLM, route-follow mode, step-free polish. Preserve the 3D map, Rain transformation, forecast, recommendation, Calm route, and Tour mode because they are the judging story.
