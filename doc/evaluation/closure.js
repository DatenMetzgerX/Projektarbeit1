function createUniqueIdGenerator() {
	let currentId = 0;
	
	return () => ++currentId;
}

const generator = createUniqueIdGenerator();
generator();
