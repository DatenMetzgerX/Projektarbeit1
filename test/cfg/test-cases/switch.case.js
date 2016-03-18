let y;

switch (x) {
	case "A":
	case "B":
		y = "test";
		break;

	case "C":
	case "D":
		y = "CD";
	case "X":
		y = "Y";
		break;

	case "N":
	default:
		y = "Error";

	case "M":
		y = "M";
}

console.log(y);