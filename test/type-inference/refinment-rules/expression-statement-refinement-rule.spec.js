import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {RefinementContext} from "../../../lib/type-inference/refinement-context";
import {ExpressionStatementRefinementRule} from "../../../lib/type-inference/refinement-rules/expression-statement-refinement-rule";
import {VoidType} from "../../../lib/semantic-model/types";

describe("ExpressionStatementRefinementRule", function () {
	let rule, context, expressionStatement;

	beforeEach(function () {
		context = new RefinementContext();
		sinon.stub(context, "infer");
		rule = new ExpressionStatementRefinementRule();
		expressionStatement = t.expressionStatement(t.assignmentExpression("=", t.identifier("x"), t.numericLiteral(5)));
	});

	describe("canRefine", function () {
		it("returns true for an expression statement", function () {
			expect(rule.canRefine(expressionStatement)).to.be.true;
		});

		it("returns false otherwise", function () {
			expect(rule.canRefine(t.numericLiteral(4))).to.be.false;
		});
	});

	describe("refine", function () {
		it("returns VoidType", function () {
			expect(rule.refine(expressionStatement, context)).to.be.instanceOf(VoidType);
		});

		it("infers the type of the expression", function () {
			// act
			rule.refine(expressionStatement, context);

			// assert
			sinon.assert.calledWithExactly(context.infer, expressionStatement.expression);
		});
	});
});