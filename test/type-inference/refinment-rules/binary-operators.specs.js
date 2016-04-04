import {expect} from "chai";
import sinon from "sinon";
import BINARY_OPERATORS from "../../../lib/type-inference/refinement-rules/binary-operators";
import {NumberType, MaybeType, NullType, BooleanType, StringType} from "../../../lib/semantic-model/types";

describe("BinaryOperators", function () {
	let operator, unify;

	beforeEach(function () {
		unify = sinon.stub();
		unify.returnsArg(0);
	});

	for (const numberOperator of ["+", "-", "*", "/", "<<", ">>", ">>>", "%", "|", "^", "&"]) {
		describe(numberOperator, function () {

			beforeEach(function () {
				operator = BINARY_OPERATORS[numberOperator];
			});

			it(`is registered with the name ${numberOperator}`, function () {
				expect(BINARY_OPERATORS).to.have.property(numberOperator);
			});

			it("refines the type to NumberType", function () {
				// arrange
				const leftParameter = new NullType();
				const rightParameter = new MaybeType(new NumberType());

				// act
				const refined = operator.refine(leftParameter, rightParameter, unify);

				// assert
				expect(refined).to.be.instanceOf(NumberType);
			});

			it("calls unify for the left- and right parameter together with the operator type", function () {
				// arrange
				const leftParameter = new MaybeType(new NumberType());
				const rightParameter = new MaybeType(new NumberType());

				// act
				operator.refine(leftParameter, rightParameter, unify);

				// assert
				sinon.assert.calledWithExactly(unify, leftParameter, sinon.match.instanceOf(MaybeType));
				sinon.assert.calledWithExactly(unify, sinon.match.instanceOf(MaybeType), rightParameter);
			});

		});
	}

	for (const op of ["===", "!=="]) {
		describe(op, function () {
			beforeEach(function () {
				operator = BINARY_OPERATORS[op];
			});

			it(`is registered with the name ${op}`, function () {
				expect(BINARY_OPERATORS).to.have.property(op);
			});

			it("returns BoolType as operator result", function () {
				// arrange
				const leftType = new NumberType();
				const rightType = new NumberType();

				// act
				const refined = operator.refine(leftType, rightType, unify);

				// assert
				expect(refined).to.be.instanceOf(BooleanType);
			});

			it("fails if the right and left parameter type cannot be unified", function () {
				// arrange
				const leftType = new NumberType();
				const rightType = new StringType();

				unify.throws(new Error("Unification of string and number not possible"));

				// act
				expect(() => operator.refine(leftType, rightType, unify)).to.throw("Unification of string and number not possible");
			});
		});
	}

	for (const op of ["==", "!="]) {
		describe(op, function () {
			beforeEach(function () {
				operator = BINARY_OPERATORS[op];
			});

			it(`is registered with the name ${op}`, function () {
				expect(BINARY_OPERATORS).to.have.property(op);
			});

			it("returns BoolType as operator result", function () {
				// arrange
				const leftType = new NumberType();
				const rightType = new NumberType();

				// act
				const refined = operator.refine(leftType, rightType, unify);

				// assert
				expect(refined).to.be.instanceOf(BooleanType);
			});
		});
	}
});