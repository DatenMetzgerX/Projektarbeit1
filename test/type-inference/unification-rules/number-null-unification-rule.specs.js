import {expect} from "chai";

import NumberNullUnificationRule from "../../../lib/type-inference/unification-rules/number-null-unification-rule";
import {NullType, NumberType, Type, MaybeType} from "../../../lib/semantic-model/types/index";

describe("NullMaybeUnificationRule", function () {
	let rule;

	beforeEach(function () {
		rule = new NumberNullUnificationRule();
	});

	describe("canUnify", function () {
		it("returns true if t1 is number type and t2 is null type", function () {
			expect(rule.canUnify(new NumberType(), new NullType())).to.be.true;
		});

		it("returns true if t1 is null type and t2 is maybe type", function () {
			expect(rule.canUnify(new NullType(), new NumberType())).to.be.true;
		});

		it("returns false if t1 is neither null nor number type", function () {
			expect(rule.canUnify(new Type("string"), new NumberType())).to.be.false;
		});

		it("returns false if t2 is neither null nor maybe type", function () {
			expect(rule.canUnify(new NumberType(), new Type("string"))).to.be.false;
		});
	});

	describe("unify", function () {
		it("returns Maybe<number> type", function () {
			// act, assert
			expect(rule.unify(new NumberType(), new NullType())).to.be.instanceOf(MaybeType);
		});
	});
});