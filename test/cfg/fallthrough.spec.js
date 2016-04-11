import traverse from "babel-traverse";
import {parse } from "babylon";
import { expect } from "chai";

import "./chai-path-helpe";
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

	describe("LabelStatement", () => {
		it("returns the body element", () => {
			// arrange
			const program = getPath(`
			checkiandj: while (i < 4) {
			  console.log("i: " + i);
			  i += 1;
			}`);

			const labelStatement = program.get("body")[0];
			const whileLoop = labelStatement.get("body");

			// act
			const fallthrough = computeFallThrough(labelStatement);

			// assert
			expect(fallthrough).to.equalPath(whileLoop);
		});
	});

	it("returns the fallthrough of the fallthrough", () => {
		// arrange
		const program = getPath(`
			loop1:
				for (i = 0; i < 3; i++) {
					console.log(i);
				}`);

		const labelStatement = program.get("body")[0];
		const forLoop = labelStatement.get("body");

		// act
		const fallthrough = computeFallThrough(labelStatement);

		// assert
		expect(fallthrough).to.equalPath(forLoop.get("init"));
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