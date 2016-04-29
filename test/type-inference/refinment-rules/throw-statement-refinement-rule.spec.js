import sinon from "sinon";
import {expect} from "chai";
import * as t from "babel-types";

import {Program} from "../../../lib/semantic-model/program";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {VoidType, StringType} from "../../../lib/semantic-model/types";
import {ThrowStatementRefinementRule} from "../../../lib/type-inference/refinement-rules/throw-statement-refinement-rule";

describe("ThrowStatementRefinementRule", function () {
	let context, rule, throwStatement;

	beforeEach(function () {
		context = new HindleyMilnerContext(null, new TypeInferenceContext(new Program()));
		rule = new ThrowStatementRefinementRule();
		throwStatement = t.throwStatement(t.stringLiteral("Ohoh"));
	});

	describe("canRefine", function () {
		it("returns true if the node is a throw statement", function () {
			expect(rule.canRefine(throwStatement)).to.be.true;
		});

		it("returns false if the node is not a throw statement", function () {
			expect(rule.canRefine(t.identifier("x"))).to.be.false;
		});
	});

	describe("refine", function () {
		it ("returns type void", function () {
			// arrange
			sinon.stub(context, "infer").returns(StringType.create());

			// act, assert
			expect(rule.refine(throwStatement, context)).to.be.instanceOf(VoidType);
		});

		it ("infers the argument of the throw statement", function () {
			sinon.stub(context, "infer").returns(StringType.create());

			// assert
			rule.refine(throwStatement, context);

			// assert
			sinon.assert.calledWith(context.infer, throwStatement.argument);
		});
	});
});