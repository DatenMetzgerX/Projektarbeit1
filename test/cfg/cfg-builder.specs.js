import {parse} from "babylon";
import {assert} from "chai";

import {BRANCHES} from "../../lib/cfg/control-flow-graph";
import createControlFlowGraph from "../../lib/cfg/cfg-builder";

describe("createControlFlowGraph", function () {
	it("returns a cfg", function () {
		// act
		const {cfg} = toCfg("");

		// assert
		assert.isNotNull(cfg);
	});

	describe("ExpressionStatement", () => {
		it("creates an edge to the successor node", () => {
			// act
			const {ast, cfg} = toCfg("x++;");

			// assert
			const expression = ast.program.body[0];
			assert.isTrue(cfg.isConnected(expression, null, BRANCHES.UNCONDITIONAL));
		});
	});

	describe("VariableDeclaration", () => {
		it("creates an edge to the successor node", () => {
			const {ast, cfg} = toCfg("let x = 10;");

			// assert
			const variableDeclaration = ast.program.body[0];
			assert.isTrue(cfg.isConnected(variableDeclaration, null, BRANCHES.UNCONDITIONAL));
		});
	});

	describe("EmptyStatement", () => {
		it("creates an edge to the successor node", () => {
			const {ast, cfg} = toCfg(";");

			// assert
			const emptyStatement = ast.program.body[0];
			assert.isTrue(cfg.isConnected(emptyStatement, null, BRANCHES.UNCONDITIONAL));
		});
	});

	describe("BreakStatement", () => {
		it("creates an edge to the successor statement of the parent loop statement", () => {
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
		it("connects the first statement in the block statement as successor node", () => {
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

		it("connects the next sibling of the block statement as successor if the block statement is empty", () => {
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

	describe("IfStatement", () => {
		it("creates a conditional false branch from the if statement to following sibling node if the if statement has no else branch", function () {
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

		it("creates a conditional true branch from the if statement to the consequent body", function () {
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

		it("creates an unconditional branch from the last statement in the consequent to successor of the if statement", function () {
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

		it("creates a conditional false branch from the if statement to the else branch for an if statement with an else branch", function () {
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

		it("creates an unconditional branch from the last statement in the alternate to the successor of the if statement", function () {
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

	describe("WhileStatement", () => {
		it("connects the first statement in the while statement as successor (TRUE Branch)", () => {
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

		it("connects the successor of the while statement with a false branch", () => {
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

	describe("ForStatement", () => {
		it("connects the init statement with the for statement (which represents the condition)", () => {
			const {ast, cfg} = toCfg(`
			for (let x = 0; x < 10; ++x) {
				console.log(x);
			}
			`);

			// assert
			const forStatement = ast.program.body[0];

			assert.isTrue(cfg.isConnected(forStatement.init, forStatement, BRANCHES.UNCONDITIONAL));
		});

		it("connects the body statement of the for loop as successor of the for loop itself (TRUE Branch)", () => {
			const {ast, cfg} = toCfg(`
			for (let x = 0; x < 10; ++x) {
				console.log(x);
			}
			`);

			// assert
			const forStatement = ast.program.body[0];
			const blockStatement = forStatement.body;

			assert.isTrue(cfg.isConnected(forStatement, blockStatement, BRANCHES.TRUE));
		});

		it("connects the update statement as successor of the last statement in the body of the for loop", () => {
			const {ast, cfg} = toCfg(`
			for (let x = 0; x < 10; ++x) {
				console.log(x);
			}
			`);

			// assert
			const forStatement = ast.program.body[0];
			const assignmentStatement = forStatement.body.body[0];

			assert.isTrue(cfg.isConnected(assignmentStatement, forStatement.update, BRANCHES.UNCONDITIONAL));
		});

		it("connects the for statement with the successor of the for statement (FALSE)", () => {
			const {ast, cfg} = toCfg(`
			for (let x = 0; x < 10; ++x) {
				console.log(x);
			}
			`);

			// assert
			const forStatement = ast.program.body[0];

			assert.isTrue(cfg.isConnected(forStatement, null, BRANCHES.FALSE));
		});

		it("connects the last statement in the loop directly with the for statement and not with the update statement, if the for statement has no update statement", () => {
			const {ast, cfg} = toCfg(`
			for (;;) {
				console.log(x);
			}
			`);

			// assert
			const forStatement = ast.program.body[0];
			const expressionStatement = forStatement.body.body[0];

			assert.isTrue(cfg.isConnected(expressionStatement, forStatement, BRANCHES.UNCONDITIONAL));
			assert.isFalse(cfg.isConnected(expressionStatement, null, BRANCHES.UNCONDITIONAL));
		});

		it("does not connect the successor of the for statement as false branch of the for statement if the for statement has no condition and therefore is always true", () => {
			const {ast, cfg} = toCfg(`
			for (;;) {
				console.log(x);
			}
			x = 10;
			`);

			// assert
			const forStatement = ast.program.body[0];
			const assignment = ast.program.body[1];

			assert.isFalse(cfg.isConnected(forStatement, assignment, BRANCHES.FALSE));
		});

		it("does not connect the for statement init statement (null) with the for statement if the for statement has no init statement and therefore is null (EOF)", () => {
			const {ast, cfg} = toCfg(`
			for (;;x++) {
				console.log(x);
			}
			x = 10;
			`);

			// assert
			const forStatement = ast.program.body[0];

			assert.isFalse(cfg.isConnected(forStatement.init, forStatement, BRANCHES.UNCONDITIONAL));
		});

		it("does not connect the ForStatement update (null) with the for statement if the for statement has no update statement and therefore is null (EOF)", () => {
			const {ast, cfg} = toCfg(`
			for (let y = 0; y < 10;) {
				console.log(x);
			}
			x = 10;
			`);

			// assert
			const forStatement = ast.program.body[0];

			assert.isFalse(cfg.isConnected(forStatement.update, forStatement, BRANCHES.UNCONDITIONAL));
		});
	});

	describe("ForInStatement", () => {
		it("connects the for statement with a true branch to it's body", () => {
			const {ast, cfg} = toCfg(`
			for (let p in o) {
				console.log(p);
			}
			`);

			// assert
			const forInStatement = ast.program.body[0];

			assert.isTrue(cfg.isConnected(forInStatement, forInStatement.body, BRANCHES.TRUE));
		});

		it("connects the for statement with a false branch to it's successor", () => {
			const {ast, cfg} = toCfg(`
			for (let p in o) {
				console.log(p);
			}
			console.log("end");
			`);

			// assert
			const forInStatement = ast.program.body[0];
			const endStatement = ast.program.body[1];

			assert.isTrue(cfg.isConnected(forInStatement, endStatement, BRANCHES.FALSE));
		});
	});

	describe("ForOfStatement", () => {
		it("connects the for statement with a true branch to it's body", () => {
			const {ast, cfg} = toCfg(`
			for (let p of o) {
				console.log(p);
			}
			`);

			// assert
			const forOfStatement = ast.program.body[0];

			assert.isTrue(cfg.isConnected(forOfStatement, forOfStatement.body, BRANCHES.TRUE));
		});

		it("connects the for statement with a false branch to it's successor", () => {
			const {ast, cfg} = toCfg(`
			for (let p of o) {
				console.log(p);
			}
			console.log("end");
			`);

			// assert
			const forOfStatement = ast.program.body[0];
			const endStatement = ast.program.body[1];

			assert.isTrue(cfg.isConnected(forOfStatement, endStatement, BRANCHES.FALSE));
		});
	});

	describe("DoWhileStatement", () => {
		it("connects the do while statement with a true branch to it's body", () => {
			const {ast, cfg} = toCfg(`
			do {
				console.log(p++);
			} while (p < 10);
			`);

			// assert
			const doWhileStatement = ast.program.body[0];

			assert.isTrue(cfg.isConnected(doWhileStatement, doWhileStatement.body, BRANCHES.TRUE));
		});

		it("connects the do while statement with a false branch to it's successor", () => {
			const {ast, cfg} = toCfg(`
			do {
				console.log(p++);
			} while (p < 10);
			console.log("end");
			`);

			// assert
			const doWhileStatement = ast.program.body[0];
			const endStatement = ast.program.body[1];

			assert.isTrue(cfg.isConnected(doWhileStatement, endStatement, BRANCHES.FALSE));
		});
	});
});

function toCfg (code) {
	const ast = parse(code);

	return { cfg: createControlFlowGraph(ast), ast: ast};
}