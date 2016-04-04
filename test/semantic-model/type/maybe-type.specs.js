import {expect} from "chai";
import Immutable from "immutable";
import {Type, MaybeType} from "../../../lib/semantic-model/types/index";

describe("MaybeType", function () {
	it("sets the of type as type parameter", function () {
		// arrange
		const number = new Type("number");

		// act
		const maybe = new MaybeType(number);

		// assert
		expect(maybe.typeParameters).to.deep.equal(Immutable.List.of(number));
	});
});