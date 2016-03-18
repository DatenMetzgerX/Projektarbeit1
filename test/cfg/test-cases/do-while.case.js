let x = 10;

do {
	let y = Math.pow(x, x);
	console.log(y);

	if (x === 2) {
		continue;
	}

	if (x === -1) {
		break;
	}
} while (x > 0);

console.log(x);
