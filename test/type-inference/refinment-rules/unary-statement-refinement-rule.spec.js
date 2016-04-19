import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";
import {UnaryExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/unary-expression-refinement-rule";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {NumberType, VoidType, BooleanType, NullType, MaybeType} from "../../../lib/semantic-model/types";

describe("UnaryExpressionRefinementRule", function () {
	let rule, context;

	beforeEach(function() {
		rule = new UnaryExpressionRefinementRule();
		context = new HindleyMilnerContext();
	});

	describe("canRefine", function() {
		it("returns true if the node is an unary expression", function () {
			// arrange
			const expression = t.unaryExpression("!", t.identifier("x"));

			// act, assert
			expect(rule.canRefine(expression)).to.be.true;
		});

		it("returns false if the node is not an unary expression", function () {
			expect(rule.canRefine(t.identifier("x"))).to.be.false;
		});
	});

	describe("refine", function () {
		it("infers the type for the argument", function () {
			// arrange
			const expression = t.unaryExpression("!", t.identifier("x"));
			sinon.stub(context, "infer");

			// act
			rule.refine(expression, context);

			// assert
			sinon.assert.calledWith(context.infer, expression.argument);
		});

		it("throws if the operator is unknown", function () {
			// arrange
			const expression = t.unaryExpression("typeof", t.identifier("x"));
			sinon.stub(context, "infer");

			// act, assert
			expect(() => rule.refine(expression, context)).to.throw("The operator typeof for unary expressions is not yet supported");
		});

		describe("void", function () {
			it("returns type void", function () {
				// arrange
				const expression = t.unaryExpression("void", t.identifier("x"));
				sinon.stub(context, "infer").returns(new NumberType());

				// act, assert
				expect(rule.refine(expression, context)).to.be.instanceOf(VoidType);
			});
		});

		describe("!", function () {
			it("returns boolean type", function () {
				// arrange
				const expression = t.unaryExpression("!", t.identifier("x"));
				sinon.stub(context, "infer").returns(new NumberType());

				// act, assert
				expect(rule.refine(expression, context)).to.be.instanceOf(BooleanType);
			});
		});

		for (const operator of ["+", "-", "~"]) {
			describe(operator, function () {
				it("returns number type", function () {
					// arrange
					const expression = t.unaryExpression(operator, t.identifier("x"));
					sinon.stub(context, "infer").returns(new NullType());
					sinon.stub(context, "unify").returns(new MaybeType(new NumberType()));

					// act, assert
					expect(rule.refine(expression, context)).to.be.instanceOf(NumberType);
				});

				it("unifies the type of the argument with type number", function () {
					// arrange
					const expression = t.unaryExpression(operator, t.identifier("x"));
					sinon.stub(context, "unify");
					sinon.stub(context, "infer").returns(new NullType());

					// act
					rule.refine(expression, context);

					// assert
					sinon.assert.calledWith(context.unify, sinon.match.instanceOf(NullType), sinon.match.instanceOf(NumberType), expression);
				});
			});
		}
	});
});