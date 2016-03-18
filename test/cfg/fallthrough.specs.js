import traverse from "babel-traverse";
import {parse } from "babylon";
import { expect } from "chai";

import "./chai-path-helper";
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
			expect(fallthrough).to.equalPath(forStatement.get("init"));
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
			expect(fallthrough).to.equalPath(forStatement);
		});
	});

	describe("DoWhileStatement", () => {
		it("returns the body of the do while statement", () => {
			// arrange
			const program = getPath(`
			do {
				++x;
			} while (x < 10)`);

			const doWhileStatement = program.get("body")[0];

			// act
			const fallthrough = computeFallThrough(doWhileStatement);

			// assert
			expect(fallthrough).to.equalPath(doWhileStatement.get("body"));
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