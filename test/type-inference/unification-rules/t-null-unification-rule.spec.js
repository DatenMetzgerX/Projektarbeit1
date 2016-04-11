import {expect} from "chai";

import TNullUnificationRule from "../../../lib/type-inference/unification-rules/t-null-unification-rule";
import {NullType, NumberType, Type, MaybeType} from "../../../lib/semantic-model/types/index";

describe("TNullUnificationRule", function () {
	let rule;

	beforeEach(function () {
		rule = new TNullUnificationRule();
	});

	describe("canUnify", function () {
		it("returns true if t1 is null type", function () {
			expect(rule.canUnify(new NumberType(), new NullType())).to.be.true;
		});

		it("returns true if t2 is null type", function () {
			expect(rule.canUnify(new NullType(), new NumberType())).to.be.true;
		});

		it("returns false if t1 null but t2 is maybe type", function () {
			expect(rule.canUnify(new NullType(), new MaybeType(new Type("string")))).to.be.false;
		});

		it("returns false if t2 is null type but t1 is maybe type", function () {
			expect(rule.canUnify(new MaybeType(new Type("string")), new NullType())).to.be.false;
		});

		it("returns false if neither t1 nor t2 is null type", function () {
			expect(rule.canUnify(new NumberType(), new Type("string"))).to.be.false;
		});
	});

	describe("unify", function () {
		it("returns Maybe<T> type", function () {
			// act, assert
			expect(rule.unify(new NumberType(), new NullType())).to.be.instanceOf(MaybeType).and.to.have.property("of").that.is.an.instanceOf(NumberType);
			expect(rule.unify(new NullType(), new NumberType())).to.be.instanceOf(MaybeType).and.to.have.property("of").that.is.an.instanceOf(NumberType);
		});
	});
});