# 3D map and pins

Serve the repository root and open `/3d-map/`:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

The feature has no package dependencies. Building footprints are a small local subset derived from OpenStreetMap and are attributed in the interface. Seeded pins and indoor preview geometry are visibly labelled as demo data.

## Navigation integration

Selecting **Navigate here** dispatches a browser event:

```js
window.addEventListener("campus-pulse:navigate", ({ detail }) => {
  // detail.destinationType: "building" | "pin" | "room"
  // detail includes the applicable buildingId, floor, roomId, and coordinates.
});
```

Indoor room events currently use `dataStatus: "demo"`. Replace the geometry in `data.js` with validated blueprint-derived exports before changing that provenance.

## Visual QA routes

- `/3d-map/` — campus overview
- `/3d-map/?select=food-cohon` — selected pin and gallery card
- `/3d-map/?building=wean` — hero-building camera
- `/3d-map/?indoor=wean` — indoor demo floor
