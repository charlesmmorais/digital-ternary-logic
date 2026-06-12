import {
  TRIT,
  tInv,
  tMin,
  tMax,
  tEq,
  tMux3,
  balancedFullAdd,
  normalizeTrit,
  normalizeBus,
  makeBus,
  busEquals,
  mergeDrivers,
  busToDisplay,
  balancedDigitsToDecimal,
} from './trit.js';

export const PROJECT_VERSION = '1.0.0';

export const BUILTIN_TYPES = Object.freeze({
  INPUT: {
    title: 'Input', category: 'I/O', description: 'Entrada manual de 1 trit. Clique para alternar N → 0 → P.',
    inputs: [], outputs: [{ name: 'out', width: 1 }], defaults: { value: TRIT.Z }, kind: 'source'
  },
  INPUT3: {
    title: 'Input Bus 3', category: 'I/O', description: 'Entrada manual de barramento com 3 trits.',
    inputs: [], outputs: [{ name: 'out', width: 3 }], defaults: { value: [TRIT.Z, TRIT.Z, TRIT.Z] }, kind: 'source'
  },
  OUTPUT: {
    title: 'Output', category: 'I/O', description: 'Saída/probe de 1 trit.',
    inputs: [{ name: 'in', width: 1 }], outputs: [], defaults: {}, kind: 'sink'
  },
  OUTPUT3: {
    title: 'Output Bus 3', category: 'I/O', description: 'Saída/probe de barramento com 3 trits.',
    inputs: [{ name: 'in', width: 3 }], outputs: [], defaults: {}, kind: 'sink'
  },
  CONST_N: {
    title: 'Const N', category: 'Sources', description: 'Constante -1.',
    inputs: [], outputs: [{ name: 'out', width: 1 }], defaults: {}, kind: 'source'
  },
  CONST_Z: {
    title: 'Const 0', category: 'Sources', description: 'Constante 0.',
    inputs: [], outputs: [{ name: 'out', width: 1 }], defaults: {}, kind: 'source'
  },
  CONST_P: {
    title: 'Const P', category: 'Sources', description: 'Constante +1.',
    inputs: [], outputs: [{ name: 'out', width: 1 }], defaults: {}, kind: 'source'
  },
  TINV: {
    title: 'TINV', category: 'Primitives', description: 'Inversor ternário balanceado: -1 ↔ +1; 0 permanece 0.',
    inputs: [{ name: 'in', width: 1 }], outputs: [{ name: 'out', width: 1 }], defaults: {}, kind: 'gate'
  },
  TMIN: {
    title: 'TMIN', category: 'Primitives', description: 'Mínimo ternário, equivalente ao AND balanceado.',
    inputs: [{ name: 'a', width: 1 }, { name: 'b', width: 1 }], outputs: [{ name: 'out', width: 1 }], defaults: {}, kind: 'gate'
  },
  TMAX: {
    title: 'TMAX', category: 'Primitives', description: 'Máximo ternário, equivalente ao OR balanceado.',
    inputs: [{ name: 'a', width: 1 }, { name: 'b', width: 1 }], outputs: [{ name: 'out', width: 1 }], defaults: {}, kind: 'gate'
  },
  TRIBUF: {
    title: 'TriBuf', category: 'Bus', description: 'Buffer tri-state: passa D quando EN=P; caso contrário deixa X.',
    inputs: [{ name: 'd', width: 1 }, { name: 'en', width: 1 }], outputs: [{ name: 'out', width: 1 }], defaults: {}, kind: 'gate'
  },
  MERGE3: {
    title: 'Merge3', category: 'Bus', description: 'Combina três fios de 1 trit em um barramento de 3 trits.',
    inputs: [{ name: 't0', width: 1 }, { name: 't1', width: 1 }, { name: 't2', width: 1 }], outputs: [{ name: 'bus', width: 3 }], defaults: {}, kind: 'gate'
  },
  SPLIT3: {
    title: 'Split3', category: 'Bus', description: 'Divide um barramento de 3 trits em três fios.',
    inputs: [{ name: 'bus', width: 3 }], outputs: [{ name: 't0', width: 1 }, { name: 't1', width: 1 }, { name: 't2', width: 1 }], defaults: {}, kind: 'gate'
  },
  TDEC: {
    title: 'TDEC', category: 'Selectors', description: 'Decodificador: ativa n/z/p com P; demais saem N.',
    inputs: [{ name: 'in', width: 1 }], outputs: [{ name: 'n', width: 1 }, { name: 'z', width: 1 }, { name: 'p', width: 1 }], defaults: {}, kind: 'gate'
  },
  TMUX3: {
    title: 'TMUX3', category: 'Selectors', description: 'Multiplexador ternário: sel=N escolhe n, sel=0 escolhe z, sel=P escolhe p.',
    inputs: [{ name: 'sel', width: 1 }, { name: 'n', width: 1 }, { name: 'z', width: 1 }, { name: 'p', width: 1 }], outputs: [{ name: 'out', width: 1 }], defaults: {}, kind: 'gate'
  },
  TEQ: {
    title: 'TEQ', category: 'Selectors', description: 'Comparador ternário: P se A=B, N se A≠B, X se indefinido.',
    inputs: [{ name: 'a', width: 1 }, { name: 'b', width: 1 }], outputs: [{ name: 'eq', width: 1 }], defaults: {}, kind: 'gate'
  },
  TADD: {
    title: 'TADD', category: 'Arithmetic', description: 'Somador completo balanceado: A+B+Cin → Sum+Cout.',
    inputs: [{ name: 'a', width: 1 }, { name: 'b', width: 1 }, { name: 'cin', width: 1 }], outputs: [{ name: 'sum', width: 1 }, { name: 'cout', width: 1 }], defaults: {}, kind: 'gate'
  },
  REGISTER: {
    title: 'Register', category: 'Sequential', description: 'Registrador de 1 trit. No Tick: LOAD=P grava D; RESET=P zera.',
    inputs: [{ name: 'd', width: 1 }, { name: 'load', width: 1 }, { name: 'reset', width: 1 }], outputs: [{ name: 'q', width: 1 }], defaults: { q: TRIT.Z }, kind: 'stateful'
  },
  RAM9: {
    title: 'RAM9', category: 'Memory', description: 'RAM ternária de 9 células. Endereço com 2 trits balanceados; Tick grava se WE=P.',
    inputs: [{ name: 'a1', width: 1 }, { name: 'a0', width: 1 }, { name: 'data', width: 1 }, { name: 'we', width: 1 }], outputs: [{ name: 'out', width: 1 }], defaults: { mem: Array(9).fill(TRIT.Z) }, kind: 'stateful'
  },
  ROM9: {
    title: 'ROM9', category: 'Memory', description: 'ROM ternária de 9 células. Edite a memória no painel de propriedades.',
    inputs: [{ name: 'a1', width: 1 }, { name: 'a0', width: 1 }], outputs: [{ name: 'out', width: 1 }], defaults: { mem: [TRIT.N, TRIT.N, TRIT.Z, TRIT.P, TRIT.Z, TRIT.P, TRIT.N, TRIT.Z, TRIT.P] }, kind: 'memory'
  }
});

export function makeId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultProject(name = 'Digital Ternary Logic') {
  return { version: PROJECT_VERSION, name, nodes: [], wires: [], customChips: {} };
}

export function cloneProject(project) {
  return JSON.parse(JSON.stringify(project));
}

export function getNodeType(type, customChips = {}) {
  if (BUILTIN_TYPES[type]) return BUILTIN_TYPES[type];
  if (type?.startsWith('CUSTOM:')) {
    const name = type.slice('CUSTOM:'.length);
    const def = customChips[name];
    if (!def) return null;
    return makeCustomType(name, def);
  }
  return null;
}

export function makeCustomType(name, definition) {
  const inputs = exposedInputNodes(definition).map((n, i) => ({ name: safePortName(n.label || `in${i}`), width: getNodeType(n.type, definition.customChips)?.outputs?.[0]?.width ?? 1 }));
  const outputs = exposedOutputNodes(definition).map((n, i) => ({ name: safePortName(n.label || `out${i}`), width: getNodeType(n.type, definition.customChips)?.inputs?.[0]?.width ?? 1 }));
  return {
    title: name,
    category: 'Custom Chips',
    description: `Chip composto: ${name}`,
    inputs,
    outputs,
    defaults: {},
    kind: 'custom'
  };
}

export function safePortName(label) {
  return String(label || 'port').trim().toLowerCase().replace(/[^a-z0-9_]+/gi, '_').replace(/^_+|_+$/g, '') || 'port';
}

function exposedInputNodes(project) {
  return (project.nodes || [])
    .filter((n) => n.type === 'INPUT' || n.type === 'INPUT3')
    .sort((a, b) => (a.y - b.y) || (a.x - b.x) || String(a.id).localeCompare(String(b.id)));
}

function exposedOutputNodes(project) {
  return (project.nodes || [])
    .filter((n) => n.type === 'OUTPUT' || n.type === 'OUTPUT3')
    .sort((a, b) => (a.y - b.y) || (a.x - b.x) || String(a.id).localeCompare(String(b.id)));
}

export function createNode(type, x = 80, y = 80, label = '') {
  const base = BUILTIN_TYPES[type] || null;
  const state = JSON.parse(JSON.stringify(base?.defaults || {}));
  return {
    id: makeId('node'),
    type,
    x,
    y,
    label: label || base?.title || type,
    state
  };
}

export function createWire(fromNode, fromPort, toNode, toPort) {
  return { id: makeId('wire'), fromNode, fromPort, toNode, toPort };
}

export class CircuitSimulator {
  constructor(project) {
    this.project = project;
    this.result = null;
  }

  simulate(options = {}) {
    const project = this.project;
    const maxIterations = options.maxIterations ?? 64;
    const nodeMap = new Map(project.nodes.map((node) => [node.id, node]));
    let outputs = this.initialOutputs(project);
    let inputs = this.collectInputs(project, outputs, nodeMap);
    let stable = false;

    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      const nextOutputs = {};
      for (const node of project.nodes) {
        nextOutputs[node.id] = this.evaluateNode(node, inputs[node.id] || {}, false);
      }
      stable = outputsEqual(outputs, nextOutputs);
      outputs = nextOutputs;
      inputs = this.collectInputs(project, outputs, nodeMap);
      if (stable) break;
    }

    if (options.tick) {
      for (const node of project.nodes) this.commitNode(node, inputs[node.id] || {});
      outputs = this.initialOutputs(project);
      inputs = this.collectInputs(project, outputs, nodeMap);
      for (let iteration = 0; iteration < maxIterations; iteration += 1) {
        const nextOutputs = {};
        for (const node of project.nodes) nextOutputs[node.id] = this.evaluateNode(node, inputs[node.id] || {}, false);
        stable = outputsEqual(outputs, nextOutputs);
        outputs = nextOutputs;
        inputs = this.collectInputs(project, outputs, nodeMap);
        if (stable) break;
      }
    }

    const conflicts = detectInputConflicts(project, outputs, nodeMap);
    this.result = { outputs, inputs, stable, conflicts };
    return this.result;
  }

  initialOutputs(project) {
    const outputs = {};
    for (const node of project.nodes) outputs[node.id] = this.evaluateNode(node, {}, true);
    return outputs;
  }

  collectInputs(project, outputs, nodeMap) {
    const inputs = {};
    for (const node of project.nodes) inputs[node.id] = {};

    for (const node of project.nodes) {
      const type = getNodeType(node.type, project.customChips);
      for (const input of type?.inputs || []) inputs[node.id][input.name] = makeBus(input.width, TRIT.X);
    }

    const grouped = new Map();
    for (const wire of project.wires || []) {
      const toNode = nodeMap.get(wire.toNode);
      const fromNode = nodeMap.get(wire.fromNode);
      if (!toNode || !fromNode) continue;
      const toType = getNodeType(toNode.type, project.customChips);
      const inputDef = toType?.inputs?.find((p) => p.name === wire.toPort);
      if (!inputDef) continue;
      const key = `${wire.toNode}:${wire.toPort}`;
      if (!grouped.has(key)) grouped.set(key, { width: inputDef.width, drivers: [] });
      const bus = outputs?.[wire.fromNode]?.[wire.fromPort] || makeBus(inputDef.width, TRIT.X);
      grouped.get(key).drivers.push(bus);
    }

    for (const [key, info] of grouped) {
      const [nodeId, port] = key.split(':');
      inputs[nodeId][port] = mergeDrivers(info.drivers, info.width);
    }
    return inputs;
  }

  evaluateNode(node, inputs, initialOnly = false) {
    const typeDef = getNodeType(node.type, this.project.customChips);
    if (!typeDef) return {};
    const out = {};
    const pin = (name, width = 1) => normalizeBus(inputs[name], width);
    const trit = (name) => pin(name, 1)[0];

    switch (node.type) {
      case 'INPUT': out.out = normalizeBus(node.state?.value ?? TRIT.Z, 1); break;
      case 'INPUT3': out.out = normalizeBus(node.state?.value ?? [TRIT.Z, TRIT.Z, TRIT.Z], 3); break;
      case 'OUTPUT': case 'OUTPUT3': break;
      case 'CONST_N': out.out = [TRIT.N]; break;
      case 'CONST_Z': out.out = [TRIT.Z]; break;
      case 'CONST_P': out.out = [TRIT.P]; break;
      case 'TINV': out.out = [tInv(trit('in'))]; break;
      case 'TMIN': out.out = [tMin(trit('a'), trit('b'))]; break;
      case 'TMAX': out.out = [tMax(trit('a'), trit('b'))]; break;
      case 'TRIBUF': out.out = trit('en') === TRIT.P ? pin('d', 1) : [TRIT.X]; break;
      case 'MERGE3': out.bus = [trit('t0'), trit('t1'), trit('t2')]; break;
      case 'SPLIT3': {
        const bus = pin('bus', 3);
        out.t0 = [bus[0]]; out.t1 = [bus[1]]; out.t2 = [bus[2]];
        break;
      }
      case 'TDEC': {
        const value = trit('in');
        out.n = [value === TRIT.X ? TRIT.X : (value === TRIT.N ? TRIT.P : TRIT.N)];
        out.z = [value === TRIT.X ? TRIT.X : (value === TRIT.Z ? TRIT.P : TRIT.N)];
        out.p = [value === TRIT.X ? TRIT.X : (value === TRIT.P ? TRIT.P : TRIT.N)];
        break;
      }
      case 'TMUX3': out.out = [tMux3(trit('sel'), trit('n'), trit('z'), trit('p'))]; break;
      case 'TEQ': out.eq = [tEq(trit('a'), trit('b'))]; break;
      case 'TADD': {
        const sum = balancedFullAdd(trit('a'), trit('b'), trit('cin'));
        out.sum = [sum.sum]; out.cout = [sum.carry];
        break;
      }
      case 'REGISTER': out.q = [normalizeTrit(node.state?.q ?? TRIT.Z)]; break;
      case 'RAM9': out.out = [readMemory9(node.state?.mem, trit('a1'), trit('a0'))]; break;
      case 'ROM9': out.out = [readMemory9(node.state?.mem, trit('a1'), trit('a0'))]; break;
      default: {
        if (node.type?.startsWith('CUSTOM:') && !initialOnly) {
          return this.evaluateCustomNode(node, inputs);
        }
      }
    }
    return out;
  }

  evaluateCustomNode(node, inputs) {
    const name = node.type.slice('CUSTOM:'.length);
    const def = this.project.customChips?.[name];
    if (!def) return {};
    const instance = cloneProject(def);
    instance.customChips = { ...(this.project.customChips || {}), ...(def.customChips || {}) };
    const exposedInputs = exposedInputNodes(instance);
    exposedInputs.forEach((inputNode, i) => {
      const portName = safePortName(inputNode.label || `in${i}`);
      const portDef = getNodeType(inputNode.type, instance.customChips)?.outputs?.[0];
      inputNode.state = inputNode.state || {};
      inputNode.state.value = normalizeBus(inputs[portName], portDef?.width ?? 1);
    });
    const simulator = new CircuitSimulator(instance);
    const result = simulator.simulate({ maxIterations: 64 });
    const exposedOutputs = exposedOutputNodes(instance);
    const out = {};
    exposedOutputs.forEach((outputNode, i) => {
      const portName = safePortName(outputNode.label || `out${i}`);
      const portDef = getNodeType(outputNode.type, instance.customChips)?.inputs?.[0];
      out[portName] = normalizeBus(result.inputs[outputNode.id]?.in, portDef?.width ?? 1);
    });
    return out;
  }

  commitNode(node, inputs) {
    const trit = (name) => normalizeBus(inputs[name], 1)[0];
    if (node.type === 'REGISTER') {
      node.state = node.state || {};
      if (trit('reset') === TRIT.P) node.state.q = TRIT.Z;
      else if (trit('load') === TRIT.P) node.state.q = trit('d');
    }
    if (node.type === 'RAM9') {
      node.state = node.state || {};
      node.state.mem = Array.isArray(node.state.mem) ? node.state.mem.map(normalizeTrit).slice(0, 9) : Array(9).fill(TRIT.Z);
      while (node.state.mem.length < 9) node.state.mem.push(TRIT.Z);
      if (trit('we') === TRIT.P) {
        const index = address2ToIndex(trit('a1'), trit('a0'));
        if (index >= 0) node.state.mem[index] = trit('data');
      }
    }
  }
}

function address2ToIndex(a1, a0) {
  const value = balancedDigitsToDecimal([a1, a0]);
  if (!Number.isFinite(value) || value < -4 || value > 4) return -1;
  return value + 4;
}

function readMemory9(mem, a1, a0) {
  const index = address2ToIndex(a1, a0);
  if (index < 0) return TRIT.X;
  const memory = Array.isArray(mem) ? mem : Array(9).fill(TRIT.Z);
  return normalizeTrit(memory[index] ?? TRIT.Z);
}

function outputsEqual(a, b) {
  const nodeIds = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const nodeId of nodeIds) {
    const ports = new Set([...Object.keys(a?.[nodeId] || {}), ...Object.keys(b?.[nodeId] || {})]);
    for (const port of ports) {
      if (!busEquals(a?.[nodeId]?.[port] || [], b?.[nodeId]?.[port] || [])) return false;
    }
  }
  return true;
}

function detectInputConflicts(project, outputs, nodeMap) {
  const conflicts = [];
  const grouped = new Map();
  for (const wire of project.wires || []) {
    const toNode = nodeMap.get(wire.toNode);
    const fromNode = nodeMap.get(wire.fromNode);
    if (!toNode || !fromNode) continue;
    const toType = getNodeType(toNode.type, project.customChips);
    const inputDef = toType?.inputs?.find((p) => p.name === wire.toPort);
    if (!inputDef) continue;
    const key = `${wire.toNode}:${wire.toPort}`;
    if (!grouped.has(key)) grouped.set(key, { wire, width: inputDef.width, buses: [] });
    grouped.get(key).buses.push(outputs?.[wire.fromNode]?.[wire.fromPort] || makeBus(inputDef.width, TRIT.X));
  }
  for (const [key, info] of grouped) {
    if (info.buses.length < 2) continue;
    const merged = mergeDrivers(info.buses, info.width);
    const nonX = info.buses.flat().filter((t) => normalizeTrit(t) !== TRIT.X);
    if (merged.includes(TRIT.X) && new Set(nonX).size > 1) {
      const [nodeId, port] = key.split(':');
      conflicts.push({ nodeId, port, drivers: info.buses.map(busToDisplay) });
    }
  }
  return conflicts;
}

export function serializeProject(project) {
  return JSON.stringify(project, null, 2);
}

export function parseProject(json) {
  const project = typeof json === 'string' ? JSON.parse(json) : json;
  return {
    version: project.version || PROJECT_VERSION,
    name: project.name || 'Digital Ternary Logic',
    nodes: Array.isArray(project.nodes) ? project.nodes : [],
    wires: Array.isArray(project.wires) ? project.wires : [],
    customChips: project.customChips || {}
  };
}

export function exportAsCustomChip(project, name) {
  const cleanName = String(name || '').trim().replace(/[^a-z0-9_ -]+/gi, '').slice(0, 32);
  if (!cleanName) throw new Error('Informe um nome para o chip composto.');
  const inputs = exposedInputNodes(project);
  const outputs = exposedOutputNodes(project);
  if (inputs.length === 0 || outputs.length === 0) throw new Error('Um chip composto precisa ter pelo menos um INPUT e um OUTPUT expostos.');
  const def = cloneProject(project);
  delete def.customChips;
  return { name: cleanName, definition: def };
}
