let x = 10;

do {
	console.log(--x);

	if (x === 2) {
		continue;
	}

	if (x === -1) {
		break;
	}
} while (x > 0);

console.log(x);
