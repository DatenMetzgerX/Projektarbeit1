import * as babylon from "babylon";

/**
 * Parses the passed in text
 * @param content the javascript program to parse
 * @return the parsed ast
 */
export function parse (content) {
	return babylon.parse(content, {
		sourceType: "module" // default: "script"
	});
}