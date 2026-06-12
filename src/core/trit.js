export const TRIT = Object.freeze({ N: 'N', Z: '0', P: 'P', X: 'X' });
export const TRITS = Object.freeze([TRIT.N, TRIT.Z, TRIT.P]);

const NUMERIC = Object.freeze({ [TRIT.N]: -1, [TRIT.Z]: 0, [TRIT.P]: 1 });
const FROM_NUMERIC = Object.freeze({ '-1': TRIT.N, '0': TRIT.Z, '1': TRIT.P });

export function normalizeTrit(value) {
  if (value === -1 || value === '-1' || value === 'N' || value === 'n') return TRIT.N;
  if (value === 0 || value === '0' || value === 'Z' || value === 'z') return TRIT.Z;
  if (value === 1 || value === '+1' || value === '1' || value === 'P' || value === 'p') return TRIT.P;
  return TRIT.X;
}

export function tritToNumber(value) {
  const t = normalizeTrit(value);
  return t === TRIT.X ? Number.NaN : NUMERIC[t];
}

export function numberToTrit(value) {
  if (value < 0) return TRIT.N;
  if (value > 0) return TRIT.P;
  return TRIT.Z;
}

export function tInv(value) {
  const t = normalizeTrit(value);
  if (t === TRIT.N) return TRIT.P;
  if (t === TRIT.P) return TRIT.N;
  if (t === TRIT.Z) return TRIT.Z;
  return TRIT.X;
}

export function tMin(a, b) {
  const ta = normalizeTrit(a);
  const tb = normalizeTrit(b);
  if (ta === TRIT.X || tb === TRIT.X) return TRIT.X;
  return NUMERIC[ta] <= NUMERIC[tb] ? ta : tb;
}

export function tMax(a, b) {
  const ta = normalizeTrit(a);
  const tb = normalizeTrit(b);
  if (ta === TRIT.X || tb === TRIT.X) return TRIT.X;
  return NUMERIC[ta] >= NUMERIC[tb] ? ta : tb;
}

export function tEq(a, b) {
  const ta = normalizeTrit(a);
  const tb = normalizeTrit(b);
  if (ta === TRIT.X || tb === TRIT.X) return TRIT.X;
  return ta === tb ? TRIT.P : TRIT.N;
}

export function tMux3(sel, nValue, zValue, pValue) {
  const s = normalizeTrit(sel);
  if (s === TRIT.N) return normalizeTrit(nValue);
  if (s === TRIT.Z) return normalizeTrit(zValue);
  if (s === TRIT.P) return normalizeTrit(pValue);
  return TRIT.X;
}

export function balancedFullAdd(a, b, carryIn = TRIT.Z) {
  const values = [a, b, carryIn].map(normalizeTrit);
  if (values.includes(TRIT.X)) return { sum: TRIT.X, carry: TRIT.X };
  const total = values.reduce((acc, v) => acc + NUMERIC[v], 0);
  if (total > 1) return { sum: FROM_NUMERIC[String(total - 3)], carry: TRIT.P };
  if (total < -1) return { sum: FROM_NUMERIC[String(total + 3)], carry: TRIT.N };
  return { sum: FROM_NUMERIC[String(total)], carry: TRIT.Z };
}

export function makeBus(width = 1, fill = TRIT.X) {
  return Array.from({ length: Math.max(1, width) }, () => normalizeTrit(fill));
}

export function normalizeBus(value, width = 1) {
  if (Array.isArray(value)) {
    const bus = value.map(normalizeTrit);
    while (bus.length < width) bus.push(TRIT.X);
    return bus.slice(0, width);
  }
  return makeBus(width, value);
}

export function busEquals(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((v, i) => normalizeTrit(v) === normalizeTrit(b[i]));
}

export function mergeDrivers(driverBuses, width = 1) {
  const result = makeBus(width, TRIT.X);
  for (let i = 0; i < width; i += 1) {
    const driven = [];
    for (const bus of driverBuses) {
      const t = normalizeTrit(Array.isArray(bus) ? bus[i] : bus);
      if (t !== TRIT.X) driven.push(t);
    }
    if (driven.length === 0) {
      result[i] = TRIT.X;
    } else if (driven.every((t) => t === driven[0])) {
      result[i] = driven[0];
    } else {
      result[i] = TRIT.X;
    }
  }
  return result;
}

export function busToDisplay(bus) {
  const normalized = normalizeBus(bus, Array.isArray(bus) ? bus.length : 1);
  return normalized.join('');
}

export function cycleTrit(value) {
  const t = normalizeTrit(value);
  if (t === TRIT.N) return TRIT.Z;
  if (t === TRIT.Z) return TRIT.P;
  return TRIT.N;
}

export function balancedDigitsToDecimal(bus) {
  const normalized = normalizeBus(bus, Array.isArray(bus) ? bus.length : 1);
  let total = 0;
  for (const trit of normalized) {
    if (trit === TRIT.X) return Number.NaN;
    total = total * 3 + NUMERIC[trit];
  }
  return total;
}

export function decimalToBalancedDigits(number, minWidth = 1) {
  if (!Number.isFinite(number) || !Number.isInteger(number)) return makeBus(minWidth, TRIT.X);
  if (number === 0) return makeBus(minWidth, TRIT.Z);
  let n = number;
  const digits = [];
  while (n !== 0) {
    let remainder = ((n % 3) + 3) % 3;
    n = Math.floor((n - remainder) / 3);
    if (remainder === 2) {
      remainder = -1;
      n += 1;
    }
    digits.unshift(FROM_NUMERIC[String(remainder)]);
  }
  while (digits.length < minWidth) digits.unshift(TRIT.Z);
  return digits;
}
