import sinon from "sinon";
import {expect} from "chai";
import * as t from "babel-types";

import {Program} from "../../../lib/semantic-model/program";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {WhileStatementRefinementRule} from "../../../lib/type-inference/refinement-rules/while-statement-refinement-rule";
import {VoidType, BooleanType} from "../../../lib/semantic-model/types";

describe("WhileStatementRefinementRule", function () {
	let context, rule, program;

	beforeEach(function () {
		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));
		rule = new WhileStatementRefinementRule();
	});

	describe("canRefine", function () {
		it("returns true if the node is a while statement", function () {
			// arrange
			const whileStatement = t.whileStatement(t.booleanLiteral(true), t.blockStatement([]));

			// act, assert
			expect(rule.canRefine(whileStatement)).to.be.true;
		});

		it("returns true if the node is a do while statement", function () {
			// arrange
			const doWhileStatement = t.doWhileStatement(t.booleanLiteral(true), t.blockStatement([]));

			// act, assert
			expect(rule.canRefine(doWhileStatement)).to.be.true;
		});

		it("returns false if the node is neither a while nor do while statement", function () {
			expect(rule.canRefine(t.identifier("x"))).to.be.false;
		});
	});

	describe("refine", function () {
		it ("returns type void", function () {
			// arrange
			const whileStatement = t.whileStatement(t.booleanLiteral(true), t.blockStatement([]));

			sinon.stub(context, "infer").returns(BooleanType.create());

			// act, assert
			expect(rule.refine(whileStatement, context)).to.be.instanceOf(VoidType);
		});

		it ("infers the test expression", function () {
			// arrange
			const whileStatement = t.whileStatement(t.booleanLiteral(true), t.blockStatement([]));

			sinon.stub(context, "infer").returns(BooleanType.create());

			// assert
			rule.refine(whileStatement, context);

			// assert
			sinon.assert.calledWith(context.infer, whileStatement.test);
		});
	});
});