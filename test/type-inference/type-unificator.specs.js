import {expect} from "chai";
import sinon from "sinon";
import {TypeUnificator} from "../../lib/type-inference/type-unificator";
import {TypeVariable, NumberType, MaybeType, Type} from "../../lib/semantic-model/types/index";


describe("TypeUnificator", function () {
	describe("common", function () {

		it("resolves the unification rules from the unification-rules directory", function () {
			// act
			const unificator = new TypeUnificator();

			// assert
			expect(unificator.baseTypeUnificationRules.toArray()).not.to.be.empty;
		});

		it("returns if the passed in types are equal", function () {
			// arrange
			const numberType = new Type("number");
			const otherNumberType = new Type("number");
			const unificator = new TypeUnificator();

			sinon.stub(numberType, "equals").returns(true);

			// act
			const unified = unificator.unify(numberType, otherNumberType);

			// assert
			expect(unified).to.equal(numberType);
		});

		it("unifies the resolved types and not on the passed in types", function () {
			// arrange
			const variable1 = new TypeVariable();
			variable1.resolvesTo(new Type("number"));

			const variable2 = new TypeVariable();
			variable2.resolvesTo(new Type("number"));

			const unificator = new TypeUnificator();

			// act
			const unified = unificator.unify(variable1, variable2);

			// assert
			expect(unified.name).to.equal("number");
		});
	});

	describe("unifying type variable with base type", function () {
		it("returns the base type when the first type is a base type and the second is a type variable", function () {
			// arrange
			const typeUnificator = new TypeUnificator();
			const typeVariable = new TypeVariable();
			const numberType = new NumberType();

			// act
			const unified = typeUnificator.unify(numberType, typeVariable);

			// assert
			expect(unified).to.equal(numberType);
			expect(typeVariable.resolved).to.equal(numberType);
		});

		it("returns the base type when the first type is a type variable and the second is a base type", function () {
			// arrange
			const typeUnificator = new TypeUnificator();
			const typeVariable = new TypeVariable();
			const numberType = new NumberType();

			// act
			const unified = typeUnificator.unify(typeVariable, numberType);

			// assert
			expect(unified).to.equal(numberType);
			expect(typeVariable.resolved).to.equal(numberType);
		});

		it("throws when the type variable is part of the other type definition with which it should be unified", function () {
			// arrange
			const typeUnificator = new TypeUnificator();
			const typeVariable = new TypeVariable();
			const maybeType = new MaybeType(typeVariable);

			// act, assert
			expect(() => typeUnificator.unify(maybeType, typeVariable)).to.throw("Unification for type '@ (1)' and 'Maybe<@ (1)>' failed because The type variable of t1 is contained inside of the type t2 and therefore cannot be replaced by t2.");
		});
	});

	describe("unifying two type variables", function () {
		it("resolves the first type variable to the second (t1 is an alias for t2)", function () {
			// arrange
			const typeUnificator = new TypeUnificator();
			const typeVariable = new TypeVariable();
			const secondTypeVariable = new TypeVariable();

			// act
			const unified = typeUnificator.unify(typeVariable, secondTypeVariable);

			// assert
			expect(unified).to.equal(secondTypeVariable);
			expect(typeVariable.resolved).to.equal(secondTypeVariable);
		});
	});

	describe("unifying two base types", function () {
		let typeUnificator, rule1, rule2;

		beforeEach(function () {
			rule1 = { canUnify: sinon.stub(), unify: sinon.stub()};
			rule2 = { canUnify: sinon.stub(), unify: sinon.stub()};
			typeUnificator = new TypeUnificator([rule1, rule2]);
		});

		it("uses the base unification rule that can unify the given two base types", function () {
			// arrange
			const numberType = new NumberType();
			const maybeType = new MaybeType(numberType);

			rule1.canUnify.returns(true);
			rule1.unify.returns(maybeType);

			rule2.canUnify.returns(false);

			// act
			const unified = typeUnificator.unify(numberType, maybeType);

			// assert
			sinon.assert.calledWith(rule1.unify, numberType, maybeType);
			expect(unified).to.equal(maybeType);
		});

		it("throws if no rule can be used for unifying the two base types", function () {
			// arrange
			const numberType = new NumberType();
			const maybeType = new MaybeType(numberType);

			rule1.canUnify.returns(false);
			rule2.canUnify.returns(false);

			// act, assert
			expect(() => typeUnificator.unify(numberType, maybeType)).to.throw("Unification for type 'number' and 'Maybe<number>' failed because there exists no rule that can be used to unify the given types.");
		});

		it("throws if when more then one rule can be used for unifying the two base types", function () {
			// arrange
			const numberType = new NumberType();
			const maybeType = new MaybeType(numberType);

			rule1.canUnify.returns(true);
			rule2.canUnify.returns(true);

			// act, assert
			expect(() => typeUnificator.unify(numberType, maybeType)).to.throw("Unification for type 'number' and 'Maybe<number>' failed because unification rule to use is ambiguous(Object,Object).");
		});
	});
});