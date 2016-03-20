console.log(10);

hy("User");

function hy (firstname, lastname) {
	function computeFullName() {
		if (lastname) {
			return `{$firstname} ${lastname}`;
		}

		return firstname;
	}

	console.log(`Hy ${computeFullName()}`);
}

console.log("Complete");