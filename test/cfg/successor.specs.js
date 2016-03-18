import {assert} from "chai";
import traverse from "babel-traverse";
import {parse} from "babylon";
import computeSuccessor from "../../lib/cfg/successor";

describe("computeSuccessor", () => {
	describe("Statement", () => {
		it("returns the directly following statement by default", () => {
			// arrange
			const path = getPath(`
			let x = 10;
			++x;
			`);

			// act
			const successor = computeSuccessor(path.get("body")[0]);

			// assert
			assert.equal(successor, path.get("body")[1]);
		});

		it("returns null (EOF) when the statement is the last in the program", () => {
			// arrange
			const path = getPath(`
			let x = 10;
			`);

			// act
			const successor = computeSuccessor(path.get("body")[0]);

			// assert
			assert.isNull(successor);
		});

		it("returns the successor of the parent node, if the statement is the last on it's level (e.g. inside a block statement)", () => {
			// arrange
			const path = getPath(`
			{
				let x = 10;
			}
			++x;
			`);

			const blockStatement = path.get("body")[0];
			const declaration = blockStatement.get("body")[0];

			// act
			const successor = computeSuccessor(declaration);

			// assert
			assert.equal(successor, path.get("body")[1]);
		});
	});

	describe("LoopStatement", () => {

		it("returns the initial statement of a for loop when the following statement is a for loop.", () => {
			// arrange
			const path = getPath(`
			let x = 10;
			for (let i = 0; i < 10; ++i) {
				x = Math.pow(x, i);
			}
			`);

			const assignment = path.get("body")[0];
			const forStatement = path.get("body")[1];
			const initStatement = forStatement.get("init");

			// act
			const successor = computeSuccessor(assignment);

			// assert
			assert.equal(successor, initStatement);
		});

		it("returns the successor of the loop when a break statement is passed to the function", () => {
			// arrange
			const path = getPath(`
			for (let i = 0; i < 10; ++i) {
				if (x > 1000) 
					break;
				
				x = Math.pow(x, i);
			}
			console.log(x);
			`);

			const forStatement = path.get("body")[0];
			const ifStatement = forStatement.get("body.body")[0];
			const breakStatement = ifStatement.get("consequent");
			const logStatement = path.get("body")[1];

			// act
			const successor = computeSuccessor(breakStatement);

			// assert
			assert.equal(successor, logStatement);
		});

		it("returns the loop when a continue statement is passed to the function", () => {
			// arrange
			const path = getPath(`
			for (let i = 0; i < 10; ++i) {
				if (x > 1000) 
					continue;
				
				x = Math.pow(x, i);
			}
			`);

			const forStatement = path.get("body")[0];
			const ifStatement = forStatement.get("body.body")[0];
			const continueStatement = ifStatement.get("consequent");

			// act
			const successor = computeSuccessor(continueStatement);

			// assert
			assert.equal(successor, forStatement);
		});
	});

	describe("WhileStatement", () => {
		it("returns the while statement when the statement is the last inside the while loop", () => {
			// arrange
			const path = getPath(`
			while (x < 1000)
				x = Math.pow(x, i);
			const y = x / 2;
			`);

			const whileStatement = path.get("body")[0];
			const assignment = whileStatement.get("body");

			// act
			const successor = computeSuccessor(assignment);

			// assert
			assert.equal(successor, whileStatement);
		});
	});

	describe("ForStatement", () => {
		it("returns the update statement of the for loop when the statement is the last of the for loop", () => {
			// arrange
			const path = getPath(`
			for (let i = 0; i < y; ++i)
				x = Math.pow(x, i);
			`);

			const forStatement = path.get("body")[0];
			const updateStatement = forStatement.get("update");
			const assignment = forStatement.get("body");

			// act
			const successor = computeSuccessor(assignment);

			// assert
			assert.equal(successor, updateStatement);
		});

		it("returns the loop statement for the last statement in the loop if the for loop has no update statement", () => {
			// arrange
			const path = getPath(`
			for (let i = 0; i < y;)
				x = Math.pow(x, i);
			`);

			const forStatement = path.get("body")[0];
			const assignment = forStatement.get("body");

			// act
			const successor = computeSuccessor(assignment);

			// assert
			assert.equal(successor, forStatement);
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