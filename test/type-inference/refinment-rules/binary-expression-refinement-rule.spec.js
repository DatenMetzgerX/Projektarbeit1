import {expect} from "chai";
import * as t from "babel-types";
import sinon from "sinon";

import BINARY_OPERATORS from "../../../lib/type-inference/refinement-rules/binary-operators";
import {BinaryExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/binary-expression-refinement-rule";
import {NullType, NumberType} from "../../../lib/semantic-model/types";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";

describe("BinaryExpressionRefinementRule", function () {
	let rule, context, sandbox, program;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));
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

			// act, asserts
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
			const nullType = NullType.create();
			const numberType = NumberType.create();

			sandbox.stub(BINARY_OPERATORS["+"], "refine").returns(NumberType.create());

			context.infer.withArgs(addExpression.left).returns(nullType);
			context.infer.withArgs(addExpression.right).returns(numberType);

			// act
			const refined = rule.refine(addExpression, context);

			// assert
			sinon.assert.calledWithExactly(BINARY_OPERATORS["+"].refine, sinon.match.instanceOf(NullType), sinon.match.instanceOf(NumberType), sinon.match.func);
			expect(refined).to.be.instanceOf(NumberType);
		});
	});
});