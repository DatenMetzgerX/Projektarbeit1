import {parse} from "babylon";
import {assert} from "chai";

import {BRANCHES} from "../../src/cfg/control-flow-graph";
import createControlFlowGraph from "../../src/cfg/cfg-builder";

describe("createControlFlowGraph", function () {
	it("returns a cfg", function () {
		// act
		const {cfg} = toCfg("");

		// assert
		assert.isNotNull(cfg);
	});

	describe("ExpressionStatement", () => {
		it("creates an edge to the next sibling statement as successor", () => {
			// act
			const {ast, cfg} = toCfg("x++;");

			// assert
			const expression = ast.program.body[0];
			assert.isTrue(cfg.isConnected(expression, null, BRANCHES.UNCONDITIONAL));
		});
	});

	describe("VariableDeclaration", () => {
		it("creates an edge to the next sibling statement as successor", () => {
			const {ast, cfg} = toCfg("let x = 10;");

			// assert
			const variableDeclaration = ast.program.body[0];
			assert.isTrue(cfg.isConnected(variableDeclaration, null, BRANCHES.UNCONDITIONAL));
		});
	});

	describe("EmptyStatement", () => {
		it("creates an edge to the next sibling statement as successor", () => {
			const {ast, cfg} = toCfg(";");

			// assert
			const emptyStatement = ast.program.body[0];
			assert.isTrue(cfg.isConnected(emptyStatement, null, BRANCHES.UNCONDITIONAL));
		});
	});

	describe("BreakStatement", () => {
		it("creates an edge to the next sibling statement of the parent loop statement", () => {
			const {ast, cfg} = toCfg(`
				for (let i = 0; i < 10; ++i) {
					if (y) {
						break;
					}
					console.log(y);
				}
			`);

			// assert
			const breakStatement = ast.program.body[0].body.body[0].consequent.body[0];
			assert.isTrue(cfg.isConnected(breakStatement, null, BRANCHES.UNCONDITIONAL));
		});
	});

	describe("ContinueStatement", () => {
		it("creates an edge to the direct parent loop statement", () => {
			const {ast, cfg} = toCfg(`
			for (let i = 0; i < 10; ++i) {
				if (y) {
					continue;
				}
				console.log(y);
			}
			`);

			// assert
			const forLoop = ast.program.body[0];
			const continueStatement = forLoop.body.body[0].consequent.body[0];
			assert.isTrue(cfg.isConnected(continueStatement, forLoop, BRANCHES.UNCONDITIONAL));
		});
	});

	describe("BlockStatement", () => {
		it("connects the first statement in the block statement as direct successor", () => {
			const {ast, cfg} = toCfg(`
			{
				const x = 10;
			}
			`);

			// assert
			const blockStatement = ast.program.body[0];
			const assignment = blockStatement.body[0];
			assert.isTrue(cfg.isConnected(blockStatement, assignment, BRANCHES.UNCONDITIONAL));
		});

		it("connects the next sibling of the block statement as direct successor if the block statement is empty", () => {
			const {ast, cfg} = toCfg(`
			{
			}
			const x = 10;
			`);

			// assert
			const blockStatement = ast.program.body[0];
			const assignment = ast.program.body[1];
			assert.isTrue(cfg.isConnected(blockStatement, assignment, BRANCHES.UNCONDITIONAL));
		});
	});

	describe("IfStatement", function () {
		it("creates a conditional Branch from the if statement to following sibling node if the if statement has no else branch", function () {
			// act
			const {ast, cfg} = toCfg(`
			let x = 0;
			if (x < 10) {
				x = 9;
			}
			`);

			// assert
			const ifStatement = ast.program.body[1];
			assert.isTrue(cfg.isConnected(ifStatement, null, BRANCHES.FALSE), "The if statement should have a edge to the following sibling node for the case the condition is false.");
		});

		it("creates a conditional Branch from the if statement to the consequent body of the if statement", function () {
			// act
			const {ast, cfg} = toCfg(`
			let x = 0;
			if (x < 10) {
				x = 9;
			}
			`);

			// assert
			const ifStatement = ast.program.body[1];
			assert.isTrue(cfg.isConnected(ifStatement, ifStatement.consequent, BRANCHES.TRUE));
		});

		it("creates an unconditional branch from the last statement in the consequent to the following node of the if statement", function () {
			// act
			const {ast, cfg} = toCfg(`
			let x = 0;
			if (x < 10) {
				x = 9;
			}
			`);

			// assert
			const ifStatement = ast.program.body[1];
			assert.isTrue(cfg.isConnected(ifStatement.consequent.body[0], null, BRANCHES.UNCONDITIONAL));
		});

		it("creates a conditional Branch from the if statement to the else branch for an if statement with an else branch", function () {
			// act
			const {ast, cfg} = toCfg(`
			let x = 0;
			if (x < 10) {
				x = 9;
			} else {
				x = 8;
			}
			`);

			// assert
			const ifStatement = ast.program.body[1];
			assert.isTrue(cfg.isConnected(ifStatement, ifStatement.alternate, BRANCHES.FALSE));
			assert.isFalse(cfg.isConnected(ifStatement, null));
		});

		it("creates an unconditional branch from the last statement in the alternate to the following node of the if statement", function () {
			// act
			const {ast, cfg} = toCfg(`
			let x = 0;
			if (x < 10) {
				x = 9;
			} else {
				x = 8;
			}
			`);

			// assert
			const ifStatement = ast.program.body[1];
			assert.isTrue(cfg.isConnected(ifStatement.alternate.body[0], null, BRANCHES.UNCONDITIONAL));
		});
	});

	describe("WhileStatement", function () {
		it("connects the first statement in the while statement as direct successor with the while statement (TRUE Branch)", () => {
			const {ast, cfg} = toCfg(`
			while (x < 10) {
				++x;
			}
			`);

			// assert
			const whileStatement = ast.program.body[0];
			const blockStatement = whileStatement.body;

			assert.isTrue(cfg.isConnected(whileStatement, blockStatement, BRANCHES.TRUE));
		});

		it("connects the next statement following the while statement as direct successor of the while statement (FALSE Branch)", () => {
			const {ast, cfg} = toCfg(`
			while (x < 10) {
				++x;
			}
			`);

			// assert
			const whileStatement = ast.program.body[0];

			assert.isTrue(cfg.isConnected(whileStatement, null, BRANCHES.FALSE));
		});
	});
});

function toCfg (code) {
	const ast = parse(code);

	return { cfg: createControlFlowGraph(ast), ast: ast};
}