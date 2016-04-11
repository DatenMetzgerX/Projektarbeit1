//const x = 10;
const y = 10;

function hy(x) {
	let func = hy;
	let p1 = { name: null, age: null};
	let person = p1;
	let z = x;

	if (!p1.name) {
		p1.name = "Default";
	}

	person.address = { street: "Nice view 23" };
	return p1.age / 2 + x;
}
