function defaults(target, source) {
	target = target === undefined ? {} : target;
	for (const key of Object.keys(source)) { 
		target[key] = target[key] === undefined ? source[key] : target[key];
	}

	return target;
}

let options = defaults({}, {rounds: 1000, step: 1});
const end = options.rnds * options.step;