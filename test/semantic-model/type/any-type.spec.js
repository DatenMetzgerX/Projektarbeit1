import {expect} from "chai";

import {AnyType, StringType, NullType} from "../../../lib/semantic-model/types";

describe("AnyType", function () {
	describe("isSubType", function () {
		it("returns true", function () {
			expect(new AnyType().isSubType(new StringType())).to.be.true;
			expect(new AnyType().isSubType(new NullType())).to.be.true;
		});
	});
});