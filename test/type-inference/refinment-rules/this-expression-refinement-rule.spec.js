import {expect} from "chai";
import * as t from "babel-types";

import {Symbol, SymbolFlags} from "../../../lib/semantic-model/symbol";
import {ObjectType} from "../../../lib/semantic-model/types";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {Program} from "../../../lib/semantic-model/program";
import {ThisExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/this-expression-refinement-rule";

describe("ThisExpressionRefinementRule", function () {
	let rule, context, program;

	beforeEach(function () {
		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));

		rule = new ThisExpressionRefinementRule();
	});

	describe("canRefine", function () {
		it("returns true for a this expression", function () {
			expect(rule.canRefine(t.thisExpression())).to.be.true;
		});

		it("returns false otherwise", function () {
			expect(rule.canRefine(t.numericLiteral(4))).to.be.false;
		});
	});

	describe("refine", function () {

		it("returns the type the this symbol in the type environment", function () {
			// arrange
			const thisExpression = t.thisExpression();
			const thiz = new Symbol("this", SymbolFlags.Variable);
			const thisT = ObjectType.create();
			program.symbolTable.setSymbol(thisExpression, thiz);
			context.setType(thiz, thisT);

			// act
			const refined = rule.refine(thisExpression, context);

			// assert
			expect(refined).to.equal(thisT);
		});

		it("throws if the type of this is unknown and therefor this is not defined for the current scope", function () {
			// arrange
			const thisExpression = t.thisExpression();
			const thiz = new Symbol("this", SymbolFlags.Variable);
			program.symbolTable.setSymbol(thisExpression, thiz);

			// act, assert
			expect(() => rule.refine(thisExpression, context)).to.throw("Access to this outside of a function");
		});
	});
});