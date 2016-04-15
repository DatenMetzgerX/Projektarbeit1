import sinon from "sinon";
import {WorkListDataFlowAnalysis} from "../../lib/data-flow-analysis/work-list-data-flow-analysis";
import {ControlFlowGraph, BRANCHES} from "../../lib/cfg/control-flow-graph";

describe("WorkListDataFlowAnalysis", function () {
	let sandbox, analysis, cfg;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		cfg = new ControlFlowGraph();

		analysis = new WorkListDataFlowAnalysis();
	});

	describe("analyse", function () {
		it("calls the transfer function for each node", function () {
			// arrange
			const functionDeclaration = "function () {";
			const variableDeclarator = "let x = 10;";
			const variableDeclarator2 = "let y = 19";
			const returnStatement = "return x + y;";

			cfg.connectIfNotFound(functionDeclaration, BRANCHES.UNCONDITIONAL, variableDeclarator);
			cfg.connectIfNotFound(variableDeclarator, BRANCHES.UNCONDITIONAL, variableDeclarator2);
			cfg.connectIfNotFound(variableDeclarator2, BRANCHES.UNCONDITIONAL, returnStatement);
			cfg.connectIfNotFound(returnStatement, BRANCHES.UNCONDITIONAL, null);

			sandbox.stub(analysis, "createEmptyLattice").returns({});
			sandbox.stub(analysis, "transfer").returns({});
			sandbox.stub(analysis, "areStatesEqual").returns(true);

			// act
			analysis.analyse(cfg);

			// assert
			sinon.assert.calledWith(analysis.transfer, functionDeclaration);
			sinon.assert.calledWith(analysis.transfer, variableDeclarator);
			sinon.assert.calledWith(analysis.transfer, variableDeclarator2);
			sinon.assert.calledWith(analysis.transfer, returnStatement);
			sinon.assert.calledWith(analysis.transfer, null);

			sinon.assert.callCount(analysis.transfer, 5);
		});

		it("process only the nodes that have a path from the passed in node to the exit node", function () {
			// arrange
			const functionDeclaration = "function () {";
			const variableDeclarator = "let x = 10;";
			const variableDeclarator2 = "let y = 19";
			const returnStatement = "return x + y;";

			cfg.connectIfNotFound(functionDeclaration, BRANCHES.UNCONDITIONAL, variableDeclarator);
			cfg.connectIfNotFound(variableDeclarator, BRANCHES.UNCONDITIONAL, variableDeclarator2);
			cfg.connectIfNotFound(variableDeclarator2, BRANCHES.UNCONDITIONAL, returnStatement);
			cfg.connectIfNotFound(returnStatement, BRANCHES.UNCONDITIONAL, null);

			sandbox.stub(analysis, "createEmptyLattice").returns({});
			sandbox.stub(analysis, "transfer").returns({});
			sandbox.stub(analysis, "areStatesEqual").returns(true);

			// act
			analysis.analyse(cfg, variableDeclarator2);

			// assert
			sinon.assert.calledWith(analysis.transfer, variableDeclarator2);
			sinon.assert.calledWith(analysis.transfer, returnStatement);
			sinon.assert.calledWith(analysis.transfer, null);

			sinon.assert.callCount(analysis.transfer, 3);
		});

		it("reschedules the successor nodes if the in and out lattice of a node are not equal", function () {
			// arrange
			const declaration = cfg.createNode("let x = 1");
			const whileStatement = cfg.createNode("while (x)");
			const whileBody = cfg.createNode("--x");
			const whileSuccessor = cfg.createNode("console.log(x)");
			const exitNode = cfg.createNode(null);

			cfg.connectIfNotFound(declaration, BRANCHES.UNCONDITIONAL, whileStatement);
			cfg.connectIfNotFound(whileStatement, BRANCHES.TRUE, whileBody);
			cfg.connectIfNotFound(whileBody, BRANCHES.UNCONDITIONAL, whileStatement);
			cfg.connectIfNotFound(whileStatement, BRANCHES.FALSE, whileSuccessor);
			cfg.connectIfNotFound(whileSuccessor, BRANCHES.UNCONDITIONAL, null);

			sandbox.stub(analysis, "createEmptyLattice").returns("empty");

			const whileResult1 = "x = 1";

			sandbox.stub(analysis, "transfer").withArgs(whileBody.value, "empty").returns(whileResult1);
			analysis.transfer.returnsArg(1);

			sandbox.stub(analysis, "areStatesEqual").withArgs("empty", whileResult1).returns(false);
			analysis.areStatesEqual.returns(true);

			sandbox.stub(analysis, "joinBranches").withArgs("empty", ["x = 1"]).returns("x = 1");
			analysis.joinBranches.returnsArg(0);

			// act
			analysis.analyse(cfg);

			// assert
			sinon.assert.calledWith(analysis.transfer, declaration.value, "empty");
			sinon.assert.calledWith(analysis.transfer, whileStatement.value, "empty");
			sinon.assert.calledWith(analysis.transfer, whileStatement.value, "x = 1");
			sinon.assert.calledWith(analysis.transfer, whileBody.value, "empty");
			sinon.assert.calledWith(analysis.transfer, whileBody.value, "x = 1");
			sinon.assert.calledWith(analysis.transfer, whileSuccessor.value, "empty");
			sinon.assert.calledWith(analysis.transfer, whileSuccessor.value, "x = 1");
			sinon.assert.calledWith(analysis.transfer, exitNode.value, "empty");
			sinon.assert.calledWith(analysis.transfer, exitNode.value, "x = 1");
		});
	});
});