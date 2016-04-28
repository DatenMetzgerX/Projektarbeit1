import sinon from "sinon";
import {expect} from "chai";
import * as t from "babel-types";

import {Program} from "../../../lib/semantic-model/program";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {VoidType, NumberType, TypeVariable, BooleanType} from "../../../lib/semantic-model/types";
import {ForStatementRefinementRule} from "../../../lib/type-inference/refinement-rules/for-statement-refinement-rule";

describe("ForStatementRefinementRule", function () {
	let context, rule, program, init, test, update;

	beforeEach(function () {
		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));
		rule = new ForStatementRefinementRule();
		init = t.assignmentExpression("=", t.identifier("x"), t.numericLiteral(10));
		test = t.binaryExpression("<", t.identifier("x"), t.numericLiteral(100));
		update = t.updateExpression("++", t.identifier("x"));
	});

	describe("canRefine", function () {
		it("returns true if the node is a for statement", function () {
			// arrange
			const forOfStatement = t.forStatement(init, test, update, t.blockStatement([]));

			// act, assert
			expect(rule.canRefine(forOfStatement)).to.be.true;
		});

		it("returns false if the node is not a for statement", function () {
			expect(rule.canRefine(t.identifier("x"))).to.be.false;
		});
	});

	describe("refine", function () {
		it ("returns type void", function () {
			// arrange
			const forStatement = t.forStatement(init, test, update, t.blockStatement([]));

			sinon.stub(context, "infer")
				.withArgs(init).returns(TypeVariable.create())
				.withArgs(test).returns(BooleanType.create())
				.withArgs(update).returns(NumberType.create());

			// act, assert
			expect(rule.refine(forStatement, context)).to.be.instanceOf(VoidType);
		});

		it ("infers the type for init, test and update", function () {
			// arrange
			const forStatement = t.forStatement(init, test, update, t.blockStatement([]));

			sinon.stub(context, "infer")
				.withArgs(init).returns(TypeVariable.create())
				.withArgs(test).returns(BooleanType.create())
				.withArgs(update).returns(NumberType.create());

			// act
			rule.refine(forStatement, context);

			// assert
			sinon.assert.calledWith(context.infer, init);
			sinon.assert.calledWith(context.infer, test);
			sinon.assert.calledWith(context.infer, update);
		});

		it("can handle a for statement without init, test and update", function () {
			// arrange
			const forStatement = t.forStatement(null, null, null, t.blockStatement([]));
			sinon.stub(context, "infer");

			// act
			rule.refine(forStatement, context);

			// assert
			sinon.assert.notCalled(context.infer);
		});
	});
});