let x = 11;

if (x === 10) {
	console.log("A");
} else if (x < 2) {
	console.log("x is less then 2");
} else {
	console.log("B");
}

for (let y = 0; y < 10; ++y) {
	console.log(y);
	--x;
}

console.log("Almost complete");
console.log("Complete");