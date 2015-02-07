'use strict';


describe("DeltaJs constructor", function () {


	it("is present", function () {
		expect(DeltaJs).toEqual(any(Function));
	});


	it("never throws any exception", function () {
		expect(function () {
			return new DeltaJs();
		}).not.toThrow();
	});


	it("returns an object of type DeltaJs", function () {
		var deltaJs = new DeltaJs();
		expect(deltaJs).toEqual(any(DeltaJs));
	});


});


describe("DeltaJs instance", function () {

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	var deltaJs, delta, d;
	beforeEach(() => {
		deltaJs = new DeltaJs();
		delta = new deltaJs.Delta.Modify();
		d = delta.do();
	});

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function ExpectedError(type, content) { this.type = type; this.content = content; }
	function expectError(type, content) { return new ExpectedError(type, content) }

	function itCan(description, triples) {
		var counter = 0;
		triples.forEach(([pre, action, post]) => {
			it(`can ${description} (${++counter})`, () => {
				/* creating the initial object using the given 'pre' */
				var rootObj = { obj: (typeof pre === 'function' ? pre() : pre) };
				var target = new DeltaJs.ReadableTarget(rootObj); // because we don't allow replacing/removing the root

				/* creating the delta through the given code */
				if (post instanceof ExpectedError && post.type !== DeltaJs.ApplicationError) {
					expect(action).toThrowSpecific(post.type, post.content);
				} else {
					action();

					/* applying the delta to the given 'pre' value */
					if (post instanceof ExpectedError && post.type === DeltaJs.ApplicationError) {
						expect(() => { delta.applyTo(target) }).toThrowSpecific(post.type, post.content);
					} else {
						delta.applyTo(target);
						if (typeof post === 'function') {
							post(rootObj.obj);
						} else {
							expect(rootObj.obj).toEqual(post);
						}
					}
				}
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	describe("object operations", () => {

		itCan("add a new field to an object", [[
			{},
			() => { d.add('obj.foo', 'bar') },
			{ foo: 'bar' }
		], [
			{},
			() => { d.modify('obj').add('foo', 'bar') },
			{ foo: 'bar' }
		], [
			{ key: 'val' },
			() => { d.add('obj.foo', 'bar') },
			{ key: 'val', foo: 'bar' }
		], [
			{ key: 'val' },
			() => { d.modify('obj').add('foo', 'bar') },
			{ key: 'val', foo: 'bar' }
		], [
			{ key: 'val' },
			() => { d.add('obj.key', 'bar') },
			expectError(DeltaJs.ApplicationError)
		], [
			{ key: 'val' },
			() => { d.modify('obj').add('key', 'bar') },
			expectError(DeltaJs.ApplicationError)
		]]);

		itCan("remove an existing field from an object", [[
			{ foo: 'bar' },
			() => { d.remove('obj.foo') },
			{}
		], [
			{ foo: 'bar' },
			() => { d.modify('obj').remove('foo') },
			{}
		], [
			{ key: 'val', foo: 'bar' },
			() => { d.remove('obj.foo') },
			{ key: 'val' }
		], [
			{ key: 'val', foo: 'bar' },
			() => { d.modify('obj').remove('foo') },
			{ key: 'val' }
		], [
			{ foo: 'bar' },
			() => { d.remove('obj.key') },
			expectError(DeltaJs.ApplicationError)
		], [
			{ foo: 'bar' },
			() => { d.modify('obj').remove('key') },
			expectError(DeltaJs.ApplicationError)
		]]);

		itCan("forbid a field from being in an object", [[
			{ foo: 'bar' },
			() => { d.forbid('obj.key') },
			{ foo: 'bar' }
		], [
			{ foo: 'bar' },
			() => { d.modify('obj').forbid('key') },
			{ foo: 'bar' }
		], [
			{ key: 'val', foo: 'bar' },
			() => { d.forbid('obj.key') },
			expectError(DeltaJs.ApplicationError)
		], [
			{ key: 'val', foo: 'bar' },
			() => { d.modify('obj').forbid('key') },
			expectError(DeltaJs.ApplicationError)
		]]);

		itCan("replace an existing field in an object", [[
			{ foo: 'bar' },
			() => { d.replace('obj.foo', 'BAS') },
			{ foo: 'BAS' }
		], [
			{ foo: 'bar' },
			() => { d.modify('obj').replace('foo', 'BAS') },
			{ foo: 'BAS' }
		], [
			{ key: 'val', foo: 'bar' },
			() => { d.replace('obj.foo', 'BAS') },
			{ key: 'val', foo: 'BAS' }
		], [
			{ key: 'val', foo: 'bar' },
			() => { d.modify('obj').replace('foo', 'BAS') },
			{ key: 'val', foo: 'BAS' }
		], [
			{ foo: 'bar' },
			() => { d.replace('obj.key', 'BAS') },
			expectError(DeltaJs.ApplicationError)
		], [
			{ foo: 'bar' },
			() => { d.modify('obj').replace('key', 'BAS') },
			expectError(DeltaJs.ApplicationError)
		]]);

	});

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	describe("composite object operations", () => {


		itCan("correctly modify objects when the composition is valid", [[
			{ key: 'val' },
			() => {
				d.add('obj.foo1', 'bar1');
				d.add('obj.foo2', 'bar2');
			},
			{ key: 'val', foo1: 'bar1', foo2: 'bar2' }
		], [
			{ key: 'val', key1: 'val1', key2: 'val2' },
			() => {
				d.remove('obj.key1');
				d.remove('obj.key2');
			},
			{ key: 'val' }
		], [
			{ key: 'val' },
			() => {
				d.forbid('obj.foo1');
				d.forbid('obj.foo2');
			},
			{ key: 'val' }
		], [
			{ key1: 'val1', key2: 'val2' },
			() => {
				d.replace('obj.key1', 'VAL1');
				d.replace('obj.key2', 'VAL2');
			},
			{ key1: 'VAL1', key2: 'VAL2' }
		], [
			{ key: 'val' },
			() => {
				d.add('obj.foo', {});
				d.modify('obj.foo').add('bar', 'bas');
			},
			{ key: 'val', foo: { bar: 'bas' } }
		], [
			{ key: 'val', foo: 'bar' },
			() => {
				d.add('obj.foo', {});
				d.modify('obj.foo').add('bar', 'bas');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.foo' is forbidden, but was present
		], [
			{ key: 'val' },
			() => {
				// a more complex / deep version of 'add' composed with 'modify'
				d.add('obj.level1', { level2: {} });
				d.add('obj.level1.level2.sideLevel', 'final');
				d.modify('obj.level1.level2').add('level3', {});
				d.modify('obj.level1').modify('level2.level3').add('level4', 'final');
			},
			{ key: 'val', level1: { level2: { sideLevel: 'final', level3: { level4: 'final' } } } }
		], [
			{ key: 'val', foo: { bar: 'bas' } },
			() => {
				d.modify('obj.foo').add('newKey', 'newVal');
				d.remove('obj.foo');
			},
			{ key: 'val' }
		], [
			{ key: 'val' },
			() => {
				d.add('obj.foo', 'bar');
				d.remove('obj.foo');
			},
			{ key: 'val' }
		], [
			{ key: 'val', foo: 'whatever' },
			() => {
				d.add('obj.foo', 'bar');
				d.remove('obj.foo');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.foo' is forbidden, but was present
		], [
			{ key: 'val', foo: 'whatever' },
			() => {
				d.remove('obj.foo');
				d.add('obj.foo', 'bar');
			},
			{ key: 'val', foo: 'bar' }
		], [
			{ key: 'val' },
			() => {
				d.remove('obj.foo');
				d.add('obj.foo', 'bar');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.foo' is mandatory, but was absent
		], [
			{ key: 'val', foo: 'whatever' },
			() => {
				d.remove('obj.foo');
				d.forbid('obj.foo');
			},
			{ key: 'val' }
		], [
			{ key: 'val' },
			() => {
				d.remove('obj.foo');
				d.forbid('obj.foo');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.foo' is mandatory, but was absent
		], [
			{ key: 'val' },
			() => {
				d.forbid('obj.foo');
				d.add('obj.foo', 'bar');
			},
			{ key: 'val', foo: 'bar' }
		], [
			{ key: 'val', foo: 'bar' },
			() => {
				d.forbid('obj.foo');
				d.add('obj.foo', 'bar');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.foo' is forbidden, but was present
		], [
			{ key: 'val' },
			() => {
				d.forbid('obj.foo');
				d.forbid('obj.foo');
			},
			{ key: 'val' }
		], [
			{ key: 'val', foo: 'bar' },
			() => {
				d.forbid('obj.foo');
				d.forbid('obj.foo');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.foo' is forbidden (twice), but was present
		], [
			{ key: 'val', foo: { bar: 'bas' } },
			() => {
				d.modify('obj.foo');
				d.replace('obj.foo', 'newValue');
			},
			{ key: 'val', foo: 'newValue' }
		], [
			{ key: 'val' },
			() => {
				d.modify('obj.foo');
				d.replace('obj.foo', 'newValue');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.foo' is mandatory, but was absent
		], [
			{ key: 'val' },
			() => {
				d.add('obj.foo', 'oldValue');
				d.replace('obj.foo', 'newValue');
			},
			{ key: 'val', foo: 'newValue' }
		], [
			{ key: 'val', foo: { bar: 'bas' } },
			() => {
				d.add('obj.foo', 'oldValue');
				d.replace('obj.foo', 'newValue');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.foo' is forbidden, but was present
		], [
			{ key: 'val', foo: 'bar' },
			() => {
				d.replace('obj.foo', {});
				d.modify('obj.foo').add('bar', 'bas');
			},
			{ key: 'val', foo: { bar: 'bas' } }
		], [
			{ key: 'val' },
			() => {
				d.replace('obj.foo', {});
				d.modify('obj.foo').add('bar', 'bas');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.foo' is mandatory, but was absent
		], [
			{ key: 'val', level1: 'oldValue' },
			() => {
				// a more complex / deep version of 'replace' composed with 'modify'
				d.replace('obj.level1', { level2: {} });
				d.add('obj.level1.level2.sideLevel', 'final');
				d.modify('obj.level1.level2').add('level3', {});
				d.modify('obj.level1').modify('level2.level3').add('level4', 'final');
			},
			{ key: 'val', level1: { level2: { sideLevel: 'final', level3: { level4: 'final' } } } }
		], [
			{ key: 'val', foo: { bar: 'bas' } },
			() => {
				d.replace('obj.foo', 'newValue');
				d.remove('obj.foo');
			},
			{ key: 'val' }
		], [
			{ key: 'val' },
			() => {
				d.replace('obj.foo', 'newValue');
				d.remove('obj.foo');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.foo' is mandatory, but was absent
		], [
			{ key: 'val', foo: { bar: 'bas' } },
			() => {
				d.replace('obj.foo', 'oldValue');
				d.replace('obj.foo', 'newValue');
			},
			{ key: 'val', foo: 'newValue' }
		], [
			{ key: 'val' },
			() => {
				d.replace('obj.foo', 'oldValue');
				d.replace('obj.foo', 'newValue');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.foo' is mandatory, but was absent
		]]);


		itCan("throw an error when the composition is detectably invalid", [
			() => {
				d.modify('obj.foo');
				d.add('obj.foo', 'bar');
			}, () => {
				d.add('obj.foo', 'bar1');
				d.add('obj.foo', 'bar2');
			}, () => {
				d.remove('obj.foo');
				d.modify('obj.foo');
			}, () => {
				d.remove('obj.foo');
				d.remove('obj.foo');
			}, () => {
				d.modify('obj.foo');
				d.forbid('obj.foo');
			}, () => {
				d.add('obj.foo', 'bar');
				d.forbid('obj.foo');
			}, () => {
				d.forbid('obj.foo');
				d.modify('obj.foo');
			}, () => {
				d.forbid('obj.foo');
				d.remove('obj.foo');
			}, () => {
				d.remove('obj.foo');
				d.replace('obj.foo', 'bar');
			}, () => {
				d.forbid('obj.foo');
				d.replace('obj.foo', 'bar');
			}, () => {
				d.replace('obj.foo', 'bar1');
				d.add('obj.foo', 'bar2');
			}, () => {
				d.replace('obj.foo', 'bar');
				d.forbid('obj.foo');
			}
		].map((action) => [null, action, expectError(DeltaJs.CompositionError)]));


	});

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	describe("array operations", () => {


		itCan("prepend a new value to an array", [[
			{ arr: [] },
			() => { d.prepend('obj.arr', 'val') },
			{ arr: ['val'] }
		], [
			{ arr: ['init'] },
			() => { d.prepend('obj.arr', 'val') },
			{ arr: ['val', 'init'] }
		], [
			{ arr: ['init1', 'init2'] },
			() => { d.prepend('obj.arr', 'val') },
			{ arr: ['val', 'init1', 'init2'] }
		], [
			{ arr: 'not an array or a function' },
			() => { d.prepend('obj.arr', 'val') },
			expectError(DeltaJs.ApplicationError)
		], [
			{ key: 'val' },
			() => { d.prepend('obj.arr', 'val') },
			expectError(DeltaJs.ApplicationError)
		]]);


		itCan("insert a new value into an array", [[
			{ arr: [] },
			() => { d.insert('obj.arr', 'val') },
			{ arr: ['val'] }
		], [
			{ arr: ['init'] },
			() => { d.insert('obj.arr', 'val') },
			(obj) => {
				expect(obj).toEqualOneOf(
					{ arr: ['val', 'init'] },
					{ arr: ['init', 'val'] }
				);
			}
		], [
			{ arr: ['init1', 'init2'] },
			() => { d.insert('obj.arr', 'val') },
			(obj) => {
				expect(obj).toEqualOneOf(
					{ arr: ['val', 'init1', 'init2'] },
					{ arr: ['init1', 'val', 'init2'] },
					{ arr: ['init1', 'init2', 'val'] }
				);
			}
		], [
			{ arr: 'not an array or a function' },
			() => { d.insert('obj.arr', 'val') },
			expectError(DeltaJs.ApplicationError)
		], [
			{ key: 'val' },
			() => { d.insert('obj.arr', 'val') },
			expectError(DeltaJs.ApplicationError)
		]]);


		itCan("append a new value to an array", [[
			{ arr: [] },
			() => { d.append('obj.arr', 'val') },
			{ arr: ['val'] }
		], [
			{ arr: ['init'] },
			() => { d.append('obj.arr', 'val') },
			{ arr: ['init', 'val'] }
		], [
			{ arr: ['init1', 'init2'] },
			() => { d.append('obj.arr', 'val') },
			{ arr: ['init1', 'init2', 'val'] }
		], [
			{ arr: 'not an array or a function' },
			() => { d.append('obj.arr', 'val') },
			expectError(DeltaJs.ApplicationError)
		], [
			{ key: 'val' },
			() => { d.append('obj.arr', 'val') },
			expectError(DeltaJs.ApplicationError)
		]]);


	});

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	describe("composite array operations", () => {


		itCan("combine multiple array operations", [[
			{ arr: ['init'] },
			() => {
				d.prepend('obj.arr', 1);
				d.prepend('obj.arr', 2);
			},
			{ arr: [2, 1, 'init'] }
		], [
			{ arr: ['init'] },
			() => {
				d.prepend('obj.arr', 1);
				d.insert ('obj.arr', 2);
			},
			(obj) => {
				expect(obj).toEqualOneOf(
					{ arr: [2, 1, 'init'] },
					{ arr: [1, 2, 'init'] },
					{ arr: [1, 'init', 2] }
				);
			}
		], [
			{ arr: ['init'] },
			() => {
				d.prepend('obj.arr', 1);
				d.append ('obj.arr', 2);
			},
			{ arr: [1, 'init', 2] }
		], [
			{ arr: ['init'] },
			() => {
				d.insert ('obj.arr', 1);
				d.prepend('obj.arr', 2);
			},
			(obj) => {
				expect(obj).toEqualOneOf(
					{ arr: [2, 1, 'init'] },
					{ arr: [2, 'init', 1] }
				);
			}
		], [
			{ arr: ['init'] },
			() => {
				d.insert('obj.arr', 1);
				d.insert('obj.arr', 2);
			},
			(obj) => {
				expect(obj).toEqualOneOf(
					{ arr: [2, 1, 'init'] },
					{ arr: [1, 2, 'init'] },
					{ arr: [1, 'init', 2] },
					{ arr: [2, 'init', 1] },
					{ arr: ['init', 2, 1] },
					{ arr: ['init', 1, 2] }
				);
			}
		], [
			{ arr: ['init'] },
			() => {
				d.insert('obj.arr', 1);
				d.append('obj.arr', 2);
			},
			(obj) => {
				expect(obj).toEqualOneOf(
					{ arr: [1, 'init', 2] },
					{ arr: ['init', 1, 2] }
				);
			}
		], [
			{ arr: ['init'] },
			() => {
				d.append ('obj.arr', 1);
				d.prepend('obj.arr', 2);
			},
			{ arr: [2, 'init', 1] }
		], [
			{ arr: ['init'] },
			() => {
				d.append('obj.arr', 1);
				d.insert('obj.arr', 2);
			},
			(obj) => {
				expect(obj).toEqualOneOf(
					{ arr: [2, 'init', 1] },
					{ arr: ['init', 2, 1] },
					{ arr: ['init', 1, 2] }
				);
			}
		], [
			{ arr: ['init'] },
			() => {
				d.append('obj.arr', 1);
				d.append('obj.arr', 2);
			},
			{ arr: ['init', 1, 2] }
		]]);


		itCan("combine array operations with other types of operations or throw an error if invalid", [[
			{ key: 'val' },
			() => {
				d.add   ('obj.arr', ['init']);
				d.append('obj.arr', 'val');
			},
			{ key: 'val', arr: ['init', 'val'] }
		], [
			{ key: 'val' },
			() => {
				d.add   ('obj.arr', 'not an array');
				d.append('obj.arr', 'val');
			},
			expectError(DeltaJs.CompositionError) // 'obj.arr', left by the 'add' operation, has to be an array
		], [
			{ key: 'val', arr: 'whatever' },
			() => {
				d.add   ('obj.arr', ['init']);
				d.append('obj.arr', 'val');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.arr' is forbidden, but was present
		], [
			{ key: 'val', arr: 'whatever' },
			() => {
				d.replace('obj.arr', ['init']);
				d.append ('obj.arr', 'val');
			},
			{ key: 'val', arr: ['init', 'val'] }
		], [
			{ key: 'val', arr: 'whatever' },
			() => {
				d.replace('obj.arr', 'not an array');
				d.append ('obj.arr', 'val');
			},
			expectError(DeltaJs.CompositionError) // 'obj.arr', left by the 'replace' operation, has to be an array
		], [
			{ key: 'val' },
			() => {
				d.replace('obj.arr', ['init']);
				d.append ('obj.arr', 'val');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.arr' is mandatory, but was absent
		], [
			{ key: 'val', arr: ['init'] },
			() => {
				d.append('obj.arr', 'val');
				d.remove('obj.arr');
			},
			{ key: 'val' }
		], [
			{ key: 'val' },
			() => {
				d.append('obj.arr', 'val');
				d.remove('obj.arr');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.arr' is mandatory, but was absent
		], [
			{ key: 'val', arr: ['init'] },
			() => {
				d.append ('obj.arr', 'val');
				d.replace('obj.arr', 'whatever');
			},
			{ key: 'val', arr: 'whatever' }
		], [
			{ key: 'val' },
			() => {
				d.append ('obj.arr', 'val');
				d.replace('obj.arr', 'whatever');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.arr' is mandatory, but was absent
		]]);


	});

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	describe("function operations", () => {


		/* setup */
		var callLog;
		function fA(...args) { callLog.push(['fA', args]) }
		function fB(...args) { callLog.push(['fB', args]) }
		function fC(...args) { callLog.push(['fC', args]) }
		beforeEach(() => { callLog = [] });


		itCan("prepend new statements to run inside an existing function", [[
			{ fn(a, b, c) { fA(this, a, c) } },
			() => { d.prepend('obj.fn', function (a, b) { fB(this, b, b) }) },
			(obj) => {
				obj.fn(1, 2, 3);
				expect(callLog).toEqual([ ['fB', [obj, 2, 2]], ['fA', [obj, 1, 3]] ]);
			}
		], [
			{ fn: 'not a function or an array' },
			() => { d.prepend('obj.fn', function () {}) },
			expectError(DeltaJs.ApplicationError)
		], [
			{ key: 'val' },
			() => { d.prepend('obj.fn', function () {}) },
			expectError(DeltaJs.ApplicationError)
		]]);


		itCan("insert new statements to run inside an existing function", [[
			{ fn(a, b, c) { fA(this, a, c) } },
			() => { d.insert('obj.fn', function (a, b) { fB(this, b, b) }) },
			(obj) => {
				obj.fn(1, 2, 3);
				expect(callLog).toEqualOneOf(
					[ ['fB', [obj, 2, 2]], ['fA', [obj, 1, 3]] ],
					[ ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]] ]
				);
			}
		], [
			{ fn: 'not a function or an array' },
			() => { d.insert('obj.fn', function () {}) },
			expectError(DeltaJs.ApplicationError)
		], [
			{ key: 'val' },
			() => { d.insert('obj.fn', function () {}) },
			expectError(DeltaJs.ApplicationError)
		]]);


		itCan("append new statements to run inside an existing function", [[
			{ fn(a, b, c) { fA(this, a, c) } },
			() => { d.append('obj.fn', function (a, b) { fB(this, b, b) }) },
			(obj) => {
				obj.fn(1, 2, 3);
				expect(callLog).toEqual([ ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]] ]);
			}
		], [
			{ fn: 'not a function or an array' },
			() => { d.append('obj.fn', function () {}) },
			expectError(DeltaJs.ApplicationError)
		], [
			{ key: 'val' },
			() => { d.append('obj.fn', function () {}) },
			expectError(DeltaJs.ApplicationError)
		]]);


	});

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	describe("composite function operations", () => {


		/* setup */
		var callLog;
		function fA(...args) { callLog.push(['fA', args]) }
		function fB(...args) { callLog.push(['fB', args]) }
		function fC(...args) { callLog.push(['fC', args]) }
		beforeEach(() => { callLog = [] });


		itCan("combine multiple function operations", [[
			{ fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.prepend('obj.fn', function (a, b) { fB(this, b, b) });
				d.prepend('obj.fn', function (a, b) { fC(this, b, a) });
			},
			(obj) => {
				obj.fn(1, 2, 3);
				expect(callLog).toEqual([ ['fC', [obj, 2, 1]], ['fB', [obj, 2, 2]], ['fA', [obj, 1, 3]] ]);
			}
		], [
			{ fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.prepend('obj.fn', function (a, b) { fB(this, b, b) });
				d.insert ('obj.fn', function (a, b) { fC(this, b, a) });
			},
			(obj) => {
				obj.fn(1, 2, 3);
				expect(callLog).toEqualOneOf(
					[ ['fC', [obj, 2, 1]], ['fB', [obj, 2, 2]], ['fA', [obj, 1, 3]] ],
					[ ['fB', [obj, 2, 2]], ['fC', [obj, 2, 1]], ['fA', [obj, 1, 3]] ],
					[ ['fB', [obj, 2, 2]], ['fA', [obj, 1, 3]], ['fC', [obj, 2, 1]] ]
				);
			}
		], [
			{ fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.prepend('obj.fn', function (a, b) { fB(this, b, b) });
				d.append ('obj.fn', function (a, b) { fC(this, b, a) });
			},
			(obj) => {
				obj.fn(1, 2, 3);
				expect(callLog).toEqual([ ['fB', [obj, 2, 2]], ['fA', [obj, 1, 3]], ['fC', [obj, 2, 1]] ]);
			}
		], [
			{ fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.insert ('obj.fn', function (a, b) { fB(this, b, b) });
				d.prepend('obj.fn', function (a, b) { fC(this, b, a) });
			},
			(obj) => {
				obj.fn(1, 2, 3);
				expect(callLog).toEqualOneOf(
					[ ['fC', [obj, 2, 1]], ['fB', [obj, 2, 2]], ['fA', [obj, 1, 3]] ],
					[ ['fC', [obj, 2, 1]], ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]] ]
				);
			}
		], [
			{ fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.insert('obj.fn', function (a, b) { fB(this, b, b) });
				d.insert('obj.fn', function (a, b) { fC(this, b, a) });
			},
			(obj) => {
				obj.fn(1, 2, 3);
				expect(callLog).toEqualOneOf(
					[ ['fC', [obj, 2, 1]], ['fB', [obj, 2, 2]], ['fA', [obj, 1, 3]] ],
					[ ['fB', [obj, 2, 2]], ['fC', [obj, 2, 1]], ['fA', [obj, 1, 3]] ],
					[ ['fB', [obj, 2, 2]], ['fA', [obj, 1, 3]], ['fC', [obj, 2, 1]] ],
					[ ['fC', [obj, 2, 1]], ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]] ],
					[ ['fA', [obj, 1, 3]], ['fC', [obj, 2, 1]], ['fB', [obj, 2, 2]] ],
					[ ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]], ['fC', [obj, 2, 1]] ]
				);
			}
		], [
			{ fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.insert('obj.fn', function (a, b) { fB(this, b, b) });
				d.append('obj.fn', function (a, b) { fC(this, b, a) });
			},
			(obj) => {
				obj.fn(1, 2, 3);
				expect(callLog).toEqualOneOf(
					[ ['fB', [obj, 2, 2]], ['fA', [obj, 1, 3]], ['fC', [obj, 2, 1]] ],
					[ ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]], ['fC', [obj, 2, 1]] ]
				);
			}
		], [
			{ fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.append ('obj.fn', function (a, b) { fB(this, b, b) });
				d.prepend('obj.fn', function (a, b) { fC(this, b, a) });
			},
			(obj) => {
				obj.fn(1, 2, 3);
				expect(callLog).toEqual([ ['fC', [obj, 2, 1]], ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]] ]);
			}
		], [
			{ fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.append('obj.fn', function (a, b) { fB(this, b, b) });
				d.insert('obj.fn', function (a, b) { fC(this, b, a) });
			},
			(obj) => {
				obj.fn(1, 2, 3);
				expect(callLog).toEqualOneOf(
					[ ['fC', [obj, 2, 1]], ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]] ],
					[ ['fA', [obj, 1, 3]], ['fC', [obj, 2, 1]], ['fB', [obj, 2, 2]] ],
					[ ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]], ['fC', [obj, 2, 1]] ]
				);
			}
		], [
			{ fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.append('obj.fn', function (a, b) { fB(this, b, b) });
				d.append('obj.fn', function (a, b) { fC(this, b, a) });
			},
			(obj) => {
				obj.fn(1, 2, 3);
				expect(callLog).toEqual([ ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]], ['fC', [obj, 2, 1]] ]);
			}
		]]);


		itCan("combine function operations with other types of operations or throw an error if invalid", [[
			{ key: 'val' },
			() => {
				d.add   ('obj.fn', function (a, b, c) { fA(this, a, c) });
				d.append('obj.fn', function (a, b)    { fB(this, b, b) });
			},
			(obj) => {
				obj.fn(1, 2, 3);
				expect(obj.key).toBe('val');
				expect(callLog).toEqual([ ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]] ]);
			}
		], [
			{ key: 'val' },
			() => {
				d.add   ('obj.fn', 'not a function or an array');
				d.append('obj.fn', function (a, b) { fB(this, b, b) });
			},
			expectError(DeltaJs.CompositionError) // 'obj.fn', left by the 'add' operation, has to be an array
		], [
			{ key: 'val', fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.add   ('obj.fn', function (a, b, c) { fA(this, a, c) });
				d.append('obj.fn', function (a, b) { fB(this, b, b) });
			},
			expectError(DeltaJs.ApplicationError) // 'obj.fn' is forbidden, but was present
		], [
			{ key: 'val', fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.replace('obj.fn', function (a, b) { fB(this, b, b) });
				d.append ('obj.fn', function (a, b) { fC(this, b, a) });
			},
			(obj) => {
				obj.fn(1, 2, 3);
				expect(obj.key).toBe('val');
				expect(callLog).toEqual([ ['fB', [obj, 2, 2]], ['fC', [obj, 2, 1]] ]);
			}
		], [
			{ key: 'val', fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.replace('obj.fn', 'not a function or an array');
				d.append ('obj.fn', function (a, b) { fB(this, b, b) });
			},
			expectError(DeltaJs.CompositionError) // 'obj.fn', left by the 'replace' operation, has to be an array
		], [
			{ key: 'val' },
			() => {
				d.replace('obj.fn', function (a, b, c) { fA(this, a, c) });
				d.append ('obj.fn', function (a, b) { fB(this, b, b) });
			},
			expectError(DeltaJs.ApplicationError) // 'obj.fn' is mandatory, but was absent
		], [
			{ key: 'val', fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.append('obj.fn', function (a, b) { fB(this, b, b) });
				d.remove('obj.fn');
			},
			{ key: 'val' }
		], [
			{ key: 'val' },
			() => {
				d.append('obj.fn', function (a, b) { fB(this, b, b) });
				d.remove('obj.fn');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.fn' is mandatory, but was absent
		], [
			{ key: 'val', fn(a, b, c) { fA(this, a, c) } },
			() => {
				d.append ('obj.fn', function (a, b) { fB(this, b, b) });
				d.replace('obj.fn', 'whatever');
			},
			{ key: 'val', fn: 'whatever' }
		], [
			{ key: 'val' },
			() => {
				d.append ('obj.fn', function (a, b) { fB(this, b, b) });
				d.replace('obj.fn', 'whatever');
			},
			expectError(DeltaJs.ApplicationError) // 'obj.fn' is mandatory, but was absent
		]]);


	});

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	describe("the delta model operation", () => {

		var dm;
		beforeEach(() => {
			dm = d.deltaModel('obj');
		});

		itCan("be a middle-man for a single other delta", [[
			{},
			() => {
				dm('X').add('key', { foo: 'bar' });
			},
			{ key: { foo: 'bar' } }
		], [
			{ key: { foo: 'bar' } },
			() => {
				dm('X').remove('key');
			},
			{}
		], [
			{},
			() => {
				dm('X').forbid('key');
			},
			{}
		], [
			{ key: { foo: 'bar' } },
			() => {
				dm('X').replace('key', 'value');
			},
			{ key: 'value' }
		], [
			{ key: { foo: 'bar' } },
			() => {
				dm('X').modify('key').replace('foo', 'bas');
			},
			{ key: { foo: 'bas' } }
		], [
			{ key: ['a'] },
			() => {
				dm('X').prepend('key', 'b');
			},
			{ key: ['b', 'a'] }
		], [
			{ key: ['a'] },
			() => {
				dm('X').insert('key', 'b');
			},
			(obj) => {
				expect(obj).toEqualOneOf(
					{ key: ['b', 'a'] },
					{ key: ['a', 'b'] }
				);
			}
		], [
			{ key: ['a'] },
			() => {
				dm('X').append('key', 'b');
			},
			{ key: ['a', 'b'] }
		]]);


		describe("with a function operation delta inside", () => {

			/* setup */
			var callLog;
			function fA(...args) { callLog.push(['fA', args]) }
			function fB(...args) { callLog.push(['fB', args]) }
			beforeEach(() => { callLog = [] });

			itCan("be a middle man for that one delta", [[
				{ fn(a, b, c) { fA(this, a, c) } },
				() => {
					dm('X').prepend('fn', function (a, b) { fB(this, b, b) });
				},
				(obj) => {
					obj.fn(1, 2, 3);
					expect(callLog).toEqual([ ['fB', [obj, 2, 2]], ['fA', [obj, 1, 3]] ]);
				}
			], [
				{ fn(a, b, c) { fA(this, a, c) } },
				() => {
					dm('X').insert('fn', function (a, b) { fB(this, b, b) });
				},
				(obj) => {
					obj.fn(1, 2, 3);
					expect(callLog).toEqualOneOf(
						[ ['fB', [obj, 2, 2]], ['fA', [obj, 1, 3]] ],
						[ ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]] ]
					);
				}
			], [
				{ fn(a, b, c) { fA(this, a, c) } },
				() => {
					dm('X').append('fn', function (a, b) { fB(this, b, b) });
				},
				(obj) => {
					obj.fn(1, 2, 3);
					expect(callLog).toEqual([ ['fA', [obj, 1, 3]], ['fB', [obj, 2, 2]] ]);
				}
			]]);

		});


		itCan("apply deltas in a linear order (as if composed)", [[
			{},
			() => {
				dm('X').add('key', { foo: 'bar' });
				dm('Y').remove({ after: ['X'] }, 'key');
			},
			{}
		], [
			{},
			() => {
				dm('X').add('key', { foo: 'bar' });
				dm('Y').replace({ after: ['X'] }, 'key', 'some value');
			},
			{ key: 'some value' }
		], [
			{},
			() => {
				dm('X'                   ).add('key1', { foo: 'bar' });
				dm('Y',  { after: ['X'] }).add('key2', 'some value');
				dm('Z',  { after: ['Y'] }).add('key3', 'some other value');
				dm('rY', { after: ['Z'] }).remove('key2');
			},
			{ key1: { foo: 'bar' }, key3: 'some other value' }
		]]);


		itCan("apply unordered deltas in arbitrary order, if they do not conflict", [[
			{ oldKey: 'old value' },
			() => {
				dm('X').add('key1', 1    );
				dm('Y').add('key2', 'b'  );
				dm('Z').add('key3', 'iii');
				dm('r').remove('oldKey');
			},
			{ key1: 1, key2: 'b', key3: 'iii' }
		]]);


		itCan("apply a partially ordered set of `deltas in topological order, if unordered deltas do not conflict", [[
             { oldKey: 'old value' },
             () => {
                 dm('W'                  ).add('key', { foo: 'bar' });
                 dm('X', { after: ['W'] }).add('key.x', 1           );
                 dm('Y', { after: ['W'] }).add('key.y', 2           );
                 dm('Z', { after: ['W'] }).add('key.z', 3           );
             },
             { oldKey: 'old value', key: { foo: 'bar', x: 1, y: 2, z: 3 } }
         ], [
			{ oldKey: 'old value' },
			() => {
				dm('X', { after: ['W'] }).add('key.x', 1           );
				dm('Y', { after: ['W'] }).add('key.y', 2           );
				dm('Z', { after: ['W'] }).add('key.z', 3           );
				dm('W'                  ).add('key', { foo: 'bar' }); // the order doesn't matter
			},
			{ oldKey: 'old value', key: { foo: 'bar', x: 1, y: 2, z: 3 } }
		]]);


		itCan("throw an error if there is an application order cycle", [[
            {},
            () => {
                dm('X',  { after: ['Y'] }).add('key1', 'value 1');
                dm('Y',  { after: ['X'] }).add('key2', 'value 2');
            },
            expectError(DeltaJs.ApplicationOrderCycle, { from: 'X', to: 'Y' })
        ], [
			{},
			() => {
				dm('W'                        ).add('keyW', 'value W');
				dm('X',  { after: ['W', 'Z'] }).add('keyX', 'value X');
				dm('Y',  { after: ['X']      }).add('keyY', 'value Y');
				dm('Z',  { after: ['Y']      }).add('keyZ', 'value Z');
			},
			expectError(DeltaJs.ApplicationOrderCycle, { from: 'Y', to: 'Z' })
		]]);


		// TODO: conflicts


	});


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	describe("features", () => {

		it("have a class to represent them", () => {
			expect(typeof deltaJs.Feature).toBe('function');
		});

		it("have a DeltaJs method to declare them", () => {
			expect(typeof deltaJs.newFeature).toBe('function');
		});

		it("have a DeltaJs object in which they are stored", () => {
			expect(deltaJs.features).toEqual(any(Object));
			expect(deltaJs.features['f']).toBeUndefined();
			var f = deltaJs.newFeature('f');
			expect(f).toEqual(any(deltaJs.Feature));
			expect(deltaJs.features['f']).toBe(f);
		});

		it("can be instantiated", () => {
			var f = deltaJs.newFeature('f');
			expect(f).toBe(deltaJs.features['f']);
			expect(f).toEqual(any(deltaJs.Feature));
		});

		describe("that are instantiated", () => {
			var e, f, g, h;
			beforeEach(() => {
				e = deltaJs.newFeature('e');
				f = deltaJs.newFeature('f');
				g = deltaJs.newFeature('g');
				h = deltaJs.newFeature('h');
			});
			function expectAllUnselected() {
				expect(e.selected).toBeFalsy();
				expect(f.selected).toBeFalsy();
				expect(g.selected).toBeFalsy();
				expect(h.selected).toBeFalsy();
			}

			it("know their name", () => {
				expect(e.name).toBe('e');
				expect(f.name).toBe('f');
				expect(g.name).toBe('g');
				expect(h.name).toBe('h');
			});

			it("start out not selected", () => {
				expectAllUnselected();
			});

			it("can be selected: 'select'", () => {
				g.select();
				expect(e.selected).toBeFalsy();
				expect(f.selected).toBeFalsy();
				expect(g.selected).toBeTruthy();
				expect(h.selected).toBeFalsy();
			});

			it("can be selected: 'if(true)'", () => {
				g.if(true);
				expect(e.selected).toBeFalsy();
				expect(f.selected).toBeFalsy();
				expect(g.selected).toBeTruthy();
				expect(h.selected).toBeFalsy();
			});

			it("can automatically be selected when other features are: 'if' by reference", () => {
				e.if(f);
				f.if(g);
				g.if(h);
				expectAllUnselected();
				g.select();
				expect(e.selected).toBeTruthy();
				expect(f.selected).toBeTruthy();
				expect(g.selected).toBeTruthy();
				expect(h.selected).toBeFalsy();
			});

			it("can automatically be selected when other features are: 'if' by name", () => {
				e.if('f');
				f.if('g');
				g.if('h');
				expectAllUnselected();
				g.select();
				expect(e.selected).toBeTruthy();
				expect(f.selected).toBeTruthy();
				expect(g.selected).toBeTruthy();
				expect(h.selected).toBeFalsy();
			});

			it("can throw an error when constraints on other features are not met: 'onlyIf' by reference", () => {
				f.onlyIf(g);
				expectAllUnselected();
				f.select();
				expect(() => f.selected).toThrowSpecific(DeltaJs.ConstraintFailure, { feature: f });
				g.select();
				expect(f.selected).toBeTruthy();
				expect(g.selected).toBeTruthy();
			});

			it("can throw an error when constraints on other features are not met: 'onlyIf' by name", () => {
				f.onlyIf('g');
				expectAllUnselected();
				f.select();
				expect(() => f.selected).toThrowSpecific(DeltaJs.ConstraintFailure, { feature: f });
				g.select();
				expect(f.selected).toBeTruthy();
				expect(g.selected).toBeTruthy();
			});

			it("can automatically select other features when selected: 'selects' by reference", () => {
				e.selects(e);
				f.selects(g);
				g.selects(h);
				expectAllUnselected();
				f.select();
				expect(e.selected).toBeFalsy();
				expect(f.selected).toBeTruthy();
				expect(g.selected).toBeTruthy();
				expect(h.selected).toBeTruthy();
			});

			it("can automatically select other features when selected: 'selects' by name", () => {
				e.selects('e');
				f.selects('g');
				g.selects('h');
				expectAllUnselected();
				f.select();
				expect(e.selected).toBeFalsy();
				expect(f.selected).toBeTruthy();
				expect(g.selected).toBeTruthy();
				expect(h.selected).toBeTruthy();
			});

			it("can throw an error when constraints on other features are not met: 'requiredBy' by reference", () => {
				f.requiredBy(g);
				expectAllUnselected();
				g.select();
				expect(() => g.selected).toThrowSpecific(DeltaJs.ConstraintFailure, { feature: g });
				f.select();
				expect(f.selected).toBeTruthy();
				expect(g.selected).toBeTruthy();
			});

			it("can throw an error when constraints on other features are not met: 'requiredBy' by name", () => {
				f.requiredBy('g');
				expectAllUnselected();
				g.select();
				expect(() => g.selected).toThrowSpecific(DeltaJs.ConstraintFailure, { feature: g });
				f.select();
				expect(f.selected).toBeTruthy();
				expect(g.selected).toBeTruthy();
			});

			it("can automatically select other features when selected: 'iff' (1) by reference", () => {
				f.iff(g);
				expectAllUnselected();
				g.select();
				expect(f.selected).toBeTruthy();
				expect(g.selected).toBeTruthy();
			});

			it("can automatically select other features when selected: 'iff' (1) by name", () => {
				f.iff('g');
				expectAllUnselected();
				g.select();
				expect(f.selected).toBeTruthy();
				expect(g.selected).toBeTruthy();
			});

			it("can automatically select other features when selected: 'iff' (2) by reference", () => {
				f.iff(g);
				expectAllUnselected();
				f.select();
				expect(() => f.selected).toThrowSpecific(DeltaJs.ConstraintFailure, { feature: f });
				g.select();
				expect(f.selected).toBeTruthy();
				expect(g.selected).toBeTruthy();
			});

			it("can automatically select other features when selected: 'iff' (2) by name", () => {
				f.iff('g');
				expectAllUnselected();
				f.select();
				expect(() => f.selected).toThrowSpecific(DeltaJs.ConstraintFailure, { feature: f });
				g.select();
				expect(f.selected).toBeTruthy();
				expect(g.selected).toBeTruthy();
			});

		});


	});


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	describe("variation points", () => {

		it("have a DeltaJs method to indicate them in the domain-specific code: 'vp'", () => {
			expect(typeof deltaJs.vp).toBe('function');
		});

		it("have a DeltaJs method to operate on them: 'operation'", () => {
			expect(typeof deltaJs.operation).toBe('function');
		});

		it("have a DeltaJs facade to operate on them: 'do'", () => {
			expect(typeof deltaJs.do).toBe('function');
			expect(typeof deltaJs.do()).toBe('function');
		});

		it("pass a value through unchanged if no operations are prepared for them", () => {
			var x = deltaJs.vp('x', 'old value');
			expect(x).toBe('old value');
		});

		it("apply deltas to a value for which deltas are prepared (1)", () => {
			deltaJs.do('delta-name', { feature: false }).replace('x', 'new x value');
			var x = deltaJs.vp('x', 'old x value');
			var y = deltaJs.vp('y', 'old y value');
			expect(x).toBe('new x value');
			expect(y).toBe('old y value');
		});

		it("apply deltas to a value for which deltas are prepared (2)", () => {
			deltaJs.do('w', { feature: false                    }).add('obj', { keyW: 'valW' });
			deltaJs.do('x', { feature: false, after: ['w']      }).add('obj.keyX', 'valX');
			deltaJs.do('y', { feature: false, after: ['w']      }).add('obj.keyY', 'valY');
			deltaJs.do('z', { feature: false, after: ['x', 'y'] }).modify('obj')
				.replace('keyX', 'valXZ')
				.replace('keyY', 'valYZ');
			var obj = deltaJs.vp('obj');
			expect(obj).toEqual({
				keyW: 'valW',
				keyX: 'valXZ',
				keyY: 'valYZ'
			});
		});

	});


	describe("application conditions", () => {

		var F, G, H;
		var w, x, y, z;

		beforeEach(() => {
			F = deltaJs.newFeature('F');
			G = deltaJs.newFeature('G');
			H = deltaJs.newFeature('H');
			w = deltaJs.do('w');
			x = deltaJs.do('x');
			y = deltaJs.do('y');
			z = deltaJs.do('z');
		});

		it("can, based on which features are selected, apply or not apply a delta", () => {

			/* deltas, normally declared independently */
			w({ iff: ['F']      }).add('obj.w', 'w-value');
			x({ iff: ['F', 'G'] }).add('obj.x', 'x-value');
			y({ iff: ['F', 'H'] }).add('obj.y', 'y-value');
			z({ feature: false  }).add('obj.z', 'z-value');

			/* the desired features, selected in a central location */
			deltaJs.select(['F', 'H']);

			/* a variation point, indicated throughout the domain specific code */
			var obj = deltaJs.vp('obj', {});

			/* as a consequence of the the above, 'obj' is expected to be as follows */
			expect(obj).toEqual({
				w: 'w-value',
				// not x, because 'G' was not selected
				y: 'y-value',
				z: 'z-value'
			});

		});

	});


	describe("deltas and features", () => {

		var w, x, y, z;

		beforeEach(() => {
			w = deltaJs.do('w');
			x = deltaJs.do('x');
			y = deltaJs.do('y');
			z = deltaJs.do('z');
		});

		it("can be declared eponymous: together in one shot to share the same name and a one-to-one relationship", () => {

			/* deltas, normally declared independently */
			w.add('obj.w', 'w-value');
			x.add('obj.x', 'x-value');
			y.add('obj.y', 'y-value');


			/* the desired features, selected in a central location */
			deltaJs.select(['w', 'x']);


			/* a variation point, indicated throughout the domain specific code */
			var obj = deltaJs.vp('obj', {});


			/* as a consequence of the the above, 'obj' is expected to be as follows */
			expect(obj).toEqual({
				w: 'w-value',
				x: 'x-value',
				// not y, because it was not selected
			});

		});

		it("–if they are eponymous– are both effected by the 'combines' option", () => {

			/* deltas, normally declared independently */
			x.add('obj.x', 'x-value');
			y.add('obj.y', 'y-value');
			z({ combines: ['x', 'y'] })
				.replace('obj.x', 'z-value')
				.replace('obj.y', 'z-value');

			/* the desired features, selected in a central location */
			deltaJs.select(['x', 'y']);

			/* a variation point, indicated throughout the domain specific code */
			var obj = deltaJs.vp('obj', {});

			/* as a consequence of the the above, 'obj' is expected to be as follows */
			expect(obj).toEqual({
				x: 'z-value',
				y: 'z-value'
			});

		});

	});



	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

});
