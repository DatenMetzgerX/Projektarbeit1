import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {Program} from "../../../lib/semantic-model/program";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {ArrayExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/array-expression-refinement-rule";
import {AnyType, ArrayType, TypeVariable, NumberType, StringType} from "../../../lib/semantic-model/types";
import {NotUnifiableError} from "../../../lib/type-inference/type-unificator";
import {TypeInferenceError} from "../../../lib/type-inference/type-inference-error";

describe("ArrayExpressionRefinementRule", function () {
	let context, rule, program;

	beforeEach(function () {
		program = new Program();
		context = new HindleyMilnerContext(null, new TypeInferenceContext(program));
		rule = new ArrayExpressionRefinementRule();
	});

	describe("canRefine", function () {
		it("returns true for an array expression", function () {
			expect(rule.canRefine(t.arrayExpression([t.numericLiteral(5), t.numericLiteral(4)]))).to.be.true;
		});

		it("returns false for if the node is not an array expression", function () {
			expect(rule.canRefine(t.numericLiteral(5))).to.be.false;
		});
	});

	describe("refine", function () {
		it("returns an array with a type variable as it's T if the array does not contain any elements", function () {
			// act
			const arrayType =rule.refine(t.arrayExpression(), context);

			// assert
			expect(arrayType).to.be.an.instanceOf(ArrayType);
			expect(arrayType.of).to.be.an.instanceOf(TypeVariable);
		});

		it("returns an array of the element's type", function () {
			// arrange
			const arrayExpression = t.arrayExpression([t.numericLiteral(5), t.numericLiteral(5)]);
			sinon.stub(context, "infer")
				.withArgs(arrayExpression.elements[0]).returns(NumberType.create())
				.withArgs(arrayExpression.elements[0]).returns(NumberType.create());

			sinon.stub(context, "unify").returns(NumberType.create());

			// act
			const arrayType =rule.refine(arrayExpression, context);

			// assert
			expect(arrayType).to.be.an.instanceOf(ArrayType);
			expect(arrayType.of).to.be.an.instanceOf(NumberType);
		});

		it("returns an array of type Any if the elements are not unifiable", function () {
			// arrange
			const arrayExpression = t.arrayExpression([t.numericLiteral(5), t.numericLiteral(5)]);
			sinon.stub(context, "infer")
				.withArgs(arrayExpression.elements[0]).returns(StringType.create())
				.withArgs(arrayExpression.elements[0]).returns(NumberType.create());

			const unificationError = new NotUnifiableError(StringType.create(), NumberType.create());
			sinon.stub(context, "unify").throws(new TypeInferenceError(unificationError, arrayExpression.elements[1]));

			// act
			const arrayType =rule.refine(arrayExpression, context);

			// assert
			expect(arrayType).to.be.an.instanceOf(ArrayType);
			expect(arrayType.of).to.be.an.instanceOf(AnyType);
		});
	});
});