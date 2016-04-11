import {expect} from "chai";

import AnyUnificationRule from "../../../lib/type-inference/unification-rules/any-unification-rule";
import {NumberType, AnyType} from "../../../lib/semantic-model/types/index";

describe("AnyUnificationRule", function () {
	let rule;

	beforeEach(function () {
		rule = new AnyUnificationRule();
	});

	describe("canUnify", function () {
		it("returns true if t1 is an any type", function () {
			expect(rule.canUnify(new AnyType(), new NumberType())).to.be.true;
		});

		it("returns true if t2 is an any type", function () {
			expect(rule.canUnify(new NumberType(), new AnyType())).to.be.true;
		});

		it("returns false if neither t1 nor t2 is an any type", function () {
			expect(rule.canUnify(new NumberType(), new NumberType())).to.be.false;
		});
	});

	describe("unify", function () {
		it("returns any", function () {
			// act, assert
			expect(rule.unify(new NumberType(), new AnyType())).to.be.instanceOf(AnyType);
		});
	});
});