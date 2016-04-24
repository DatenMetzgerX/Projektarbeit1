import {expect} from "chai";

import NullMaybeUnificationRule from "../../../lib/type-inference/unification-rules/null-maybe-unification-rule";
import {NullType, MaybeType, Type} from "../../../lib/semantic-model/types/index";

describe("NullMaybeUnificationRule", function () {
	let rule;

	beforeEach(function () {
		rule = new NullMaybeUnificationRule();
	});

	describe("canUnify", function () {
		it("returns true if t1 is maybe type and t2 is null type", function () {
			expect(rule.canUnify(MaybeType.of(new Type("number")), NullType.create())).to.be.true;
		});

		it("returns true if t1 is null type and t2 is maybe type", function () {
			expect(rule.canUnify(NullType.create(), MaybeType.of(new Type("number")))).to.be.true;
		});

		it("returns false if t1 is neither null nor maybe type", function () {
			expect(rule.canUnify(new Type("number"), MaybeType.of(new Type("number")))).to.be.false;
		});

		it("returns false if t2 is neither null nor maybe type", function () {
			expect(rule.canUnify(MaybeType.of(new Type("number")), new Type("number"))).to.be.false;
		});
	});

	describe("unify", function () {
		it("returns the t1 if t1 is the maybe type", function () {
			// arrange
			const maybe = MaybeType.of(new Type("number"));

			// act, assert
			expect(rule.unify(maybe, NullType.create())).to.equal(maybe);
		});

		it("returns the t2 if t2 is the maybe type", function () {
			// arrange
			const maybe = MaybeType.of(new Type("number"));

			// act, assert
			expect(rule.unify(NullType.create(), maybe)).to.equal(maybe);
		});
	});
});