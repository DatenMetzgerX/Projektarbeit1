import {expect} from "chai";
import * as t from "babel-types";
import sinon from "sinon";

import {FunctionRefinementRule} from "../../../lib/type-inference/refinement-rules/function-refinement-rule";
import {FunctionType, TypeVariable, VoidType} from "../../../lib/semantic-model/types";
import {Symbol, SymbolFlags} from "../../../lib/semantic-model/symbol";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {ControlFlowGraph, BRANCHES} from "../../../lib/cfg/control-flow-graph";
import {Edge} from "../../../lib/cfg/edge";
import {Node} from "../../../lib/cfg/node";
import {Program} from "../../../lib/semantic-model/program";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";

describe("FunctionRefinementRule", function () {
	let rule, context, cfg, program;

	beforeEach(function () {
		rule = new FunctionRefinementRule();
		cfg = new ControlFlowGraph();
		sinon.stub(cfg, "getExitEdges");

		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));
		sinon.stub(context, "getCfg").returns(cfg);
	});

	describe("canRefine", function () {
		it ("returns true for a function declaration", function () {
			// arrange
			const functionDeclaration = t.functionDeclaration(t.identifier("abcd"), [], t.blockStatement([]));

			// act, assert
			expect(rule.canRefine(functionDeclaration)).to.be.true;
		});

		it ("returns true for an arrow function expression", function () {
			// arrange
			const arrowFunctionExpression = t.arrowFunctionExpression([], t.blockStatement([]));

			// act, assert
			expect(rule.canRefine(arrowFunctionExpression)).to.be.true;
		});

		it ("returns true for a class method", function () {
			// arrange
			const classMethod = t.classMethod("method", t.identifier("x"), [], t.blockStatement([]));

			// act, assert
			expect(rule.canRefine(classMethod)).to.be.true;
		});

		it("returns true for an object method", function () {
			// arrange
			const objectMethod = t.objectMethod("method", t.identifier("x"), [], t.blockStatement([]));

			// act, assert
			expect(rule.canRefine(objectMethod)).to.be.true;
		});

		it("returns false in the other cases", function () {
			// arrange
			const identifier = t.identifier("x");

			// act, assert
			expect(rule.canRefine(identifier)).to.be.false;
		});
	});

	describe("refine", function () {
		it("returns a FunctionType for a function declaration", function () {
			// arrange
			const functionDeclaration = t.functionDeclaration(t.identifier("abcd"), [], t.blockStatement([]));
			cfg.getExitEdges.returns([]);

			program.symbolTable.setSymbol(functionDeclaration, new Symbol("abcd", SymbolFlags.Function));

			// act, assert
			expect(rule.refine(functionDeclaration, context)).to.be.instanceOf(FunctionType);
		});

		it("Sets the function type in the symbol table", function () {
			// arrange
			const functionDeclaration = t.functionDeclaration(t.identifier("abcd"), [], t.blockStatement([]));
			cfg.getExitEdges.returns([]);

			const functionSymbol = new Symbol("abcd", SymbolFlags.Function);
			program.symbolTable.setSymbol(functionDeclaration, functionSymbol);

			// act
			rule.refine(functionDeclaration, context);

			// assert
			expect(context.getType(functionSymbol)).to.be.instanceOf(FunctionType);
		});

		it("adds a type parameter for each parameter", function () {
			// arrange
			const functionDeclaration = t.functionDeclaration(t.identifier("multiply"), [t.identifier("x"), t.identifier("y")], t.blockStatement([]));
			const x = new Symbol("x", SymbolFlags.Variable);
			const y = new Symbol("y", SymbolFlags.Variable);

			program.symbolTable.setSymbol(functionDeclaration, new Symbol("multiply", SymbolFlags.Function));
			program.symbolTable.setSymbol(functionDeclaration.params[0], x);
			program.symbolTable.setSymbol(functionDeclaration.params[1], y);

			cfg.getExitEdges.returns([]);

			// act
			const refined = rule.refine(functionDeclaration, context);

			// assert
			expect(refined.thisType).to.be.instanceOf(TypeVariable); // will be changed when the this parameter will be implemented
			expect(refined.params[0]).to.be.instanceOf(TypeVariable);
			expect(refined.params[1]).to.be.instanceOf(TypeVariable);
		});

		it("sets the return type to void if no exit edge is an explicit return statement", function () {
			// arrange
			const statement = t.expressionStatement(t.assignmentExpression("=", t.identifier("x"), t.identifier("y")));
			const functionDeclaration = t.functionDeclaration(t.identifier("multiply"), [t.identifier("x"), t.identifier("y")], t.blockStatement([statement]));

			program.symbolTable.setSymbol(functionDeclaration, new Symbol("multiply", SymbolFlags.Function));
			program.symbolTable.setSymbol(functionDeclaration.params[0], new Symbol("x", SymbolFlags.Variable));
			program.symbolTable.setSymbol(functionDeclaration.params[1], new Symbol("y", SymbolFlags.Variable));

			const exit1 = new Edge(new Node(statement), BRANCHES.UNCONDITIONAL, new Node(null));
			cfg.getExitEdges.returns([exit1]);

			// act
			const refined = rule.refine(functionDeclaration, context);

			// assert
			expect(refined.returnType).to.be.instanceOf(VoidType);
		});

		it("sets the return type to a type variable if the function has one explicit return edge", function () {
			// arrange
			const statement = t.returnStatement(t.binaryExpression("*", t.identifier("x"), t.identifier("y")));
			const functionDeclaration = t.functionDeclaration(t.identifier("multiply"), [t.identifier("x"), t.identifier("y")], t.blockStatement([statement]));

			program.symbolTable.setSymbol(functionDeclaration, new Symbol("multiply", SymbolFlags.Function));
			program.symbolTable.setSymbol(functionDeclaration.params[0], new Symbol("x", SymbolFlags.Variable));
			program.symbolTable.setSymbol(functionDeclaration.params[1], new Symbol("y", SymbolFlags.Variable));

			const exit1 = new Edge(new Node(statement), BRANCHES.UNCONDITIONAL, new Node(null));
			cfg.getExitEdges.returns([exit1]);

			// act
			const refined = rule.refine(functionDeclaration, context);

			// assert
			expect(refined.returnType).to.be.instanceOf(TypeVariable);
		});

		it("sets the return type to a type variable if all exit nodes are explicit returns or EXCEPTION Branches", function () {
			// arrange
			const statement = t.returnStatement(t.binaryExpression("*", t.identifier("x"), t.identifier("y")));
			const throwExit = t.throwStatement(t.identifier("z"));
			const functionDeclaration = t.functionDeclaration(t.identifier("multiply"), [t.identifier("x"), t.identifier("y")], t.blockStatement([statement]));

			program.symbolTable.setSymbol(functionDeclaration, new Symbol("multiply", SymbolFlags.Function));
			program.symbolTable.setSymbol(functionDeclaration.params[0], new Symbol("x", SymbolFlags.Variable));
			program.symbolTable.setSymbol(functionDeclaration.params[1], new Symbol("y", SymbolFlags.Variable));

			const exit1 = new Edge(new Node(statement), BRANCHES.UNCONDITIONAL, new Node(null));
			const throwEdge = new Edge(new Node(throwExit), BRANCHES.EXCEPTION, new Node(null));
			cfg.getExitEdges.returns([exit1, throwEdge]);

			// act
			const refined = rule.refine(functionDeclaration, context);

			// assert
			expect(refined.returnType).to.be.instanceOf(TypeVariable);
		});

		it("sets the return type to void type if the function has one non explicit return edge (in this case the function might return a value)", function () {
			// arrange
			const statement = t.returnStatement(t.binaryExpression("*", t.identifier("x"), t.identifier("y")));
			const otherExit = t.expressionStatement(t.binaryExpression("*", t.identifier("x"), t.identifier("y")));
			const functionDeclaration = t.functionDeclaration(t.identifier("multiply"), [t.identifier("x"), t.identifier("y")], t.blockStatement([statement]));

			program.symbolTable.setSymbol(functionDeclaration, new Symbol("multiply", SymbolFlags.Function));
			program.symbolTable.setSymbol(functionDeclaration.params[0], new Symbol("x", SymbolFlags.Variable));
			program.symbolTable.setSymbol(functionDeclaration.params[1], new Symbol("y", SymbolFlags.Variable));

			const exit1 = new Edge(new Node(statement), BRANCHES.UNCONDITIONAL, new Node(null));
			const exit2 = new Edge(new Node(otherExit), BRANCHES.UNCONDITIONAL, new Node(null));
			cfg.getExitEdges.returns([exit1, exit2]);

			// act
			const refined = rule.refine(functionDeclaration, context);

			// assert
			expect(refined.returnType).to.be.instanceOf(VoidType);
		});

		it("sets the type environment of the declaration in the function type", function () {
			// arrange
			const functionDeclaration = t.functionDeclaration(t.identifier("abcd"), [], t.blockStatement([]));
			cfg.getExitEdges.returns([]);

			program.symbolTable.setSymbol(functionDeclaration, new Symbol("abcd", SymbolFlags.Function));

			// act
			const func = rule.refine(functionDeclaration, context);

			// assert
			expect(func.typeEnvironment).to.equal(context.typeEnvironment);
		});

		it("sets the function declaration node", function () {
			// arrange
			const functionDeclaration = t.functionDeclaration(t.identifier("abcd"), [], t.blockStatement([]));
			cfg.getExitEdges.returns([]);

			program.symbolTable.setSymbol(functionDeclaration, new Symbol("abcd", SymbolFlags.Function));

			// act
			const func = rule.refine(functionDeclaration, context);

			// assert
			expect(func.declaration).to.equal(functionDeclaration);
		});
	});
});