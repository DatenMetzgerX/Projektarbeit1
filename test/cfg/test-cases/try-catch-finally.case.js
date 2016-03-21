while(x) {
	try {
		try {
			test(); // break would be preferred, but not yet supported
		} catch (a) {
		} finally {
			foo();
		}
		fooFollow();
	} catch (b) {
		console.log("Error");
	} finally {
		bar();
	}
	barFollow();
}
END();