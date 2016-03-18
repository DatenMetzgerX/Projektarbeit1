import traverse from "babel-traverse";
import {parse } from "babylon";
import { assert } from "chai";

import computeFallThrough from "../../lib/cfg/fallthrough";

describe("computeFallthrough", () => {
	describe("ForStatement", () => {
		it("returns the init statement of the for loop", () => {
			// arrange
			const program = getPath(`
			for (let x = 0; x<10; ++x) {
				console.log(x);
			}`);

			const forStatement = program.get("body")[0];

			// act
			const fallthrough = computeFallThrough(forStatement);

			// assert
			assert.equal(fallthrough, forStatement.get("init"));
		});

		it("returns the for statement if the for statement has no init", () => {
			// arrange
			const program = getPath(`
			for (; x<10; ++x) {
				console.log(x);
			}`);

			const forStatement = program.get("body")[0];

			// act
			const fallthrough = computeFallThrough(forStatement);

			// assert
			assert.equal(fallthrough, forStatement);
		});
	});
});

function getPath (code) {
	let _path;

	const ast = parse(code);
	traverse(ast, {
		Program: function (path) {
			_path = path;
			path.stop();
		}
	});

	return _path;
}