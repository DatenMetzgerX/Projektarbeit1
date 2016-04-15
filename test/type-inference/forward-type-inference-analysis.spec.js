import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {ForwardTypeInferenceAnalysis} from "../../lib/type-inference/forward-type-inference-analysis";
import {Program} from "../../lib/semantic-model/program";
import {TypeEnvironment} from "../../lib/type-inference/type-environment";
import {SymbolFlags, Symbol} from "../../lib/semantic-model/symbol";
import {VoidType, NullType} from "../../lib/semantic-model/types";
import {HindleyMilner} from "../../lib/type-inference/hindley-milner";
import {SourceFile} from "../../lib/semantic-model/source-file";
import {BRANCHES, ControlFlowGraph} from "../../lib/cfg/control-flow-graph";
import {HindleyMilnerContext} from "../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../lib/type-inference/type-inference-context";

describe("ForwardTypeInferenceAnalysis", function () {
	let analysis, program, hindleyMilner, sandbox;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		program = new Program();
		hindleyMilner = new HindleyMilner();
		analysis = new ForwardTypeInferenceAnalysis(program, hindleyMilner);
	});

	afterEach(function () {
		sandbox.restore();
	});

	describe("analyseSourceFile", function () {
		it("analyse all ast nodes in the source file", function () {
			// arrange
			const programNode = t.program([
				t.variableDeclaration("let", [t.variableDeclarator(t.identifier("x"))]),
				t.expressionStatement(t.unaryExpression("++", t.identifier("x")))
			]);
			const sourceFile = new SourceFile("./test.js", "let x", null);
			sourceFile.ast = {program: programNode};

			const cfg = new ControlFlowGraph();
			cfg.connectIfNotFound(programNode.body[0], BRANCHES.UNCONDITIONAL, programNode.body[1]);
			cfg.connectIfNotFound(programNode.body[1], BRANCHES.UNCONDITIONAL, null);

			sandbox.stub(hindleyMilner, "infer");
			sandbox.stub(program, "getCfg").returns(cfg);

			// act
			analysis.analyseSourceFile(sourceFile);

			// assert
			sinon.assert.calledWith(hindleyMilner.infer, programNode.body[0]);
			sinon.assert.calledWith(hindleyMilner.infer, programNode.body[1]);
		});
	});

	describe("analyse", function () {
		it("analyses the given node and it's successor nodes", function () {
			// arrange
			const variableDeclaration = t.variableDeclaration("let", [t.variableDeclarator(t.identifier("x"))]);
			const updateExpression = t.expressionStatement(t.unaryExpression("++", t.identifier("x")));

			const cfg = new ControlFlowGraph();
			cfg.connectIfNotFound(variableDeclaration, BRANCHES.UNCONDITIONAL, updateExpression);
			cfg.connectIfNotFound(updateExpression, BRANCHES.UNCONDITIONAL, null);

			sandbox.stub(hindleyMilner, "infer");
			sandbox.stub(program, "getCfg").returns(cfg);

			// act
			analysis.analyse(variableDeclaration);

			// assert
			sinon.assert.calledWith(hindleyMilner.infer, variableDeclaration);
			sinon.assert.calledWith(hindleyMilner.infer, updateExpression);
		});
	});

	describe("joinTypeEnvironments", function () {
		it("merges the definitions into a new type environment containing the definitions of both environments", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Variable);
			const age = new Symbol("age", SymbolFlags.Variable);

			const env1 = new TypeEnvironment().setType(name, new VoidType());
			const env2 = new TypeEnvironment().setType(age, new NullType());

			sandbox.stub(hindleyMilner, "mergeWithTypeEnvironments");

			const node = {};

			// act
			analysis.joinTypeEnvironments(env1, [env2], node);

			// assert
			sinon.assert.calledWith(hindleyMilner.mergeWithTypeEnvironments, [env2], node, sinon.match.has("typeEnvironment", env1));
		});
	});

	describe("createTypeInferenceContext", function () {
		it("creates a new type inference context with the given type environment", function () {
			// arrange
			const typeEnvironment = new TypeEnvironment();

			// act
			const context = analysis.createTypeInferenceContext(typeEnvironment);

			// assert
			expect(context).to.be.instanceOf(TypeInferenceContext);
			expect(context.typeEnvironment).to.equal(typeEnvironment);
		});
	});

	describe("createHindleyMilnerContext", function () {
		it("creates a new context that is based on the given type environment", function () {
			// arrange
			const typeEnvironment = new TypeEnvironment();

			// act
			const context = analysis.createHindleyMilnerContext(typeEnvironment);

			// assert
			expect(context).to.be.instanceOf(HindleyMilnerContext);
			expect(context.typeEnvironment).to.equal(typeEnvironment);
		});

		it("creates a new context that is based on the given type inference context", function () {
			// arrange
			const typeEnvironment = new TypeEnvironment();
			const typeInferenceContext = new TypeInferenceContext(program, typeEnvironment);

			// act
			const context = analysis.createHindleyMilnerContext(typeInferenceContext);

			// assert
			expect(context).to.be.instanceOf(HindleyMilnerContext);
			expect(context.typeEnvironment).to.equal(typeEnvironment);
		});
	});
});