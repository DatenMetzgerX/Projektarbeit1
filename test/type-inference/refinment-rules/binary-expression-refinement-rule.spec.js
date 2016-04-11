import {expect} from "chai";
import * as t from "babel-types";
import sinon from "sinon";

import BINARY_OPERATORS from "../../../lib/type-inference/refinement-rules/binary-operators";
import {BinaryExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/binary-expression-refinement-rule";
import {NullType, NumberType} from "../../../lib/semantic-model/types";
import {RefinementContext} from "../../../lib/type-inference/refinment-context";

describe("BinaryExpressionRefinementRule", function () {
	let rule, context, sandbox;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		context = new RefinementContext();
		sandbox.stub(context, "infer");
		rule = new BinaryExpressionRefinementRule();
	});

	afterEach(function () {
		sandbox.restore();
	});

	describe("canRefine", function () {
		it ("returns true for a binary expression declaration", function () {
			// arrange
			const binaryExpression = t.binaryExpression("+", t.identifier("x"), t.identifier("y"));

			// act, assert
			expect(rule.canRefine(binaryExpression)).to.be.true;
		});

		it("returns false in the other cases", function () {
			// arrange
			const identifier = t.identifier("x");

			// act, assert
			expect(rule.canRefine(identifier)).to.be.false;
		});
	});

	describe("refine", function () {
		it("throws if the operator is not supported", function () {
			// arrange
			const illegalAssignmentOperator = t.assignmentExpression("$", t.identifier("x"), t.numericLiteral(4));

			// act, assert
			expect(() => rule.refine(illegalAssignmentOperator, context)).to.throw("Type inference failure: The binary operator $ is not supported.");
		});

		it("uses the binary operator with the given name to refine the type", function () {
			// arrange
			const addExpression = t.binaryExpression("+", t.nullLiteral(), t.numericLiteral(4));
			const nullType = new NullType();
			const numberType = new NumberType();

			sandbox.stub(BINARY_OPERATORS["+"], "refine").returns(new NumberType());

			context.infer.withArgs(addExpression.left).returns(nullType);
			context.infer.withArgs(addExpression.right).returns(numberType);

			// act
			const refined = rule.refine(addExpression, context);

			// assert
			sinon.assert.calledWithExactly(BINARY_OPERATORS["+"].refine, nullType, numberType, sinon.match.func);
			expect(refined).to.be.instanceOf(NumberType);
		});
	});
});