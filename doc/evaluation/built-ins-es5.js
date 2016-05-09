var array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var doubled = array.map(function (x) { 
	return x * 2; 
});

var sum = array.reduce(0, function (accum, x) { return accum + x; }, 0);