import {expect} from "chai";
import {Type, MaybeType, TypeVariable} from "../../../lib/semantic-model/types/index";

describe("Type", function () {
	it("initializes the type parameters to an empty list by default", function () {
		// arrange
		const type = new Type("number");

		// assert
		expect(type.typeParameters.toArray()).to.be.empty;
	});

	describe("resolved", function () {
		it("returns the type itself if the type has not been resolved to another type", function () {
			// arrange
			const numberType = new Type("number");

			// assert
			expect(numberType.resolved).to.equal(numberType);
		});

		it("returns the resolved type if this type has been resolved", function () {
			// arrange
			const numberType = new Type("number");
			const maybeType = new Type("maybe");

			maybeType.resolvesTo(numberType);

			// assert
			expect(maybeType.resolved).to.equal(numberType);
		});

		it("returns the resolved 'resolved type' if this type has been resolved and the resolved type has been resolved to", function () {
			// arrange
			const typeVariable = new Type("@");
			const numberType = new Type("number");
			const maybeType = new Type("maybe");

			typeVariable.resolvesTo(maybeType);
			maybeType.resolvesTo(numberType);

			// assert
			expect(typeVariable.resolved).to.equal(numberType);
		});
	});

	describe("resolveDeep", function () {
		it("returns the resolved type", function () {
			// arrange
			const numberType = new Type("number");
			const variable = new TypeVariable();

			variable.resolvesTo(numberType);

			// assert
			expect(variable.resolveDeep()).to.equal(numberType);
		});

		it("resolves all type parameters too", function () {
			// arrange
			const numberType = new Type("number");
			const thisType = new Type("this");
			const returnType = new Type("return");
			const param1 = new Type("@");

			const functionType = new Type("Function", thisType, param1, returnType);
			param1.resolvesTo(numberType);

			// act
			const deepResolved = functionType.resolveDeep();

			// assert
			expect(deepResolved.typeParameters.toArray()).to.deep.equal([thisType, numberType, returnType]);
		});
	});

	describe("resolvesTo", function () {
		it("does not set the resolved to if the type to which it resolves is the same as this type", function () {
			const numberType = new Type("number");

			numberType.resolvesTo(numberType);

			// assert
			expect(numberType.resolved).to.equal(numberType);
		});
	});

	describe("isTypeVariable", function () {
		it("returns false", function () {
			// arrange
			const numberType = new Type("number");

			// act, assert
			expect(numberType.isTypeVariable).to.be.false;
		});
	});

	describe("isBaseType", function () {
		it ("returns true by default", function () {
			// arrange
			const numberType = new Type("number");

			// assert
			expect(numberType.isBaseType).to.be.true;
		});
	});

	describe("occursIn", function () {
		it("returns false for two different type instances", function () {
			// arrange
			const t1 = new Type("number");
			const t2 = new Type("number");

			// act, assert
			expect(t1.occursIn(t2)).to.be.false;
		});

		it("returns true if the two types are the same instance and therefore equal", function () {
			// arrange
			const t1 = new Type("number");

			// act, assert
			expect(t1.occursIn(t1)).to.be.true;
		});

		it("returns true if the type occurs in a type parameter of the other type", function () {
			// arrange
			const t1 = new Type("number");
			const t2 = new Type("number", t1);

			// act, assert
			expect(t1.occursIn(t2)).to.be.true;
		});

		it("returns true if the type occurs in a type parameter of a type parameter", function () {
			// arrange
			const t1 = new Type("number");
			const t2 = new Type("maybe", t1);
			const t3 = new Type("array", t2);

			// act, assert
			expect(t1.occursIn(t3)).to.be.true;
		});
	});

	describe("toString", function () {
		it("returns the name of the type", function () {
			// arrange
			const t1 = new Type("number");

			// act, assert
			expect(t1.toString()).to.equal("number");
		});

		it("returns the path to the resolved type if this type resolves to another type", function () {
			// arrange
			const t1 = new Type("@");
			t1.resolvesTo(new Type("number"));

			// act, assert
			expect(t1.toString()).to.equal("@ -> number");
		});

		it("contains the type parameters", function () {
			// arrange
			const t1 = new Type("Function", new Type("number"), new Type("string"));

			// act, assert
			expect(t1.toString()).to.equal("Function<number, string>");
		});
	});

	describe("isSameType", function () {
		it("returns true if both types have the same constructor (are from the same type)", function () {
			// arrange
			const first = new Type("number");
			const second = new Type("number");

			// act, assert
			expect(first.isSameType(second)).to.be.true;
		});

		it("returns true if both types have the same constructor but different type parameters", function () {
			// arrange
			const numberType = new Type("number");
			const stringType = new Type("string");
			const first = new Type("array", numberType);
			const second = new Type("array", stringType);

			// act, assert
			expect(first.isSameType(second)).to.be.true;
		});

		it("returns false if the types have not the same constructors", function () {
			// arrange
			const first = new Type("number");
			const second = new MaybeType(new Type("number"));

			// act, assert
			expect(first.isSameType(second)).to.be.false;
		});
	});

	describe("equals", function () {
		it("returns true if this is compared with itself", function () {
			// arrange
			const type = new Type("number");

			// act, assert
			expect(type.equals(type)).to.be.true;
		});

		it("returns true if both types are from the same types and have the same type parameters", function () {
			// arrange
			const numberType = new Type("number");
			const first = new MaybeType(numberType);
			const second = new MaybeType(numberType);

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
			const first = new Type("number");
			const second = new Type("array", new Type("number"));

			// act, assert
			expect(first.equals(second)).to.be.false;
		});

		it("returns false if the parameter types are not equal", function () {
			// arrange
			const first = new Type("array", new MaybeType(new Type("number")));
			const second = new Type("array", new Type("number"));

			// act, assert
			expect(first.equals(second)).to.be.false;
		});
	});
});
