function onKeyDown(event) {
	if (event.getModifierState("Shift")) {
		console.log("Shift...");
	}
}

var search = document.getElementById("search");

if (search) {
	search.addEventListener("keydown", onKeyDown, false);
	search.addEventListener("blur", onKeyDown, false);
}
