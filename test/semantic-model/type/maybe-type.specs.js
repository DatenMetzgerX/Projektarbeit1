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

		it("updates the of type when setting the type parameters", function () {
			// arrange
			const maybe = new MaybeType(new Type("string"));
			const number = new Type("number");

			// act
			maybe.typeParameters = [number];

			// assert
			expect(maybe.of).to.equal(number);
		});
	});
});