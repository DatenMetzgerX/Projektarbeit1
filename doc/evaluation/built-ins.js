const array = [1, 2, 3, 4, 5];

const doubled = array.map(x => x * 2);
const sum = array.reduce(0, 
	(accum, x) => accum + x);