//const x = 10;
const y = {
	length: 10,
	width: 5
};

function id(x) {
	return x;
}

function map(x, mapper) {
	return mapper(x);
}

function length(x) {
	const result = id(x);
	return result.length;
}

function setName(to, name) {
	to.name = name;
}

const z = {};

z.maxLength = function maxLengthMethod(arg1, arg2) {
	const xLength = length(arg1);
	const yLength = length(arg2);

	if (xLength < yLength) {
		return yLength;
	}

	return xLength;
};

// setName(y, "Test");

const a = map(y, length);


function hy(x) {
	let func = hy;
	let p1 = { name: null, age: null};
	let z = x;

	if (!p1.name) {
		p1.name = "Default";
	}

	let person = id(p1);

	person.address = { street: "Nice view 23" };
	return p1.age / 2 + x;
}

