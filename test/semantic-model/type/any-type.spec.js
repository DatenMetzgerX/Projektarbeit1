import {expect} from "chai";

import {AnyType, StringType, NullType} from "../../../lib/semantic-model/types";

describe("AnyType", function () {
	describe("isSubType", function () {
		it("returns true", function () {
			expect(AnyType.create().isSubType(StringType.create())).to.be.true;
			expect(AnyType.create().isSubType(NullType.create())).to.be.true;
		});
	});
});