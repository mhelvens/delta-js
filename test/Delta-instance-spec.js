'use strict';

describe("Delta instance", function () {

	//beforeEach(() => {
	//	DeltaJs.registerPromiseResolver(P.resolve);
	//});
	//
	//function defer() {
	//	var result = {};
	//	result.promise = new P((resolve, reject) => {
	//		result.resolve = resolve;
	//		result.reject = reject;
	//	});
	//	return result;
	//}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	var deltaJs;
	var delta;
	beforeEach(() => {
		deltaJs = new DeltaJs();
		delta = new deltaJs.Delta('test-delta', {if: true});
	});

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function itCan(description, ...triples) {
		var counter = 0;
		triples.forEach(([pre, action, post]) => {
			it(`can ${description} (${++counter})`, () => {
				var rootObj = { obj: (typeof pre === 'function' ? pre() : pre) };
				action();
				if (post === Error) {
					expect(() => delta.applyTo(rootObj)).toThrowError();
				} else {
					expect(() => delta.applyTo(rootObj)).not.toThrowError();
					if (typeof post === 'function') {
						post(rootObj.obj);
					} else {
						expect(rootObj.obj).toEqual(post);
					}
				}
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	describe('object operations', () => {

		itCan('add a new field to an object',
			[
				{},
				() => { delta.add('obj.foo', 'bar') },
				{ foo: 'bar' }
			], [
				{},
				() => { delta.modify('obj').add('foo', 'bar') },
				{ foo: 'bar' }
			], [
				{ key: 'val' },
				() => { delta.add('obj.foo', 'bar') },
				{ key: 'val', foo: 'bar' }
			], [
				{ key: 'val' },
				() => { delta.modify('obj').add('foo', 'bar') },
				{ key: 'val', foo: 'bar' }
			], [
				{ key: 'val' },
				() => { delta.add('obj.key', 'bar') },
				Error
			], [
				{ key: 'val' },
				() => { delta.modify('obj').add('key', 'bar') },
				Error
			]);

		itCan('remove an existing field from an object',
			[
				{ foo: 'bar' },
				() => { delta.remove('obj.foo') },
				{}
			], [
				{ foo: 'bar' },
				() => { delta.modify('obj').remove('foo') },
				{}
			], [
				{ key: 'val', foo: 'bar' },
				() => { delta.remove('obj.foo') },
				{ key: 'val' }
			], [
				{ key: 'val', foo: 'bar' },
				() => { delta.modify('obj').remove('foo') },
				{ key: 'val' }
			], [
				{ foo: 'bar' },
				() => { delta.remove('obj.key') },
				Error
			], [
				{ foo: 'bar' },
				() => { delta.modify('obj').remove('key') },
				Error
			]);

		itCan('forbid a field from being in an object',
				[
					{ foo: 'bar' },
					() => { delta.forbid('obj.key') },
					{ foo: 'bar' }
				], [
					{ foo: 'bar' },
					() => { delta.modify('obj').forbid('key') },
					{ foo: 'bar' }
				], [
					{ key: 'val', foo: 'bar' },
					() => { delta.forbid('obj.key') },
					Error
				], [
					{ key: 'val', foo: 'bar' },
					() => { delta.modify('obj').forbid('key') },
					Error
				]);

		itCan('replace an existing field in an object',
				[
					{ foo: 'bar' },
					() => { delta.replace('obj.foo', 'BAS') },
					{ foo: 'BAS' }
				], [
					{ foo: 'bar' },
					() => { delta.modify('obj').replace('foo', 'BAS') },
					{ foo: 'BAS' }
				], [
					{ key: 'val', foo: 'bar' },
					() => { delta.replace('obj.foo', 'BAS') },
					{ key: 'val', foo: 'BAS' }
				], [
					{ key: 'val', foo: 'bar' },
					() => { delta.modify('obj').replace('foo', 'BAS') },
					{ key: 'val', foo: 'BAS' }
				], [
					{ foo: 'bar' },
					() => { delta.replace('obj.key', 'BAS') },
					Error
				], [
					{ foo: 'bar' },
					() => { delta.modify('obj').replace('key', 'BAS') },
					Error
				]);

	});

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	//describe('function operations', () => {
	//
	//	var callLog;
	//	function fA(...args) { callLog.push(['fA', args]) }
	//	function fB(...args) { callLog.push(['fB', args]) }
	//	function fC(...args) { callLog.push(['fC', args]) }
	//	function fD(...args) { callLog.push(['fD', args]) }
	//	beforeEach(() => {
	//		callLog = [];
	//	});
	//
	//	itCan('append statements to an existing function',
	//		[
	//			{ fn(a, b, c) { fA(this, a, c) } },
	//			() => { delta.append('obj.fn', function (a, b) { fB(this, b, b) }) },
	//			(obj) => {
	//				obj.fn(1, 2, 3);
	//				expect(callLog[0]).toEqual(['fA', [obj, 1, 3]]);
	//				expect(callLog[1]).toEqual(['fB', [obj, 2, 2]]);
	//			}
	//		], [
	//			{ fn(a, b, c) { fA(this, a, c) } },
	//			() => { delta.modify('obj').append('fn', function (a, b) { fB(this, b, b) }) },
	//			(obj) => {
	//				obj.fn(1, 2, 3);
	//				expect(callLog[0]).toEqual(['fA', [obj, 1, 3]]);
	//				expect(callLog[1]).toEqual(['fB', [obj, 2, 2]]);
	//			}
	//		]);
	//
	//
	//	itCan('prepend statements to an existing function',
	//		[
	//			{ fn(a, b, c) { fA(this, a, c) } },
	//			() => { delta.prepend('obj.fn', function (a, b) { fB(this, b, b) }) },
	//			(obj) => {
	//				obj.fn(1, 2, 3);
	//				expect(callLog[0]).toEqual(['fB', [obj, 2, 2]]);
	//				expect(callLog[1]).toEqual(['fA', [obj, 1, 3]]);
	//			}
	//		], [
	//			{ fn(a, b, c) { fA(this, a, c) } },
	//			() => { delta.modify('obj').prepend('fn', function (a, b) { fB(this, b, b) }) },
	//			(obj) => {
	//				obj.fn(1, 2, 3);
	//				expect(callLog[0]).toEqual(['fB', [obj, 2, 2]]);
	//				expect(callLog[1]).toEqual(['fA', [obj, 1, 3]]);
	//			}
	//		]);
	//
	//
	//	itCan('insert statements into an existing function',
	//		[
	//			{ fn(a, b, c) { fA(this, a, c) } },
	//			() => { delta.insert('obj.fn', function (a, b) { fB(this, b, b) }) },
	//			(obj) => {
	//				obj.fn(1, 2, 3);
	//				expect(callLog).toContainSomethingEqualTo(['fA', [obj, 1, 3]]);
	//				expect(callLog).toContainSomethingEqualTo(['fB', [obj, 2, 2]]);
	//			}
	//		], [
	//			{ fn(a, b, c) { fA(this, a, c) } },
	//			() => { delta.modify('obj').insert('fn', function (a, b) { fB(this, b, b) }) },
	//			(obj) => {
	//				obj.fn(1, 2, 3);
	//				expect(callLog).toContainSomethingEqualTo(['fA', [obj, 1, 3]]);
	//				expect(callLog).toContainSomethingEqualTo(['fB', [obj, 2, 2]]);
	//			}
	//		]);
	//
	//
	//	itCanAsync('attach statements to an existing function, to be run asynchronously after it finishes',
	//			[
	//				{ fn(a, b, c) { fA(this, a, c) } },
	//				(done) => {
	//					delta.after('obj.fn', function (a, b) {
	//						fB(this, b, b);
	//						expect(callLog[0]).toEqual(['fA', [this, 1, 3]]);
	//						expect(callLog[1]).toEqual(['fB', [this, 2, 2]]);
	//						done();
	//					});
	//				},
	//				(obj) => {
	//					obj.fn(1, 2, 3);
	//					expect(callLog[0]).toEqual(['fA', [obj, 1, 3]]);
	//					expect(callLog[1]).not.toBeDefined();
	//				}
	//			], [
	//				{ fn(a, b, c) { fA(this, a, c) } },
	//				(done) => {
	//					delta.modify('obj').after('fn', function (a, b) {
	//						fB(this, b, b);
	//						expect(callLog[0]).toEqual(['fA', [this, 1, 3]]);
	//						expect(callLog[1]).toEqual(['fB', [this, 2, 2]]);
	//						done();
	//					});
	//				},
	//				(obj) => {
	//					obj.fn(1, 2, 3);
	//					expect(callLog[0]).toEqual(['fA', [obj, 1, 3]]);
	//					expect(callLog[1]).not.toBeDefined();
	//				}
	//			]);
	//
	//
	//	var deferred;
	//	beforeEach(() => {
	//		deferred = defer();
	//	});
	//
	//
	//	itCanAsync('attach statements to an existing function, to be run after a returned promise is resolved',
	//		[
	//			{ fn(a, b, c) { fA(this, a, c); return deferred.promise; } },
	//			() => {
	//				delta.after('obj.fn', function (a, b) {
	//					fB(this, b, b);
	//				});
	//			},
	//			(obj, done) => {
	//				obj.fn(1, 2, 3);
	//				expect(callLog[0]).toEqual(['fA', [obj, 1, 3]]);
	//				setTimeout(() => {
	//					expect(callLog[1]).not.toBeDefined();
	//					deferred.resolve('promised value');
	//					expect(callLog[1]).not.toBeDefined();
	//					setTimeout(() => {
	//						expect(callLog[1]).toEqual(['fB', [obj, 2, 2]]);
	//						done();
	//					});
	//				});
	//			}
	//		], [
	//			{ fn(a, b, c) { fA(this, a, c); return deferred.promise; } },
	//			() => {
	//				delta.modify('obj').after('fn', function (a, b) {
	//					fB(this, b, b);
	//				});
	//			},
	//			(obj, done) => {
	//				obj.fn(1, 2, 3);
	//				expect(callLog[0]).toEqual(['fA', [obj, 1, 3]]);
	//				setTimeout(() => {
	//					expect(callLog[1]).not.toBeDefined();
	//					deferred.resolve('promised value');
	//					expect(callLog[1]).not.toBeDefined();
	//					setTimeout(() => {
	//						expect(callLog[1]).toEqual(['fB', [obj, 2, 2]]);
	//						done();
	//					});
	//				});
	//			}
	//		]);
	//
	//
	//
	//
	//});




});
