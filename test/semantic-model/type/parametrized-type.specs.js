import {expect} from "chai";
import {ParametrizedType, MaybeType, Type} from "../../../lib/semantic-model/types";

describe("ParametrizedType", function () {
	describe("resolveDeep", function () {
		it("resolves all type parameters", function () {
			// arrange
			const numberType = new Type("number");
			const thisType = new Type("this");
			const returnType = new Type("return");
			const param1 = new Type("@");

			const functionType = new TestParametrizedType("Function", thisType, param1, returnType);
			param1.resolvesTo(numberType);

			// act
			const deepResolved = functionType.resolveDeep();

			// assert
			expect(deepResolved.typeParameters).to.deep.equal([thisType, numberType, returnType]);
		});
	});

	describe("containsType", function () {
		it("returns true if the type occurs in a type parameter of the other type", function () {
			// arrange
			const t1 = new Type("number");
			const t2 = new TestParametrizedType("number", t1);

			// act, assert
			expect(t1.occursIn(t2)).to.be.true;
		});

		it("returns true if the type occurs in a type parameter of a type parameter", function () {
			// arrange
			const t1 = new Type("number");
			const t2 = new TestParametrizedType("maybe", t1);
			const t3 = new TestParametrizedType("array", t2);

			// act, assert
			expect(t1.occursIn(t3)).to.be.true;
		});
	});

	describe("prettyName", function () {
		it("contains the type parameters", function () {
			// arrange
			const t1 = new TestParametrizedType("Function", new Type("number"), new Type("string"));

			// act, assert
			expect(t1.prettyName).to.equal("Function<number, string>");
		});
	});

	describe("isSameType", function () {
		it("returns true if both types have the same constructor but different type parameters", function () {
			// arrange
			const numberType = new Type("number");
			const stringType = new Type("string");
			const first = new TestParametrizedType("array", numberType);
			const second = new TestParametrizedType("array", stringType);

			// act, assert
			expect(first.isSameType(second)).to.be.true;
		});

		it("returns false if the types have not the same constructors", function () {
			// arrange
			const first = new Type("number");
			const second = new TestParametrizedType("optional", new Type("number"));

			// act, assert
			expect(first.isSameType(second)).to.be.false;
		});
	});

	describe("equals", function () {
		it("returns true if both types are from the same types and have the same type parameters", function () {
			// arrange
			const numberType = new Type("number");
			const first = new TestParametrizedType("optional", numberType);
			const second = new TestParametrizedType("optional", numberType);

			// act, assert
			expect(first.equals(second)).to.be.true;
		});

		it("returns false if the types are not from the same kind", function () {
			// arrange
			const first = new Type("number");
			const second = new MaybeType(new Type("number"));

			// act, assert
			expect(first.equals(second)).to.be.false;
		});

		it("returns false if the types have not the same number of type parameters", function () {
			// arrange
			const first = new TestParametrizedType("number");
			const second = new TestParametrizedType("array", new Type("number"));

			// act, assert
			expect(first.equals(second)).to.be.false;
		});

		it("returns false if the parameter types are not equal", function () {
			// arrange
			const first = new TestParametrizedType("array", new MaybeType(new Type("number")));
			const second = new TestParametrizedType("array", new Type("number"));

			// act, assert
			expect(first.equals(second)).to.be.false;
		});
	});
});


class TestParametrizedType extends ParametrizedType {
	constructor(name, ...typeParameters) {
		super(name);
		this._typeParameters = typeParameters;
	}

	get typeParameters() {
		return this._typeParameters;
	}

	set typeParameters(value) {
		this._typeParameters = value;
	}
}

