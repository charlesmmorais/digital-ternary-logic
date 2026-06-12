import {
  BUILTIN_TYPES,
  CircuitSimulator,
  createNode,
  createWire,
  defaultProject,
  exportAsCustomChip,
  getNodeType,
  makeCustomType,
  parseProject,
  serializeProject,
  safePortName,
} from '../core/circuit.js';
import { TRIT, busToDisplay, cycleTrit, normalizeBus, normalizeTrit } from '../core/trit.js';

const canvas = document.querySelector('#circuitCanvas');
const paletteEl = document.querySelector('#palette');
const customEl = document.querySelector('#customChips');
const inspectorEl = document.querySelector('#inspectorContent');
const statusEl = document.querySelector('#status');
const projectNameEl = document.querySelector('#projectName');
const exportBox = document.querySelector('#exportBox');

const STORAGE_KEY = 'digital-ternary-logic-project';

let project = defaultProject('Digital Ternary Logic');
let simulator = new CircuitSimulator(project);
let editor;

const colors = {
  N: '#60a5fa',
  '0': '#e5e7eb',
  P: '#34d399',
  X: '#f59e0b',
  node: '#172033',
  nodeSelected: '#1d4ed8',
  line: '#475569',
  text: '#e5e7eb',
  muted: '#9ca3af',
  grid: 'rgba(148, 163, 184, 0.08)',
};

function setStatus(message) {
  statusEl.textContent = message;
}

function refresh() {
  simulator.project = project;
  const result = simulator.simulate();
  projectNameEl.textContent = project.name || 'Sem nome';
  renderPalette();
  editor.setResult(result);
  renderInspector();
  setStatus(result.conflicts.length ? `${result.conflicts.length} conflito(s) detectado(s)` : 'Simulação estável');
}

function renderPalette() {
  const categories = new Map();
  for (const [type, def] of Object.entries(BUILTIN_TYPES)) {
    if (!categories.has(def.category)) categories.set(def.category, []);
    categories.get(def.category).push({ type, def });
  }
  paletteEl.innerHTML = '';
  for (const [category, entries] of categories) {
    const group = document.createElement('div');
    group.className = 'palette-category';
    group.innerHTML = `<h3>${category}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'palette-grid';
    for (const entry of entries) {
      const button = document.createElement('button');
      button.textContent = entry.def.title;
      button.title = entry.def.description;
      button.addEventListener('click', () => addNode(entry.type));
      grid.appendChild(button);
    }
    group.appendChild(grid);
    paletteEl.appendChild(group);
  }

  customEl.innerHTML = '';
  for (const [name, def] of Object.entries(project.customChips || {})) {
    const row = document.createElement('button');
    const type = makeCustomType(name, def);
    row.textContent = `${type.title} (${type.inputs.length}→${type.outputs.length})`;
    row.title = type.description;
    row.addEventListener('click', () => addNode(`CUSTOM:${name}`));
    customEl.appendChild(row);
  }
}

function addNode(type) {
  const center = editor.screenToWorld(canvas.clientWidth / 2, canvas.clientHeight / 2);
  const node = createNode(type, center.x - 80 + Math.random() * 40, center.y - 30 + Math.random() * 40, getNodeType(type, project.customChips)?.title || type);
  project.nodes.push(node);
  editor.selectNode(node.id);
  refresh();
}

function renderInspector() {
  const selected = editor.selectedNode ? project.nodes.find((n) => n.id === editor.selectedNode) : null;
  if (!selected) {
    inspectorEl.innerHTML = 'Selecione um componente.';
    return;
  }
  const type = getNodeType(selected.type, project.customChips);
  const result = simulator.result;
  const inputs = result?.inputs?.[selected.id] || {};
  const outputs = result?.outputs?.[selected.id] || {};
  const portLines = [
    ...(type.inputs || []).map((p) => `← ${p.name}: ${busToDisplay(inputs[p.name] || normalizeBus(TRIT.X, p.width))}`),
    ...(type.outputs || []).map((p) => `→ ${p.name}: ${busToDisplay(outputs[p.name] || normalizeBus(TRIT.X, p.width))}`),
  ].join('\n');

  inspectorEl.innerHTML = `
    <strong>${escapeHtml(type.title)}</strong><br />
    <span>${escapeHtml(type.description || '')}</span>
    <label>Rótulo <input id="nodeLabel" value="${escapeHtml(selected.label || '')}" /></label>
    <div class="ports">${escapeHtml(portLines || 'Sem portas')}</div>
    <button id="btnDeleteNode" class="danger">Excluir componente</button>
  `;

  document.querySelector('#nodeLabel')?.addEventListener('input', (e) => {
    selected.label = e.target.value;
    editor.draw();
  });
  document.querySelector('#btnDeleteNode')?.addEventListener('click', () => {
    deleteNode(selected.id);
  });

  if (selected.type === 'INPUT') renderInputInspector(selected, 1);
  if (selected.type === 'INPUT3') renderInputInspector(selected, 3);
  if (selected.type === 'REGISTER') renderRegisterInspector(selected);
  if (selected.type === 'RAM9' || selected.type === 'ROM9') renderMemoryInspector(selected);
}

function renderInputInspector(node, width) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = '<h2>Valor</h2>';
  const values = normalizeBus(node.state.value, width);
  values.forEach((value, index) => {
    const row = document.createElement('div');
    row.className = 'state-row';
    row.innerHTML = `<span>T${index}</span>`;
    for (const t of [TRIT.N, TRIT.Z, TRIT.P]) {
      const btn = document.createElement('button');
      btn.className = 'mini';
      btn.textContent = t;
      if (value === t) btn.style.outline = '2px solid var(--accent)';
      btn.addEventListener('click', () => {
        const next = normalizeBus(node.state.value, width);
        next[index] = t;
        node.state.value = width === 1 ? t : next;
        refresh();
      });
      row.appendChild(btn);
    }
    wrapper.appendChild(row);
  });
  inspectorEl.appendChild(wrapper);
}

function renderRegisterInspector(node) {
  const div = document.createElement('div');
  div.innerHTML = `<h2>Estado</h2><p>Q atual: <strong>${normalizeTrit(node.state.q)}</strong></p><button id="btnResetQ">Forçar Q=0</button>`;
  inspectorEl.appendChild(div);
  document.querySelector('#btnResetQ')?.addEventListener('click', () => {
    node.state.q = TRIT.Z;
    refresh();
  });
}

function renderMemoryInspector(node) {
  const div = document.createElement('div');
  div.innerHTML = '<h2>Memória (-4 a +4)</h2>';
  const mem = Array.isArray(node.state.mem) ? node.state.mem : Array(9).fill(TRIT.Z);
  for (let i = 0; i < 9; i += 1) {
    const row = document.createElement('div');
    row.className = 'state-row';
    row.innerHTML = `<span>${i - 4}</span>`;
    for (const t of [TRIT.N, TRIT.Z, TRIT.P]) {
      const btn = document.createElement('button');
      btn.className = 'mini';
      btn.textContent = t;
      if (normalizeTrit(mem[i]) === t) btn.style.outline = '2px solid var(--accent)';
      btn.addEventListener('click', () => {
        node.state.mem = Array.isArray(node.state.mem) ? node.state.mem : Array(9).fill(TRIT.Z);
        node.state.mem[i] = t;
        refresh();
      });
      row.appendChild(btn);
    }
    div.appendChild(row);
  }
  inspectorEl.appendChild(div);
}

function deleteNode(nodeId) {
  project.nodes = project.nodes.filter((n) => n.id !== nodeId);
  project.wires = project.wires.filter((w) => w.fromNode !== nodeId && w.toNode !== nodeId);
  editor.selectedNode = null;
  refresh();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

class CanvasEditor {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.result = null;
    this.selectedNode = null;
    this.drag = null;
    this.connecting = null;
    this.pan = { x: 0, y: 0 };
    this.scale = 1;
    this.hoverPort = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    canvasElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvasElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvasElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
    canvasElement.addEventListener('dblclick', (e) => this.onDoubleClick(e));
    canvasElement.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    canvasElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(800, Math.floor(rect.width * devicePixelRatio));
    this.canvas.height = Math.max(600, Math.floor(rect.height * devicePixelRatio));
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    this.draw();
  }

  setResult(result) {
    this.result = result;
    this.draw();
  }

  selectNode(nodeId) {
    this.selectedNode = nodeId;
    renderInspector();
  }

  worldToScreen(x, y) { return { x: x * this.scale + this.pan.x, y: y * this.scale + this.pan.y }; }
  screenToWorld(x, y) { return { x: (x - this.pan.x) / this.scale, y: (y - this.pan.y) / this.scale }; }

  nodeSize(node) {
    const type = getNodeType(node.type, project.customChips);
    const ports = Math.max(type?.inputs?.length || 0, type?.outputs?.length || 0, 1);
    return { w: Math.max(126, (node.label || '').length * 7 + 36), h: 40 + ports * 22 };
  }

  portPosition(node, portName, direction) {
    const type = getNodeType(node.type, project.customChips);
    const ports = direction === 'in' ? type.inputs : type.outputs;
    const index = ports.findIndex((p) => p.name === portName);
    const size = this.nodeSize(node);
    const y = node.y + 34 + index * 22;
    const x = direction === 'in' ? node.x : node.x + size.w;
    return { x, y };
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    this.drawGrid(ctx, width, height);
    ctx.translate(this.pan.x, this.pan.y);
    ctx.scale(this.scale, this.scale);
    this.drawWires(ctx);
    if (this.connecting) this.drawPendingWire(ctx);
    for (const node of project.nodes) this.drawNode(ctx, node);
    ctx.restore();
  }

  drawGrid(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    const step = 32 * this.scale;
    const ox = this.pan.x % step;
    const oy = this.pan.y % step;
    for (let x = ox; x < width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = oy; y < height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    ctx.restore();
  }

  drawWires(ctx) {
    for (const wire of project.wires) {
      const from = project.nodes.find((n) => n.id === wire.fromNode);
      const to = project.nodes.find((n) => n.id === wire.toNode);
      if (!from || !to) continue;
      const start = this.portPosition(from, wire.fromPort, 'out');
      const end = this.portPosition(to, wire.toPort, 'in');
      const state = this.result?.outputs?.[wire.fromNode]?.[wire.fromPort] || [TRIT.X];
      const display = busToDisplay(state);
      const trit = state.length === 1 ? state[0] : (state.includes(TRIT.X) ? TRIT.X : TRIT.Z);
      ctx.strokeStyle = colors[trit] || colors.line;
      ctx.lineWidth = state.length > 1 ? 5 : 3;
      ctx.beginPath();
      const mid = Math.max(40, Math.abs(end.x - start.x) / 2);
      ctx.moveTo(start.x, start.y);
      ctx.bezierCurveTo(start.x + mid, start.y, end.x - mid, end.y, end.x, end.y);
      ctx.stroke();
      ctx.font = '12px ui-monospace, monospace';
      ctx.fillStyle = colors.text;
      ctx.fillText(display, (start.x + end.x) / 2, (start.y + end.y) / 2 - 6);
    }
  }

  drawPendingWire(ctx) {
    const from = project.nodes.find((n) => n.id === this.connecting.nodeId);
    if (!from) return;
    const start = this.portPosition(from, this.connecting.port, 'out');
    const mouse = this.screenToWorld(this.lastMouse.x, this.lastMouse.y);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawNode(ctx, node) {
    const type = getNodeType(node.type, project.customChips);
    const size = this.nodeSize(node);
    const selected = this.selectedNode === node.id;
    roundRect(ctx, node.x, node.y, size.w, size.h, 10);
    ctx.fillStyle = selected ? '#1e3a8a' : colors.node;
    ctx.fill();
    ctx.strokeStyle = selected ? '#93c5fd' : '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0b1220';
    roundRect(ctx, node.x, node.y, size.w, 26, 10);
    ctx.fill();
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(node.label || type.title, node.x + 10, node.y + 18);

    ctx.font = '12px ui-monospace, monospace';
    for (const input of type.inputs || []) {
      const p = this.portPosition(node, input.name, 'in');
      const val = this.result?.inputs?.[node.id]?.[input.name] || normalizeBus(TRIT.X, input.width);
      this.drawPort(ctx, p.x, p.y, val, 'in');
      ctx.fillStyle = colors.muted;
      ctx.fillText(`${input.name}:${busToDisplay(val)}`, node.x + 10, p.y + 4);
    }
    for (const output of type.outputs || []) {
      const p = this.portPosition(node, output.name, 'out');
      const val = this.result?.outputs?.[node.id]?.[output.name] || normalizeBus(TRIT.X, output.width);
      this.drawPort(ctx, p.x, p.y, val, 'out');
      const text = `${output.name}:${busToDisplay(val)}`;
      ctx.fillStyle = colors.muted;
      ctx.fillText(text, node.x + size.w - 10 - ctx.measureText(text).width, p.y + 4);
    }

    if (node.type === 'INPUT' || node.type === 'INPUT3') {
      ctx.fillStyle = colors.accent;
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText('click para alternar', node.x + 10, node.y + size.h - 8);
    }
  }

  drawPort(ctx, x, y, bus, direction) {
    const t = bus.length === 1 ? bus[0] : (bus.includes(TRIT.X) ? TRIT.X : TRIT.Z);
    ctx.beginPath();
    ctx.arc(x, y, bus.length > 1 ? 6 : 5, 0, Math.PI * 2);
    ctx.fillStyle = colors[t] || colors.X;
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (bus.length > 1) {
      ctx.fillStyle = '#020617';
      ctx.font = 'bold 8px system-ui';
      ctx.fillText(String(bus.length), x - 2.5, y + 3);
    }
  }

  onMouseDown(event) {
    this.lastMouse = { x: event.offsetX, y: event.offsetY };
    const world = this.screenToWorld(event.offsetX, event.offsetY);
    const port = this.findPort(world.x, world.y);
    if (port) {
      if (port.direction === 'out') {
        this.connecting = port;
        this.draw();
        return;
      }
      if (this.connecting && port.direction === 'in') {
        this.tryConnect(this.connecting, port);
        this.connecting = null;
        refresh();
        return;
      }
    }
    const node = this.findNode(world.x, world.y);
    if (node) {
      this.selectNode(node.id);
      if (node.type === 'INPUT') {
        node.state.value = cycleTrit(node.state.value);
        refresh();
      } else if (node.type === 'INPUT3' && event.shiftKey) {
        const value = normalizeBus(node.state.value, 3);
        node.state.value = value.map(cycleTrit);
        refresh();
      }
      this.drag = { type: 'node', nodeId: node.id, dx: world.x - node.x, dy: world.y - node.y };
      return;
    }
    this.selectedNode = null;
    renderInspector();
    this.drag = { type: 'pan', x: event.offsetX, y: event.offsetY, panX: this.pan.x, panY: this.pan.y };
  }

  onMouseMove(event) {
    this.lastMouse = { x: event.offsetX, y: event.offsetY };
    const world = this.screenToWorld(event.offsetX, event.offsetY);
    this.hoverPort = this.findPort(world.x, world.y);
    if (this.drag?.type === 'node') {
      const node = project.nodes.find((n) => n.id === this.drag.nodeId);
      if (node) { node.x = world.x - this.drag.dx; node.y = world.y - this.drag.dy; }
      this.draw();
    } else if (this.drag?.type === 'pan') {
      this.pan.x = this.drag.panX + event.offsetX - this.drag.x;
      this.pan.y = this.drag.panY + event.offsetY - this.drag.y;
      this.draw();
    } else if (this.connecting) {
      this.draw();
    }
  }

  onMouseUp() {
    this.drag = null;
  }

  onDoubleClick(event) {
    const world = this.screenToWorld(event.offsetX, event.offsetY);
    const port = this.findPort(world.x, world.y);
    if (port) return;
    const node = this.findNode(world.x, world.y);
    if (node) { deleteNode(node.id); return; }
    const wire = this.findWire(world.x, world.y);
    if (wire) {
      project.wires = project.wires.filter((w) => w.id !== wire.id);
      refresh();
    }
  }

  onWheel(event) {
    event.preventDefault();
    const before = this.screenToWorld(event.offsetX, event.offsetY);
    const factor = event.deltaY < 0 ? 1.08 : 0.92;
    this.scale = Math.min(2, Math.max(0.45, this.scale * factor));
    const after = this.screenToWorld(event.offsetX, event.offsetY);
    this.pan.x += (after.x - before.x) * this.scale;
    this.pan.y += (after.y - before.y) * this.scale;
    this.draw();
  }

  tryConnect(from, to) {
    if (from.nodeId === to.nodeId) return;
    const fromNode = project.nodes.find((n) => n.id === from.nodeId);
    const toNode = project.nodes.find((n) => n.id === to.nodeId);
    const fromType = getNodeType(fromNode.type, project.customChips);
    const toType = getNodeType(toNode.type, project.customChips);
    const outDef = fromType.outputs.find((p) => p.name === from.port);
    const inDef = toType.inputs.find((p) => p.name === to.port);
    if (outDef.width !== inDef.width) {
      setStatus(`Largura incompatível: ${outDef.width} → ${inDef.width}`);
      return;
    }
    const exists = project.wires.some((w) => w.fromNode === from.nodeId && w.fromPort === from.port && w.toNode === to.nodeId && w.toPort === to.port);
    if (!exists) project.wires.push(createWire(from.nodeId, from.port, to.nodeId, to.port));
  }

  findNode(x, y) {
    for (let i = project.nodes.length - 1; i >= 0; i -= 1) {
      const node = project.nodes[i];
      const size = this.nodeSize(node);
      if (x >= node.x && x <= node.x + size.w && y >= node.y && y <= node.y + size.h) return node;
    }
    return null;
  }

  findPort(x, y) {
    for (let i = project.nodes.length - 1; i >= 0; i -= 1) {
      const node = project.nodes[i];
      const type = getNodeType(node.type, project.customChips);
      for (const input of type.inputs || []) {
        const p = this.portPosition(node, input.name, 'in');
        if (distance(x, y, p.x, p.y) < 10) return { nodeId: node.id, port: input.name, direction: 'in' };
      }
      for (const output of type.outputs || []) {
        const p = this.portPosition(node, output.name, 'out');
        if (distance(x, y, p.x, p.y) < 10) return { nodeId: node.id, port: output.name, direction: 'out' };
      }
    }
    return null;
  }

  findWire(x, y) {
    for (const wire of project.wires) {
      const from = project.nodes.find((n) => n.id === wire.fromNode);
      const to = project.nodes.find((n) => n.id === wire.toNode);
      if (!from || !to) continue;
      const a = this.portPosition(from, wire.fromPort, 'out');
      const b = this.portPosition(to, wire.toPort, 'in');
      if (pointToSegmentDistance(x, y, a.x, a.y, b.x, b.y) < 9) return wire;
    }
    return null;
  }
}

function distance(x1, y1, x2, y2) { return Math.hypot(x1 - x2, y1 - y2); }
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1; const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
  return distance(px, py, x1 + t * dx, y1 + t * dy);
}
function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, serializeProject(project));
  setStatus('Projeto salvo no navegador');
}
function loadLocal() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) { setStatus('Nenhum projeto salvo localmente'); return; }
  project = parseProject(saved);
  simulator = new CircuitSimulator(project);
  editor.selectedNode = null;
  refresh();
}
function clearProject() {
  if (!confirm('Limpar o projeto atual?')) return;
  project = defaultProject('Digital Ternary Logic');
  simulator = new CircuitSimulator(project);
  editor.selectedNode = null;
  refresh();
}
function exportProject() {
  exportBox.value = serializeProject(project);
  exportBox.classList.add('visible');
  exportBox.focus();
  exportBox.select();
  navigator.clipboard?.writeText(exportBox.value).catch(() => {});
  setStatus('JSON exportado; clique fora ou pressione Esc para fechar');
}
function importProject(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      project = parseProject(reader.result);
      simulator = new CircuitSimulator(project);
      editor.selectedNode = null;
      refresh();
      setStatus('Projeto importado');
    } catch (error) {
      setStatus(`Erro ao importar: ${error.message}`);
    }
  };
  reader.readAsText(file);
}

function createCustomChip() {
  const name = prompt('Nome do chip composto:');
  if (!name) return;
  try {
    const custom = exportAsCustomChip(project, name);
    project.customChips = project.customChips || {};
    project.customChips[custom.name] = custom.definition;
    setStatus(`Chip composto criado: ${custom.name}`);
    refresh();
  } catch (error) {
    alert(error.message);
  }
}

function wire(projectRef, from, out, to, input) { projectRef.wires.push(createWire(from.id, out, to.id, input)); }
function makeExamplePrimitives() {
  const p = defaultProject('Exemplo: TINV, TMIN e TMAX');
  const a = createNode('INPUT', 60, 120, 'A'); a.state.value = TRIT.N;
  const b = createNode('INPUT', 60, 260, 'B'); b.state.value = TRIT.P;
  const inv = createNode('TINV', 260, 90, 'TINV(A)');
  const min = createNode('TMIN', 260, 220, 'TMIN(A,B)');
  const max = createNode('TMAX', 260, 360, 'TMAX(A,B)');
  const o1 = createNode('OUTPUT', 500, 90, 'out_inv');
  const o2 = createNode('OUTPUT', 500, 220, 'out_min');
  const o3 = createNode('OUTPUT', 500, 360, 'out_max');
  p.nodes.push(a, b, inv, min, max, o1, o2, o3);
  wire(p, a, 'out', inv, 'in'); wire(p, inv, 'out', o1, 'in');
  wire(p, a, 'out', min, 'a'); wire(p, b, 'out', min, 'b'); wire(p, min, 'out', o2, 'in');
  wire(p, a, 'out', max, 'a'); wire(p, b, 'out', max, 'b'); wire(p, max, 'out', o3, 'in');
  return p;
}
function makeExampleAdder() {
  const p = defaultProject('Exemplo: Somador ternário balanceado');
  const a = createNode('INPUT', 60, 120, 'A'); a.state.value = TRIT.P;
  const b = createNode('INPUT', 60, 230, 'B'); b.state.value = TRIT.P;
  const cin = createNode('INPUT', 60, 340, 'Cin'); cin.state.value = TRIT.Z;
  const add = createNode('TADD', 310, 205, 'TADD');
  const sum = createNode('OUTPUT', 560, 170, 'SUM');
  const cout = createNode('OUTPUT', 560, 270, 'COUT');
  p.nodes.push(a, b, cin, add, sum, cout);
  wire(p, a, 'out', add, 'a'); wire(p, b, 'out', add, 'b'); wire(p, cin, 'out', add, 'cin');
  wire(p, add, 'sum', sum, 'in'); wire(p, add, 'cout', cout, 'in');
  return p;
}
function makeExampleMemory() {
  const p = defaultProject('Exemplo: Registrador e RAM9');
  const data = createNode('INPUT', 60, 80, 'Data'); data.state.value = TRIT.P;
  const load = createNode('INPUT', 60, 180, 'Load/WE'); load.state.value = TRIT.P;
  const reset = createNode('INPUT', 60, 280, 'Reset'); reset.state.value = TRIT.N;
  const reg = createNode('REGISTER', 300, 130, 'Reg1');
  const q = createNode('OUTPUT', 540, 150, 'Q');
  const a1 = createNode('INPUT', 60, 450, 'A1'); a1.state.value = TRIT.Z;
  const a0 = createNode('INPUT', 60, 550, 'A0'); a0.state.value = TRIT.P;
  const ram = createNode('RAM9', 300, 430, 'RAM9');
  const out = createNode('OUTPUT', 560, 500, 'RAM out');
  p.nodes.push(data, load, reset, reg, q, a1, a0, ram, out);
  wire(p, data, 'out', reg, 'd'); wire(p, load, 'out', reg, 'load'); wire(p, reset, 'out', reg, 'reset'); wire(p, reg, 'q', q, 'in');
  wire(p, a1, 'out', ram, 'a1'); wire(p, a0, 'out', ram, 'a0'); wire(p, reg, 'q', ram, 'data'); wire(p, load, 'out', ram, 'we'); wire(p, ram, 'out', out, 'in');
  return p;
}

function loadExample(name) {
  if (name === 'primitives') project = makeExamplePrimitives();
  if (name === 'adder') project = makeExampleAdder();
  if (name === 'memory') project = makeExampleMemory();
  simulator = new CircuitSimulator(project);
  editor.selectedNode = null;
  refresh();
}

function boot() {
  editor = new CanvasEditor(canvas);
  document.querySelector('#btnTick').addEventListener('click', () => {
    simulator.project = project;
    const result = simulator.simulate({ tick: true });
    editor.setResult(result);
    renderInspector();
    setStatus('Tick executado');
  });
  document.querySelector('#btnSave').addEventListener('click', saveLocal);
  document.querySelector('#btnLoad').addEventListener('click', loadLocal);
  document.querySelector('#btnClear').addEventListener('click', clearProject);
  document.querySelector('#btnExport').addEventListener('click', exportProject);
  document.querySelector('#fileImport').addEventListener('change', (e) => { if (e.target.files[0]) importProject(e.target.files[0]); e.target.value = ''; });
  document.querySelector('#btnCreateChip').addEventListener('click', createCustomChip);
  document.querySelectorAll('[data-example]').forEach((btn) => btn.addEventListener('click', () => loadExample(btn.dataset.example)));
  exportBox.addEventListener('keydown', (e) => { if (e.key === 'Escape') exportBox.classList.remove('visible'); });
  exportBox.addEventListener('blur', () => exportBox.classList.remove('visible'));
  loadExample('primitives');
}

boot();
