import {expect} from "chai";

import {Symbol, SymbolFlags} from "../../../lib/semantic-model/symbol";
import {Type, MaybeType, NumberType, ObjectType, StringType, NullType, VoidType} from "../../../lib/semantic-model/types";

describe("MaybeType", function () {
	it("of contains the type parameter", function () {
		// arrange
		const number = new Type("number");

		// act
		const maybe = new MaybeType(number);

		// assert
		expect(maybe.of).to.equal(number);
	});

	describe("typeParameters", function () {
		it ("returns an array containing the of type", function () {
			// arrange
			const number = new Type("number");

			// act
			const maybe = new MaybeType(number);

			// assert
			expect(maybe.typeParameters).to.deep.equal([number]);
		});
	});

	describe("withTypeParameters", function () {
		it("returns a new instance with the specified id", function () {
			// arrange
			const maybe = new MaybeType(new Type("number"));

			// act
			const newMaybe = maybe.withTypeParameters([new Type("string")], maybe.id);

			// assert
			expect(newMaybe).not.to.be.equal(maybe);
			expect(newMaybe.id).to.be.equal(maybe.id);
		});

		it("is a maybe of the new type parameter", function () {
			// arrange
			const maybe = new MaybeType(new Type("string"));
			const number = new Type("number");

			// act
			const newMaybe = maybe.withTypeParameters([number]);

			// assert
			expect(newMaybe.of).to.equal(number);
		});
	});

	describe("isSubType", function () {
		it("returns true for Maybe<T>.isSubType(Maybe<T>)", function () {
			// arrange
			const maybe1 = new MaybeType(new NumberType());
			const maybe2 = new MaybeType(new NumberType());

			// act, assert
			expect(maybe1.isSubType(maybe2)).to.be.true;
		});

		it("returns true for Maybe<T> and Maybe<S> where S is subtype of T", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Property);
			const age = new Symbol("age", SymbolFlags.Property);
			const maybe1 = new MaybeType(ObjectType.create([[name, new StringType()]]));
			const maybe2 = new MaybeType(ObjectType.create([[name, new StringType()], [age, new NumberType() ]]));

			// act, assert
			expect(maybe1.isSubType(maybe2)).to.be.true;
		});

		it("returns false for Maybe<T> and Maybe<S> where S is NOT a subtype of T", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Property);
			const age = new Symbol("age", SymbolFlags.Property);
			const maybe1 = new MaybeType(ObjectType.create([[name, new StringType()]]));
			const maybe2 = new MaybeType(ObjectType.create([[age, new NumberType() ]]));

			// act, assert
			expect(maybe1.isSubType(maybe2)).to.be.false;
		});

		it("returns true for null", function () {
			expect(new MaybeType(new StringType()).isSubType(new NullType())).to.be.true;
		});

		it("returns true for void", function () {
			expect(new MaybeType(new StringType()).isSubType(new VoidType())).to.be.true;
		});

		it("returns true for Maybe<T>.isSubType(T)", function () {
			// arrange
			const maybe1 = new MaybeType(new NumberType());

			// act, assert
			expect(maybe1.isSubType(new NumberType())).to.be.true;
		});

		it("returns false for Maybe<T>.isSubType(U) where U is NOT a subtype of T", function () {
			// arrange
			const maybe1 = new MaybeType(new NumberType());

			// act, assert
			expect(maybe1.isSubType(new StringType())).to.be.false;
		});
	});
});