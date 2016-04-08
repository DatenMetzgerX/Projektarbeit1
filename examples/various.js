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
		lastName; "Reiser"
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

/// Wann entstehen eigentlich Unions??? 