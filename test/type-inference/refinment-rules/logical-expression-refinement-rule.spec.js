import sinon from "sinon";
import {expect} from "chai";
import * as t from "babel-types";

import {Program} from "../../../lib/semantic-model/program";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {BooleanType, NumberType} from "../../../lib/semantic-model/types";
import {LogicalExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/logical-expression-refinement-rule";

describe("LogicalExpressionRefinementRule", function () {
	let context, rule, program;

	beforeEach(function () {
		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));
		rule = new LogicalExpressionRefinementRule();
	});

	describe("canRefine", function () {
		it("returns true if the node is a logical expression", function () {
			// arrange
			const logicalExpression = t.logicalExpression("&&", t.identifier("x"), t.identifier("x"));

			// act
			expect(rule.canRefine(logicalExpression)).to.be.true;
		});

		it("returns false if the node is not a logical expression", function () {
			expect(rule.canRefine(t.identifier("x"))).to.be.false;
		});
	});

	describe("refine", function () {
		it ("returns the boolean type", function () {
			// arrange
			const logicalExpression = t.logicalExpression("&&", t.identifier("x"), t.identifier("x"));

			sinon.stub(context, "infer").returns(new NumberType());

			// act, assert
			expect(rule.refine(logicalExpression, context)).to.be.instanceOf(BooleanType);
		});

		it("infers the type of the test left and right hand side of the expression", function () {
			// arrange
			const logicalExpression = t.logicalExpression("&&", t.identifier("x"), t.identifier("x"));

			sinon.stub(context, "infer").returns(new NumberType());

			// act
			rule.refine(logicalExpression, context);

			// assert
			sinon.assert.calledWith(context.infer, logicalExpression.left);
			sinon.assert.calledWith(context.infer, logicalExpression.right);
		});
	});
});