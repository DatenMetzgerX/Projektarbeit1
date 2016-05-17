function onKeyDown(event) {
	if (event.getModifierState("Shift")) {
		console.log("Shift...");
	}
}

const input = document.getElementById("pwd");

if (input) {
	input.addEventListener("keydown", onKeyDown, false);
	input.addEventListener("blur", onKeyDown, false);
}
