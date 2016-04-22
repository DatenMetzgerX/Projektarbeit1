import sinon from "sinon";
import {expect} from "chai";
import * as t from "babel-types";

import {Program} from "../../../lib/semantic-model/program";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {MaybeType, NumberType} from "../../../lib/semantic-model/types";
import {ConditionalExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/conditional-expression-refinement-rule";

describe("ConditionalExpressionRefinementRule", function () {
	let context, rule, program;

	beforeEach(function () {
		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));
		rule = new ConditionalExpressionRefinementRule();
	});

	describe("canRefine", function () {
		it("returns true if the node is a conditionalExpression", function () {
			// arrange
			const conditionalExpr = t.conditionalExpression(t.identifier("x"), t.identifier("x"), t.numericLiteral(0));

			// act
			expect(rule.canRefine(conditionalExpr)).to.be.true;
		});

		it("returns false if the node is not a conditional expression", function () {
			expect(rule.canRefine(t.identifier("x"))).to.be.false;
		});
	});

	describe("refine", function () {
		it ("returns the unified type of the consequent and alternate branch", function () {
			// arrange
			const conditionalExpr = t.conditionalExpression(t.identifier("x"), t.identifier("x"), t.numericLiteral(0));

			sinon.stub(context, "infer")
				.withArgs(conditionalExpr.consequent).returns(MaybeType.of(new NumberType()))
				.withArgs(conditionalExpr.alternate).returns(new NumberType());

			sinon.stub(context, "unify").returns(MaybeType.of(new NumberType()));

			// act, assert
			expect(rule.refine(conditionalExpr, context)).to.be.instanceOf(MaybeType);
			sinon.assert.calledWith(context.unify, sinon.match.instanceOf(MaybeType), sinon.match.instanceOf(NumberType));
		});

		it("infers the type of the test condition", function () {
			// arrange
			const conditionalExpr = t.conditionalExpression(t.identifier("x"), t.identifier("x"), t.numericLiteral(0));

			sinon.stub(context, "infer").returns(new NumberType());
			sinon.stub(context, "unify").returns(new NumberType());

			// act
			rule.refine(conditionalExpr, context);

			// assert
			sinon.assert.calledWith(context.infer, conditionalExpr.test);
		});
	});
});