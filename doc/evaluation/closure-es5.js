function createUniqueIdGenerator() {
	var currentId = 0;
	
	return function() {
		return ++currentId;
	}
}

var generator = createUniqueIdGenerator();
generator();
