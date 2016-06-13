var _ = require('lodash');

_.mixin({
	pickTruthy: function (obj, props) {
		return _.spread(_.cond([
			[_.negate(_.isObject), function () {throw new Error('Invalid params');}],
			[this.argsLength(_.partial(_.isEqual, 1)), _.constant(_.pickBy(obj, this.isTruthy))],
			[_.flow(_.nthArg(1), _.isString), _.constant((this.isTruthy(obj[props]) ? _.pick(obj, props) : {}))],
			[_.flow(_.nthArg(1), _.isArray), _.constant(_.pickBy(_.pick(obj, props), this.isTruthy))],
			[_.honesty(), function () {throw new Error('Invalid params');}],
		]))(_.reject([obj, props], _.isUndefined));
	}
});

_.mixin({
	isFalsy: function (val) {
		return !Boolean(val);
	},
	isTruthy: function (val) {
		return Boolean(val);
	},
	isNullOrUndefined: function (val) {
		return _.overSome(_.isNull, _.isUndefined)(val);
	},
	isIntable: function (val) {
		// TODO: extract flowover, identity spread, sizeIs, to functions
		return _.bind(_.cond([
			[
				_.overSome(_.isString, _.isNumber),
				_.flow(
					_.over(_.identity, _.identity),
					_.spread(_.overArgs(_.eq, _.toInteger, _.toNumber)))
				],
			[
				_.overEvery(
					_.isArray,
					_.flow(_.tail, _.isEmpty),
					_.overSome(_.isEvery('Integer'), _.isEvery('String'))
				),
				_.flow(_.first, this.isIntable)
			],
			[_.honesty(), _.falsehood()]
		]), this)(val);
	},
	isBare: function (val) {
		return _.bind(_.cond([
			[_.isUndefined, _.honesty()],
			[_.overEvery(_.overSome(_.isPlainObject, _.isArrayLikeObject), _.isEmpty), _.honesty()],
			[_.overSome(_.isPlainObject, _.isArrayLikeObject), _.flow(_.values, _.isEvery('Bare'))],
			[_.honesty(), _.falsehood()]
		]), this)(val);
	},
	honesty: function () {
		return _.constant(true);
	},
	falsehood: function () {
		return _.constant(false);
	}
});

_.mixin({
	argsLength: function (callback) {
		return _.flow(_.rest(_.size), _.find([callback, _.identity]));
	},
	fullSize: function(obj) {
		return _.reduce(
			_.pickBy(obj, _.isPlainObject),
			_.overArgs(_.add, _.identity, _.thisBind('fullSize')),
			_.size(obj)
		);
	},
	allPaths: function (obj, parentPath) {
		var parentPathPrepend = _.partial(_.overTern(_.isTruthy, _.concat, _.rearg(_.arrayWrap, 1)), parentPath);
		return _.reduce(
			_.pickBy(obj, _.isPlainObject),
			_.overTern(
				_.rearg(_.isPlainObject, 1),
				_.flow(
					_.over(_.identity, _.rearg(_.overArg(_.thisBind('allPaths'), parentPathPrepend, 1), 1, 2)),
					_.spread(_.concat)
				)
			),
			_.map(_.keys(obj), _.unary(parentPathPrepend))
		);
	}
});

_.mixin({
	collCloner: function (callback, self) {
		return _.overArg(callback, _.cloneDeep);
	}
});

_.mixin({
	hasAll: function (obj, array) {
		return _.every(array, _.partial(_.has, obj));
	},
	hasAny: function (obj, array) {
		return _.some(array, _.partial(_.has, obj));
	},
	includesAny: function (searchIn, searchFor) {
		return _.cond([
			[
				_.rest(_.isEvery('String')),
				_.rearg(_.overArgs(_.some, _.identity, _.curry(_.includes)), 1, 0)
			],
			[
				_.overEvery(
					_.unary(_.isEvery('PlainObject')),
					_.rearg(_.unary(_.isEvery('String')), 1)
				),
				_.negate(_.overArg(_.disjoint, _.partialRight(_.flatMap, _.keys)))
			],
			[_.rest(_.isEvery('Array')), _.negate(_.disjoint)],
			[_.isPlainObject, _.negate(_.overArg(_.disjoint, _.values))],
			[_.honesty(), _.falsehood()]
		])(searchIn, searchFor);
	},
	disjoint: function (arrayA, arrayB) {
		return _.isEmpty(_.intersection(arrayA, arrayB));
	},
	isEvery: function (predicate) {
		// TODO: refactor to remove assignment operator and create lodash error throwing function
		if (_.isString(predicate)) {
			predicate = _['is' + _.upperFirst(predicate)];
			if (_.isUndefined(predicate)) {
				throw new Error('No such lodash function');
			}
		}
		return _.partialRight(_.every, predicate);
	}
});

_.mixin({
	extendAll: function (collection, sources) {
		return _.overTern(
			_.flow(_.flatten, _.union, _.negate(_.isEvery('PlainObject'))),
			function () {throw new Error('Invalid params');},
			_.spread(_.rest(_.overArg(
				_.each,
				_.flow(_.curry(_.each), _.partial(_.flow, _.curry(_.extend, 2)), _.unary),
				1
			), 1))
		)(arguments);
	}
});

_.mixin({
	getAll: function (object, paths, default_) {
		return _.map(paths, _.partial(_.rearg(_.get, 0, 2, 1), object, default_));
	},
	getFirst: function (object, paths, default_) {
		return _.get(object, _.find(paths, _.partial(_.has, object)), default_);
	},
	setDefinite: function (object, path, value) {
		return _.overTern(
			_.flow(_.negate, _.unary, _.flip)(_.isUndefined),
			_.set,
			_.noop
		)(object, path, value);
	},
	setEach: function (object, paths, values) {
		return _.reduce(_.zip(paths, values), _.spread(_.set, 1), object);
	}
});

_.mixin({
	// TODO: Rename as 'until' to match ruby inspiration?
	eachUntil: function (collection, callback, predicate) {
		_.each(collection, _.ary(
			_.overTern(_.find([predicate, _.identity]), _.falsehood(), callback), 3
		));
	},
	overTern: function (cond, ifCond, ifNotCond) {
		return _.cond([[cond, ifCond],[_.honesty(), _.find([ifNotCond, _.identity])]]);
	}
});

_.mixin({
	pathsEqual: function (pair1, pair2) {
		return _.every([
			_.has(pair1[0], pair1[1]),
			_.has(pair2[0], pair2[1]),
			_.isEqual(_.get(pair1[0], pair1[1]), _.get(pair2[0], pair2[1]))
		]);
	},
	innerJoin: function (object1, object2) {
		// TODO: does not work for NaN
		// TODO: simplify the below
		return _.reduce(
			_.sortBy(_.allPaths(object1)),
			_.ary(
				_.overTern(
					// TODO: extract below _.flow(_.flow...) to function, as well as _.rearg(_.unary)
					_.flow(
						_.flow,
						_.unary,
						_.partialRight(_.rearg, 1)
					)(
						_.arrayWrap,
						_.curryRight(_.concat, 2),
						_.unary,
						_.partial(_.map, [object1, object2]),
						_.spread(_.pathsEqual)
					),
					_.flow(
						_.over(
							_.rest(_.identity),
							_.flow(
								_.flow,
								_.unary,
								_.partialRight(_.rearg, 1)
							)(
								_.partial(_.get, object1),
								_.cloneDeep
							)
						),
						_.flatten,
						_.spread(_.set)
					)
			), 2),
			{}
		);
	}
});

_.mixin({
	arrayWrap: function (val) {
		return [val];
	},
	defaultZero: function (val) {
		return _.cond([
			[_.isTruthy, _.identity],
			[_.honesty, _.constant(0)]
		])(val);
	}
})

_.mixin({
	overArg: function (func, transform, argIndex) {
		return _.overArgs(func,
			_.set(_.fill([], _.identity, _.size(func)), _.defaultZero(argIndex), transform)
		);
	},
	filtration: function (collection, filterArray) {
		// TODO: make sure 3rd param does not affect anything
		// TODO: handle matches, matchesProperty and property iteratee shorthands
		return _.reduce(filterArray, _.filter, collection);
	},
	setBySelf: function (obj, atPath, toPath) {
		return _.set(obj, atPath, _.get(obj, toPath));
	},
	applyToNested: function (func, nestedPath, argIndex) {
		return _.overArg(func, _.partialRight(_.get, nestedPath), argIndex);
	},
	thisBind: function (func) {
		return _.bind(this[func], this);
	},
	mapKeysAndValues: function (object, valueMap, keyMap) {
		// TODO: make arguments passable params like extendAll
		return _.reduce(
			object,
			_.cond([
				[
					_.constant(_.lt(_.size(arguments), 3)),
					_.flow(
						_.over(_.identity, _.rearg(_.find([valueMap, _.rest(_.identity)]), 1, 2)),
						_.spread(_.cond([
							[_.rearg(_.isArray, 1), _.spread(_.rearg(_.set, 0, 2, 1), 1)],
							[_.rearg(_.isPlainObject, 1), _.extend]
						]))
					)
				],
				[
					_.constant(_.gt(_.size(arguments), 2)),
					_.rearg(_.overArgs(_.set, _.identity, keyMap, valueMap), 0, 2, 1)
				]
			]),
			{}
		);
	},
	under: function () {
		// TODO: make arguments passable param like extendAll
		return _.rest(_.partialRight(_.map, _.flow(
			_.unary(_.spread),
			_.partialRight(_.attempt, arguments)
		)));
	},
	mapOver: function (func, map) {
		// TODO: extract to overAll
		return _.flow(_.rest(_.partialRight(_.map, map)), _.spread(func));
	},
	nullEnd: function (obj, path) {
		return _.flow(
			_.overTern(_.isString, _.partialRight(_.split, '.')),
			_.partial(_.cond([
				[_.isNull, _.constant('')],
				[_.overSome(_.rest(_.partialRight(_.some, _.isEmpty), 0), _.negate(_.isPlainObject)), _.constant(null)],
				[_.flow(_.get, _.partial(_.isEqual, null)), _.flip(_.unary(_.partialRight(_.join, '.')))],
				[_.honesty(), _.overArg(_.thisBind('nullEnd'), _.initial, 1)]
			]), obj)
		)(path);
	},
	spreadOver: function () {
		// TODO: make arguments passable param like extendAll
		return _.rest(_.flow(
			_.curry(_.get, 2),
			_.partial(_.rearg(_.overArg, 0, 2, 1), _.attempt, 1),
			_.partial(_.map, _.flatten(arguments))
		), 0);
	}
});

module.exports = _;