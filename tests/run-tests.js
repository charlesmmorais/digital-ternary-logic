import assert from 'node:assert/strict';
import {
  TRIT,
  tInv,
  tMin,
  tMax,
  balancedFullAdd,
  decimalToBalancedDigits,
  balancedDigitsToDecimal,
  mergeDrivers,
} from '../src/core/trit.js';
import {
  CircuitSimulator,
  createNode,
  createWire,
  defaultProject,
  exportAsCustomChip,
} from '../src/core/circuit.js';

function connect(project, from, out, to, input) {
  project.wires.push(createWire(from.id, out, to.id, input));
}

function testPrimitives() {
  assert.equal(tInv(TRIT.N), TRIT.P);
  assert.equal(tInv(TRIT.Z), TRIT.Z);
  assert.equal(tInv(TRIT.P), TRIT.N);
  assert.equal(tMin(TRIT.N, TRIT.P), TRIT.N);
  assert.equal(tMin(TRIT.Z, TRIT.P), TRIT.Z);
  assert.equal(tMax(TRIT.N, TRIT.P), TRIT.P);
  assert.equal(tMax(TRIT.N, TRIT.Z), TRIT.Z);
}

function testAdder() {
  assert.deepEqual(balancedFullAdd(TRIT.P, TRIT.P, TRIT.Z), { sum: TRIT.N, carry: TRIT.P });
  assert.deepEqual(balancedFullAdd(TRIT.P, TRIT.P, TRIT.P), { sum: TRIT.Z, carry: TRIT.P });
  assert.deepEqual(balancedFullAdd(TRIT.N, TRIT.N, TRIT.Z), { sum: TRIT.P, carry: TRIT.N });
  assert.deepEqual(balancedFullAdd(TRIT.N, TRIT.N, TRIT.N), { sum: TRIT.Z, carry: TRIT.N });
}

function testBalancedConversion() {
  const cases = new Map([
    [-4, [TRIT.N, TRIT.N]],
    [-3, [TRIT.N, TRIT.Z]],
    [-2, [TRIT.N, TRIT.P]],
    [-1, [TRIT.N]],
    [0, [TRIT.Z]],
    [1, [TRIT.P]],
    [2, [TRIT.P, TRIT.N]],
    [3, [TRIT.P, TRIT.Z]],
    [4, [TRIT.P, TRIT.P]],
  ]);
  for (const [decimal, digits] of cases) {
    assert.deepEqual(decimalToBalancedDigits(decimal), digits, `decimal ${decimal}`);
    assert.equal(balancedDigitsToDecimal(digits), decimal, `digits ${digits.join('')}`);
  }
}

function testConflict() {
  assert.deepEqual(mergeDrivers([[TRIT.P], [TRIT.P]], 1), [TRIT.P]);
  assert.deepEqual(mergeDrivers([[TRIT.X], [TRIT.N]], 1), [TRIT.N]);
  assert.deepEqual(mergeDrivers([[TRIT.P], [TRIT.N]], 1), [TRIT.X]);
}

function testCircuitTInv() {
  const project = defaultProject('test');
  const input = createNode('INPUT', 0, 0, 'A'); input.state.value = TRIT.N;
  const inv = createNode('TINV', 0, 0, 'INV');
  const output = createNode('OUTPUT', 0, 0, 'Y');
  project.nodes.push(input, inv, output);
  connect(project, input, 'out', inv, 'in');
  connect(project, inv, 'out', output, 'in');
  const result = new CircuitSimulator(project).simulate();
  assert.deepEqual(result.inputs[output.id].in, [TRIT.P]);
}

function testRegisterTick() {
  const project = defaultProject('register');
  const data = createNode('INPUT', 0, 0, 'D'); data.state.value = TRIT.N;
  const load = createNode('INPUT', 0, 0, 'LOAD'); load.state.value = TRIT.P;
  const reset = createNode('INPUT', 0, 0, 'RESET'); reset.state.value = TRIT.N;
  const reg = createNode('REGISTER', 0, 0, 'R');
  const out = createNode('OUTPUT', 0, 0, 'Q');
  project.nodes.push(data, load, reset, reg, out);
  connect(project, data, 'out', reg, 'd');
  connect(project, load, 'out', reg, 'load');
  connect(project, reset, 'out', reg, 'reset');
  connect(project, reg, 'q', out, 'in');
  const sim = new CircuitSimulator(project);
  assert.deepEqual(sim.simulate().inputs[out.id].in, [TRIT.Z]);
  assert.deepEqual(sim.simulate({ tick: true }).inputs[out.id].in, [TRIT.N]);
}

function testRam9() {
  const project = defaultProject('ram');
  const a1 = createNode('INPUT', 0, 0, 'A1'); a1.state.value = TRIT.Z;
  const a0 = createNode('INPUT', 0, 0, 'A0'); a0.state.value = TRIT.P;
  const data = createNode('INPUT', 0, 0, 'D'); data.state.value = TRIT.P;
  const we = createNode('INPUT', 0, 0, 'WE'); we.state.value = TRIT.P;
  const ram = createNode('RAM9', 0, 0, 'RAM');
  const out = createNode('OUTPUT', 0, 0, 'OUT');
  project.nodes.push(a1, a0, data, we, ram, out);
  connect(project, a1, 'out', ram, 'a1');
  connect(project, a0, 'out', ram, 'a0');
  connect(project, data, 'out', ram, 'data');
  connect(project, we, 'out', ram, 'we');
  connect(project, ram, 'out', out, 'in');
  const sim = new CircuitSimulator(project);
  assert.deepEqual(sim.simulate().inputs[out.id].in, [TRIT.Z]);
  assert.deepEqual(sim.simulate({ tick: true }).inputs[out.id].in, [TRIT.P]);
}

function testCustomChip() {
  const project = defaultProject('custom base');
  const input = createNode('INPUT', 0, 0, 'a'); input.state.value = TRIT.N;
  const inv = createNode('TINV', 0, 0, 'inv');
  const output = createNode('OUTPUT', 0, 0, 'y');
  project.nodes.push(input, inv, output);
  connect(project, input, 'out', inv, 'in');
  connect(project, inv, 'out', output, 'in');
  const custom = exportAsCustomChip(project, 'NEGATE');

  const top = defaultProject('top');
  top.customChips[custom.name] = custom.definition;
  const topInput = createNode('INPUT', 0, 0, 'A'); topInput.state.value = TRIT.P;
  const customNode = createNode('CUSTOM:NEGATE', 0, 0, 'NEGATE');
  const topOutput = createNode('OUTPUT', 0, 0, 'Y');
  top.nodes.push(topInput, customNode, topOutput);
  connect(top, topInput, 'out', customNode, 'a');
  connect(top, customNode, 'y', topOutput, 'in');
  const result = new CircuitSimulator(top).simulate();
  assert.deepEqual(result.inputs[topOutput.id].in, [TRIT.N]);
}

const tests = [
  testPrimitives,
  testAdder,
  testBalancedConversion,
  testConflict,
  testCircuitTInv,
  testRegisterTick,
  testRam9,
  testCustomChip,
];

for (const test of tests) {
  test();
  console.log(`✓ ${test.name}`);
}
console.log(`\n${tests.length} tests passed.`);
