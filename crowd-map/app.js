const LEVELS = [
  { min: 0, color: "#D8CDBB", top: "#FFFDF7", front: "#D8C8B8", side: "#E8DCD0", label: "Quiet" },
  { min: 35, color: "#F4A460", top: "#F7C38F", front: "#D8945C", side: "#E8AB73", label: "Open" },
  { min: 55, color: "#E9824C", top: "#F29A68", front: "#C86840", side: "#DD7B4E", label: "Active" },
  { min: 75, color: "#E35336", top: "#EE765C", front: "#B9442E", side: "#D5573D", label: "Busy" },
  { min: 90, color: "#8F321E", top: "#B9573E", front: "#732816", side: "#913824", label: "At capacity" },
];

const SCENARIOS = {
  steady: {
    time: "2:18",
    progress: 31,
    headline: "Tuesday · 2:18 PM",
    title: "Campus activity is rising",
    copy: "Class change begins in 2 minutes. Expect the busiest paths between Wean, Gates, and the Cut.",
    classImpact: "+18%",
  },
  class: {
    time: "2:20",
    progress: 36,
    headline: "Tuesday · 2:20 PM",
    title: "Class change is here",
    copy: "A short, intense wave is crossing the Cut. Indoor study spaces remain steadier than main paths.",
    classImpact: "+31%",
  },
  lunch: {
    time: "12:15",
    progress: 62,
    headline: "Tuesday · 12:15 PM",
    title: "Lunch traffic is peaking",
    copy: "Cohon Center and the Cut are busiest. Hunt lower level is the closest calmer alternative.",
    classImpact: "+8%",
  },
};

const buildings = [
  { id: "wean", name: "Wean Hall", short: "WH", type: "STUDY · ACADEMIC", x: 420, y: 305, w: 155, d: 76, h: 112, base: 78, class: 18, lunch: 3, rain: 10, capacity: 820, indoor: true },
  { id: "gates", name: "Gates Hillman", short: "GHC", type: "ACADEMIC · LABS", x: 715, y: 214, w: 146, d: 70, h: 95, base: 66, class: 22, lunch: 1, rain: 8, capacity: 900, indoor: true },
  { id: "hunt", name: "Hunt Library", short: "HL", type: "LIBRARY · STUDY", x: 748, y: 487, w: 142, d: 70, h: 76, base: 43, class: 5, lunch: 2, rain: 14, capacity: 680, indoor: true },
  { id: "cohon", name: "Cohon Center", short: "CUC", type: "DINING · RECREATION", x: 200, y: 287, w: 142, d: 74, h: 69, base: 57, class: 8, lunch: 31, rain: 13, capacity: 760, indoor: true },
  { id: "baker", name: "Baker Hall", short: "BH", type: "ACADEMIC · HUMANITIES", x: 258, y: 506, w: 155, d: 68, h: 68, base: 52, class: 13, lunch: 0, rain: 7, capacity: 610, indoor: true },
  { id: "cfa", name: "College of Fine Arts", short: "CFA", type: "ARTS · PERFORMANCE", x: 890, y: 345, w: 132, d: 70, h: 87, base: 47, class: 10, lunch: 0, rain: 6, capacity: 540, indoor: true },
  { id: "porter", name: "Porter Hall", short: "PH", type: "ACADEMIC · ENGINEERING", x: 485, y: 545, w: 125, d: 58, h: 58, base: 35, class: 11, lunch: 0, rain: 9, capacity: 440, indoor: true },
  { id: "tepper", name: "Tepper Quad", short: "TQ", type: "ACADEMIC · DINING", x: 805, y: 95, w: 125, d: 62, h: 74, base: 49, class: 15, lunch: 17, rain: 8, capacity: 720, indoor: true },
  { id: "cut", name: "The Cut", short: "CUT", type: "OUTDOOR · QUAD", x: 540, y: 408, w: 135, d: 58, h: 8, base: 61, class: 29, lunch: 14, rain: -37, capacity: 950, indoor: false },
];

const state = {
  scenario: "steady",
  raining: false,
  paused: false,
  filter: "all",
  selectedId: null,
  tick: 0,
  lastUpdate: new Date(),
};

const el = (id) => document.getElementById(id);
const svgNS = "http://www.w3.org/2000/svg";
const layers = {
  halos: el("zoneHalos"),
  buildings: el("buildingsLayer"),
  labels: el("labelsLayer"),
  agents: el("crowdAgents"),
  rain: el("rainLayer"),
};

function svgElement(tag, attributes = {}) {
  const node = document.createElementNS(svgNS, tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function pointsString(points) {
  return points.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`).join(" ");
}

function getGeometry(building) {
  const skew = 0.26;
  const depthLift = 0.43;
  const { x, y, w, d, h } = building;
  const base = [
    [x, y],
    [x + w, y - w * skew],
    [x + w + d, y - w * skew + d * depthLift],
    [x + d, y + d * depthLift],
  ];
  const top = base.map(([px, py]) => [px, py - h]);
  return {
    base,
    top,
    center: [x + (w + d) / 2, y - h - (w * skew) / 2 + (d * depthLift) / 2],
  };
}

function hashNoise(id, tick) {
  const seed = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Math.sin(seed * 2.17 + tick * 0.83) * 2.2;
}

function occupancyFor(building) {
  let occupancy = building.base;
  if (state.scenario === "class") occupancy += building.class;
  if (state.scenario === "lunch") occupancy += building.lunch;
  if (state.raining) occupancy += building.rain;
  occupancy += hashNoise(building.id, state.tick);
  return Math.max(12, Math.min(99, Math.round(occupancy)));
}

function levelFor(occupancy) {
  let level = 0;
  LEVELS.forEach((entry, index) => {
    if (occupancy >= entry.min) level = index;
  });
  return level;
}

function createBuilding(building) {
  const geometry = getGeometry(building);
  const halo = svgElement("ellipse", {
    id: `halo-${building.id}`,
    class: "zone-halo",
    cx: geometry.center[0],
    cy: building.y + building.d * 0.12,
    rx: Math.max(52, building.w * 0.62),
    ry: Math.max(25, building.d * 0.42),
  });
  layers.halos.appendChild(halo);

  const group = svgElement("g", {
    id: `building-${building.id}`,
    class: "building",
    role: "button",
    tabindex: "0",
    "aria-label": `${building.name}, simulated occupancy`,
  });

  const front = svgElement("polygon", {
    class: "front",
    points: pointsString([geometry.base[3], geometry.base[2], geometry.top[2], geometry.top[3]]),
  });
  const side = svgElement("polygon", {
    class: "side",
    points: pointsString([geometry.base[1], geometry.base[2], geometry.top[2], geometry.top[1]]),
  });
  const top = svgElement("polygon", {
    class: "top",
    points: pointsString(geometry.top),
  });

  group.append(front, side, top);

  if (building.h > 15) {
    const midY = (geometry.top[2][1] + geometry.base[2][1]) / 2;
    const windows = svgElement("line", {
      class: "window-line",
      x1: geometry.top[3][0] + 14,
      y1: midY + 5,
      x2: geometry.top[2][0] - 12,
      y2: midY - building.w * 0.26 + 5,
    });
    group.appendChild(windows);
  }

  const open = () => selectBuilding(building.id);
  group.addEventListener("click", open);
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
  layers.buildings.appendChild(group);

  const label = svgElement("g", { id: `label-${building.id}`, class: "map-label" });
  const labelY = geometry.center[1] - 22;
  const name = svgElement("text", { x: geometry.center[0], y: labelY, "text-anchor": "middle" });
  name.textContent = building.name;
  const sub = svgElement("text", { class: "label-sub", x: geometry.center[0], y: labelY + 16, "text-anchor": "middle" });
  sub.textContent = "SIMULATED";
  const badge = svgElement("g", { class: "level-badge", transform: `translate(${geometry.center[0] + building.w * 0.43} ${labelY - 21})` });
  const badgeRect = svgElement("rect", { x: -15, y: -11, width: 30, height: 18, rx: 8 });
  const badgeText = svgElement("text", { x: 0, y: 2, "text-anchor": "middle" });
  badge.append(badgeRect, badgeText);
  label.append(name, sub, badge);
  layers.labels.appendChild(label);

  building.geometry = geometry;
}

function createAgents() {
  const routes = [
    "M70 394 C240 320 347 381 508 329 S825 143 1150 112",
    "M138 676 C293 558 456 559 618 480 S873 354 1117 350",
    "M304 24 C358 187 456 271 608 354 S829 487 931 704",
  ];
  for (let index = 0; index < 28; index += 1) {
    const circle = svgElement("circle", {
      class: "crowd-agent",
      r: index % 5 === 0 ? 3.2 : 2.2,
      fill: index % 4 === 0 ? "#ffb15a" : "#8be8d8",
    });
    const motion = svgElement("animateMotion", {
      path: routes[index % routes.length],
      dur: `${9 + (index % 8) * 1.3}s`,
      begin: `${-index * 0.73}s`,
      repeatCount: "indefinite",
      keyPoints: "0;1",
      keyTimes: "0;1",
      calcMode: "spline",
      keySplines: ".4 0 .2 1",
    });
    circle.appendChild(motion);
    layers.agents.appendChild(circle);
  }
}

function createRain() {
  for (let index = 0; index < 70; index += 1) {
    const x = (index * 97) % 1260;
    const y = (index * 67) % 650;
    const drop = svgElement("line", {
      class: "rain-drop",
      x1: x,
      y1: y,
      x2: x - 7,
      y2: y + 18,
      "stroke-width": index % 3 === 0 ? 1.5 : 1,
      style: `animation-delay:${-(index % 11) * 0.12}s;animation-duration:${0.8 + (index % 6) * 0.11}s`,
    });
    layers.rain.appendChild(drop);
  }
}

function renderBuildings() {
  buildings.forEach((building) => {
    const occupancy = occupancyFor(building);
    const level = levelFor(occupancy);
    const palette = LEVELS[level];
    const group = el(`building-${building.id}`);
    const halo = el(`halo-${building.id}`);
    const label = el(`label-${building.id}`);
    group.querySelector(".top").style.fill = palette.top;
    group.querySelector(".top").style.stroke = palette.color;
    group.querySelector(".front").style.fill = palette.front;
    group.querySelector(".side").style.fill = palette.side;
    halo.style.fill = palette.color;
    halo.style.opacity = `${0.2 + level * 0.1}`;
    label.querySelector(".level-badge rect").style.fill = palette.color;
    label.querySelector(".level-badge text").style.fill = level >= 3 ? "#fff" : "#07111f";
    label.querySelector(".level-badge text").textContent = `L${level}`;
    group.setAttribute("aria-label", `${building.name}, ${occupancy}% occupied, level ${level} ${palette.label}`);

    const shouldDim = state.filter === "calm" ? level > 1 : state.filter === "busy" ? level < 3 : false;
    group.classList.toggle("dimmed", shouldDim);
    label.classList.toggle("dimmed", shouldDim);
    halo.classList.toggle("dimmed", shouldDim);
  });
}

function updateSummary() {
  const values = buildings.map(occupancyFor);
  const total = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const calm = values.filter((value) => value < 50).length;
  el("campusOccupancy").textContent = `${total}%`;
  el("calmSpaces").textContent = calm;
  el("updatedTime").textContent = state.paused ? "model paused" : "just now";
  state.lastUpdate = new Date();

  const candidates = buildings
    .map((building) => ({ building, occupancy: occupancyFor(building) }))
    .filter(({ building }) => building.indoor)
    .sort((a, b) => a.occupancy - b.occupancy);
  const pick = candidates[0];
  el("recommendationName").textContent = pick.building.id === "hunt" ? "Hunt Library · Lower level" : pick.building.name;
  el("recommendationCopy").textContent = `${pick.occupancy}% occupied · ${pick.building.id === "hunt" ? 5 : 4} min walk`;
  el("showRecommendation").dataset.buildingId = pick.building.id;
}

function updateScenarioCopy() {
  const scenario = SCENARIOS[state.scenario];
  el("mapHeadline").textContent = scenario.headline;
  el("clockTime").textContent = scenario.time;
  el("insightTitle").textContent = state.raining ? "Rain is shifting crowds indoors" : scenario.title;
  el("insightCopy").textContent = state.raining
    ? "Outdoor activity is falling while Hunt, Wean, and Cohon fill faster. Calm indoor options are updating now."
    : scenario.copy;
  document.querySelector(".class-driver").parentElement.querySelector("em").textContent = scenario.classImpact;
  el("timelineProgress").style.width = `${scenario.progress}%`;
  el("timelineHandle").style.left = `${scenario.progress}%`;
  el("timelineHandle").setAttribute("aria-label", `Simulation time: ${scenario.time} PM`);
  el("weatherLabel").textContent = state.raining ? "Rain arriving" : "Dry evening";
  el("weatherDriverTitle").textContent = state.raining ? "Rain arriving" : "Clear paths";
  el("weatherDriverCopy").textContent = state.raining ? "Indoor demand increases" : "Outdoor spaces remain active";
  el("weatherDriverMetric").textContent = state.raining ? "+14%" : "−4%";

  const busyPath = state.scenario === "lunch"
    ? "M0 115 C43 94 77 71 111 68 S167 92 204 82 251 48 320 52"
    : state.scenario === "class"
      ? "M0 113 C46 92 71 41 113 38 S168 67 204 51 257 19 320 31"
      : "M0 116 C49 101 75 64 112 61 S171 77 204 70 259 46 320 57";
  el("forecastLine").setAttribute("d", busyPath);
  el("forecastArea").setAttribute("d", `${busyPath} L320 150H0Z`);
}

function render() {
  renderBuildings();
  updateSummary();
  updateScenarioCopy();
  document.body.classList.toggle("raining", state.raining);
  el("rainToggle").setAttribute("aria-pressed", String(state.raining));
  if (state.selectedId) updatePlaceCard(state.selectedId);
}

function statusFor(occupancy) {
  const level = levelFor(occupancy);
  return ["Quiet now", "Plenty of room", "Active now", "Busy now", "Near capacity"][level];
}

function insightFor(building, occupancy) {
  if (state.raining && building.indoor) {
    return `Rain is adding indoor demand. ${building.name} is forecast to rise another ${Math.max(4, Math.round(building.rain * 0.7))}% over the next 20 minutes.`;
  }
  if (building.id === "cut" && state.raining) {
    return "Rain has cleared much of the Cut. Nearby indoor paths are absorbing the displaced activity.";
  }
  if (state.scenario === "class") {
    return "Class change is creating a short peak. Activity is expected to ease in 18 minutes.";
  }
  if (occupancy < 50) {
    return "This is one of the calmest nearby spaces. It should remain comfortable for at least 35 minutes.";
  }
  return "Activity is building gradually. The next short peak is expected around class change.";
}

function updatePlaceCard(id) {
  const building = buildings.find((item) => item.id === id);
  if (!building) return;
  const occupancy = occupancyFor(building);
  const level = levelFor(occupancy);
  const palette = LEVELS[level];
  el("placeSymbol").textContent = building.short;
  el("placeType").textContent = building.type;
  el("placeName").textContent = building.name;
  el("placeOccupancy").textContent = `${occupancy}%`;
  el("placeStatus").textContent = statusFor(occupancy);
  el("placeStatus").style.color = level === 0 ? "#A0522D" : palette.color;
  el("capacityRing").querySelector("span").textContent = level;
  el("capacityRing").style.borderTopColor = palette.color;
  el("capacityRing").style.borderRightColor = palette.color;
  el("occupancyBar").style.width = `${occupancy}%`;
  el("occupancyBar").style.background = `linear-gradient(90deg, ${LEVELS[Math.max(0, level - 1)].color}, ${palette.color})`;
  el("placeInsight").textContent = insightFor(building, occupancy);
}

function selectBuilding(id) {
  state.selectedId = id;
  buildings.forEach((building) => {
    el(`building-${building.id}`).classList.toggle("selected", building.id === id);
  });
  updatePlaceCard(id);
  el("placeCard").classList.add("open");

  const building = buildings.find((item) => item.id === id);
  const svgRect = el("campusMap").getBoundingClientRect();
  const viewBoxWidth = 1200;
  const viewBoxHeight = 760;
  const mapScale = Math.min(svgRect.width / viewBoxWidth, svgRect.height / viewBoxHeight);
  const mapOffsetX = (svgRect.width - viewBoxWidth * mapScale) / 2;
  const mapOffsetY = (svgRect.height - viewBoxHeight * mapScale) / 2;
  const x = mapOffsetX + building.geometry.center[0] * mapScale;
  const y = mapOffsetY + building.geometry.center[1] * mapScale;
  const pin = el("selectedPin");
  pin.style.left = `${x}px`;
  pin.style.top = `${y}px`;
  pin.classList.add("visible");
  pin.setAttribute("aria-hidden", "false");
}

function closePlaceCard() {
  state.selectedId = null;
  el("placeCard").classList.remove("open");
  el("selectedPin").classList.remove("visible");
  el("selectedPin").setAttribute("aria-hidden", "true");
  buildings.forEach((building) => el(`building-${building.id}`).classList.remove("selected"));
}

function setScenario(scenario) {
  state.scenario = scenario;
  state.tick += 1;
  document.querySelectorAll("[data-scenario]").forEach((button) => {
    button.classList.toggle("active", button.dataset.scenario === scenario);
  });
  render();
}

function setFilter(filter) {
  state.filter = filter;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderBuildings();
}

function toggleRain() {
  state.raining = !state.raining;
  state.tick += 1;
  render();
}

function togglePause() {
  state.paused = !state.paused;
  el("pauseButton").setAttribute("aria-pressed", String(state.paused));
  el("pauseButton").querySelector("span").textContent = state.paused ? "Resume" : "Pause";
  el("updatedTime").textContent = state.paused ? "model paused" : "just now";
  layers.agents.style.animationPlayState = state.paused ? "paused" : "running";
  layers.agents.querySelectorAll("animateMotion").forEach((motion) => {
    state.paused ? motion.parentNode.pauseAnimations?.() : motion.parentNode.unpauseAnimations?.();
  });
}

function selectCalmer() {
  const current = buildings.find((building) => building.id === state.selectedId);
  const candidate = buildings
    .filter((building) => building.id !== current?.id && building.indoor)
    .map((building) => ({ building, occupancy: occupancyFor(building) }))
    .sort((a, b) => a.occupancy - b.occupancy)[0];
  selectBuilding(candidate.building.id);
}

function bindEvents() {
  el("rainToggle").addEventListener("click", toggleRain);
  el("pauseButton").addEventListener("click", togglePause);
  el("closeCard").addEventListener("click", closePlaceCard);
  el("calmerButton").addEventListener("click", selectCalmer);
  el("forecastButton").addEventListener("click", () => {
    el("insightTitle").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  el("showRecommendation").addEventListener("click", (event) => selectBuilding(event.currentTarget.dataset.buildingId));
  el("resetButton").addEventListener("click", () => {
    state.raining = false;
    state.filter = "all";
    closePlaceCard();
    setFilter("all");
    setScenario("steady");
  });
  el("timelineHandle").addEventListener("click", () => {
    const next = state.scenario === "steady" ? "class" : state.scenario === "class" ? "lunch" : "steady";
    setScenario(next);
  });
  document.querySelectorAll("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => setScenario(button.dataset.scenario));
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });
  window.addEventListener("resize", () => {
    if (state.selectedId) selectBuilding(state.selectedId);
  });
}

function tickSimulation() {
  if (state.paused) return;
  state.tick += 1;
  render();
}

function initialize() {
  buildings.forEach(createBuilding);
  createAgents();
  createRain();
  bindEvents();
  render();
  window.setTimeout(() => selectBuilding("wean"), 900);
  window.setInterval(tickSimulation, 5000);
}

initialize();
