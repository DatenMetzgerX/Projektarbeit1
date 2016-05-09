function map(array, mapper) {
	var result = [];
	for (var i = 0; i < array.length; ++i) {
		result.push(mapper(array[i]));
	}
	return result;
}

var array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var doubled = map(array, function (x) { 
	return x * 2; 
});

var names = ["Anisa", "Ardelia", "Andres", "Madlyn", "Luana" ]
var lengths = map(names, function (name) {
	return name.length;
});
