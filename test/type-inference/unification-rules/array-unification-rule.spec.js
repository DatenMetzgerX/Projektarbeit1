import sinon from "sinon";
import {expect} from "chai";
import {ArrayUnificationRule} from "../../../lib/type-inference/unification-rules/array-unification-rule";
import {ArrayType, StringType, NumberType, TypeVariable, NullType, MaybeType} from "../../../lib/semantic-model/types";


describe("ArrayUnificationRule", function () {
	let rule, unificator;

	beforeEach(function () {
		rule = new ArrayUnificationRule();
		unificator = { unify: sinon.stub() };
	});

	describe("canUnify", function () {
		it("returns true if both types are array types", function () {
			// arrange
			const array1 = ArrayType.of(StringType.create());
			const array2 = ArrayType.of(NumberType.create());

			// act, assert
			expect(rule.canUnify(array1, array2)).to.be.true;
		});

		it("returns false if only one of the types is an array", function () {
			// arrange
			const array = ArrayType.of(StringType.create());
			const string = StringType.create();

			// act, assert
			expect(rule.canUnify(array, string)).to.be.false;
			expect(rule.canUnify(string, array)).to.be.false;
		});
	});

	describe("unify", function () {
		it("returns t1 if the types are equal", function () {
			// arrange
			const array1 = ArrayType.of(StringType.create());
			const array2 = ArrayType.of(StringType.create());

			unificator.unify.returns(StringType.create());

			// act
			const unified = rule.unify(array1, array2, unificator);

			// assert
			expect(unified).to.equal(array1);
		});

		it("returns t1 if the unified type is equal to t1", function () {
			// arrange
			const array1 = ArrayType.of(StringType.create());
			const array2 = ArrayType.of(TypeVariable.create());

			unificator.unify.returns(StringType.create());

			// act
			const unified = rule.unify(array1, array2, unificator);

			// assert
			expect(unified).to.equal(array1);
		});

		it("returns t2 if the unified type is equal to t2", function () {
			// arrange
			const array1 = ArrayType.of(TypeVariable.create());
			const array2 = ArrayType.of(StringType.create());

			unificator.unify.returns(StringType.create());

			// act
			const unified = rule.unify(array1, array2, unificator);

			// assert
			expect(unified).to.equal(array2);
		});

		it("returns a new array of the unified array type", function () {
			// arrange
			const array1 = ArrayType.of(StringType.create());
			const array2 = ArrayType.of(NullType.create());

			unificator.unify.returns(MaybeType.of(StringType.create()));

			// act
			const unified = rule.unify(array1, array2, unificator);

			// assert
			expect(unified).not.to.equal(array1).and.not.to.equal(array2);
			expect(unified.of).to.be.an.instanceOf(MaybeType).and.to.have.property("of").that.is.an.instanceOf(StringType);
		});
	});
});