const collection = [1, 2, 3, 4];

for (let x in collection) {
	if (x === 1) {
		continue;
	}

	if (x === 3) {
		break;
	}

	console.log(x);
}

console.log("complete");