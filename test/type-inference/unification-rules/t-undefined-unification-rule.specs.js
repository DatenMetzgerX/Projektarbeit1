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
			expect(rule.canUnify(new StringType(), new VoidType())).to.be.true;
			expect(rule.canUnify(new VoidType(), new StringType())).to.be.true;
		});

		it("returns false if neither of the types is VoidType", function () {
			expect(rule.canUnify(new StringType(), new StringType())).to.be.false;
		});
	});

	describe("unify", function () {
		it ("returns t1 if t2 is VoidType", function () {
			// arrange
			const t1 = new StringType();
			const t2 = new VoidType();

			// assert
			expect(rule.unify(t1, t2)).to.equal(t1);
		});

		it ("returns t2 if t1 is VoidType", function () {
			// arrange
			const t1 = new VoidType();
			const t2 = new StringType();

			// assert
			expect(rule.unify(t1, t2)).to.equal(t2);
		});
	});
});