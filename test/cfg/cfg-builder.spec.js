import {parse} from "babylon";
import traverse from "babel-traverse";
import {expect} from "chai";

import {BRANCHES} from "../../lib/cfg/control-flow-graph";
import CfgBuilder from "../../lib/cfg/cfg-builder";
import {createTraverseVisitorWrapper} from "../../lib/util";

describe("CfgBuilder", function () {
	it("returns a cfg", function () {
		// act
		const {cfg} = toCfg("");

		// assert
		expect(cfg).not.to.be.null;
	});

	describe("ExpressionStatement", function () {
		it("creates an edge to the successor node", () => {
			// act
			const {ast, cfg} = toCfg("x++;");

			// assert
			const expression = ast.program.body[0];
			expect(cfg.isConnected(expression, null, BRANCHES.UNCONDITIONAL)).to.be.true;
		});
	});

	describe("VariableDeclaration", function () {
		it("creates an edge to the successor node", () => {
			const {ast, cfg} = toCfg("let x = 10;");

			// assert
			const variableDeclaration = ast.program.body[0];
			expect(cfg.isConnected(variableDeclaration, null, BRANCHES.UNCONDITIONAL)).to.be.true;
		});
	});

	describe("EmptyStatement", function () {
		it("skips an empty statement", () => {
			const {ast, cfg} = toCfg("let x = 10;;x++");

			// assert
			const declaration = ast.program.body[0];
			const emptyStatement = ast.program.body[1];
			const update = ast.program.body[2];
			expect(cfg.getNode(emptyStatement)).to.be.undefined;
			expect(cfg.isConnected(declaration, update, BRANCHES.UNCONDITIONAL)).to.be.true;
		});
	});

	describe("BreakStatement", function () {
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
			expect(cfg.isConnected(breakStatement, null, BRANCHES.UNCONDITIONAL)).to.be.true;
		});

		it("fails if a break statement is used inside of try finally", function () {
			expect(() => toCfg(`
			while(true) {
				try {
					break;
				} finally {
					console.log("A");
				}
			}
			`)).to.throw();
		});
	});

	describe("ContinueStatement", function () {
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
			expect(cfg.isConnected(continueStatement, forLoop, BRANCHES.UNCONDITIONAL)).to.be.true;
		});

		it("fails if a continue statement is used inside of try finally", function () {
			expect(() => toCfg(`
			while (true) {
				try {
					continue;
				} finally {
					console.log("A");
				}
			}
			`)).to.throw();
		});
	});

	describe("BlockStatement", function () {
		it("connects the first statement in the block statement as successor node", () => {
			const {ast, cfg} = toCfg(`
			{
				const x = 10;
			}
			`);

			// assert
			const blockStatement = ast.program.body[0];
			const assignment = blockStatement.body[0];
			expect(cfg.isConnected(blockStatement, assignment, BRANCHES.UNCONDITIONAL)).to.be.true;
		});

		it("connects the block statement with a function declaration, if the function declaration is the first statement in the block", function () {
			const {ast, cfg} = toCfg(`
			{
				function hy () {
					console.log("Hello world");
				}
				const x = 10;
			}
			`);

			// assert
			const blockStatement = ast.program.body[0];
			const functionDeclaration = blockStatement.body[0];
			expect(cfg.isConnected(blockStatement, functionDeclaration, BRANCHES.UNCONDITIONAL)).to.be.true;
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
			expect(cfg.isConnected(blockStatement, assignment, BRANCHES.UNCONDITIONAL)).to.be.true;
		});
	});

	describe("IfStatement", function () {
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
			expect(cfg.isConnected(ifStatement, null, BRANCHES.FALSE)).to.be.true;
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
			expect(cfg.isConnected(ifStatement, ifStatement.consequent, BRANCHES.TRUE)).to.be.true;
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
			expect(cfg.isConnected(ifStatement.consequent.body[0], null, BRANCHES.UNCONDITIONAL)).to.be.true;
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
			expect(cfg.isConnected(ifStatement, ifStatement.alternate, BRANCHES.FALSE)).to.be.true;
			expect(cfg.isConnected(ifStatement, null)).to.be.false;
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
			expect(cfg.isConnected(ifStatement.alternate.body[0], null, BRANCHES.UNCONDITIONAL)).to.be.true;
		});
	});

	describe("WhileStatement", function () {
		it("connects the first statement in the while statement as successor (TRUE Branch)", () => {
			const {ast, cfg} = toCfg(`
			while (x < 10) {
				++x;
			}
			`);

			// assert
			const whileStatement = ast.program.body[0];
			const blockStatement = whileStatement.body;

			expect(cfg.isConnected(whileStatement, blockStatement, BRANCHES.TRUE)).to.be.true;
		});

		it("connects the successor of the while statement with a false branch", () => {
			const {ast, cfg} = toCfg(`
			while (x < 10) {
				++x;
			}
			`);

			// assert
			const whileStatement = ast.program.body[0];

			expect(cfg.isConnected(whileStatement, null, BRANCHES.FALSE)).to.be.true;
		});
	});

	describe("ForStatement", function () {
		it("connects the init statement with the for statement (which represents the condition)", () => {
			const {ast, cfg} = toCfg(`
			for (let x = 0; x < 10; ++x) {
				console.log(x);
			}
			`);

			// assert
			const forStatement = ast.program.body[0];

			expect(cfg.isConnected(forStatement.init, forStatement, BRANCHES.UNCONDITIONAL)).to.be.true;
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

			expect(cfg.isConnected(forStatement, blockStatement, BRANCHES.TRUE)).to.be.true;
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

			expect(cfg.isConnected(assignmentStatement, forStatement.update, BRANCHES.UNCONDITIONAL)).to.be.true;
		});

		it("connects the for statement with the successor of the for statement (FALSE)", () => {
			const {ast, cfg} = toCfg(`
			for (let x = 0; x < 10; ++x) {
				console.log(x);
			}
			`);

			// assert
			const forStatement = ast.program.body[0];

			expect(cfg.isConnected(forStatement, null, BRANCHES.FALSE)).to.be.true;
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

			expect(cfg.isConnected(expressionStatement, forStatement, BRANCHES.UNCONDITIONAL)).to.be.true;
			expect(cfg.isConnected(expressionStatement, null, BRANCHES.UNCONDITIONAL)).to.be.false;
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

			expect(cfg.isConnected(forStatement, assignment, BRANCHES.FALSE)).to.be.false;
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

			expect(cfg.isConnected(forStatement.init, forStatement, BRANCHES.UNCONDITIONAL)).to.be.false;
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

			expect(cfg.isConnected(forStatement.update, forStatement, BRANCHES.UNCONDITIONAL)).to.be.false;
		});
	});

	describe("ForInStatement", function () {
		it("connects the for statement with a true branch to it's body", () => {
			const {ast, cfg} = toCfg(`
			for (let p in o) {
				console.log(p);
			}
			`);

			// assert
			const forInStatement = ast.program.body[0];

			expect(cfg.isConnected(forInStatement, forInStatement.body, BRANCHES.TRUE)).to.be.true;
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

			expect(cfg.isConnected(forInStatement, endStatement, BRANCHES.FALSE)).to.be.true;
		});
	});

	describe("ForOfStatement", function () {
		it("connects the for statement with a true branch to it's body", () => {
			const {ast, cfg} = toCfg(`
			for (let p of o) {
				console.log(p);
			}
			`);

			// assert
			const forOfStatement = ast.program.body[0];

			expect(cfg.isConnected(forOfStatement, forOfStatement.body, BRANCHES.TRUE)).to.be.true;
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

			expect(cfg.isConnected(forOfStatement, endStatement, BRANCHES.FALSE)).to.be.true;
		});
	});

	describe("DoWhileStatement", function () {
		it("connects the do while statement with a true branch to it's body", () => {
			const {ast, cfg} = toCfg(`
			do {
				console.log(p++);
			} while (p < 10);
			`);

			// assert
			const doWhileStatement = ast.program.body[0];

			expect(cfg.isConnected(doWhileStatement, doWhileStatement.body, BRANCHES.TRUE)).to.be.true;
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

			expect(cfg.isConnected(doWhileStatement, endStatement, BRANCHES.FALSE)).to.be.true;
		});
	});

	describe("SwitchStatement", function () {
		it("connects the switch statement with the first case statement", () => {
			const {ast, cfg} = toCfg(`
			switch (x) {
				case "A":
					y = 2;
				default:
					y = null;
			}
			`);

			// assert
			const switchStatement = ast.program.body[0];
			const firstCase = switchStatement.cases[0];

			expect(cfg.isConnected(switchStatement, firstCase, BRANCHES.UNCONDITIONAL)).to.be.true;
		});

		it("connects the switch statement with the first case statement even when the default statement is first in order", () => {
			const {ast, cfg} = toCfg(`
			switch (x) {
				default:
					y = null;
				case "A":
					y = 2;
			}
			`);

			// assert
			const switchStatement = ast.program.body[0];
			const defaultStatement = switchStatement.cases[0];
			const firstCase = switchStatement.cases[1];

			expect(cfg.isConnected(switchStatement, defaultStatement, BRANCHES.UNCONDITIONAL)).to.be.false;
			expect(cfg.isConnected(switchStatement, firstCase, BRANCHES.UNCONDITIONAL)).to.be.true;
		});

		it("connects the switch statement with it's successor and not with null (first case) if the switch statement has no cases", () => {
			const {ast, cfg} = toCfg(`
			switch (x) {
			}
			
			console.log(x);
			`);

			// assert
			const switchStatement = ast.program.body[0];
			const logStatement = ast.program.body[1];

			expect(cfg.isConnected(switchStatement, null, BRANCHES.UNCONDITIONAL)).to.be.false;
			expect(cfg.isConnected(switchStatement, logStatement, BRANCHES.UNCONDITIONAL)).to.be.true;
		});
	});

	describe("SwitchCase", function () {
		it("connects the case with a true branch to it's consequent", () => {
			const {ast, cfg} = toCfg(`
			switch (x) {
				case "A":
					y = 2;
				default:
					y = null;
			}
			`);

			// assert
			const switchStatement = ast.program.body[0];
			const firstCase = switchStatement.cases[0];

			expect(cfg.isConnected(firstCase, firstCase.consequent[0], BRANCHES.TRUE)).to.be.true;
		});

		it("connects the case with a false branch to the next case", () => {
			const {ast, cfg} = toCfg(`
			switch (x) {
				case "A":
					y = 2;
				default:
					y = null;
			}
			`);

			// assert
			const switchStatement = ast.program.body[0];
			const firstCase = switchStatement.cases[0];
			const defaultCase = switchStatement.cases[1];

			expect(cfg.isConnected(firstCase, defaultCase, BRANCHES.FALSE)).to.be.true;
		});

		it("connects the case with a false branch to the successor of the switch statement if it is the last case in the switch", () => {
			const {ast, cfg} = toCfg(`
			switch (x) {
				case "A":
					y = 2;
			}
			console.log("A");
			`);

			// assert
			const switchStatement = ast.program.body[0];
			const caseA = switchStatement.cases[0];
			const logStatement = ast.program.body[1];

			expect(cfg.isConnected(caseA, logStatement, BRANCHES.FALSE)).to.be.true;
		});

		it("connects the case with a false branch to the next case even when default is the next 'case' in order", () => {
			const {ast, cfg} = toCfg(`
			switch (x) {
				case "A":
					y = 2;
				default:
					y = null;
				case "B":
					y = 3;
			}
			`);

			// assert
			const switchStatement = ast.program.body[0];
			const firstCase = switchStatement.cases[0];
			const defaultCase = switchStatement.cases[1];
			const secondCase = switchStatement.cases[2];

			expect(cfg.isConnected(firstCase, defaultCase, BRANCHES.FALSE)).to.be.false;
			expect(cfg.isConnected(firstCase, secondCase, BRANCHES.FALSE)).to.be.true;
		});

		it("connects the case with a false branch to the default case the case is the last in order", () => {
			const {ast, cfg} = toCfg(`
			switch (x) {
				case "A":
					y = 2;
				default:
					y = null;
				case "B":
					y = 3;
			}
			`);

			// assert
			const switchStatement = ast.program.body[0];

			const defaultCase = switchStatement.cases[1];
			const secondCase = switchStatement.cases[2];

			expect(cfg.isConnected(secondCase, defaultCase, BRANCHES.FALSE)).to.be.true;
		});

		it("connects the default case consequent with an unconditional branch", () => {
			const {ast, cfg} = toCfg(`
			switch (x) {
				case "A":
					y = 2;
				default:
					y = null;
			}
			`);

			// assert
			const switchStatement = ast.program.body[0];
			const defaultCase = switchStatement.cases[1];

			expect(cfg.isConnected(defaultCase, defaultCase.consequent[0], BRANCHES.UNCONDITIONAL)).to.be.true;
		});

		it("does not connect the default case with a false branch to any following case statements", () => {
			const {ast, cfg} = toCfg(`
			switch (x) {
				default:
					y = null;
				case "A":
					y = 2;
			}
			`);

			// assert
			const switchStatement = ast.program.body[0];
			const defaultCase = switchStatement.cases[0];
			const secondCase = switchStatement.cases[1];

			expect(cfg.isConnected(defaultCase, secondCase, BRANCHES.FALSE)).to.be.false;
		});

		it("connects the case without a consequent to the consequent of a following case statement", () => {
			const {ast, cfg} = toCfg(`
			switch (x) {
				case "A":
				default:
					y = null;
			}
			`);

			// assert
			const switchStatement = ast.program.body[0];
			const firstCase = switchStatement.cases[0];
			const defaultCase = switchStatement.cases[1];

			expect(cfg.isConnected(firstCase, defaultCase.consequent[0], BRANCHES.TRUE)).to.be.true;
		});

		it("connects the successor statement of the switch case as true branch for a case without a consequent and any following cases without a consequent", () => {
			const {ast, cfg} = toCfg(`
			switch (x) {
				case "A":
				default:
			}
			console.log(y);
			`);

			// assert
			const switchStatement = ast.program.body[0];
			const firstCase = switchStatement.cases[0];
			const logStatement = ast.program.body[1];

			expect(cfg.isConnected(firstCase, null, BRANCHES.TRUE)).to.be.false;
			expect(cfg.isConnected(firstCase, logStatement, BRANCHES.TRUE)).to.be.true;
		});
	});

	describe("FunctionDeclaration", function () {
		it("connects the function declaration with the successor statement", function () {
			const {ast, cfg} = toCfg(`
			function x (z) {
				console.log(z);
			}
			let y = 10;
			`);

			// assert
			const functionStatement = ast.program.body[0];

			expect(cfg.isConnected(functionStatement, ast.program.body[1], BRANCHES.UNCONDITIONAL)).to.be.true;
		});

		it("connects the last statement in the function body with the EOF node", function () {
			const {ast, cfg} = toCfg(`
			function x (z) {
				console.log(z);
			}
			let y = 10;
			`);

			// assert
			const functionStatement = ast.program.body[0];
			expect(cfg.isConnected(functionStatement.body.body[0], null, BRANCHES.UNCONDITIONAL)).to.be.true;
		});
	});

	describe("ReturnStatement", function () {
		it("returns null as successor", function () {
			//
			const { ast, cfg } = toCfg(`
			function x() {
				return 10;
				console.log("A");
			}
			console.log("B");
			`);

			// assert
			const functionDeclaration = ast.program.body[0];
			const returnStatement = functionDeclaration.body.body[0];
			const logStatement = functionDeclaration.body.body[1];

			expect(cfg.isConnected(returnStatement, logStatement, BRANCHES.UNCONDITIONAL)).to.be.false;
			expect(cfg.isConnected(returnStatement, null, BRANCHES.UNCONDITIONAL)).to.be.true;
		});

		it("fails if a return statement is used inside of try finally", function () {
			expect(() => toCfg(`
			function x() {
				try {
					return 10;
				} finally {
					console.log("A");
				}
			}
			`)).to.throw();
		});
	});

	describe("TryStatement", function () {
		it("connects the try statement with the block", () => {
			// act
			const { ast, cfg } = toCfg(`
			try {
				callZ();
			} catch (e) {
				console.log(e);
			} 
			`);

			// assert
			const tryStatement = ast.program.body[0];

			expect(cfg.isConnected(tryStatement, tryStatement.block, BRANCHES.UNCONDITIONAL)).to.be.true;
		});

		it("adds an exception connection from a call expression inside the try block to the exception handler", function () {
			// act
			const { ast, cfg } = toCfg(`
			try {
				callZ();
			} catch (e) {
				console.log(e);
			} 
			`);

			// assert
			const tryStatement = ast.program.body[0];
			const callStatement = tryStatement.block.body[0];
			const catchStatement = tryStatement.handler;

			expect(cfg.isConnected(callStatement, null, BRANCHES.UNCONDITIONAL)).to.be.true;
			expect(cfg.isConnected(callStatement, catchStatement, BRANCHES.EXCEPTION)).to.be.true;
		});

		it("does not add exception connection handler for statements in the catch block", function () {
			// act
			const { ast, cfg } = toCfg(`
			try {
				callZ();
			} catch (e) {
				console.log(e);
			} 
			`);

			// assert
			const tryStatement = ast.program.body[0];
			const catchStatement = tryStatement.handler;
			const logStatement = catchStatement.body.body[0];

			expect(cfg.isConnected(logStatement, catchStatement)).to.be.false;
		});

		it("Adds exception connection to statements in a finally clause if this is part of another try catch statement", function () {
			// act
			const { ast, cfg } = toCfg(`
			try {
				try {
					callZ();
				} finally {
					console.log(e);
				}
			} catch (y) {
				console.log(x);
			}
			`);

			// assert
			const outerTryStatement = ast.program.body[0];
			const outerCatchStatement = outerTryStatement.handler;
			const innerTryStatement = outerTryStatement.block.body[0];
			const innerFinallyStatement = innerTryStatement.finalizer;
			const innerLogStatement = innerFinallyStatement.body[0];

			expect(cfg.isConnected(innerLogStatement, outerCatchStatement, BRANCHES.EXCEPTION)).to.be.true;
		});
	});

	describe("CatchClause", function () {
		it("connects the catch clause with it's body", function () {
			// act
			const { ast, cfg } = toCfg(`
			try {
				callZ();
			} catch (e) {
				console.log(e);
			} 
			`);

			// assert
			const tryStatement = ast.program.body[0];
			const catchStatement = tryStatement.handler;

			expect(cfg.isConnected(catchStatement, catchStatement.body, BRANCHES.UNCONDITIONAL)).to.be.true;
		});

		it("Adds exception connection to statements in a catch clause if this is part of another try catch statement", function () {
			// act
			const { ast, cfg } = toCfg(`
			try {
				try {
					callZ();
				} catch (e) {
					console.log(e);
				}
			} catch (y) {
				console.log(x);
			}
			`);

			// assert
			const outerTryStatement = ast.program.body[0];
			const outerCatchStatement = outerTryStatement.handler;
			const innerTryStatement = outerTryStatement.block.body[0];
			const innerCatchStatement = innerTryStatement.handler;
			const innerLogStatement = innerCatchStatement.body.body[0];

			expect(cfg.isConnected(innerLogStatement, outerCatchStatement, BRANCHES.EXCEPTION)).to.be.true;
		});
	});
});

function toCfg (code) {
	const ast = parse(code);

	const builder = new CfgBuilder(ast);
	traverse(ast, createTraverseVisitorWrapper(builder));

	return { cfg: ast.cfg, ast: ast};
}
