import sinon from "sinon";
import {expect} from "chai";
import * as t from "babel-types";

import {Program} from "../../../lib/semantic-model/program";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {UpdateExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/update-expression-refinement-rule";
import {MaybeType, NumberType} from "../../../lib/semantic-model/types";

describe("UpdateExpressionRefinementRule", function () {
	let context, rule, program;

	beforeEach(function () {
		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));
		rule = new UpdateExpressionRefinementRule();
	});

	describe("canRefine", function () {
		it("returns true if the node is an update expression", function () {
			// arrange
			const updateExpression = t.updateExpression("++", t.identifier("x"));

			// act, assert
			expect(rule.canRefine(updateExpression)).to.be.true;
		});

		it("returns false if the node is not an update expression", function () {
			expect(rule.canRefine(t.identifier("x"))).to.be.false;
		});
	});

	describe("refine", function () {
		it ("returns number type", function () {
			// arrange
			const updateExpression = t.updateExpression("++", t.identifier("x"));

			sinon.stub(context, "infer").returns(new NumberType());
			sinon.stub(context, "unify").returns(new NumberType());

			// act, assert
			expect(rule.refine(updateExpression, context)).to.be.instanceOf(NumberType);
		});

		it("infers and unifies the type of the argument with the maybe number type", function () {
			// arrange
			const updateExpression = t.updateExpression("++", t.identifier("x"));

			sinon.stub(context, "infer").returns(new NumberType());
			sinon.stub(context, "unify").returns(new NumberType());

			// act
			rule.refine(updateExpression, context);

			// assert
			sinon.assert.calledWith(context.infer, updateExpression.argument);
			sinon.assert.calledWith(context.unify, sinon.match.instanceOf(MaybeType), sinon.match.instanceOf(NumberType), updateExpression.argument);
		});
	});
});