var i, j;

loop1:
	for (i = 0; i < 3; i++) {      //The first for statement is labeled "loop1"
		loop2:
			for (j = 0; j < 3; j++) {   //The second for statement is labeled "loop2"
				if (i === 1 && j === 1) {
					break loop1;
				}
				console.log("i = " + i + ", j = " + j);
			}
	}

outer_block: {
	inner_block: {
		console.log('1');
		break outer_block; // breaks out of both inner_block and outer_block
		console.log(':-('); // skipped
	}
	console.log('2'); // skipped
}