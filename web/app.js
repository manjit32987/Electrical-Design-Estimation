/**
 * Electrical Design & Load Estimator - Core Web Application Logic
 * Ported from Python 3.12 PyQt6 estimation engine
 */

// Wattage Constants (Watts)
const WATT_LIGHT = 12;
const WATT_FAN = 75;
const WATT_SOCKET = 100;
const WATT_AC = 1500;

// Default Unit Costs (₹) matching data/material_costs.json
const DEFAULT_COSTS = {
  light_fitting: 350.0,
  fan: 1500.0,
  socket_outlet: 200.0,
  ac_point: 800.0,
  wire_per_metre: 25.0,
  conduit_factor: 0.15,
  labour_factor: 0.20
};

// Initial State (empty default — ready for user input)
let appState = {
  project: {
    name: "",
    client: "",
    buildingType: "Residential"
  },
  standards: {
    areaPerLight: 10.0,
    areaPerFan: 15.0,
    wireWastage: 1.3,
    diversityFactor: 0.8
  },
  costs: { ...DEFAULT_COSTS },
  rooms: [],
  calculatedResults: []
};

// DOM Element References
const DOM = {
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  projectName: document.getElementById('projectName'),
  clientName: document.getElementById('clientName'),
  buildingType: document.getElementById('buildingType'),
  areaPerLight: document.getElementById('areaPerLight'),
  areaPerFan: document.getElementById('areaPerFan'),
  wireWastage: document.getElementById('wireWastage'),
  diversityFactor: document.getElementById('diversityFactor'),
  roomsTableBody: document.getElementById('roomsTableBody'),
  addRoomBtn: document.getElementById('addRoomBtn'),
  calculateBtn: document.getElementById('calculateBtn'),
  generateLayoutBtn: document.getElementById('generateLayoutBtn'),
  resultsTableBody: document.getElementById('resultsTableBody'),
  roomCountBadge: document.getElementById('roomCountBadge'),
  summaryTotalLoad: document.getElementById('summaryTotalLoad'),
  summaryDiversifiedLoad: document.getElementById('summaryDiversifiedLoad'),
  summaryTotalFixtures: document.getElementById('summaryTotalFixtures'),
  summaryFixturesBreakdown: document.getElementById('summaryFixturesBreakdown'),
  summaryWireLength: document.getElementById('summaryWireLength'),
  summaryTotalCost: document.getElementById('summaryTotalCost'),
  floorPlanCanvas: document.getElementById('floorPlanCanvas'),
  exportPngBtn: document.getElementById('exportPngBtn'),
  exportSvgBtn: document.getElementById('exportSvgBtn'),
  saveProjectBtn: document.getElementById('saveProjectBtn'),
  openProjectBtn: document.getElementById('openProjectBtn'),
  projectFileInput: document.getElementById('projectFileInput'),
  costsBtn: document.getElementById('costsBtn'),
  costsModal: document.getElementById('costsModal'),
  closeCostsModal: document.getElementById('closeCostsModal'),
  saveCostsBtn: document.getElementById('saveCostsBtn'),
  resetCostsBtn: document.getElementById('resetCostsBtn'),
  // Cost inputs
  costLight: document.getElementById('costLight'),
  costFan: document.getElementById('costFan'),
  costSocket: document.getElementById('costSocket'),
  costAc: document.getElementById('costAc'),
  costWire: document.getElementById('costWire'),
  costConduitFactor: document.getElementById('costConduitFactor'),
  costLabourFactor: document.getElementById('costLabourFactor')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadStoredState();
  bindEvents();
  renderRoomsTable();
  performCalculations();
  drawPlaceholderCanvas();
});

// ─────────────────────────────────────────────
//  State & Storage Management
// ─────────────────────────────────────────────
function loadStoredState() {
  const saved = localStorage.getItem('electrical_estimator_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      appState = { ...appState, ...parsed };
      DOM.projectName.value = appState.project.name || "";
      DOM.clientName.value = appState.project.client || "";
      DOM.buildingType.value = appState.project.buildingType || "Residential";
      DOM.areaPerLight.value = appState.standards.areaPerLight || 10.0;
      DOM.areaPerFan.value = appState.standards.areaPerFan || 15.0;
      DOM.wireWastage.value = appState.standards.wireWastage || 1.3;
      DOM.diversityFactor.value = appState.standards.diversityFactor || 0.8;
    } catch (e) {
      console.warn("Failed to parse saved state", e);
    }
  }
}

function saveState() {
  localStorage.setItem('electrical_estimator_state', JSON.stringify(appState));
}

// ─────────────────────────────────────────────
//  Event Listeners
// ─────────────────────────────────────────────
function bindEvents() {
  // Theme Toggle
  DOM.themeToggleBtn.addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    DOM.themeToggleBtn.innerHTML = next === 'dark' ? '🌙' : '☀️';
    if (appState.calculatedResults.length > 0) renderLayoutCanvas();
  });

  // Inputs Change
  [DOM.projectName, DOM.clientName, DOM.buildingType].forEach(el => {
    el.addEventListener('change', () => {
      appState.project.name = DOM.projectName.value;
      appState.project.client = DOM.clientName.value;
      appState.project.buildingType = DOM.buildingType.value;
      saveState();
    });
  });

  [DOM.areaPerLight, DOM.areaPerFan, DOM.wireWastage, DOM.diversityFactor].forEach(el => {
    el.addEventListener('change', () => {
      appState.standards.areaPerLight = parseFloat(DOM.areaPerLight.value) || 10.0;
      appState.standards.areaPerFan = parseFloat(DOM.areaPerFan.value) || 15.0;
      appState.standards.wireWastage = parseFloat(DOM.wireWastage.value) || 1.3;
      appState.standards.diversityFactor = parseFloat(DOM.diversityFactor.value) || 0.8;
      saveState();
    });
  });

  // Add Room
  DOM.addRoomBtn.addEventListener('click', () => {
    const count = appState.rooms.length + 1;
    appState.rooms.push({
      id: "r_" + Date.now(),
      name: `Room ${count}`,
      length: 4.0,
      width: 3.5,
      height: 3.0,
      roomType: "Bedroom",
      hasAc: false
    });
    renderRoomsTable();
    performCalculations();
    renderLayoutCanvas();
    saveState();
  });

  // Action Buttons
  DOM.calculateBtn.addEventListener('click', () => {
    performCalculations();
    renderLayoutCanvas();
  });

  DOM.generateLayoutBtn.addEventListener('click', () => {
    if (appState.calculatedResults.length === 0) performCalculations();
    renderLayoutCanvas();
  });

  // Export Canvas Buttons
  DOM.exportPngBtn.addEventListener('click', exportPNG);
  DOM.exportSvgBtn.addEventListener('click', exportSVG);

  // Save / Load Project JSON
  DOM.saveProjectBtn.addEventListener('click', saveProjectJSON);
  DOM.openProjectBtn.addEventListener('click', () => DOM.projectFileInput.click());
  DOM.projectFileInput.addEventListener('change', loadProjectJSON);

  // Costs Modal
  DOM.costsBtn.addEventListener('click', openCostsModal);
  DOM.closeCostsModal.addEventListener('click', () => DOM.costsModal.classList.remove('active'));
  DOM.saveCostsBtn.addEventListener('click', saveCostsModal);
  DOM.resetCostsBtn.addEventListener('click', () => {
    appState.costs = { ...DEFAULT_COSTS };
    populateCostsForm();
  });
}

// ─────────────────────────────────────────────
//  Calculation Engine (Matching Python Backend)
// ─────────────────────────────────────────────
function calculateSockets(lights) {
  if (lights <= 2) return 2;
  if (lights <= 4) return 3;
  return 4;
}

function calculateRoom(room, areaPerLight, areaPerFan) {
  const area = room.length * room.width;
  const lights = Math.max(1, Math.ceil(area / areaPerLight));
  const fans = Math.max(1, Math.ceil(area / areaPerFan));
  const sockets = calculateSockets(lights);
  const acPoint = room.hasAc ? 1 : 0;
  const loadW = (lights * WATT_LIGHT) + (fans * WATT_FAN) + (sockets * WATT_SOCKET) + (acPoint * WATT_AC);

  return {
    id: room.id,
    name: room.name,
    length: room.length,
    width: room.width,
    area: area,
    lights: lights,
    fans: fans,
    sockets: sockets,
    acPoint: acPoint,
    connectedLoadW: loadW
  };
}

function performCalculations() {
  const areaPerLight = parseFloat(DOM.areaPerLight.value) || 10.0;
  const areaPerFan = parseFloat(DOM.areaPerFan.value) || 15.0;
  const wireWastage = parseFloat(DOM.wireWastage.value) || 1.3;
  const diversityFactor = parseFloat(DOM.diversityFactor.value) || 0.8;

  appState.calculatedResults = appState.rooms.map(room => calculateRoom(room, areaPerLight, areaPerFan));

  // Compute Totals
  let totalLoadW = 0;
  let totalLights = 0;
  let totalFans = 0;
  let totalSockets = 0;
  let totalAc = 0;
  let totalPerimeter = 0;

  appState.calculatedResults.forEach(res => {
    totalLoadW += res.connectedLoadW;
    totalLights += res.lights;
    totalFans += res.fans;
    totalSockets += res.sockets;
    totalAc += res.acPoint;
    totalPerimeter += 2 * (res.length + res.width);
  });

  const wireLengthM = totalPerimeter * wireWastage;
  const diversifiedLoadKw = ((totalLoadW * diversityFactor) / 1000).toFixed(2);

  // Material & Labour Cost
  const c = appState.costs;
  const materialSubtotal = (totalLights * c.light_fitting)
    + (totalFans * c.fan)
    + (totalSockets * c.socket_outlet)
    + (totalAc * c.ac_point)
    + (wireLengthM * c.wire_per_metre);
  const totalCost = materialSubtotal * (1 + c.conduit_factor + c.labour_factor);

  // Update Summary UI
  DOM.summaryTotalLoad.textContent = `${totalLoadW.toLocaleString()} W`;
  DOM.summaryDiversifiedLoad.textContent = `Diversified: ${diversifiedLoadKw} kW`;
  DOM.summaryTotalFixtures.textContent = `${totalLights + totalFans + totalSockets + totalAc}`;
  DOM.summaryFixturesBreakdown.textContent = `${totalLights} Lights | ${totalFans} Fans | ${totalSockets} Sockets | ${totalAc} AC`;
  DOM.summaryWireLength.textContent = `${wireLengthM.toFixed(1)} m`;
  DOM.summaryTotalCost.textContent = `₹${Math.round(totalCost).toLocaleString()}`;
  DOM.roomCountBadge.textContent = `${appState.rooms.length} Rooms`;

  renderResultsTable();
}

// ─────────────────────────────────────────────
//  UI Rendering (Tables)
// ─────────────────────────────────────────────
function renderRoomsTable() {
  DOM.roomsTableBody.innerHTML = '';
  if (appState.rooms.length === 0) {
    DOM.roomsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center muted-text" style="padding: 1.5rem;">
          No rooms added yet. Click <strong>+ Add Room</strong> to get started.
        </td>
      </tr>
    `;
    return;
  }

  appState.rooms.forEach((room, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" value="${room.name}" data-idx="${idx}" data-field="name"></td>
      <td><input type="number" value="${room.length}" step="0.5" min="1" style="width:60px;" data-idx="${idx}" data-field="length"></td>
      <td><input type="number" value="${room.width}" step="0.5" min="1" style="width:60px;" data-idx="${idx}" data-field="width"></td>
      <td>
        <select data-idx="${idx}" data-field="roomType">
          <option value="Bedroom" ${room.roomType === 'Bedroom' ? 'selected' : ''}>Bedroom</option>
          <option value="Hall" ${room.roomType === 'Hall' ? 'selected' : ''}>Hall</option>
          <option value="Kitchen" ${room.roomType === 'Kitchen' ? 'selected' : ''}>Kitchen</option>
          <option value="Bathroom" ${room.roomType === 'Bathroom' ? 'selected' : ''}>Bathroom</option>
          <option value="Office" ${room.roomType === 'Office' ? 'selected' : ''}>Office</option>
        </select>
      </td>
      <td class="text-center">
        <input type="checkbox" ${room.hasAc ? 'checked' : ''} data-idx="${idx}" data-field="hasAc">
      </td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteRoom(${idx})">&times;</button>
      </td>
    `;
    DOM.roomsTableBody.appendChild(tr);
  });

  // Table inputs listener
  DOM.roomsTableBody.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      const field = e.target.getAttribute('data-field');
      if (field === 'hasAc') {
        appState.rooms[idx].hasAc = e.target.checked;
      } else if (field === 'length' || field === 'width') {
        appState.rooms[idx][field] = parseFloat(e.target.value) || 1.0;
      } else {
        appState.rooms[idx][field] = e.target.value;
      }
      saveState();
    });
  });
}

function deleteRoom(idx) {
  appState.rooms.splice(idx, 1);
  renderRoomsTable();
  performCalculations();
  renderLayoutCanvas();
  saveState();
}

function renderResultsTable() {
  DOM.resultsTableBody.innerHTML = '';
  if (appState.calculatedResults.length === 0) {
    DOM.resultsTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center muted-text" style="padding: 1.5rem;">
          No rooms available. Click <strong>+ Add Room</strong> to begin estimating.
        </td>
      </tr>
    `;
    return;
  }

  appState.calculatedResults.forEach(res => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${res.name}</strong></td>
      <td>${res.length.toFixed(1)} × ${res.width.toFixed(1)}</td>
      <td>${res.area.toFixed(1)} m²</td>
      <td><span class="legend-symbol light">●</span> ${res.lights}</td>
      <td><span class="legend-symbol fan">⊕</span> ${res.fans}</td>
      <td><span class="legend-symbol socket">□</span> ${res.sockets}</td>
      <td><span class="legend-symbol ac">${res.acPoint ? '★ 1' : '-'}</span></td>
      <td><strong>${res.connectedLoadW} W</strong></td>
    `;
    DOM.resultsTableBody.appendChild(tr);
  });
}

// ─────────────────────────────────────────────
//  Canvas Floor Plan Layout Drawer
// ─────────────────────────────────────────────
function drawPlaceholderCanvas() {
  const canvas = DOM.floorPlanCanvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#64748b';
  ctx.font = '16px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("Add rooms, click '⚡ Calculate', then '🗺 Render Layout'", canvas.width / 2, canvas.height / 2);
}

function renderLayoutCanvas() {
  const canvas = DOM.floorPlanCanvas;
  const ctx = canvas.getContext('2d');
  const results = appState.calculatedResults;

  if (!results || results.length === 0) {
    drawPlaceholderCanvas();
    return;
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const roomFill = isDark ? '#1e293b' : '#f0f4ff';
  const roomEdge = isDark ? '#38bdf8' : '#2c3e50';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  const GAP_H = 0.5; // metres
  const GAP_V = 1.2; // metres
  const MAX_ROW_WIDTH = 20.0; // metres

  // Calculate total bounding dimensions in metres
  let xCursor = 0.0;
  let yCursor = 0.0;
  let rowMaxH = 0.0;
  let layoutW = 0.0;

  results.forEach((room) => {
    if (xCursor > 0 && xCursor + room.width > MAX_ROW_WIDTH) {
      yCursor += rowMaxH + GAP_V;
      xCursor = 0.0;
      rowMaxH = 0.0;
    }
    rowMaxH = Math.max(rowMaxH, room.length);
    xCursor += room.width + GAP_H;
    layoutW = Math.max(layoutW, xCursor);
  });
  const layoutH = yCursor + rowMaxH + GAP_V;

  // Setup High DPI Canvas Scaling
  const padding = 60;
  const targetW = canvas.parentElement.clientWidth || 900;
  const scale = Math.min((targetW - padding * 2) / layoutW, 500 / layoutH);

  canvas.width = Math.max(targetW, (layoutW * scale) + padding * 2);
  canvas.height = Math.max(450, (layoutH * scale) + padding * 2);

  // Background Fill
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle Grid Lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  const gridSize = 25;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Draw Rooms
  xCursor = 0.0;
  yCursor = 0.0;
  rowMaxH = 0.0;

  results.forEach(room => {
    if (xCursor > 0 && xCursor + room.width > MAX_ROW_WIDTH) {
      yCursor += rowMaxH + GAP_V;
      xCursor = 0.0;
      rowMaxH = 0.0;
    }

    const rx = padding + (xCursor * scale);
    const ry = padding + (yCursor * scale);
    const rw = room.width * scale;
    const rh = room.length * scale;

    // Room Box
    ctx.fillStyle = roomFill;
    ctx.strokeStyle = roomEdge;
    ctx.lineWidth = 2;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);

    // Room Label
    ctx.fillStyle = textColor;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(room.name, rx + rw / 2, ry - 14);

    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.fillText(`${room.length.toFixed(1)}m × ${room.width.toFixed(1)}m`, rx + rw / 2, ry - 3);

    // Draw Fixtures Inside Room
    drawSymbols(ctx, rx, ry + rh * 0.3, rw, rh * 0.55, room.lights, '●', isDark ? '#facc15' : '#d97706');
    drawSymbols(ctx, rx, ry + rh * 0.05, rw, rh * 0.55, room.fans, '⊕', isDark ? '#38bdf8' : '#0284c7');
    drawSockets(ctx, rx, ry, rw, rh, room.sockets, isDark ? '#4ade80' : '#16a34a');

    if (room.acPoint) {
      ctx.fillStyle = isDark ? '#f87171' : '#dc2626';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('★', rx + rw - 8, ry + 18);
    }

    rowMaxH = Math.max(rowMaxH, room.length);
    xCursor += room.width + GAP_H;
  });

  DOM.exportPngBtn.disabled = false;
  DOM.exportSvgBtn.disabled = false;
}

function drawSymbols(ctx, rx, ry, rw, rh, count, symbol, color) {
  if (count <= 0) return;
  const rows = Math.max(1, Math.ceil(Math.sqrt(count)));
  const cols = Math.ceil(count / rows);

  let placed = 0;
  ctx.fillStyle = color;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (placed >= count) break;
      const x = rx + (rw * (0.2 + (cols > 1 ? (c / (cols - 1)) * 0.6 : 0.3)));
      const y = ry + (rh * (0.2 + (rows > 1 ? (r / (rows - 1)) * 0.6 : 0.3)));
      ctx.fillText(symbol, x, y);
      placed++;
    }
  }
}

function drawSockets(ctx, rx, ry, rw, rh, count, color) {
  if (count <= 0) return;
  ctx.fillStyle = color;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';

  for (let i = 0; i < count; i++) {
    const x = rx + (rw * (0.15 + (count > 1 ? (i / (count - 1)) * 0.7 : 0.35)));
    ctx.fillText('□', x, ry + rh - 6);
  }
}

// ─────────────────────────────────────────────
//  Export & File Operations
// ─────────────────────────────────────────────
function exportPNG() {
  const canvas = DOM.floorPlanCanvas;
  const link = document.createElement('a');
  link.download = `${appState.project.name.replace(/\s+/g, '_')}_Layout.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function exportSVG() {
  const results = appState.calculatedResults;
  if (!results || results.length === 0) return;

  const GAP_H = 0.5, GAP_V = 1.2, MAX_ROW_WIDTH = 20.0;
  let xCursor = 0.0, yCursor = 0.0, rowMaxH = 0.0, layoutW = 0.0;

  results.forEach((room) => {
    if (xCursor > 0 && xCursor + room.width > MAX_ROW_WIDTH) {
      yCursor += rowMaxH + GAP_V;
      xCursor = 0.0;
      rowMaxH = 0.0;
    }
    rowMaxH = Math.max(rowMaxH, room.length);
    xCursor += room.width + GAP_H;
    layoutW = Math.max(layoutW, xCursor);
  });
  const layoutH = yCursor + rowMaxH + GAP_V;
  const scale = 40;
  const svgW = (layoutW * scale) + 100;
  const svgH = (layoutH * scale) + 100;

  let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">\n`;
  svgStr += `<rect width="100%" height="100%" fill="#0f172a"/>\n`;

  xCursor = 0.0; yCursor = 0.0; rowMaxH = 0.0;
  results.forEach(room => {
    if (xCursor > 0 && xCursor + room.width > MAX_ROW_WIDTH) {
      yCursor += rowMaxH + GAP_V;
      xCursor = 0.0; rowMaxH = 0.0;
    }
    const rx = 50 + (xCursor * scale);
    const ry = 50 + (yCursor * scale);
    const rw = room.width * scale;
    const rh = room.length * scale;

    svgStr += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>\n`;
    svgStr += `<text x="${rx + rw/2}" y="${ry - 10}" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${room.name}</text>\n`;
    svgStr += `<text x="${rx + rw/2}" y="${ry + rh/2}" fill="#facc15" font-family="sans-serif" font-size="14" text-anchor="middle">Lights: ${room.lights} | Fans: ${room.fans}</text>\n`;

    rowMaxH = Math.max(rowMaxH, room.length);
    xCursor += room.width + GAP_H;
  });

  svgStr += `</svg>`;

  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${appState.project.name.replace(/\s+/g, '_')}_Layout.svg`;
  link.href = url;
  link.click();
}

function saveProjectJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
  const link = document.createElement('a');
  link.download = `${appState.project.name.replace(/\s+/g, '_')}_Project.json`;
  link.href = dataStr;
  link.click();
}

function loadProjectJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const loaded = JSON.parse(event.target.result);
      if (loaded.rooms) {
        appState = { ...appState, ...loaded };
        DOM.projectName.value = appState.project.name || "";
        DOM.clientName.value = appState.project.client || "";
        DOM.buildingType.value = appState.project.buildingType || "Residential";
        renderRoomsTable();
        performCalculations();
        renderLayoutCanvas();
        saveState();
        alert("Project loaded successfully!");
      }
    } catch (err) {
      alert("Invalid project file format.");
    }
  };
  reader.readAsText(file);
}

// ─────────────────────────────────────────────
//  Costs Modal Handlers
// ─────────────────────────────────────────────
function openCostsModal() {
  populateCostsForm();
  DOM.costsModal.classList.add('active');
}

function populateCostsForm() {
  const c = appState.costs;
  DOM.costLight.value = c.light_fitting;
  DOM.costFan.value = c.fan;
  DOM.costSocket.value = c.socket_outlet;
  DOM.costAc.value = c.ac_point;
  DOM.costWire.value = c.wire_per_metre;
  DOM.costConduitFactor.value = c.conduit_factor;
  DOM.costLabourFactor.value = c.labour_factor;
}

function saveCostsModal() {
  appState.costs = {
    light_fitting: parseFloat(DOM.costLight.value) || 350,
    fan: parseFloat(DOM.costFan.value) || 1500,
    socket_outlet: parseFloat(DOM.costSocket.value) || 200,
    ac_point: parseFloat(DOM.costAc.value) || 800,
    wire_per_metre: parseFloat(DOM.costWire.value) || 25,
    conduit_factor: parseFloat(DOM.costConduitFactor.value) || 0.15,
    labour_factor: parseFloat(DOM.costLabourFactor.value) || 0.20
  };
  DOM.costsModal.classList.remove('active');
  saveState();
  performCalculations();
}
