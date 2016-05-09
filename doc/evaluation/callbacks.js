function map(array, mapper) {
	const result = [];
	for (let i = 0; i < array.length; ++i) {
		result.push(mapper(array[i]));
	}
	return result;
}

const array = [1, 2, 3, 4, 5, 6];
const doubled = map(array, x => x * 2);

const names = ["Anisa", "Ardelia", "Madlyn"];
const lengths = map(names, name => name.length);