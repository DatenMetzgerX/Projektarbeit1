import {expect} from "chai";

import TMaybeUnificationRule from "../../../lib/type-inference/unification-rules/t-maybe-unification-rule";
import {NullType, MaybeType, Type, StringType, NumberType} from "../../../lib/semantic-model/types/index";
import {TypeUnificator} from "../../../lib/type-inference/type-unificator";

describe("TMaybeUnificationRule", function () {
	let rule;
	let unificator;

	beforeEach(function () {
		rule = new TMaybeUnificationRule();
		unificator = new TypeUnificator([rule]);
	});

	describe("canUnify", function () {
		it("returns true if t1 is a maybe type and t2 is another type", function () {
			expect(rule.canUnify(MaybeType.of(new Type("number")), new Type("number"))).to.be.true;
		});

		it("returns true if t1 is another type and t2 is maybe type", function () {
			expect(rule.canUnify(new Type("number"), MaybeType.of(new Type("number")))).to.be.true;
		});

		it("returns false if neither t1 nor t2 are a maybe type", function () {
			expect(rule.canUnify(new Type("number"), new Type("string"))).to.be.false;
		});

		it("returns false if one type is a maybe type and the other is the null type (this case is handled by null-maybe-unification)", function () {
			expect(rule.canUnify(MaybeType.of(new Type("number")), NullType.create())).to.be.false;
		});
	});

	describe("unify", function () {
		it("returns the maybe type", function () {
			// arrange
			const maybe = MaybeType.of(new Type("number"));

			// act, assert
			expect(rule.unify(maybe, new Type("number"), unificator)).to.equal(maybe);
		});

		it("fails if MaybeType.of cannot be unified with the other type", function () {
			// arrange
			const maybe = MaybeType.of(NumberType.create("number"));

			// act, assert
			expect(() => rule.unify(new StringType(), maybe, unificator)).to.throw("Unification for type 'string' and 'number' failed because there exists no rule that can be used to unify the given types.");
		});
	});
});