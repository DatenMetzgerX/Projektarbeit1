import {expect} from "chai";
import {ParametrizedType, MaybeType, Type, NumberType, NullType, StringType} from "../../../lib/semantic-model/types";

describe("ParametrizedType", function () {

	describe("prettyName", function () {
		it("contains the type parameters", function () {
			// arrange
			const t1 = new TestParametrizedType("Function", [new Type("number"), new Type("string")]);

			// act, assert
			expect(t1.prettyName).to.equal("Function<number, string>");
		});
	});

	describe("fresh", function () {
		it("returns a new instance with the same name and type parameters", function () {
			// arrange
			const t = new TestParametrizedType("x", [new Type("number")]);

			// act
			const fresh = t.fresh();

			// assert
			expect(fresh).not.to.equal(t);
			expect(fresh.name).to.equal(t.name);
			expect(fresh.typeParameters).to.deep.equal(t.typeParameters);
		});

		it("returns a new instance that has not the same id as the original one", function () {
			// arrange
			const t = new TestParametrizedType("x", [new Type("number")], 10);

			// act
			const fresh = t.fresh();

			// assert
			expect(fresh.id).not.to.equal(t.id);
		});
	});

	describe("containsType", function () {
		it("returns true if the type occurs in a type parameter of the other type", function () {
			// arrange
			const t1 = new Type("number");
			const t2 = new TestParametrizedType("number", [t1]);

			// act, assert
			expect(t1.occursIn(t2)).to.be.true;
		});

		it("returns true if the type occurs in a type parameter of a type parameter", function () {
			// arrange
			const t1 = new Type("number");
			const t2 = new TestParametrizedType("maybe", [t1]);
			const t3 = new TestParametrizedType("array", [t2]);

			// act, assert
			expect(t1.occursIn(t3)).to.be.true;
		});
	});

	describe("isSameType", function () {
		it("returns true if both types have the same constructor but different type parameters", function () {
			// arrange
			const numberType = new Type("number");
			const stringType = new Type("string");
			const first = new TestParametrizedType("array", [numberType]);
			const second = new TestParametrizedType("array", [stringType]);

			// act, assert
			expect(first.isSameType(second)).to.be.true;
		});

		it("returns false if the types have not the same constructors", function () {
			// arrange
			const first = new Type("number");
			const second = new TestParametrizedType("optional", [new Type("number")]);

			// act, assert
			expect(first.isSameType(second)).to.be.false;
		});
	});

	describe("equals", function () {
		it("returns true if both types are from the same types and have the same type parameters", function () {
			// arrange
			const numberType = new Type("number");
			const first = new TestParametrizedType("optional", [numberType]);
			const second = new TestParametrizedType("optional", [numberType]);

			// act, assert
			expect(first.equals(second)).to.be.true;
			expect(second.equals(first)).to.be.true;
		});

		it("returns false if the types are not from the same kind", function () {
			// arrange
			const first = new Type("number");
			const second = MaybeType.of(new Type("number"));

			// act, assert
			expect(first.equals(second)).to.be.false;
			expect(second.equals(first)).to.be.false;
		});

		it("returns false if the types have not the same number of type parameters", function () {
			// arrange
			const first = new TestParametrizedType("number");
			const second = new TestParametrizedType("array", [new Type("number")]);

			// act, assert
			expect(first.equals(second)).to.be.false;
			expect(second.equals(first)).to.be.false;
		});

		it("returns false if the parameter types are not equal", function () {
			// arrange
			const first = new TestParametrizedType("array", [MaybeType.of(new Type("number"))]);
			const second = new TestParametrizedType("array", [new Type("number")]);

			// act, assert
			expect(first.equals(second)).to.be.false;
			expect(second.equals(first)).to.be.false;
		});
	});

	describe("substitute", function () {
		it("returns the newType if this is the same as the new type", function () {
			// arrange
			const t = new TestParametrizedType("array", [new Type("number")]);
			const newT = new TestParametrizedType("array", [new Type("maybe")]);

			// act, assert
			expect(t.substitute(t, newT)).to.equal(newT);
		});

		it("returns this if no parameter has been replaced", function () {
			// arrange
			const t = new TestParametrizedType("array", [new Type("number")]);

			// act, assert
			expect(t.substitute(new Type("old"), new Type("new"))).to.equal(t);
		});

		it("returns a new type where all occurrences of the old type in the type parameters are replaced", function () {
			// arrange
			const oldType = new Type("number");
			const t = new TestParametrizedType("array", [oldType]);

			const newType = MaybeType.of(new Type("number"));

			// act
			const substituted = t.substitute(oldType, newType);

			// assert
			expect(substituted.typeParameters[0]).to.equal(newType);
		});
	});

	describe("isSubType", function () {
		it("returns true if the type parameters of t are all subtypes of this type", function () {
			// arrange
			const t = new TestParametrizedType("array", [MaybeType.of(NumberType.create())]);
			const tSub = new TestParametrizedType("array", [NumberType.create()]);

			// act, assert
			expect(t.isSubType(tSub)).to.be.true;
		});

		it("returns false if any type parameter of t is not a subtype of this type", function () {
			// arrange
			const t = new TestParametrizedType("array", [MaybeType.of(NumberType.create()), StringType.create()]);
			const tNotSub = new TestParametrizedType("array", [NullType.create(), NumberType.create()]);

			// act, assert
			expect(t.isSubType(tNotSub)).to.be.false;
		});

		it("returns false if t is of a different type", function () {
			// arrange
			const t = new TestParametrizedType("array", [NumberType.create()]);
			const tDifferent = MaybeType.of(NumberType.create());

			// act, assert
			expect(t.isSubType(tDifferent)).to.be.false;
		});
	});
});


class TestParametrizedType extends ParametrizedType {
	constructor(name, typeParameters=[], id=undefined) {
		super(name, id);
		this._typeParameters = typeParameters;
	}

	get typeParameters() {
		return this._typeParameters;
	}

	withTypeParameters(value, id) {
		return new TestParametrizedType(this.name, value, id);
	}
}

