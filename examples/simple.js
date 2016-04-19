let x = 3;
let y = 5;


function add(a, b) {
	return a + b;
}

function duplicate(d) {
	return add(d, d);
}

function setName(x, name) {
	x.name = name;
}

function getName(x) {
	return x.name;
}

function getStreet(x) {
	return x.address.street;
}

function setStreet(x, street) {
	x.address.street = street;
}


function id(x) {
	return x;
}

const p = { address: {street: "test"} };
setStreet(p, "test");
setName(p, "Test");
const name = getName(p);
let s = getStreet(p);
s = id(id)("test"); // ID not known, fails
s = id(getName({name: "Micha"}));

function log(m) {
	m = "test";
}


const n = 10; // n should stay number
log(n);

// function successor(x) {
//	if (x === 0) {
//		return 1;
//	}
//
//	return successor(x - 1) + 1;
//}


// let z = duplicate(x, y);
// let eleven = successor(10);

// //const x = 10;
// const y = {
// 	length: 10,
// 	width: 5
// };

//
// function map(x, mapper) {
// 	return mapper(x);
// }
//
// function length(x) {
// 	const result = id(x);
// 	return result.length;
// }
//
// function setName(to, name) {
// 	to.name = name;
// }
//
// const z = {};
//
// z.maxLength = function maxLengthMethod(arg1, arg2) {
// 	const xLength = length(arg1);
// 	const yLength = length(arg2);
//
// 	if (xLength < yLength) {
// 		return yLength;
// 	}
//
// 	return xLength;
// };
//
// // setName(y, "Test");
//
// const a = map(y, length);
//
//
// function hy(x) {
// 	let func = hy;
// 	let p1 = { name: null, age: null};
// 	let z = x;
//
// 	if (!p1.name) {
// 		p1.name = "Default";
// 	}
//
// 	let person = id(p1);
//
// 	person.address = { street: "Nice view 23" };
// 	return p1.age / 2 + x;
// }
//
