function defaults(target, source) {
	target = target === undefined ? {} : target;
	for (var key in source) {
		target[key] = target[key] === undefined ? source[key] : target[key];
	}

	return target;
}

var options = defaults({}, { rounds: 1000, step: 1 });
var end = options.rnds * options.step;