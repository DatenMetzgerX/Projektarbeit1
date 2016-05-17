function range(start, end, step) {
	if (end === undefined) {
		end = start;
		start = 0;
	}
	
	if (step === undefined) {
		step = 1;
	}
	
	var result = [];
	
	for (var i= start; i < end; i = i + step) {
		result.push(i);
	}
	return result;
}

var r = range(10);
var r2 = range(1, 10);
var r3 = range(10, 1, -1);
