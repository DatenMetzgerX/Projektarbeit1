function range(start, end, step) {
	if (end === undefined) {
		end = start;
		start = 0;
	}
	
	if (step === undefined) {
		step = 1;
	}
	
	const result = [];
	
	for (let i= start; i < end; i = i + step) {
		result.push(i);
	}
	return result;
}

const r = range(10);
const r2 = range(1, 10);
const r3 = range(10, 1, -1);
