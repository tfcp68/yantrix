const ERRORS = {
  DIVISION_BY_ZERO: "Division by 0",
  INVALID_NUMBER_OF_ARGUMENTS: "Invalid number of arguments",
  INVALID_NUMERIC_ARGUMENT: "Argument must be provided and be a valid number.",
  INVALID_BINARY_ARGUMENT: "Argument must be provided and be a valid binary",
  INVALID_ARGUMENTS: "Invalid arguments",
  INDEX_OUT_OF_RANGE: "Index out of range",
  INVALID_PRECISION_ARGUMENT: "Precision must be a valid number.",
  AT_LEAST_ONE_NUMBER_REQUIRED: "At least 1 parameter must be provided and be a number.",
  ALL_ARGUMENTS_MUST_BE_NUMBERS: "All arguments must be numbers.",
  LISTS_MUST_BE_ARRAYS: "All arguments provided must be lists",
  MIN_TWO_LISTS_REQUIRED: "At least 2 lists of the same length must be provided.",
  NON_EMPTY_LISTS_REQUIRED: "All lists must have at least 1 number.",
  LISTS_MUST_BE_SAME_LENGTH: "All lists provided must be the same length.",
  ALL_LIST_ITEMS_MUST_BE_NUMERIC: "All items in the provided lists must be numbers.",
  UNEXPECTED_ERROR: "An unexpected error has occurred.",
  ALL_ARGUMENTS_MUST_BE_STRINGS: "All arguments must be strings.",
  ALL_ARGUMENTS_MUST_BE_LISTS: "All arguments must be lists.",
  INVALID_LIST_ARGUMENT: "Invalid List argument",
  LIST_LENGTH_MISMATCH: "All List arguments must be of the same length"
};
const errorTypes = {
  DIVISION_BY_ZERO: EvalError,
  INDEX_OUT_OF_RANGE: RangeError,
  UNEXPECTED_ERROR: Error
};
function invalid(errorKey, extra) {
  throw new (errorTypes[errorKey] ?? TypeError)(ERRORS[errorKey] + (extra ? `: ${extra}` : ""));
}
function isCollection(value) {
  return Array.isArray(value) && value.every(
    (it) => it != null && (typeof it === "object" || typeof it === "function")
  );
}
function isIterable(obj) {
  return obj != null && typeof obj[Symbol.iterator] === "function";
}
function _deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null || typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => _deepEqual(a[k], b[k]));
}
function _parsePath(p) {
  return Array.isArray(p) ? p : String(p).replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
}
function _sampleSize(arr, n) {
  const a = [...arr];
  const size = Math.min(Math.max(0, n), a.length);
  for (let i = 0; i < size; i++) {
    const r = i + (Math.random() * (a.length - i) | 0);
    [a[r], a[i]] = [a[i], a[r]];
  }
  return a.slice(0, size);
}
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function unifyObjectKey(key) {
  return Number.parseInt(String(key));
}
__name(unifyObjectKey, "unifyObjectKey");
function deepEqual(a, b) {
  if (a === b) return true;
  if (a && b && typeof a === "object" && typeof b === "object") {
    if (a.constructor !== b.constructor) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      const length2 = a.length;
      if (length2 !== b.length) return false;
      for (let i = length2; i-- !== 0; ) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    const aObj = a;
    const bObj = b;
    if (aObj.constructor === RegExp) {
      return a.source === b.source && a.flags === b.flags;
    }
    if (aObj.valueOf !== Object.prototype.valueOf)
      return aObj.valueOf() === bObj.valueOf();
    if (aObj.toString !== Object.prototype.toString)
      return aObj.toString() === bObj.toString();
    const keys2 = Object.keys(aObj);
    const length = keys2.length;
    if (length !== Object.keys(bObj).length) return false;
    for (let i = length; i-- !== 0; ) {
      const key = keys2[i];
      if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false;
      if (!deepEqual(aObj[key], bObj[key])) return false;
    }
    return true;
  }
  return Number.isNaN(a) && Number.isNaN(b);
}
__name(deepEqual, "deepEqual");
function microtime() {
  let mt = 0;
  if (typeof process !== "undefined" && process?.hrtime)
    mt = ((/* @__PURE__ */ new Date()).getTime() * 1e9 + process.hrtime()[1]) / 864e11;
  else if (performance)
    mt = performance.now();
  else mt = ((/* @__PURE__ */ new Date()).getTime() + Math.random()) / 86400;
  return Number.parseInt(Math.floor(mt * 1e5).toString(10));
}
__name(microtime, "microtime");
function randomString(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
__name(randomString, "randomString");
function randomInteger(min2 = 1, max2 = 100) {
  return Math.floor(Math.random() * (max2 - min2)) + min2;
}
__name(randomInteger, "randomInteger");
var randomDecimal = /* @__PURE__ */ __name((min2 = -1e4, max2 = 1e4) => Math.random() * (max2 - min2) + min2, "randomDecimal");
function randomValueFunction() {
  const randomValueFunctions = [randomString, randomInteger, randomDecimal];
  const randomIndex = Math.floor(Math.random() * randomValueFunctions.length);
  return randomValueFunctions[randomIndex];
}
__name(randomValueFunction, "randomValueFunction");
function randomValue() {
  return randomValueFunction()();
}
__name(randomValue, "randomValue");
function randomArray(valueType, amount = randomInteger(1, 20)) {
  return Array.from({ length: amount }, valueType);
}
__name(randomArray, "randomArray");
function sampleRange(min2 = 1, max2 = 100) {
  return min2 + Math.floor(Math.random() * (max2 - min2 + 1));
}
__name(sampleRange, "sampleRange");
function pickFromArray(arr, n = 1) {
  const acc = [];
  if (!arr?.length || n <= 0)
    return acc;
  const a = JSON.parse(JSON.stringify(arr));
  while (acc.length < n) acc.push(...a.splice(Math.floor(Math.random() * a.length), 1));
  return acc;
}
__name(pickFromArray, "pickFromArray");
function popFromArray(arr, n = 1) {
  const acc = [];
  if (!arr?.length || n <= 0)
    return acc;
  let i = 0;
  while (i++ < n) {
    const v = arr.pop();
    if (v == null)
      break;
    acc.push(v);
  }
  return acc;
}
__name(popFromArray, "popFromArray");
function sampleArray(item, n) {
  if (item === null) {
    return Array.from({ length: n }).fill(null).map((_, ix) => ix + 1);
  }
  if (item instanceof Function) {
    return Array.from({ length: n }).fill(null).map((_, ix) => item(ix));
  }
  return Array.from({ length: n }).fill(item);
}
__name(sampleArray, "sampleArray");
function uniqId(length = 10) {
  const keys2 = [...microtime().toString(36)].reverse().slice(0, Math.floor(length / 2));
  while (keys2.length < length) keys2.push(...sampleRange(0, 35).toString(36));
  return keys2.slice(0, length).join("").toUpperCase();
}
__name(uniqId, "uniqId");
var isNumber = /* @__PURE__ */ __name((t) => Number.isFinite(t), "isNumber");
var isPositiveNumber = /* @__PURE__ */ __name((t) => isNumber(t) && t >= 0, "isPositiveNumber");
var isPositiveInteger = /* @__PURE__ */ __name((t) => isPositiveNumber(t) && Number.isSafeInteger(t), "isPositiveInteger");
function waitForEventOnce(bus, event, timeoutMs = 500) {
  return new Promise((resolve, reject) => {
    let done = false;
    let timeoutId;
    const cleanup = /* @__PURE__ */ __name((handler) => {
      if (done) return;
      done = true;
      if (handler) {
        bus.unsubscribe(event, handler);
      }
      clearTimeout(timeoutId);
    }, "cleanup");
    const cb = /* @__PURE__ */ __name((e) => {
      cleanup(cb);
      const evt = e.event ?? event;
      resolve({ event: evt, meta: e.meta });
      return {
        event: e.event,
        meta: e.meta,
        task_id: `wait_once_${String(event)}_${uniqId()}`,
        // Return an empty list of follow-up events
        result: Promise.resolve([])
      };
    }, "cb");
    timeoutId = setTimeout(() => {
      cleanup(cb);
      reject(new Error(`Timed out waiting for event ${String(event)} after ${timeoutMs}ms`));
    }, timeoutMs);
    bus.subscribe(event, cb);
  });
}
__name(waitForEventOnce, "waitForEventOnce");
function waitForState(automata, expectedState, timeoutMs = 500, tickMs = 0) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = /* @__PURE__ */ __name(() => {
      const { state } = automata.getContext();
      if (state === expectedState) return resolve();
      if (Date.now() - start >= timeoutMs) {
        return reject(new Error(`Timed out waiting for state ${String(expectedState)}, got ${String(state)}`));
      }
      setTimeout(tick, tickMs);
    }, "tick");
    tick();
  });
}
__name(waitForState, "waitForState");
function random(min2, max2) {
  if (typeof min2 === "number" && typeof max2 === "number") return Math.floor(Math.random() * (max2 - min2) + min2);
  else return Math.round(Math.random());
}
function weightedRandom(object) {
  const objectKeys = Object.keys(object);
  const objectWeights = Object.values(object);
  if (objectKeys.length === 0) throw new Error("Weighted random object is empty");
  for (const value of objectWeights) {
    if (!Number.isInteger(value)) throw new Error("Weighted random object contains non-integer values");
    else if (value <= 0) throw new Error("Weighted random object contains values of 0 or less");
  }
  const weightsSum = objectWeights.reduce((acc, weight) => acc + weight, 0);
  const cumulativeWeights = [];
  let cumulativeWeight = 0;
  for (let index = 0; index < objectWeights.length; index++) {
    cumulativeWeight += objectWeights[index] / weightsSum;
    cumulativeWeights.push(cumulativeWeight);
  }
  const randomNumber = Math.random();
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (cumulativeWeights[i] >= randomNumber) return objectKeys[i];
  }
  throw new Error("Unexpected error, could not get weighted random value");
}

const builtInFunctions = {};

// @@begin: if
function _if(condition, trueValue, falseValue) {
  return condition ? trueValue ?? condition : falseValue ?? null;
}
builtInFunctions['if'] = _if;
// @@end: if
// @@begin: case
const _case = (...args) => {
  if (!args?.length || args.length % 2 === 0)
    return invalid("INVALID_ARGUMENTS");
  const defaultValue = args[args.length - 1] ?? null;
  for (let i = 0; i < args.length - 1; i++) {
    if (i % 2 === 0 && typeof args[i] !== "boolean") {
      return invalid("INVALID_BINARY_ARGUMENT");
    }
    if (args[i] === true) {
      if (typeof args[i + 1] === "undefined")
        return invalid("INDEX_OUT_OF_RANGE");
      return args[i + 1];
    }
  }
  return defaultValue;
};
builtInFunctions['case'] = _case;
// @@end: case
// @@begin: coalesce
const coalesce = (...values2) => {
  if (!values2?.length) return invalid("INVALID_ARGUMENTS");
  for (const value of values2) {
    if (value !== null && value !== void 0) {
      return value;
    }
  }
  return null;
};
builtInFunctions['coalesce'] = coalesce;
// @@end: coalesce
// @@begin: choose
function choose(index, ...options) {
  if (options.length === 0) return invalid("INVALID_NUMBER_OF_ARGUMENTS");
  const flattenedOptions = [...options || []];
  if (index < 0 || index >= flattenedOptions.length) return invalid("INDEX_OUT_OF_RANGE");
  return flattenedOptions[index];
}
builtInFunctions['choose'] = choose;
// @@end: choose
// @@begin: isEqual
function isEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null || typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => isEqual(a[k], b[k]));
}
builtInFunctions['isEqual'] = isEqual;
// @@end: isEqual
// @@begin: and
const and = (...conditions) => (conditions || []).every(Boolean) ?? false;
builtInFunctions['and'] = and;
builtInFunctions['all'] = and;
// @@end: and
// @@begin: or
const or = (...conditions) => (conditions || []).some(Boolean) ?? false;
builtInFunctions['or'] = or;
builtInFunctions['any'] = or;
// @@end: or
// @@begin: not
const not = (condition) => condition == null ? invalid("INVALID_BINARY_ARGUMENT") : !condition;
builtInFunctions['not'] = not;
// @@end: not
// @@begin: none
const none = (...conditions) => (conditions || []).every((t) => !t) ?? false;
builtInFunctions['none'] = none;
// @@end: none
// @@begin: isEven
function isEven(n) {
  if (!Number.isFinite(n)) return invalid("INVALID_NUMERIC_ARGUMENT");
  return n % 2 === 0;
}
builtInFunctions['isEven'] = isEven;
// @@end: isEven
// @@begin: isOdd
function isOdd(n) {
  return !isEven(n);
}
builtInFunctions['isOdd'] = isOdd;
// @@end: isOdd
// @@begin: isInteger
function isInteger(value) {
  if (!Number.isFinite(value))
    return invalid("INVALID_NUMERIC_ARGUMENT");
  return Number.isInteger(value);
}
builtInFunctions['isInteger'] = isInteger;
// @@end: isInteger
// @@begin: isGreater
function isGreater(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) ? a > b : invalid("ALL_ARGUMENTS_MUST_BE_NUMBERS");
}
builtInFunctions['isGreater'] = isGreater;
// @@end: isGreater
// @@begin: isGreaterOrEqual
function isGreaterOrEqual(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) ? a >= b : invalid("ALL_ARGUMENTS_MUST_BE_NUMBERS");
}
builtInFunctions['isGreaterOrEqual'] = isGreaterOrEqual;
// @@end: isGreaterOrEqual
// @@begin: isLess
function isLess(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) ? a < b : invalid("ALL_ARGUMENTS_MUST_BE_NUMBERS");
}
builtInFunctions['isLess'] = isLess;
// @@end: isLess
// @@begin: isLessOrEqual
function isLessOrEqual(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) ? a <= b : invalid("ALL_ARGUMENTS_MUST_BE_NUMBERS");
}
builtInFunctions['isLessOrEqual'] = isLessOrEqual;
// @@end: isLessOrEqual
// @@begin: isNegative
function isNegative(value) {
  if (!Number.isFinite(value)) return invalid("INVALID_NUMERIC_ARGUMENT");
  return value < 0;
}
builtInFunctions['isNegative'] = isNegative;
// @@end: isNegative
// @@begin: isPositive
function isPositive(value) {
  if (!Number.isFinite(value)) return invalid("INVALID_NUMERIC_ARGUMENT");
  return value > 0;
}
builtInFunctions['isPositive'] = isPositive;
// @@end: isPositive
// @@begin: contains
function contains(container, value) {
  switch (true) {
    case typeof container === "string":
      if (typeof value === "string") return container.includes(value);
      return invalid("INVALID_ARGUMENTS");
    case Array.isArray(container):
      return container.includes(value);
    case !container:
      return false;
    case typeof container !== "object":
      return invalid("INVALID_ARGUMENTS");
    default:
      return Object.values(container).includes(value);
  }
}
builtInFunctions['contains'] = contains;
// @@end: contains
// @@begin: has
function has(container, key) {
  if (!container) return false;
  if (key == null)
    return invalid("INVALID_ARGUMENTS");
  try {
    return Object.keys(container).includes(String(key));
  } catch (error) {
    return invalid("INVALID_ARGUMENTS", error.message);
  }
}
builtInFunctions['has'] = has;
// @@end: has
// @@begin: isNull
const isNull = (v) => v === null;
builtInFunctions['isNull'] = isNull;
// @@end: isNull
// @@begin: len
function len(iterable) {
  return isIterable(iterable) ? iterable.length : 0;
}
builtInFunctions['len'] = len;
// @@end: len
// @@begin: lookup
function lookup(list, value) {
  if (!Array.isArray(list)) return null;
  for (const item of list) {
    if (_deepEqual(item, value)) return item;
  }
  return null;
}
builtInFunctions['lookup'] = lookup;
// @@end: lookup
// @@begin: substr
function substr(str, start, end) {
  if (typeof str !== "string" || !Number.isFinite(start) || end != null && !Number.isFinite(end)) return "";
  return str.substring(start, end);
}
builtInFunctions['substr'] = substr;
// @@end: substr
// @@begin: pluck
function pluck(collection, prop) {
  return isCollection(collection) ? collection.map((item) => item[prop]) : [];
}
builtInFunctions['pluck'] = pluck;
// @@end: pluck
// @@begin: filterBy
function filterBy(collection, prop, value) {
  return isCollection(collection) ? collection.filter((obj) => prop in obj && obj[prop] === value) : [];
}
builtInFunctions['filterBy'] = filterBy;
// @@end: filterBy
// @@begin: find
function find(collection, prop, value) {
  return isCollection(collection) ? collection.find((obj) => prop in obj && obj[prop] === value) ?? null : null;
}
builtInFunctions['find'] = find;
// @@end: find
// @@begin: sample
function sample(iterable, n) {
  if (typeof iterable === "string") {
    return _sampleSize(iterable.split(""), n).join("");
  }
  return _sampleSize(iterable, n);
}
builtInFunctions['sample'] = sample;
// @@end: sample
// @@begin: left
const left = (arr, n) => arr?.length ? arr.slice(0, n === void 0 ? 1 : Math.max(0, n)) : [];
builtInFunctions['left'] = left;
// @@end: left
// @@begin: right
const right = (arr, n) => {
  const l = arr?.length ?? 0;
  return l ? arr.slice(Math.max(0, l - (n === void 0 ? 1 : Math.max(0, n)))) : [];
};
builtInFunctions['right'] = right;
// @@end: right
// @@begin: reverse
const reverse = (arr) => arr == null ? arr : [...arr].reverse();
builtInFunctions['reverse'] = reverse;
// @@end: reverse
// @@begin: indexOf
const indexOf = (arr, val, from) => arr ? arr.indexOf(val, from) : -1;
builtInFunctions['indexOf'] = indexOf;
// @@end: indexOf
// @@begin: repeat
const repeat = (str, n) => str == null ? "" : String(str).repeat(Math.max(0, n ?? 1));
builtInFunctions['repeat'] = repeat;
// @@end: repeat
// @@begin: sort
function sort(col, keyName, defaultValue = null) {
  if (col == null) return [];
  const arr = [...col];
  if (keyName === void 0)
    return arr.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  return arr.sort((a, b) => {
    const va = a[keyName] ?? defaultValue;
    const vb = b[keyName] ?? defaultValue;
    return va < vb ? -1 : va > vb ? 1 : 0;
  });
}
builtInFunctions['sort'] = sort;
// @@end: sort
// @@begin: shuffle
function shuffle(input) {
  if (typeof input === "string") {
    const a2 = input.split("");
    for (let i = a2.length - 1; i > 0; i--) {
      const r = Math.random() * (i + 1) | 0;
      [a2[r], a2[i]] = [a2[i], a2[r]];
    }
    return a2.join("");
  }
  const a = input == null ? [] : [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const r = Math.random() * (i + 1) | 0;
    [a[r], a[i]] = [a[i], a[r]];
  }
  return a;
}
builtInFunctions['shuffle'] = shuffle;
// @@end: shuffle
// @@begin: concat
const concat = (...args) => args.reduce((r, v) => r.concat(Array.isArray(v) ? v : [v]), []);
builtInFunctions['concat'] = concat;
// @@end: concat
// @@begin: every
const every = (arr, fn) => arr.every(fn);
builtInFunctions['every'] = every;
// @@end: every
// @@begin: intersect
const intersect = (...arrays) => arrays.length ? arrays[0].filter((v) => arrays.every((a) => a.includes(v))) : [];
builtInFunctions['intersect'] = intersect;
// @@end: intersect
// @@begin: keys
const keys = (o) => o == null ? [] : Object.keys(o);
builtInFunctions['keys'] = keys;
// @@end: keys
// @@begin: merge
const merge = (obj, ...sources) => {
  function _merge(target, src) {
    if (!src) return;
    for (const k of Object.keys(src)) {
      if (src[k] != null && typeof src[k] === "object" && !Array.isArray(src[k]) && target[k] != null && typeof target[k] === "object" && !Array.isArray(target[k]))
        _merge(target[k], src[k]);
      else target[k] = src[k];
    }
  }
  sources.forEach((s) => _merge(obj, s));
  return obj;
};
builtInFunctions['merge'] = merge;
// @@end: merge
// @@begin: omit
const omit = (obj, ...paths) => {
  if (obj == null) return {};
  const r = { ...obj };
  paths.flat().forEach((k) => delete r[k]);
  return r;
};
builtInFunctions['omit'] = omit;
// @@end: omit
// @@begin: padRight
const padRight = (str, len2, chars = " ") => {
  str = str == null ? "" : String(str);
  const d = len2 - str.length;
  if (d <= 0 || !chars) return str;
  return str + chars.repeat(Math.ceil(d / chars.length)).slice(0, d);
};
builtInFunctions['padRight'] = padRight;
// @@end: padRight
// @@begin: padLeft
const padLeft = (str, len2, chars = " ") => {
  str = str == null ? "" : String(str);
  const d = len2 - str.length;
  if (d <= 0 || !chars) return str;
  return chars.repeat(Math.ceil(d / chars.length)).slice(0, d) + str;
};
builtInFunctions['padLeft'] = padLeft;
// @@end: padLeft
// @@begin: pick
const pick = (obj, ...paths) => {
  if (obj == null) return {};
  const r = {};
  paths.flat().forEach((k) => {
    if (k in obj)
      r[k] = obj[k];
  });
  return r;
};
builtInFunctions['pick'] = pick;
// @@end: pick
// @@begin: setAttr
const setAttr = (obj, path, val) => {
  if (obj == null) return obj;
  const ps = _parsePath(path);
  const cur = obj;
  let c = cur;
  for (let i = 0; i < ps.length - 1; i++) {
    const k = ps[i];
    if (c[k] == null || typeof c[k] !== "object") c[k] = /^\d+$/.test(ps[i + 1]) ? [] : {};
    c = c[k];
  }
  c[ps[ps.length - 1]] = val;
  return obj;
};
builtInFunctions['setAttr'] = setAttr;
// @@end: setAttr
// @@begin: unsetAttr
const unsetAttr = (obj, path) => {
  if (obj == null) return true;
  const ps = _parsePath(path);
  let c = obj;
  for (let i = 0; i < ps.length - 1; i++) {
    c = c[ps[i]];
    if (c == null) return true;
  }
  delete c[ps[ps.length - 1]];
  return true;
};
builtInFunctions['unsetAttr'] = unsetAttr;
// @@end: unsetAttr
// @@begin: values
const values = (o) => o == null ? [] : Object.values(o);
builtInFunctions['values'] = values;
// @@end: values
// @@begin: zip
const zip = (...arrays) => {
  const n = arrays.length ? Math.max(...arrays.map((a) => a?.length ?? 0)) : 0;
  return Array.from({ length: n }, (_, i) => arrays.map((a) => a?.[i]));
};
builtInFunctions['zip'] = zip;
// @@end: zip
// @@begin: add
function add(...nums) {
  if (!nums?.length) return null;
  const flatNums = nums.flat();
  let sum2 = 0;
  for (let i = 0; i < flatNums.length; i++) {
    if (!Number.isFinite(flatNums[i])) return invalid("ALL_ARGUMENTS_MUST_BE_NUMBERS");
    sum2 += flatNums[i];
  }
  return sum2;
}
builtInFunctions['add'] = add;
// @@end: add
// @@begin: diff
function diff(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) ? b - a : invalid("ALL_ARGUMENTS_MUST_BE_NUMBERS");
}
builtInFunctions['diff'] = diff;
// @@end: diff
// @@begin: mult
function mult(...nums) {
  if (!nums?.length) return null;
  const flatNums = nums.flat();
  let product = 1;
  for (let i = 0; i < flatNums.length; i++) {
    if (!Number.isFinite(flatNums[i])) return invalid("ALL_ARGUMENTS_MUST_BE_NUMBERS");
    product *= flatNums[i];
  }
  return product;
}
builtInFunctions['mult'] = mult;
// @@end: mult
// @@begin: div
function div(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) ? b === 0 ? invalid("DIVISION_BY_ZERO") : a / b : invalid("INVALID_ARGUMENTS");
}
builtInFunctions['div'] = div;
// @@end: div
// @@begin: pow
function pow(n, exp) {
  return Number.isFinite(n) && Number.isFinite(exp) ? n ** exp : invalid("INVALID_ARGUMENTS");
}
builtInFunctions['pow'] = pow;
// @@end: pow
// @@begin: inc
function inc(n) {
  return add(n, 1);
}
builtInFunctions['inc'] = inc;
// @@end: inc
// @@begin: dec
function dec(n) {
  return add(n, -1);
}
builtInFunctions['dec'] = dec;
// @@end: dec
// @@begin: neg
function neg(n) {
  return mult(n, -1);
}
builtInFunctions['neg'] = neg;
// @@end: neg
// @@begin: inv
function inv(n) {
  return div(1, n);
}
builtInFunctions['inv'] = inv;
// @@end: inv
// @@begin: mod
function mod(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) ? a % b : invalid("INVALID_ARGUMENTS");
}
builtInFunctions['mod'] = mod;
// @@end: mod
// @@begin: trunc
function trunc(n) {
  return Number.isFinite(n) ? Math.trunc(n) : invalid("INVALID_NUMERIC_ARGUMENT");
}
builtInFunctions['trunc'] = trunc;
// @@end: trunc
// @@begin: ceil
function ceil(n) {
  return Number.isFinite(n) ? Math.ceil(n) : invalid("INVALID_NUMERIC_ARGUMENT");
}
builtInFunctions['ceil'] = ceil;
// @@end: ceil
// @@begin: round
function round(n, precision = 0) {
  if (n == null) return null;
  if (!Number.isFinite(n)) return invalid("INVALID_NUMERIC_ARGUMENT");
  if (!isPositiveInteger(precision) && precision !== 0)
    return invalid("INVALID_PRECISION_ARGUMENT");
  const factor = 10 ** precision;
  return Math.round(n * factor) / factor;
}
builtInFunctions['round'] = round;
// @@end: round
// @@begin: sin
function sin(n) {
  return Number.isFinite(n) ? Math.sin(n) : invalid("INVALID_NUMERIC_ARGUMENT");
}
builtInFunctions['sin'] = sin;
// @@end: sin
// @@begin: cos
function cos(n) {
  return Number.isFinite(n) ? Math.cos(n) : invalid("INVALID_NUMERIC_ARGUMENT");
}
builtInFunctions['cos'] = cos;
// @@end: cos
// @@begin: sqrt
function sqrt(n) {
  return Number.isFinite(n) ? Math.sqrt(n) : invalid("INVALID_NUMERIC_ARGUMENT");
}
builtInFunctions['sqrt'] = sqrt;
// @@end: sqrt
// @@begin: ln
function ln(n) {
  return Math.log(n);
}
builtInFunctions['ln'] = ln;
// @@end: ln
// @@begin: log
function log(num, base) {
  return Number.isFinite(num) && isPositiveNumber(base) ? ln(num) / ln(base) : invalid("INVALID_ARGUMENTS");
}
builtInFunctions['log'] = log;
// @@end: log
// @@begin: lg
function lg(n) {
  return log(n, 10);
}
builtInFunctions['lg'] = lg;
// @@end: lg
// @@begin: deg
function deg(rads) {
  return Number.isFinite(rads) ? rads * (180 / Math.PI) : invalid("INVALID_NUMERIC_ARGUMENT");
}
builtInFunctions['deg'] = deg;
// @@end: deg
// @@begin: rad
function rad(degs) {
  return Number.isFinite(degs) ? degs * (Math.PI / 180) : invalid("INVALID_NUMERIC_ARGUMENT");
}
builtInFunctions['rad'] = rad;
// @@end: rad
// @@begin: max
function max(...nums) {
  const flatNums = nums.flat();
  if (!flatNums.length) return null;
  let mx = -Infinity;
  for (let i = 0; i < flatNums.length; i++) {
    if (!Number.isFinite(flatNums[i])) return invalid("ALL_ARGUMENTS_MUST_BE_NUMBERS");
    if (flatNums[i] > mx) mx = flatNums[i];
  }
  return mx;
}
builtInFunctions['max'] = max;
// @@end: max
// @@begin: min
function min(...nums) {
  const flatNums = nums.flat();
  if (!flatNums?.length) return null;
  let mn = Infinity;
  for (let i = 0; i < flatNums.length; i++) {
    if (!Number.isFinite(flatNums[i])) return invalid("ALL_ARGUMENTS_MUST_BE_NUMBERS");
    if (flatNums[i] < mn) mn = flatNums[i];
  }
  return mn;
}
builtInFunctions['min'] = min;
// @@end: min
// @@begin: sum
function sum(...nums) {
  const flatNums = nums.flat();
  if (!flatNums?.length) return null;
  return flatNums.reduce((sum2, num) => !Number.isFinite(num) ? invalid("ALL_ARGUMENTS_MUST_BE_NUMBERS") : sum2 + num, 0);
}
builtInFunctions['sum'] = sum;
// @@end: sum
// @@begin: avg
function avg(...nums) {
  const flatNums = nums.flat();
  if (!flatNums?.length) return null;
  return (sum(...flatNums) ?? invalid("INVALID_NUMERIC_ARGUMENT")) / flatNums.length;
}
builtInFunctions['avg'] = avg;
// @@end: avg
// @@begin: med
function med(...nums) {
  const flatNums = nums.flat();
  if (!flatNums.length) return null;
  if (!flatNums.every((t) => Number.isFinite(t))) return invalid("INVALID_NUMERIC_ARGUMENT");
  const sorted = flatNums.sort();
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
builtInFunctions['med'] = med;
// @@end: med
// @@begin: sumsq
function sumsq(...nums) {
  const flatNums = nums.flat();
  if (!flatNums.length) return null;
  return flatNums.reduce((acc, num) => acc + num * num, 0);
}
builtInFunctions['sumsq'] = sumsq;
// @@end: sumsq
// @@begin: sumProduct
const sumProduct = (...lists) => {
  const tuples = Array.from({ length: Math.max(...lists.map((t) => t.length)) });
  if (!lists.length) return null;
  for (const list of lists) {
    if (!Array.isArray(list)) return invalid("ALL_ARGUMENTS_MUST_BE_LISTS");
    if (list.length < tuples.length) return invalid("LIST_LENGTH_MISMATCH");
    for (let i = 0; i < list.length; i++) {
      if (!Number.isFinite(list[i])) return invalid("ALL_LIST_ITEMS_MUST_BE_NUMERIC");
      if (!tuples[i]) tuples[i] = [];
      tuples[i] = (tuples[i] || []).concat(list[i]);
    }
  }
  return sum(tuples.map((t) => mult(...t)));
};
builtInFunctions['sumProduct'] = sumProduct;
// @@end: sumProduct
