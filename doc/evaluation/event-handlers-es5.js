function onKeyDown(event) {
	if (event.getModifierState("Shift")) {
		console.log("Shift...");
	}
}

var search = document.getElementById("search");

if (search) {
	search.addEventListener("click", onKeyDown, false);
	search.addEventListener("keydown", onKeyDown, false);
}
