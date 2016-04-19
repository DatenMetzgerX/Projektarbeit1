import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {IfStatementRefinementRule} from "../../../lib/type-inference/refinement-rules/if-statement-refinement-rule";
import {VoidType} from "../../../lib/semantic-model/types";

describe("IfStatementRefinementRule", function () {
	let rule, context, ifStatement, test;

	beforeEach(function () {
		rule = new IfStatementRefinementRule();
		context = new HindleyMilnerContext();

		test = t.unaryExpression("!", t.identifier("x"));
		ifStatement = t.ifStatement(test, t.expressionStatement(t.callExpression(t.identifier("log"), [t.stringLiteral("x is falsy")])));
	});

	describe("canRefine", function () {
		it("returns true for an if statement", function () {
			expect(rule.canRefine(ifStatement)).to.be.true;
		});

		it("returns false if it is not an if statement", function () {
			expect(rule.canRefine(t.identifier("x"))).to.be.false;
		});
	});

	describe("refine", function () {
		it("infers the type for the test expression", function () {
			// arrange
			sinon.stub(context, "infer");

			// act
			rule.refine(ifStatement, context);

			// assert
			sinon.assert.calledWith(context.infer, test);
		});

		it("returns type void", function () {
			// arrange
			sinon.stub(context, "infer");

			// act, assert
			expect(rule.refine(ifStatement, context)).to.be.instanceOf(VoidType);
		});
	});
});