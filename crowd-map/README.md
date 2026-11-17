# Simulated crowd map

Serve the repository root and open `/crowd-map/`:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

The interface uses the same terracotta, cream, sand, sienna, ink, muted, paper,
rust, and border tokens documented in `ai-assist/README-colors.md`. All occupancy
values and movement are deterministic synthetic demo data.

The local `assets/` photo set matches the 3D map's food and event marker imagery so
future combined-map views can use the same offline visual language.
