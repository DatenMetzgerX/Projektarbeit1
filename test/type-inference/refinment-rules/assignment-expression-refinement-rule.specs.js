import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import BINARY_OPERATORS from "../../../lib/type-inference/refinement-rules/binary-operators";
import {RefinementContext} from "../../../lib/type-inference/refinment-context";
import {AssignmentExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/assignment-expression-refinement-rule";
import {NumberType, NullType} from "../../../lib/semantic-model/types";
import {SymbolFlags, Symbol} from "../../../lib/semantic-model/symbol";

describe("AssignmentExpressionRefinementRule", function () {
	let rule, context, assignmentExpression, sandbox;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		context = new RefinementContext();
		sandbox.stub(context, "infer");
		sandbox.stub(context, "getSymbol");
		sandbox.stub(context, "setType");
		rule = new AssignmentExpressionRefinementRule();
		assignmentExpression = t.assignmentExpression("=", t.identifier("x"), t.numericLiteral(5));
	});

	afterEach(function () {
		sandbox.restore();
	});

	describe("canRefine", function () {
		it("returns true for a assignment expression", function () {
			expect(rule.canRefine(assignmentExpression)).to.be.true;
		});

		it("returns false otherwise", function () {
			expect(rule.canRefine(t.numericLiteral(4))).to.be.false;
		});
	});

	describe("refine", function () {
		it("returns the type of the right hand side", function () {
			// arrange
			const xSymbol = new Symbol("x", SymbolFlags.Variable);
			context.getSymbol.returns(xSymbol);

			context.infer.returns(new NumberType());

			// act, assert
			expect(rule.refine(assignmentExpression, context)).to.be.instanceOf(NumberType);
		});

		it("sets the type of the assignee in the type environment", function () {
			// arrange
			const xSymbol = new Symbol("x", SymbolFlags.Variable);
			context.getSymbol.returns(xSymbol);
			context.infer.returns(new NumberType());

			// act
			rule.refine(assignmentExpression, context);

			// assert
			sinon.assert.calledWithExactly(context.setType, xSymbol, sinon.match.instanceOf(NumberType));
		});

		it("throws if the operator is not supported", function () {
			// arrange
			const illegalAssignmentOperator = t.assignmentExpression("$=", t.identifier("x"), t.numericLiteral(4));

			// act, assert
			expect(() => rule.refine(illegalAssignmentOperator, context)).to.throw("Type inference failure: The assignment operator $= is not supported");
		});

		it("uses the binary operator with the given name to refine the type", function () {
			// arrange
			const plusAssignment = t.assignmentExpression("+=", t.identifier("x"), t.numericLiteral(4));
			const xType = new NullType();
			const numberType = new NumberType();

			sandbox.stub(BINARY_OPERATORS["+"], "refine").returns(new NumberType());

			context.infer.withArgs(plusAssignment.left).returns(xType);
			context.infer.withArgs(plusAssignment.right).returns(numberType);

			// act
			const refined = rule.refine(plusAssignment, context);

			// assert
			sinon.assert.calledWithExactly(BINARY_OPERATORS["+"].refine, xType, numberType, sinon.match.func);
			expect(refined).to.be.instanceOf(NumberType);
		});
	});
});