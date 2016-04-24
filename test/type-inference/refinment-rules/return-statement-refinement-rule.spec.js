import {expect} from "chai";
import * as t from "babel-types";
import sinon from "sinon";

import {ReturnStatementRefinementRule} from "../../../lib/type-inference/refinement-rules/return-statement-refinement-rule";
import {NullType, NumberType, VoidType, MaybeType} from "../../../lib/semantic-model/types";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {Symbol} from "../../../lib/semantic-model/symbol";
import {Program} from "../../../lib/semantic-model/program";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";

describe("ReturnStatementRefinementRule", function () {
	let rule, context, program;

	beforeEach(function () {
		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));
		sinon.stub(context, "infer");
		sinon.stub(context, "unify");
		rule = new ReturnStatementRefinementRule();
	});

	describe("canRefine", function () {
		it ("returns true for a return statement declaration", function () {
			// arrange
			const returnStatement = t.returnStatement(t.identifier("x"));

			// act, assert
			expect(rule.canRefine(returnStatement)).to.be.true;
		});

		it("returns false in the other cases", function () {
			// arrange
			const identifier = t.identifier("x");

			// act, assert
			expect(rule.canRefine(identifier)).to.be.false;
		});
	});

	describe("refine", function () {

		it("sets the type of the `return` symbol to the evaluated type of the return expression", function () {
			// arrange
			const returnStatement = t.returnStatement(t.binaryExpression("*", t.identifier("x"), t.numericLiteral(2)));

			context.infer.withArgs(returnStatement.argument).returns(NumberType.create());

			// act
			rule.refine(returnStatement, context);

			// assert
			expect(context.getType(Symbol.RETURN)).to.be.an.instanceOf(NumberType);
		});

		it("unifies the type of the `return` symbol with the type of the return `argument`", function () {
			// arrange
			const returnStatement = t.returnStatement(t.binaryExpression("*", t.identifier("x"), t.numericLiteral(2)));

			context.setType(Symbol.RETURN, NullType.create());
			context.infer.withArgs(returnStatement.argument).returns(NumberType.create());
			context.unify.withArgs(sinon.match.instanceOf(NullType), sinon.match.instanceOf(NumberType)).returns(MaybeType.of(NumberType.create()));

			// act
			rule.refine(returnStatement, context);

			// assert
			expect(context.getType(Symbol.RETURN)).to.be.an.instanceOf(MaybeType);
		});

		it("sets the type of the `return` symbol to VoidType if the return statement has no argument (just return;)", function () {
			// arrange
			const returnStatement = t.returnStatement();

			// act
			rule.refine(returnStatement, context);

			// assert
			expect(context.getType(Symbol.RETURN)).to.be.an.instanceOf(VoidType);
		});

		it("the type of a return statement is void", function () {
			// arrange
			const returnStatement = t.returnStatement(t.binaryExpression("*", t.identifier("x"), t.numericLiteral(2)));
			context.infer.withArgs(returnStatement.argument).returns(NumberType.create());

			// act, assert
			expect(rule.refine(returnStatement, context)).to.be.instanceOf(VoidType);
		});
	});
});