import {expect} from "chai";

import {TUndefinedUnificationRule} from "../../../lib/type-inference/unification-rules/t-undefined-unification-rule";
import {StringType, VoidType} from "../../../lib/semantic-model/types";

describe("TUndefinedUnificationRule", function () {
	let rule;

	beforeEach(function () {
		rule = new TUndefinedUnificationRule();
	});

	describe("canUnify", function () {
		it("returns true if one of the types is undefined", function () {
			expect(rule.canUnify(StringType.create(), VoidType.create())).to.be.true;
			expect(rule.canUnify(VoidType.create(), StringType.create())).to.be.true;
		});

		it("returns false if neither of the types is VoidType", function () {
			expect(rule.canUnify(StringType.create(), StringType.create())).to.be.false;
		});
	});

	describe("unify", function () {
		it ("returns t1 if t2 is VoidType", function () {
			// arrange
			const t1 = StringType.create();
			const t2 = VoidType.create();

			// assert
			expect(rule.unify(t1, t2)).to.equal(t1);
		});

		it ("returns t2 if t1 is VoidType", function () {
			// arrange
			const t1 = VoidType.create();
			const t2 = StringType.create();

			// assert
			expect(rule.unify(t1, t2)).to.equal(t2);
		});
	});
});