import {expect} from "chai";

import {Symbol} from "../../../lib/semantic-model/symbol";
import {StringType, FunctionType} from "../../../lib/semantic-model/types";

describe("StringType", function () {
	describe("getType", function () {
		it ("returns the type for built in functions", function () {
			// arrange
			const sType = StringType.create();

			// act
			const trim = sType.getType(new Symbol("trim"));

			// assert
			expect(trim).to.be.instanceOf(FunctionType);
			expect(trim.thisType).to.be.instanceOf(StringType);
			expect(trim.params).to.be.empty;
			expect(trim.returnType).to.be.instanceOf(StringType);
		});

		it("returns undefined for not existing properties", function () {
			// arrange
			const sType = StringType.create();

			// act, assert
			expect(sType.getType(new Symbol("trim2"))).to.be.undefined;
		});
	});

	describe("hasProperty", function () {
		it("returns true for built in types", function () {
			// arrange
			const sType = StringType.create();

			// act, assert
			expect(sType.hasProperty(new Symbol("trim"))).to.be.true;
		});

		it("returns false for not existing properties", function () {
			// arrange
			const sType = StringType.create();

			// act, assert
			expect(sType.hasProperty(new Symbol("trim2"))).to.be.false;
		});
	});

	describe("setType", function () {
		it("throws if a property of the build in type should be changed", function () {
			// arrange
			const sType = StringType.create();

			// act, assert
			expect(() => sType.setType(new Symbol("trim"), StringType.create())).to.throw("Cannot modify properties of the built in type string");
		});
	});
});