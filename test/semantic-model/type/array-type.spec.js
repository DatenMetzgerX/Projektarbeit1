import {expect} from "chai";

import {Symbol, SymbolFlags} from "../../../lib/semantic-model/symbol";
import {ArrayType, StringType, MaybeType, NumberType, TypeVariable} from "../../../lib/semantic-model/types";

describe("ArrayType", function () {
	describe("prettyName", function () {
		it("returns T[] where T is the type of the array", function () {
			expect(ArrayType.of(StringType.create()).prettyName).to.equals("string[]");
		});
	});

	describe("isSubType", function () {
		it("returns true if the array types are equal", function () {
			// arrange
			const a1 = ArrayType.of(StringType.create());
			const a2 = ArrayType.of(StringType.create());

			// act, assert
			expect(a1.isSubType(a2)).to.be.true;
			expect(a2.isSubType(a1)).to.be.true;
		});

		it("returns true for T[].isSubType(S[]) if S is a subtype of T", function () {
			// arrange
			const a1 = ArrayType.of(MaybeType.of(StringType.create()));
			const a2 = ArrayType.of(StringType.create());

			// act, assert
			expect(a1.isSubType(a2)).to.be.true;
		});

		it("returns false for T[].isSubType(U[]) where U is not a subtype of T", function () {
			// arrange
			const a1 = ArrayType.of(StringType.create());
			const a2 = ArrayType.of(NumberType.create());

			// act, assert
			expect(a1.isSubType(a2)).to.be.false;
		});
	});

	describe("substitute", function () {
		it("returns the new type if the type to substitute is this", function () {
			// arrange
			const tOld = ArrayType.of(new TypeVariable());
			const tNew = ArrayType.of(StringType.create());

			// act, assert
			expect(tOld.substitute(tOld, tNew)).to.equals(tNew);
		});

		it("substitutes the type in the of type parameter", function () {
			// arrange
			const array = ArrayType.of(new TypeVariable());
			const ofNew = StringType.create();

			// act, assert
			expect(array.substitute(array.of, ofNew)).to.be.an.instanceOf(ArrayType).that.has.property("of").that.is.an.instanceOf(StringType);
		});

		it("returns this if the type does not occurr in this", function () {
			// arrange
			const array = ArrayType.of(StringType.create());

			// act, assert
			expect(array.substitute(new TypeVariable(), NumberType.create())).to.equals(array);
		});

		it("substitutes the type in the properties of the type", function () {
			// arrange
			const description = new Symbol("description", SymbolFlags.Property & SymbolFlags.Function);
			const array = ArrayType.of(StringType.create())
							.addProperty(description, new TypeVariable());
			const newPropertyType = StringType.create();

			// act, assert
			const substituted = array.substitute(array.getType(description), newPropertyType);
			expect(substituted.getType(description)).to.equals(newPropertyType);
		});
	});

	describe("containsType", function () {
		it("returns true if the type is contained in the of type", function () {
			// arrange
			const array = ArrayType.of(new TypeVariable());

			// act, assert
			expect(array.containsType(array.of)).to.be.true;
		});

		it("returns false if the type is not contained in the of type or in any property", function () {
			// arrange
			const array = ArrayType.of(new TypeVariable());

			// act, assert
			expect(array.containsType(StringType.create())).to.be.false;
		});

		it("returns true if the type is contained in a property", function () {
			// arrange
			const description = new Symbol("description", SymbolFlags.Property & SymbolFlags.Function);
			const array = ArrayType.of(StringType.create())
				.addProperty(description, new TypeVariable());

			// act, assert
			expect(array.containsType(array.getType(description))).to.be.true;
		});
	});

	describe("equals", function () {
		it("returns true if the type has the same properties and has the same element type", function () {
			// arrange
			const description = new Symbol("description", SymbolFlags.Property & SymbolFlags.Function);
			const array1 = ArrayType.of(StringType.create())
				.addProperty(description, StringType.create());

			const array2 = ArrayType.of(StringType.create())
				.addProperty(description, StringType.create());

			// act, assert
			expect(array1.equals(array2)).to.be.true;
			expect(array2.equals(array1)).to.be.true;
		});

		it("is false if the element type of the arrays does not match", function () {
			// arrange
			const description = new Symbol("description", SymbolFlags.Property & SymbolFlags.Function);
			const array1 = ArrayType.of(StringType.create())
				.addProperty(description, StringType.create());

			const array2 = ArrayType.of(NumberType.create())
				.addProperty(description, StringType.create());

			// act, assert
			expect(array1.equals(array2)).to.be.false;
			expect(array2.equals(array1)).to.be.false;
		});

		it("is false if the type of a property is not equal", function () {
			// arrange
			const description = new Symbol("description", SymbolFlags.Property & SymbolFlags.Function);
			const array1 = ArrayType.of(StringType.create())
				.addProperty(description, StringType.create());

			const array2 = ArrayType.of(StringType.create())
				.addProperty(description, NumberType.create());

			// act, assert
			expect(array1.equals(array2)).to.be.false;
			expect(array2.equals(array1)).to.be.false;
		});
	});

	describe("hasProperty", function () {
		it("returns true for built in properties", function () {
			// arrange
			const array = ArrayType.of(StringType.create());

			// act, assert
			expect(array.hasProperty(new Symbol("length"))).to.be.true;
		});

		it("returns false if the array has neither a built in property nor a custom property with the given name", function () {
			// arrange
			const array = ArrayType.of(StringType.create());

			// act, assert
			expect(array.hasProperty(new Symbol("blabla"))).to.be.false;
		});

		it("returns true if the array has a custom property with the given name", function () {
			// arrange
			const array = ArrayType.of(StringType.create())
				.addProperty(new Symbol("bla"), StringType.create());

			// act, assert
			expect(array.hasProperty(new Symbol("bla"))).to.be.true;
		});
	});

	describe("addProperty", function () {
		it("throws if a built in property should be redefined", function () {
			// arrange
			const array = ArrayType.of(StringType.create());

			// act, assert
			expect(() => array.addProperty(new Symbol("length"), NumberType.create())).to.throw("A property with the name 'length' already exists");
		});
	});

	describe("getType", function () {
		it("returns the type of the built in property if the symbol is for a built in property", function () {
			// arrange
			const array = ArrayType.of(StringType.create());

			// act
			const length = array.getType(new Symbol("length"));

			// assert
			expect(length).to.be.instanceOf(NumberType);
		});

		it("returns the type of the custom property if the symbol is not for a built in property", function () {
			// arrange
			const array = ArrayType.of(StringType.create())
				.addProperty(new Symbol("bla"), NumberType.create());

			// act, assert
			expect(array.getType(new Symbol("bla"))).to.be.instanceOf(NumberType);
		});

		it("returns the array type if the symbol is a computed symbol", function () {
			// arrange
			const array = ArrayType.of(StringType.create());

			// act, assert
			expect(array.getType(Symbol.COMPUTED)).to.be.instanceOf(StringType);
		});

		it("returns undefined if neither a built in nor custom property with the given symbole exists", function () {
			// arrange
			const array = ArrayType.of(StringType.create());

			// act, assert
			expect(array.getType(new Symbol("bla"))).to.be.undefined;
		});
	});

	describe("setType", function () {
		it("changes the type of the array if the symbol is computed (e.g. a[i], a[2]...)", function () {
			// arrange
			const array = ArrayType.of(TypeVariable.create());

			// act
			const updated = array.setType(Symbol.COMPUTED, NumberType.create());

			// assert
			expect(updated).to.have.property("of").that.is.an.instanceOf(NumberType).and.not.to.equals(array);
		});

		it("returns a new array with the updated property", function () {
			// arrange
			const array = ArrayType.of(TypeVariable.create())
				.addProperty(new Symbol("bla"), TypeVariable.create());

			// act
			const updated = array.setType(new Symbol("bla"), NumberType.create());

			// assert
			expect(updated.getType(new Symbol("bla"))).to.be.an.instanceOf(NumberType);
			expect(updated).not.to.equals(array);
		});

		it("throws if the type of a built in operation should be changed", function () {
			// arrange
			const array = ArrayType.of(TypeVariable.create());

			// act, assert
			expect(() => array.setType(new Symbol("length"), StringType.create())).to.throw("The type of the built in array property \'length\' cannot be changed");
		});
	});
});