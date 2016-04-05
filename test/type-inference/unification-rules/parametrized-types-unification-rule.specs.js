import {expect} from "chai";
import sinon from "sinon";

import ParametrizedTypesUnificationRule from "../../../lib/type-inference/unification-rules/parametrized-types-unification-rule";
import {NumberType, ParametrizedType, StringType} from "../../../lib/semantic-model/types/index";
import {RefinementContext} from "../../../lib/type-inference/refinment-context";

describe("ParametrizedTypesUnificationRule", function () {
	let rule, context;

	beforeEach(function () {
		rule = new ParametrizedTypesUnificationRule();
		context = new RefinementContext();
		sinon.stub(context, "unify");
	});

	describe("canUnify", function () {
		it("returns true if both types are parametrized types", function () {
			// arrange
			const t1 = new TestParametrizedType("Maybe", new NumberType());
			const t2 = new TestParametrizedType("Maybe", new StringType());

			// act, assert
			expect(rule.canUnify(t1, t2)).to.be.true;
		});

		it("returns false if t1 not a parametrized type", function () {
			// arrange
			const t1 = new StringType();
			const t2 = new TestParametrizedType("Maybe", new NumberType());

			// act, assert
			expect(rule.canUnify(t1, t2)).to.be.false;
		});

		it("returns false if t2 not a parametrized type", function () {
			// arrange
			const t1 = new TestParametrizedType("Maybe", new NumberType());
			const t2 = new StringType();

			// act, assert
			expect(rule.canUnify(t1, t2)).to.be.false;
		});
	});

	describe("unify", function () {
		it("returns t1 if the type parameters are equal", function () {
			// arrange
			const typeParameter1 = new NumberType();
			const typeParameter2 = new NumberType();
			const t1 = new TestParametrizedType("Maybe", typeParameter1);
			const t2 = new TestParametrizedType("Maybe", typeParameter2);

			// act, assert
			expect(rule.unify(t1, t2, context)).to.equal(t1);
		});

		it("unifies all type parameters", function () {
			// arrange
			const typeParameter1 = new NumberType();
			const typeParameter2 = new NumberType();

			const t1 = new TestParametrizedType("Maybe", typeParameter1);
			const t2 = new TestParametrizedType("Maybe", typeParameter2);

			// act
			rule.unify(t1, t2, context);

			// assert
			sinon.assert.calledWith(context.unify, typeParameter1, typeParameter2);
		});

		it("fails if the types have not the same number of type parameters", function () {
			const t1 = new TestParametrizedType("Maybe", new NumberType());
			const t2 = new TestParametrizedType("Maybe", new NumberType(), new StringType());

			// act, assert
			expect(() => rule.unify(t1, t2, context)).to.throw("Unification for type 'Maybe<number>' and 'Maybe<number, string>' failed because the parametrized types have a different number of type parameters and therefore cannot be unified.");
		});
	});
});

class TestParametrizedType extends ParametrizedType {
	constructor(name, ...typeParameters) {
		super(name);
		this._typeParameters = typeParameters;
	}

	get typeParameters() {
		return this._typeParameters;
	}

	set typeParameters(value) {
		this._typeParameters = value;
	}
}
