import {expect} from "chai";
import sinon from "sinon";
import {WorklistDataFlowAnalyzer} from "../../lib/data-flow-analysis/worklist-data-flow-analyzer";
import {ControlFlowGraph, BRANCHES} from "../../lib/cfg/control-flow-graph";

describe("WorklistDataFlowAnalyzer", function () {
	let sandbox, analysis, analyzer, cfg;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		analysis = {
			joinBranches: sandbox.stub(),
			createEmptyLattice: sandbox.stub(),
			createEntryLattice: sandbox.stub(),
			transfer: sandbox.stub(),
			areLatticesEqual: sandbox.stub()
		};

		cfg = new ControlFlowGraph();

		analyzer = new WorklistDataFlowAnalyzer(cfg, analysis);
	});

	describe("analysis", function () {
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

			analysis.createEmptyLattice.returns({});
			analysis.createEntryLattice.returns({});

			// act
			analyzer.analyze();

			// assert
			sinon.assert.calledWith(analysis.transfer, functionDeclaration);
			sinon.assert.calledWith(analysis.transfer, variableDeclarator);
			sinon.assert.calledWith(analysis.transfer, variableDeclarator2);
			sinon.assert.calledWith(analysis.transfer, returnStatement);
			sinon.assert.calledWith(analysis.transfer, null);

			sinon.assert.callCount(analysis.transfer, 5);
		});

		it("reschedules the successor nodes if the in and out lattice of a node are not equal", function () {
			// arrange
			const declaration = cfg.createNode("let x = 1");
			const whileStatement = cfg.createNode("while (x)");
			const whileBody = cfg.createNode("--x");
			const whileSuccessor = cfg.createNode("console.log(x)");
			const exitNode = cfg.createNode(null);

			sandbox.stub(cfg, "getNodes").returns([declaration, whileStatement, whileBody, whileSuccessor, exitNode]);

			cfg.connectIfNotFound(declaration, BRANCHES.UNCONDITIONAL, whileStatement);
			cfg.connectIfNotFound(whileStatement, BRANCHES.TRUE, whileBody);
			cfg.connectIfNotFound(whileBody, BRANCHES.UNCONDITIONAL, whileStatement);
			cfg.connectIfNotFound(whileStatement, BRANCHES.FALSE, whileSuccessor);
			cfg.connectIfNotFound(whileSuccessor, BRANCHES.UNCONDITIONAL, null);

			analysis.createEmptyLattice.returns("empty");
			analysis.createEntryLattice.returns("empty");

			const whileResult1 = "x = 1";

			analysis.transfer.withArgs(whileBody.value, "empty").returns(whileResult1);
			analysis.transfer.returnsArg(1);

			analysis.areLatticesEqual.withArgs("empty", whileResult1).returns(false);
			analysis.areLatticesEqual.returns(true);

			analysis.joinBranches.withArgs("empty", ["x = 1"]).returns("x = 1");
			analysis.joinBranches.returnsArg(0);

			// act
			analyzer.analyze();

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

		it("initializes entry node instates with the Entry Lattice", function () {
			// arrange
			const entry = cfg.createNode("let x = 0;");
			const nonEntry = cfg.createNode("++x");

			cfg.connectIfNotFound(entry, BRANCHES.UNCONDITIONAL, nonEntry);
			cfg.connectIfNotFound(entry, BRANCHES.UNCONDITIONAL, null);

			analysis.createEmptyLattice.returns("empty");
			analysis.createEntryLattice.returns("entry");

			// act
			analyzer.analyze();

			// assert
			expect(entry.annotation.in).to.equal("entry");
		});
	});
});