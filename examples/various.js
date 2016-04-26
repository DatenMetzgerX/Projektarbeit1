// Base Types A = { number, string, boolean, null, void, Maybe<T>, Record }


// -------------------------
// Beispiel 1:
// -------------------------
let x = null;				// null
x = 15; 					// number

// -------------------------
// Beispiel 2:
// -------------------------
function (x) {				// any -> boolean
	return x == null;		// void
}

// -------------------------
// Beispiel 3:
// -------------------------
function (x) {				// any -> any
	if (x == null) {		// x: any, oder keine Herleitung in diesem Fall? dann bleibt x => @1 und inferred in diesem Fall dann korrekt auf number
		...
	}
	return x * 2;			// x: Maybe<number> bei forward analysis, da x dies nachher ganz sichher ist (Intersection!) 
}

// -------------------------
// Beispiel 4:
// -------------------------
function (x) {				// {} -> @1
	return x.name;
}

// -------------------------
// Beispiel 3:
// -------------------------
const x = {};				// {}
const y = x.y;				// x: {}, y: @1

// -------------------------
// Beispiel 4:
// -------------------------
const x = null;				// null
y = x.y						// null ptr

// -------------------------
// Beispiel 5:
// Was ist y nach dem Join
// -------------------------
function divide(x, y) {		// (Maybe<number>, Maybe<number>) -> number
	if (y === null) {		// y: null
		y = 1;				// y: number
	}						
	
	return x / y;			// x: Maybe<number>
}

// -------------------------
// Beispiel 6:
// -------------------------
function stringify(options){// (Maybe<number>, Maybe<number>) -> number
	if (!options) {			// options: null
		options = {};		// y: Maybe<{}>
	}
	
	return options.name;	// null ptr oder ok?
}

// -------------------------
// Beispiel 7:
// -------------------------
function query(includeAge) {// any -> void
	const x = { 			// { name: string, lastName: string };
		name: "Micha", 
		lastName: "Reiser"
	};
	
	if (includeAge) {		// includeAge: any
		x.age = 26;			// x: { name: string, lastName: string, age: number}
	}						// unification: { name: string, lastName: string }
	
	console.log(x.name);
	console.log(x.age);		// error (abhaengig von bsp. 4)
}

// -------------------------
// Beispiel 8:
// -------------------------
const x = 19;				// number
x.y = 12;					// x: { y: number }



// -------------------------
// Read of unknown property:
// This should typecheck correctly
// -------------------------
const p = {};

if (!p.name) {
	p.name = "Test";
}

// -------------------------
// Read from unknown object:
// This should throw a null ptr
// -------------------------
const p = {};

if (!p.address.street) { // throws
	p.address.street = "Test";
}

// -------------------------
// Function call that has side effects to a parameter
// -------------------------
function setName(x, name) {
	x.name = name;
}

let a = {};
setName(a, "test"); // a = {name: string}

// -------------------------
// Function call that assigns an argument and changes it's type
// -------------------------
function toNumber(x) {
	if (x == null) {
		x = 0
	}
	
	return x;
}

let a = null;
toNumber(a) // a still needs to be of type null. 

// Can we say that the type of the parameters should only be substituted if they still have the same id? But thats not the case if a member is assigned (returns another type)
// overall this only applies to record types. Changes to other types can safely be ignored. The question is, how to find out if the type has changed or not

// -------------------------
// Not invoked function wiht access to member
// Needs to typecheck safely
// -------------------------

function getName(x) {
	return x.name; // what's the return type?
}

// -------------------------
// Not invoked function with access to mutilpe members
// Needs to typecheck safely
// -------------------------

function area(x) {
	return x.length * x.width; // whats the type of length and width? 
}


// -------------------------
// Invocation of function result
// -------------------------
function id(x) {
	return x;
}

id(id)(10); // T = number



// -------------------------
// Computed property
// -------------------------
for (let i = 0; i<a.length; ++i) {
	console.log(i, a[i]);
}

while (i < a.length) {
	console.log(a[i++]);
}

function iterate(array, callback) {
	for (let i = 0; i < array.length; ++i) {
		callback(array[i]);
	}
}


function filter(array, predicate) {
	let result = [];
	iterate(array, function (element) {
		if (predicate(element) === true) {
			result.push(element);
		}
	});
	
	return result;
}


filter([1, 2, 3,4, 5,6,7, 8, 9], function (i) {
	return i % 2 === 0;
});