// @flow

// a "generic" function doing some work for us (in this case, just multiply
// value with a factor `n`)
function times(value, n) {
	return value * n;
}

// "higher order function" to generate more specific functions
function makeTimes(n) {
	return function(value) {
		return times(value, n);
	}
}

// using the specific functions (just to demonstrate, all good)
const times3 = makeTimes(3);
const times7 = makeTimes(7);
console.log(times3(3), times7(3));

// we may want to do things "in bulk", i.e. generate multiple higher order
// functions "in one go"
// This first attempt is broken, why?
function makeTimesMultipleBroken(arrayOfNs) {
	const result = [];
	for (var i = 0; i < arrayOfNs.length; i++) {
		const index = i;
		result.push(function(value) {
			return times(value, arrayOfNs[index]);
		});
	}
	return result;
}

var someTimes = makeTimesMultipleBroken([ 4, 5 ]);
var times4 = someTimes[0], times5 = someTimes[1];
const t4 = times4(3),
	t5 = times5(3);

// This second attempt works. Why?
function makeTimesMultiple(arrayOfNs) {
	return arrayOfNs.map(function(n) {
		return function(value) {
			return times(value, n);
		};
	});
}

someTimes = makeTimesMultiple([ 4, 5 ]);

times4 = someTimes[0];
times5 = someTimes[1];
const t42 = times4(3),
	t52 = times5(3);

t4 + times4;

console.log(t4, t5, t42, t52);