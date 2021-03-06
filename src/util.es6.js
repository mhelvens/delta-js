/*  extend the first passed object with the properties     */
/*  of the other objects, from left to right, and returns  */
/*  the first passed object                                */
export function extend(obj1, ...rest) {
	for (let obj of rest) {
		for (let key of Object.keys(obj)) {
			Object.defineProperty(obj1, key, Object.getOwnPropertyDescriptor(obj, key));
		}
	}
	return obj1;
}


var _default = (ds) => (object, ...rest) => {
	var keys = rest.slice(0, -1);
	var def = rest[rest.length-1];
	if (keys.length === 0) { return object }
	var last = ds(object, ...keys.slice(0, -1));
	if (last instanceof Map) {
		if (isUndefined(last.get(keys[keys.length-1]))) {
			last.set(keys[keys.length-1], def);
		}
		return last.get(keys[keys.length-1]);
	} else {
		if (isUndefined(last[keys[keys.length-1]])) {
			last[keys[keys.length-1]] = def;
		}
		return last[keys[keys.length-1]];
	}
};
export function o(object, ...keys) { return _default(o)(object, ...keys, {})        }
export function a(object, ...keys) { return _default(o)(object, ...keys, [])        }
export function m(object, ...keys) { return _default(m)(object, ...keys, new Map()) }
export function s(object, ...keys) { return _default(m)(object, ...keys, new Set()) }


/* a simple `assert` function, to express a condition that is expected to be true */
export function assert(condition, message) {
	if (!condition) { throw new Error(message || "Assertion failed") }
}


/* test if a value is `undefined` */
export function isUndefined(val) {
	return typeof val === 'undefined';
}


/* test if a value is defined (not `undefined`) */
export function isDefined(val) {
	return typeof val !== 'undefined';
}


/* repeat a string a given number of times */
export function repeat(nr, str) {
	return new Array(nr+1).join(str);
}


/* shift every line in a string right by a given number of spaces */
export function indent(str, amount, char = ' ') {
	return str.replace(/^(?!\s*$)/mg, repeat(amount, char));
}


/* run a function only once per obj+string combo */
let _oncePerSymbols = {};
export function oncePer(obj, key, fn) {
	var opFn = (obj) => {
		if (!_oncePerSymbols[key]) { _oncePerSymbols[key] = Symbol(`once per:${key}`) }
		if (obj[_oncePerSymbols[key]]) { return }
		obj[_oncePerSymbols[key]] = true;
		return fn.call(obj, obj);
	};
	if (typeof obj === 'string') {
		[key, fn] = [obj, key];
		return opFn;
	} else {
		return opFn(obj);
	}
}


/* shorthand specifier for composition preconditions */
export var t = (type1, type2) => {
	return (d1, d2) => (d1.type === type1 && d2.type === type2);
};


/* shorthand specifier for composition implementations */
export var define_d = (deltaJs) => (type, fn) => {
	if (typeof fn === 'string') { fn = ((v) => (o) => o[v])(fn) }
	return (d1, d2) => new deltaJs.Delta[type](fn && fn({d1, d2, p1: d1.arg, p2: d2.arg}));
};


export function mapEqual(a, b, eq=(x,y)=>x===y) {
	if (a.size !== b.size) { return false }
	var aKeys = [...a.keys()].sort();
	var bKeys = [...b.keys()].sort();
	for (let i = 0; i < aKeys.length; ++i) {
		if (aKeys[i] !== bKeys[i])                 { return false }
		if (!eq(a.get(aKeys[i]), b.get(bKeys[i]))) { return false }
	}
	return true;
}


export function customIndexOf(a, value, eq=(x,y)=>x===y) {
	for (var i = 0; i < a.length; ++i) {
		if (eq(a[i], value)) { return i }
	}
	return -1;
}


export function arraysEqual(a, b, eq=(x,y)=>x===y) {
	if (a.length !== b.length) { return false }
	for (let i = 0; i < a.length; ++i) {
		if (!eq(a[i], b[i])) { return false }
	}
	return true;
}


export function arraysHaveSameElements(a, b, eq=(x,y)=>x===y) {
	if (a.length !== b.length) { return false }
	var bb = [...b];
	for (var i = 0; i < a.length; ++i) {
		var found = false;
		for (var j = 0; j < bb.length; ++j) {
			if (eq(a[i], bb[j])) {
				bb.splice(j, 1);
				found = true;
				break;
			}
		}
		if (!found) { return false }
	}
	return true;
}

export function swapLastTwo(a) {
	return a.slice(0, -2).concat([a[a.length-1], a[a.length-2]]);
}
