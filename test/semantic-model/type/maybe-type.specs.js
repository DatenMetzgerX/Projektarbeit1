import {expect} from "chai";
import {Type, MaybeType} from "../../../lib/semantic-model/types/index";

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
});