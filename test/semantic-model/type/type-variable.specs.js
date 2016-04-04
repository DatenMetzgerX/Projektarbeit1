import {expect} from "chai";
import {TypeVariable} from "../../../lib/semantic-model/types/index";

describe("TypeVariable", function () {
	describe("isTypeVariable", function () {
		it("returns true", function () {
			expect(new TypeVariable().isTypeVariable).to.be.true;
		});
	});

	describe("isBaseType", function () {
		it("returns false", function () {
			expect(new TypeVariable().isBaseType).to.be.false;
		});
	});

	describe("equals", function () {
		it("returns true if the same instance is passed", function () {
			// arrange
			const variable = new TypeVariable();

			// act, assert
			expect(variable.equals(variable)).to.be.true;
		});

		it("returns false if another instance is  passed", function () {
			// arrange
			const first = new TypeVariable();
			const second = new TypeVariable();

			// act, assert
			expect(first.equals(second)).to.be.false;
		});
	});
});