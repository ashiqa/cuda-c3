const { buildings, pins, indoorDemo, bounds } = window.CAMPUS_DATA;
const svgNS = "http://www.w3.org/2000/svg";

const COLORS = {
  food: "#ffb45f",
  event: "#ee75cb",
  bathroom: "#67dced",
  printer: "#a790ff",
};

const ICONS = {
  food: "✦",
  event: "◈",
  bathroom: "●",
  printer: "▣",
};

const PHOTO_ASSETS = {
  food: "./assets/free-food-pin.jpg",
  event: "./assets/student-event-pin.jpg",
};

const state = {
  visibleLayers: new Set(["food", "event", "bathroom", "printer"]),
  crowdVisible: true,
  routeVisible: true,
  raining: false,
  selected: null,
  routeDestination: null,
  camera: "overview",
  cameraScale: 1,
  indoor: null,
  indoorFloor: null,
  selectedRoom: null,
  galleryIndex: 0,
};

const byId = (id) => document.getElementById(id);
const layers = {
  buildings: byId("buildingLayer"),
  labels: byId("labelLayer"),
  pins: byId("pinLayer"),
  crowd: byId("crowdGlowLayer"),
  route: byId("routeLayer"),
  indoor: byId("indoorLayer"),
  rain: byId("rainLayer"),
};

const foodStart = Date.now();
pins.forEach((pin) => {
  if (pin.kind === "food") pin.expiresAt = foodStart + pin.durationMinutes * 60 * 1000;
});

function svg(tag, attributes = {}) {
  const node = document.createElementNS(svgNS, tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function polygonString(points) {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function project([lon, lat]) {
  const rawX = 105 + ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 990;
  const rawY = 65 + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 630;
  const angle = -8 * (Math.PI / 180);
  const dx = rawX - 600;
  const dy = rawY - 380;
  const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
  const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
  return [600 + rotatedX, 380 + rotatedY * 0.78];
}

function centroid(points) {
  const total = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
  return [total[0] / points.length, total[1] / points.length];
}

function heightPixels(building) {
  return Math.max(22, building.height * 1.2);
}

function buildingFor(id) {
  return buildings.find((building) => building.id === id);
}

function pinFor(id) {
  return pins.find((pin) => pin.id === id);
}

function getBuildingGeometry(building) {
  const base = building.polygon.map(project);
  const height = heightPixels(building);
  const top = base.map(([x, y]) => [x, y - height]);
  return { base, top, center: centroid(top), groundCenter: centroid(base), height };
}

function renderBuildings() {
  const ordered = [...buildings]
    .map((building) => ({ building, geometry: getBuildingGeometry(building) }))
    .sort((a, b) => a.geometry.groundCenter[1] - b.geometry.groundCenter[1]);

  ordered.forEach(({ building, geometry }, index) => {
    building.geometry = geometry;
    const halo = svg("ellipse", {
      class: "crowd-halo",
      cx: geometry.groundCenter[0],
      cy: geometry.groundCenter[1] + 6,
      rx: building.hero ? 62 : 44,
      ry: building.hero ? 25 : 18,
      fill: index % 3 === 0 ? "#ff785d" : index % 3 === 1 ? "#ffb45f" : "#6ee1a3",
    });
    layers.crowd.appendChild(halo);

    const group = svg("g", {
      id: `building-${building.id}`,
      class: "building-group",
      role: "button",
      tabindex: "0",
      "aria-label": `${building.name}, ${building.category}, OpenStreetMap footprint`,
    });

    geometry.base.forEach((point, edgeIndex) => {
      const next = (edgeIndex + 1) % geometry.base.length;
      const side = svg("polygon", {
        class: "building-side",
        points: polygonString([point, geometry.base[next], geometry.top[next], geometry.top[edgeIndex]]),
      });
      const edgeShade = 19 + Math.round((edgeIndex / geometry.base.length) * 10);
      side.style.fill = `hsl(20 38% ${edgeShade}%)`;
      group.appendChild(side);
    });

    const roof = svg("polygon", {
      class: `building-roof${building.hero ? " hero" : ""}`,
      points: polygonString(geometry.top),
    });
    group.appendChild(roof);

    if (geometry.top.length > 2) {
      const windowBand = svg("path", {
        class: "window-band",
        d: `M${geometry.base[0][0].toFixed(1)} ${(geometry.base[0][1] - geometry.height * .46).toFixed(1)} L${geometry.base[1][0].toFixed(1)} ${(geometry.base[1][1] - geometry.height * .46).toFixed(1)}`,
      });
      group.appendChild(windowBand);
    }

    const select = () => selectBuilding(building.id);
    group.addEventListener("click", select);
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    });
    layers.buildings.appendChild(group);

    const label = svg("g", { class: "building-label", id: `label-${building.id}` });
    if (building.hero) {
      label.appendChild(svg("circle", { class: "hero-dot", cx: geometry.center[0], cy: geometry.center[1] - 28, r: 3 }));
    }
    const name = svg("text", { x: geometry.center[0], y: geometry.center[1] - 14 });
    name.textContent = building.shortName;
    const sub = svg("text", { class: "sub", x: geometry.center[0], y: geometry.center[1] - 3 });
    sub.textContent = building.hero ? "HERO BUILDING" : "OSM FOOTPRINT";
    label.append(name, sub);
    layers.labels.appendChild(label);
  });
}

function pinPosition(pin) {
  const building = buildingFor(pin.buildingId);
  const [x, y] = project(pin.coordinates);
  return [x, y - (building ? heightPixels(building) : 24) - 9];
}

function pinSubtitle(pin) {
  if (pin.kind === "food") return countdownText(pin);
  if (pin.kind === "event") return pin.timeLabel;
  return `${buildingFor(pin.buildingId)?.shortName || "Campus"} · Floor ${pin.floor}`;
}

function pinLabelOffset(id) {
  return {
    "food-cohon": [-44, -54],
    "bathroom-cohon": [52, -43],
    "food-wean": [43, -50],
    "printer-wean": [-62, -51],
    "bathroom-hunt": [49, -43],
    "printer-hunt": [-59, -42],
  }[id] || [0, -42];
}

function renderPins() {
  pins.forEach((pin, index) => {
    const [x, y] = pinPosition(pin);
    const color = COLORS[pin.kind];
    const hasPhoto = Boolean(PHOTO_ASSETS[pin.kind]);
    const group = svg("g", {
      id: `pin-${pin.id}`,
      class: `pin${hasPhoto ? " photo-pin" : ""}`,
      role: "button",
      tabindex: "0",
      transform: `translate(${x} ${y})`,
      style: `animation-delay:${220 + index * 70}ms`,
      "aria-label": `${pin.name}, ${pin.kind}, ${pinSubtitle(pin)}, Demo data`,
    });
    group.appendChild(svg("line", { class: "pin-stem", x1: 0, y1: 0, x2: 0, y2: hasPhoto ? 31 : 23 }));
    if (hasPhoto) {
      const clipId = `photo-clip-${pin.id}`;
      const clip = svg("clipPath", { id: clipId });
      clip.appendChild(svg("circle", { cx: 0, cy: 0, r: 22 }));
      document.querySelector("#campusMap defs").appendChild(clip);
      group.appendChild(svg("circle", { class: "pin-photo-pulse", cx: 0, cy: 0, r: 29, fill: color }));
      group.appendChild(svg("circle", { class: "pin-photo-frame", cx: 0, cy: 0, r: 25, fill: color }));
      group.appendChild(svg("image", {
        class: "pin-photo-image",
        href: PHOTO_ASSETS[pin.kind],
        x: -22,
        y: -22,
        width: 44,
        height: 44,
        preserveAspectRatio: "xMidYMid slice",
        "clip-path": `url(#${clipId})`,
      }));
      group.appendChild(svg("circle", { class: "pin-photo-badge", cx: 19, cy: 17, r: 9, fill: color }));
      const badge = svg("text", { class: "pin-photo-badge-icon", x: 19, y: 18 });
      badge.textContent = ICONS[pin.kind];
      group.appendChild(badge);
    } else {
      group.appendChild(svg("circle", { class: "pin-ring", cx: 0, cy: 0, r: 14, fill: color }));
      const icon = svg("text", { class: "pin-core", x: 0, y: 1 });
      icon.textContent = ICONS[pin.kind];
      group.appendChild(icon);
    }

    const labelWidth = Math.max(84, Math.min(132, pin.name.length * 5.4));
    const [labelX, baseLabelY] = pinLabelOffset(pin.id);
    const labelY = baseLabelY - (hasPhoto ? 17 : 0);
    const label = svg("g", { class: "pin-label", transform: `translate(${labelX} ${labelY})` });
    label.appendChild(svg("rect", { x: -labelWidth / 2, y: -16, width: labelWidth, height: 30, rx: 8 }));
    const title = svg("text", { x: 0, y: -4 });
    title.textContent = pin.name;
    const sub = svg("text", { class: "pin-sub", id: `pin-sub-${pin.id}`, x: 0, y: 7 });
    sub.textContent = pinSubtitle(pin);
    label.append(title, sub);
    group.appendChild(label);

    const select = () => selectPin(pin.id);
    group.addEventListener("click", (event) => {
      event.stopPropagation();
      select();
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    });
    layers.pins.appendChild(group);
  });
}

function renderRain() {
  for (let index = 0; index < 85; index += 1) {
    const x = (index * 83) % 1270;
    const y = (index * 57) % 720;
    layers.rain.appendChild(svg("line", {
      class: "rain-drop",
      x1: x,
      y1: y,
      x2: x - 8,
      y2: y + 22,
      "stroke-width": index % 4 === 0 ? 1.4 : .8,
      style: `animation-delay:${-(index % 13) * .1}s;animation-duration:${.75 + (index % 7) * .08}s`,
    }));
  }
}

function clearSelection() {
  document.querySelectorAll(".building-group.selected,.pin.selected,.room.selected").forEach((node) => node.classList.remove("selected"));
}

function selectBuilding(id) {
  if (state.indoor) return;
  const building = buildingFor(id);
  if (!building) return;
  clearSelection();
  byId(`building-${id}`).classList.add("selected");
  state.selected = { type: "building", id };
  showBuildingCard(building);
  setCamera(building.hero ? id : "overview", building.hero ? 1.48 : Math.max(state.cameraScale, 1.08));
  updateCaption(building.name, `${building.category} · Select Navigate or explore floors`);
}

function selectPin(id) {
  if (state.indoor) return;
  const pin = pinFor(id);
  if (!pin) return;
  clearSelection();
  byId(`pin-${id}`).classList.add("selected");
  state.selected = { type: "pin", id };
  state.galleryIndex = 0;
  showPinCard(pin);
  focusCoordinate(pin.coordinates, 1.52);
  updateCaption(pin.name, pinSubtitle(pin));
}

function cardStat(label, value) {
  return `<span class="card-stat"><strong>${value}</strong>${label}</span>`;
}

function showBuildingCard(building) {
  byId("gallery").hidden = true;
  byId("cardKind").textContent = "BUILDING";
  byId("cardKind").style.color = "var(--cyan)";
  byId("demoChip").textContent = "OSM FOOTPRINT";
  byId("cardTitle").textContent = building.name;
  byId("cardSubtitle").textContent = building.category;
  byId("cardStats").innerHTML = `${cardStat("height", `${building.height}m fallback`)}${building.floors ? cardStat("floors", building.floors.length) : ""}`;
  byId("cardDescription").textContent = building.description;
  byId("indoorButton").hidden = !indoorDemo[building.id];
  byId("navigateButton").dataset.type = "building";
  byId("navigateButton").dataset.id = building.id;
  openCard();
}

function showPinCard(pin) {
  const color = COLORS[pin.kind];
  byId("cardKind").textContent = pin.kind.toUpperCase();
  byId("cardKind").style.color = color;
  byId("demoChip").textContent = "DEMO DATA";
  byId("cardTitle").textContent = pin.name;
  byId("cardSubtitle").textContent = `${buildingFor(pin.buildingId)?.name || "Campus"} · Floor ${pin.floor}`;
  const mainStat = pin.kind === "food" ? countdownText(pin) : pin.kind === "event" ? pin.timeLabel : pin.attributes?.[0] || "Campus amenity";
  const extraStats = pin.attributes?.slice(1).map((item) => cardStat("", item)).join("") || "";
  byId("cardStats").innerHTML = `${cardStat(pin.kind === "food" ? "remaining" : "", mainStat)}${extraStats}`;
  byId("cardDescription").textContent = pin.details;
  byId("indoorButton").hidden = true;
  byId("navigateButton").dataset.type = "pin";
  byId("navigateButton").dataset.id = pin.id;
  renderGallery(pin);
  openCard();
}

function openCard() {
  byId("detailCard").classList.add("open");
  byId("detailCard").setAttribute("aria-hidden", "false");
}

function closeCard() {
  byId("detailCard").classList.remove("open");
  byId("detailCard").setAttribute("aria-hidden", "true");
  clearSelection();
  state.selected = null;
}

function renderGallery(pin) {
  const gallery = byId("gallery");
  if (!pin.gallery?.length) {
    gallery.hidden = true;
    return;
  }
  gallery.hidden = false;
  const current = pin.gallery[state.galleryIndex];
  byId("galleryMain").className = `gallery-main ${current}`;
  byId("galleryCount").textContent = `${state.galleryIndex + 1} / ${pin.gallery.length}`;
  byId("galleryThumbs").innerHTML = "";
  pin.gallery.forEach((imageClass, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `${imageClass}${index === state.galleryIndex ? " active" : ""}`;
    button.setAttribute("aria-label", `Show gallery image ${index + 1}`);
    button.addEventListener("click", () => {
      state.galleryIndex = index;
      renderGallery(pin);
    });
    byId("galleryThumbs").appendChild(button);
  });
}

function countdownText(pin) {
  const minutes = Math.max(0, Math.ceil((pin.expiresAt - Date.now()) / 60000));
  return minutes > 0 ? `about ${minutes} min left` : "just ended";
}

function updateCountdowns() {
  pins.filter((pin) => pin.kind === "food").forEach((pin) => {
    const subtitle = byId(`pin-sub-${pin.id}`);
    if (subtitle) subtitle.textContent = countdownText(pin);
    if (state.selected?.type === "pin" && state.selected.id === pin.id) showPinCard(pin);
  });
  const liveFood = pins.filter((pin) => pin.kind === "food" && pin.expiresAt > Date.now()).length;
  byId("foodCount").textContent = `${liveFood} live`;
}

function setCamera(name, overrideScale) {
  if (state.indoor) return;
  const camera = byId("cameraGroup");
  let target = [600, 380];
  let scale = overrideScale || 1;
  if (name === "wean" || name === "hunt") {
    target = buildingFor(name).geometry.center;
    scale = overrideScale || 1.72;
  }
  state.camera = name;
  state.cameraScale = scale;
  camera.style.transformOrigin = `${target[0]}px ${target[1]}px`;
  camera.style.transform = `translate(${600 - target[0]}px, ${380 - target[1]}px) scale(${scale})`;
  document.querySelectorAll("[data-camera]").forEach((button) => button.classList.toggle("active", button.dataset.camera === name));
}

function focusCoordinate(coordinates, scale) {
  const target = project(coordinates);
  const camera = byId("cameraGroup");
  state.cameraScale = scale;
  camera.style.transformOrigin = `${target[0]}px ${target[1]}px`;
  camera.style.transform = `translate(${600 - target[0]}px, ${380 - target[1]}px) scale(${scale})`;
  document.querySelectorAll("[data-camera]").forEach((button) => button.classList.remove("active"));
}

function changeZoom(delta) {
  if (state.indoor) return;
  const next = Math.max(.82, Math.min(2.25, state.cameraScale + delta));
  setCamera(state.camera, next);
}

function toggleLayer(kind) {
  state.visibleLayers.has(kind) ? state.visibleLayers.delete(kind) : state.visibleLayers.add(kind);
  document.querySelector(`[data-layer="${kind}"]`).setAttribute("aria-pressed", String(state.visibleLayers.has(kind)));
  pins.filter((pin) => pin.kind === kind).forEach((pin) => byId(`pin-${pin.id}`).classList.toggle("hidden", !state.visibleLayers.has(kind)));
}

function setLayerVisibility(kind, visible) {
  if (!COLORS[kind]) return;
  const isVisible = state.visibleLayers.has(kind);
  if (isVisible !== visible) toggleLayer(kind);
}

function highlightPins(pinIds = []) {
  clearSelection();
  const validPins = pinIds.map(pinFor).filter(Boolean);
  validPins.forEach((pin) => {
    setLayerVisibility(pin.kind, true);
    byId(`pin-${pin.id}`).classList.add("selected");
  });
  if (validPins[0]) {
    focusCoordinate(validPins[0].coordinates, 1.34);
    updateCaption(`${validPins.length} result${validPins.length === 1 ? "" : "s"} highlighted`, "Assistant moved the map");
  }
}

function executeAssistantActions(answer = {}) {
  const actions = Array.isArray(answer.actions) ? answer.actions : [];
  actions.forEach((action) => {
    const payload = action.payload || {};
    if (action.type === "fly_to" && buildingFor(payload.buildingId)) {
      selectBuilding(payload.buildingId);
    }
    if (action.type === "highlight") highlightPins(payload.pinIds);
    if (action.type === "open_pin" && pinFor(payload.pinId)) selectPin(payload.pinId);
    if (action.type === "set_layer") setLayerVisibility(payload.layer, payload.visible !== false);
    if (action.type === "set_scenario" && typeof payload.rain === "boolean" && payload.rain !== state.raining) toggleRain();
    if (action.type === "draw_route") {
      const destination = payload.route?.destination || payload.destination || {};
      if (destination.pinId && pinFor(destination.pinId)) navigateTo("pin", destination.pinId);
      else if (destination.buildingId && buildingFor(destination.buildingId)) navigateTo("building", destination.buildingId);
      else if (Array.isArray(destination.coordinates)) drawRoute(destination.coordinates);
    }
  });
  if (actions.length) showToast(`Assistant applied ${actions.length} map action${actions.length === 1 ? "" : "s"}`);
}

function toggleRain() {
  state.raining = !state.raining;
  if (window.campusAssistantContext) window.campusAssistantContext.rain = state.raining;
  document.body.classList.toggle("raining", state.raining);
  byId("rainButton").setAttribute("aria-pressed", String(state.raining));
  showToast(state.raining ? "Rain scenario on · paths darkened, indoor pins stay visible" : "Rain scenario off · dry campus view restored");
}

function navigateTo(type, id) {
  const destination = type === "pin" ? pinFor(id) : buildingFor(id);
  if (!destination) return;
  const coordinates = type === "pin" ? destination.coordinates : buildingFor(id).polygon[0];
  drawRoute(coordinates);
  state.routeDestination = { type, id };
  byId("routeStatus").textContent = `To ${destination.name}`;
  const detail = type === "pin"
    ? { destinationType: "pin", pinId: destination.id, buildingId: destination.buildingId, floor: destination.floor, label: destination.name, coordinates: destination.coordinates, dataStatus: destination.dataStatus }
    : { destinationType: "building", buildingId: destination.id, label: destination.name, coordinates, dataStatus: "osm-footprint" };
  window.dispatchEvent(new CustomEvent("campus-pulse:navigate", { detail }));
  showToast(`Route ready · ${destination.name}`);
}

function drawRoute(destinationCoordinates) {
  layers.route.innerHTML = "";
  const origin = project([-79.9461, 40.44355]);
  const destination = project(destinationCoordinates);
  const lift = Math.max(48, Math.abs(destination[0] - origin[0]) * .13);
  const controlX = (origin[0] + destination[0]) / 2;
  const controlY = Math.min(origin[1], destination[1]) - lift;
  const path = `M${origin[0].toFixed(1)} ${origin[1].toFixed(1)} Q${controlX.toFixed(1)} ${controlY.toFixed(1)} ${destination[0].toFixed(1)} ${destination[1].toFixed(1)}`;
  layers.route.appendChild(svg("path", { class: "route-path", d: path }));
  layers.route.appendChild(svg("path", { class: "route-dash", d: path }));
  layers.route.appendChild(svg("circle", { class: "route-origin", cx: origin[0], cy: origin[1], r: 6 }));
}

function openIndoor(buildingId) {
  const building = buildingFor(buildingId);
  if (!building || !indoorDemo[buildingId]) return;
  state.indoor = buildingId;
  state.indoorFloor = building.floors[0];
  state.selectedRoom = null;
  document.body.classList.add("indoor-mode");
  layers.indoor.style.opacity = "1";
  layers.buildings.style.opacity = ".035";
  layers.pins.style.opacity = ".035";
  layers.labels.style.opacity = ".035";
  layers.crowd.style.opacity = ".035";
  byId("indoorToolbar").classList.add("open");
  byId("indoorToolbar").setAttribute("aria-hidden", "false");
  byId("indoorBuilding").textContent = building.name;
  byId("detailCard").classList.remove("open");
  byId("cameraGroup").style.transformOrigin = "600px 380px";
  byId("cameraGroup").style.transform = "scale(1)";
  renderFloorPicker();
  renderIndoorFloor();
  updateCaption(`${building.name} · Floor ${state.indoorFloor}`, "Demo geometry · Blueprint source pending");
}

function closeIndoor() {
  document.body.classList.remove("indoor-mode");
  layers.indoor.style.opacity = "0";
  layers.buildings.style.opacity = "";
  layers.pins.style.opacity = "";
  layers.labels.style.opacity = "";
  layers.crowd.style.opacity = "";
  byId("indoorToolbar").classList.remove("open");
  byId("indoorToolbar").setAttribute("aria-hidden", "true");
  layers.indoor.innerHTML = "";
  const previous = state.indoor;
  state.indoor = null;
  state.indoorFloor = null;
  setCamera(previous, 1.62);
  updateCaption(buildingFor(previous).name, "Outdoor view restored");
}

function renderFloorPicker() {
  const building = buildingFor(state.indoor);
  byId("floorPicker").innerHTML = "";
  building.floors.forEach((floor) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = floor;
    button.classList.toggle("active", floor === state.indoorFloor);
    button.setAttribute("aria-label", `Show floor ${floor}`);
    button.addEventListener("click", () => {
      state.indoorFloor = floor;
      state.selectedRoom = null;
      renderFloorPicker();
      renderIndoorFloor();
      updateCaption(`${building.name} · Floor ${floor}`, "Demo geometry · Blueprint source pending");
    });
    byId("floorPicker").appendChild(button);
  });
}

function indoorPoint([nx, ny]) {
  const x = 280 + nx * 570 + ny * 110;
  const y = 190 + ny * 365 - nx * 62;
  return [x, y];
}

function renderIndoorFloor() {
  const building = buildingFor(state.indoor);
  const rooms = indoorDemo[state.indoor][state.indoorFloor];
  layers.indoor.innerHTML = "";
  layers.indoor.appendChild(svg("rect", { class: "indoor-scrim", x: 185, y: 105, width: 830, height: 585, rx: 38 }));
  const slabPoints = [[.02,.04],[.96,.04],[.96,.96],[.02,.96]].map(indoorPoint);
  layers.indoor.appendChild(svg("polygon", { class: "indoor-slab", points: polygonString(slabPoints) }));
  const title = svg("text", { class: "floor-title", x: 315, y: 162 });
  title.textContent = `${building.name} · ${state.indoorFloor}F`;
  const subtitle = svg("text", { class: "floor-subtitle", x: 315, y: 180 });
  subtitle.textContent = "DEMO GEOMETRY · NOT BLUEPRINT-DERIVED";
  layers.indoor.append(title, subtitle);

  rooms.forEach((room) => {
    const group = svg("g", { class: `room${room.type === "Corridor" ? " corridor" : ""}`, role: "button", tabindex: "0", "aria-label": `${room.name}, ${room.type}, Demo geometry` });
    const points = room.polygon.map(indoorPoint);
    group.appendChild(svg("polygon", { points: polygonString(points) }));
    const center = centroid(points);
    const name = svg("text", { x: center[0], y: center[1] - 3 });
    name.textContent = room.name;
    const sub = svg("text", { class: "room-sub", x: center[0], y: center[1] + 10 });
    sub.textContent = room.type.toUpperCase();
    const door = indoorPoint(room.doorway);
    group.append(name, sub, svg("circle", { class: "door", cx: door[0], cy: door[1], r: 4 }));
    const select = () => selectRoom(room);
    group.addEventListener("click", select);
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    });
    layers.indoor.appendChild(group);
  });
}

function selectRoom(room) {
  state.selectedRoom = room.id;
  clearSelection();
  const roomNodes = [...layers.indoor.querySelectorAll(".room")];
  const index = indoorDemo[state.indoor][state.indoorFloor].findIndex((item) => item.id === room.id);
  roomNodes[index]?.classList.add("selected");
  byId("gallery").hidden = true;
  byId("cardKind").textContent = "ROOM";
  byId("cardKind").style.color = "var(--food)";
  byId("demoChip").textContent = "DEMO GEOMETRY";
  byId("cardTitle").textContent = room.name;
  byId("cardSubtitle").textContent = `${buildingFor(state.indoor).name} · Floor ${state.indoorFloor}`;
  byId("cardStats").innerHTML = `${cardStat("type", room.type)}${cardStat("status", "Source pending")}`;
  byId("cardDescription").textContent = "This selectable indoor destination demonstrates the room contract. Geometry must be replaced with a validated blueprint-derived export before production use.";
  byId("indoorButton").hidden = true;
  byId("navigateButton").dataset.type = "room";
  byId("navigateButton").dataset.id = room.id;
  openCard();
}

function navigateToRoom(roomId) {
  const room = indoorDemo[state.indoor][state.indoorFloor].find((item) => item.id === roomId);
  const detail = {
    destinationType: "room",
    buildingId: state.indoor,
    floor: state.indoorFloor,
    roomId,
    label: room.name,
    doorway: room.doorway,
    dataStatus: "demo",
  };
  window.dispatchEvent(new CustomEvent("campus-pulse:navigate", { detail }));
  showToast(`Indoor destination ready · ${room.name}`);
}

function runSearch(query) {
  const normalized = query.trim().toLowerCase();
  const results = [];
  if (normalized) {
    buildings.forEach((building) => {
      if (`${building.name} ${building.category}`.toLowerCase().includes(normalized)) results.push({ type: "building", item: building });
    });
    pins.forEach((pin) => {
      if (`${pin.name} ${pin.kind} ${buildingFor(pin.buildingId)?.name}`.toLowerCase().includes(normalized)) results.push({ type: "pin", item: pin });
    });
    Object.entries(indoorDemo).forEach(([buildingId, floors]) => {
      Object.entries(floors).forEach(([floor, rooms]) => rooms.forEach((room) => {
        if (room.name.toLowerCase().includes(normalized)) results.push({ type: "room", item: room, buildingId, floor });
      }));
    });
  }
  renderSearchResults(results.slice(0, 6));
}

function renderSearchResults(results) {
  const container = byId("searchResults");
  container.innerHTML = "";
  if (!results.length) {
    container.hidden = true;
    return;
  }
  results.forEach((result) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    const title = result.item.name;
    const subtitle = result.type === "pin" ? `${result.item.kind} · ${buildingFor(result.item.buildingId).name}` : result.type === "room" ? `${buildingFor(result.buildingId).name} · ${result.floor}F · Demo` : result.item.category;
    button.innerHTML = `<span>${result.type === "pin" ? ICONS[result.item.kind] : result.type === "room" ? "R" : result.item.shortName.slice(0,2)}</span><span><strong>${title}</strong><small>${subtitle}</small></span><em>→</em>`;
    button.addEventListener("click", () => {
      container.hidden = true;
      byId("searchInput").value = title;
      if (result.type === "building") selectBuilding(result.item.id);
      if (result.type === "pin") selectPin(result.item.id);
      if (result.type === "room") {
        openIndoor(result.buildingId);
        state.indoorFloor = result.floor;
        renderFloorPicker();
        renderIndoorFloor();
        selectRoom(result.item);
      }
    });
    container.appendChild(button);
  });
  container.hidden = false;
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function updateCaption(title, copy) {
  byId("captionTitle").textContent = title;
  byId("captionCopy").textContent = copy;
}

function bindEvents() {
  document.querySelectorAll("[data-layer]").forEach((button) => button.addEventListener("click", () => toggleLayer(button.dataset.layer)));
  document.querySelectorAll("[data-camera]").forEach((button) => button.addEventListener("click", () => setCamera(button.dataset.camera)));
  byId("rainButton").addEventListener("click", toggleRain);
  byId("crowdToggle").addEventListener("click", () => {
    state.crowdVisible = !state.crowdVisible;
    document.body.classList.toggle("crowd-hidden", !state.crowdVisible);
    byId("crowdToggle").setAttribute("aria-pressed", String(state.crowdVisible));
  });
  byId("routeToggle").addEventListener("click", () => {
    state.routeVisible = !state.routeVisible;
    document.body.classList.toggle("route-hidden", !state.routeVisible);
    byId("routeToggle").setAttribute("aria-pressed", String(state.routeVisible));
  });
  byId("zoomIn").addEventListener("click", () => changeZoom(.18));
  byId("zoomOut").addEventListener("click", () => changeZoom(-.18));
  byId("resetCamera").addEventListener("click", () => setCamera("overview"));
  byId("closeCard").addEventListener("click", closeCard);
  byId("indoorButton").addEventListener("click", () => {
    if (state.selected?.type === "building") openIndoor(state.selected.id);
  });
  byId("exitIndoor").addEventListener("click", closeIndoor);
  byId("navigateButton").addEventListener("click", (event) => {
    const { type, id } = event.currentTarget.dataset;
    if (type === "room") navigateToRoom(id);
    else navigateTo(type, id);
  });
  byId("collapseLayers").addEventListener("click", () => {
    byId("collapseLayers").textContent = byId("layersPanel")?.classList?.contains("collapsed") ? "−" : "+";
    document.querySelector(".layers-panel").classList.toggle("collapsed");
  });
  byId("searchInput").addEventListener("input", (event) => runSearch(event.target.value));
  byId("searchForm").addEventListener("submit", (event) => event.preventDefault());
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      byId("searchInput").focus();
    }
    if (event.key === "Escape") {
      byId("searchResults").hidden = true;
      if (state.indoor) closeIndoor();
      else closeCard();
    }
  });
  window.addEventListener("campus-pulse:assistant-actions", (event) => executeAssistantActions(event.detail));
}

function initialize() {
  window.campusAssistantContext = {
    ...(window.campusAssistantContext || {}),
    pins,
    rain: state.raining,
  };
  renderBuildings();
  renderPins();
  renderRain();
  bindEvents();
  document.body.classList.add("opening");
  window.requestAnimationFrame(() => window.setTimeout(() => document.body.classList.remove("opening"), 120));
  const params = new URLSearchParams(window.location.search);
  window.setTimeout(() => {
    if (params.get("indoor") && indoorDemo[params.get("indoor")]) {
      openIndoor(params.get("indoor"));
    } else if (params.get("select") && pinFor(params.get("select"))) {
      selectPin(params.get("select"));
    } else if (params.get("building") && buildingFor(params.get("building"))) {
      selectBuilding(params.get("building"));
    } else {
      showToast("Map ready · select a building or pin to explore");
    }
  }, 1700);
  window.setInterval(updateCountdowns, 1000);
}

initialize();
