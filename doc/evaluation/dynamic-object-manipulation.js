function defaults(target, source) {
	target = target === undefined ? {} : target;
	for (const key of Object.keys(source)) {
		target[key] = target[key] ===
			undefined ? source[key] : target[key];
	}

	return target;
}

let options = defaults({}, {
	rounds: 1000,
	precision: 1
});
for (let i = 1; i < options.rnds; ++i) {
	// ...
}