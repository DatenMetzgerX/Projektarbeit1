import {expect} from "chai";
import traverse from "babel-traverse";
import {parse} from "babylon";
import "./chai-path-helper";
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
			expect(successor).to.equalPath(path.get("body")[1]);
		});

		it("returns null (EOF) when the statement is the last in the program", () => {
			// arrange
			const path = getPath(`
			let x = 10;
			`);

			// act
			const successor = computeSuccessor(path.get("body")[0]);

			// assert
			expect(successor).to.be.null;
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
			expect(successor).to.equalPath(path.get("body")[1]);
		});
	});

	describe("BreakStatement", () => {
		it("returns the successor of the loop for a break statement inside a loop", () => {
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
			expect(successor).to.equalPath(logStatement);
		});

		it("returns the successor of the switch statement if a break statement is used inside a switch", function () {
			// arrange
			const path = getPath(`
			switch (x) {
				case "a":
				    y = 0;
					break;
				
				default:
					y = 10;
			}
			console.log(x);
			`);

			const switchStatement = path.get("body")[0];
			const caseA = switchStatement.get("cases")[0];
			const breakStatement = caseA.get("consequent")[1];
			const logStatement = path.get("body")[1];

			// act
			const successor = computeSuccessor(breakStatement);

			// assert
			expect(successor).to.equalPath(logStatement);
		});
	});

	describe("ContinueStatement", () => {
		it("returns the loop for a continue statement inside a loop", () => {
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
			expect(successor).to.equalPath(forStatement);
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
			expect(successor).to.equalPath(initStatement);
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
			expect(successor).to.equalPath(whileStatement);
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
			expect(successor).to.equalPath(updateStatement);
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
			expect(successor).to.equalPath(forStatement);
		});
	});

	describe("DoWhileStatement", () => {
		it("returns the do while statement as successor of the last statement in a do while loop", () => {
			// arrange
			const path = getPath(`
			do 
				x = Math.pow(x, i);
			while (x < 10);
			`);

			const doWhileStatement = path.get("body")[0];
			const assignment = doWhileStatement.get("body");

			// act
			const successor = computeSuccessor(assignment);

			// assert
			expect(successor).to.equalPath(doWhileStatement);
		});
	});

	describe("SwitchCase", () => {
		it("returns the next statement for the same consequent", () => {
			// arrange
			const path = getPath(`
			switch (x) {
			case "A":
				y = 1;
				z = 2;
			case "B":
			}
			`);

			const switchStatement = path.get("body")[0];
			const caseA = switchStatement.get("cases")[0];

			// act
			const successor = computeSuccessor(caseA.get("consequent")[0]);

			// assert
			expect(successor).to.equalPath(caseA.get("consequent")[1]);
		});

		it("returns the consequent of the next case statement for the last statement in a SwitchCase", () => {
			// arrange
			const path = getPath(`
			switch (x) {
			case "A":
				y = 1;
			case "B":
				y = 2;
			}
			`);

			const switchStatement = path.get("body")[0];
			const caseA = switchStatement.get("cases")[0];
			const caseB = switchStatement.get("cases")[1];

			// act
			const successor = computeSuccessor(caseA.get("consequent")[0]);

			// assert
			expect(successor).to.equalPath(caseB.get("consequent")[0]);
		});

		it("returns the successor of the switch statement if it is the last statement in a consequent", () => {
			// arrange
			const path = getPath(`
			switch (x) {
			case "A":
				y = 1;
			}
			console.log("B");
			`);

			const switchStatement = path.get("body")[0];
			const caseA = switchStatement.get("cases")[0];
			const logStatement = path.get("body")[1];

			// act
			const successor = computeSuccessor(caseA.get("consequent")[0]);

			// assert
			expect(successor).to.equalPath(logStatement);
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