import sinon from "sinon";
import {expect} from "chai";
import * as t from "babel-types";

import {Program} from "../../../lib/semantic-model/program";
import {Symbol, SymbolFlags} from "../../../lib/semantic-model/symbol";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {VoidType, NumberType, ArrayType, TypeVariable} from "../../../lib/semantic-model/types";
import {ForOfStatementRefinementRule} from "../../../lib/type-inference/refinement-rules/for-of-statement-refinement-rule";

describe("ForOfStatementRefinementRule", function () {
	let context, rule, program;

	beforeEach(function () {
		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));
		rule = new ForOfStatementRefinementRule();
	});

	describe("canRefine", function () {
		it("returns true if the node is a for of statement", function () {
			// arrange
			const forOfStatement = t.forOfStatement(t.identifier("x"), t.identifier("array"), t.blockStatement([]));

			// act, assert
			expect(rule.canRefine(forOfStatement)).to.be.true;
		});

		it("returns false if the node is not a for of statement", function () {
			expect(rule.canRefine(t.identifier("x"))).to.be.false;
		});
	});

	describe("refine", function () {
		it ("returns type void", function () {
			// arrange
			const forOfStatement = t.forOfStatement(t.identifier("x"), t.identifier("array"), t.blockStatement([]));

			sinon.stub(context, "infer")
				.withArgs(forOfStatement.left).returns(TypeVariable.create())
				.withArgs(forOfStatement.right).returns(ArrayType.of(NumberType.create()));

			// act, assert
			expect(rule.refine(forOfStatement, context)).to.be.instanceOf(VoidType);
		});

		it ("substitutes the type of the left hand side with the type of the array elements", function () {
			// arrange
			const forOfStatement = t.forOfStatement(t.identifier("x"), t.identifier("array"), t.blockStatement([]));
			const x = new Symbol("x", SymbolFlags.Variable);
			const xType = TypeVariable.create();
			context.setType(x, xType);

			sinon.stub(context, "infer")
				.withArgs(forOfStatement.left).returns(xType)
				.withArgs(forOfStatement.right).returns(ArrayType.of(NumberType.create()));

			// act
			rule.refine(forOfStatement, context);

			// assert
			expect(context.getType(x)).to.be.instanceOf(NumberType);
		});

		it("throws if the right hand side is not an array", function () {
			// arrange
			const forOfStatement = t.forOfStatement(t.identifier("x"), t.identifier("array"), t.blockStatement([]));

			sinon.stub(context, "infer")
				.withArgs(forOfStatement.left).returns(TypeVariable.create())
				.withArgs(forOfStatement.right).returns(NumberType.create());

			// act, assert
			expect(() => rule.refine(forOfStatement, context)).to.throw("Type inference failure: The type number does not support iteration.");
		});
	});
});