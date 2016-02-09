var _ = require('./lodash-plus.js');
var assert = require('assert');



describe('lodash-plus', function () {
	describe('isNullOrUndefined', function () {
		var falsyAndTruthy = {
			a: false,
			b: null,
			c: undefined,
			d: 0,
			e: '',
			f: NaN,
			g: 1,
			h: 'a',
			i: {},
			j: [],
			k: true
		};
		_.each(falsyAndTruthy, function (val, key) {
			if (_.includes(['b', 'c'], key)) {
				it('should return true for null and undefined values', function () {
					assert.equal(_.isNullOrUndefined(val), true);
				});
			}
			else {
				it('should return false for non-null and defined values', function () {
					assert.equal(_.isNullOrUndefined(val), false);
				});
			}
		});
	});
	
	describe('includesAny', function () {
		describe('when called with two strings', function () {
			var searchInA = ['abc', 'def', 'ghi', 'jkl'];
			var searchInB = ['xxx', 'yyy', 'zzz'];
			
			var searchForA = ['qqqadgjqqq', 'bqeqhqk', 'qqqlifc'];
			var searchForB = ['x', 'y', 'z'];
			
			describe('and the first string contains at least one letter from the second', function () {
				_.each(searchInA, function (searchInString) {
					_.each(searchForA, function (searchForString) {
						it('should return true', function () {
							assert.equal(_.includesAny(searchInString, searchForString), true);
						});
					});
				});
			});
			
			describe('and the first string contains no letters from the second', function () {
				_.each(searchInA, function (searchInString) {
					_.each(searchForB, function (searchForString) {
						it('should return false', function () {
							assert.equal(_.includesAny(searchInString, searchForString), false);
						});
					});
				});
				
				_.each(searchInB, function (searchInString) {
					_.each(searchForA, function (searchForString) {
						it('should return false', function () {
							assert.equal(_.includesAny(searchInString, searchForString), false);
						});
					});
				});
			});
		});
		
		describe('when called with an array of objects and an array of strings', function () {
			var testObjects = [
				{a: true, b: null, c: 1},
				{d: false, e: NaN, f: 'a'},
				{g: true, h: undefined, i: []},
				{j: false, k: 0, l: _.noop}
			];
			var matchingTestStrings = [['x', 'b', 'q'], ['g', 'l', 'c'], ['z', 'zzz', 'h']];
			var unMatchingTestStrings = [['x', 'y', 'z'], ['ab', 'kl'], ['ll']];
			
			describe('and at least one of the test objects has a property key matching one of the strings', function () {
				_.each(matchingTestStrings, function (stringArray) {
					it('should return true', function () {
						assert.equal(_.includesAny(testObjects, stringArray), true);
					});
				});
			});
			
			describe('and none of the test objects have a property key matching one of the strings', function () {
				_.each(unMatchingTestStrings, function (stringArray) {
					it('should return false', function () {
						assert.equal(_.includesAny(testObjects, stringArray), false);
					});
				});
			});
		});
		
		describe('when called with arrays of non-object values', function () {
			_.each({
				'number': {
					first: [1, 2, 3],
					match: [4, 2, 6],
					unmatching: [7, 8, 9]
				},
				'string': {
					first: ['a', 'b', 'c'],
					match: ['d', 'b', 'f'],
					unmatching: ['g', 'h', 'i']
				},
				'assorted': {
					first: [true, NaN, undefined],
					match: [false, 1, NaN],
					unmatching: [null, 0, '1']
				}
			}, function (array, arrayType) {
				it('should return true when at least one element of each ' + arrayType + ' array is equal', function () {
					assert.equal(_.includesAny(array.first, array.match), true);
				});
				
				it('should return false when no elements of either ' + arrayType + ' array are equal', function () {
					assert.equal(_.includesAny(array.first, array.unmatching), false);
				});
			});
		});
	});
});
