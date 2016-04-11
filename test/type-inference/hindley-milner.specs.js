import {expect} from "chai";
import sinon from "sinon";

import {HindleyMilner} from "../../lib/type-inference/hindley-milner";
import {TypeEnvironment} from "../../lib/type-inference/type-environment";
import {TypeUnificator} from "../../lib/type-inference/type-unificator";
import {Program} from "../../lib/semantic-model/program";
import {NumberType, TypeVariable, StringType, NullType, MaybeType} from "../../lib/semantic-model/types";
import {RefinementContext} from "../../lib/type-inference/refinment-context";
import {UnificationError} from "../../lib/type-inference/type-unificator";
import {SymbolFlags, Symbol} from "../../lib/semantic-model/symbol";

describe("HindleyMilner", function () {
	let hindleyMilner, refineRule1, refineRule2, typeEnvironment, typeUnificator, program;

	beforeEach(function () {
		refineRule1 = { canRefine: sinon.stub(), refine: sinon.stub() };
		refineRule2 = { canRefine: sinon.stub(), refine: sinon.stub() };
		typeEnvironment = new TypeEnvironment();
		typeUnificator = new TypeUnificator();
		program = new Program();
		hindleyMilner = new HindleyMilner(program, typeEnvironment, typeUnificator, [refineRule1, refineRule2]);
	});

	describe("refinementRules", function () {
		it("uses the refinement rules passed in the constructor", function () {
			expect(hindleyMilner.refinementRules.toArray()).to.deep.equal([refineRule1, refineRule2]);
		});

		it("loads the refinment rules from the refinment-rules directory by default", function () {
			// act
			hindleyMilner = new HindleyMilner(typeEnvironment, program, typeUnificator);

			// assert
			expect(hindleyMilner.refinementRules.toArray()).not.to.be.empty;
		});
	});

	describe("infer", function () {
		it("uses the refinement rule that can handle the given node type", function () {
			// arrange
			const node = {};
			refineRule1.canRefine.returns(false);
			refineRule2.canRefine.returns(true);
			refineRule2.refine.returns(new NumberType());

			// act
			const inferred = hindleyMilner.infer(node);

			// assert
			expect(inferred).to.be.instanceOf(NumberType);
			sinon.assert.calledWith(refineRule2.refine, node, sinon.match.instanceOf(RefinementContext));
		});

		it("throws an exception if no rule can handle the given node", function () {
			// arrange
			const node = {};
			refineRule1.canRefine.returns(false);
			refineRule2.canRefine.returns(false);

			// act, assert
			expect(() => hindleyMilner.infer(node)).to.throw("Type inference failure: There exists no refinement rule that can handle a node of type undefined");
		});

		it("throws an exception if more then one rule can handle the given node", function () {
			// arrange
			const node = {};
			refineRule1.canRefine.returns(true);
			refineRule2.canRefine.returns(true);

			// act, assert
			expect(() => hindleyMilner.infer(node)).to.throw("Type inference failure: The refinement rule to use for a node of type undefined is ambiguous");
		});
	});

	describe("unify", function () {
		it("uses the passed in unificator to unify two types", function () {
			// arrange
			const t1 = new NumberType();
			const t2 = new NumberType();
			sinon.stub(typeUnificator, "unify").returns(t1);

			// act
			const result = hindleyMilner.unify(t1, t2, {});

			// assert
			sinon.assert.calledWith(typeUnificator.unify, t1, t2);
			expect(result).to.equal(t1);
		});

		it("substitutes the type t1 with the returned type if they are not equal", function () {
			// arrange
			const t1 = new TypeVariable();
			const t2 = new NumberType();
			sinon.stub(typeUnificator, "unify").returns(t2);
			sinon.spy(typeEnvironment, "substitute");

			// act
			hindleyMilner.unify(t1, t2, {});

			// assert
			sinon.assert.calledWith(typeEnvironment.substitute, t1, t2);
		});

		it("substitutes the type t2 with the returned type after unification if they are not equal", function () {
			// arrange
			const t2 = new TypeVariable();
			const t1 = new NumberType();
			sinon.stub(typeUnificator, "unify").returns(t1);
			sinon.spy(typeEnvironment, "substitute");

			// act
			hindleyMilner.unify(t1, t2, {});

			// assert
			sinon.assert.calledWith(typeEnvironment.substitute, t2, t1);
		});

		it("substitutes the type variable t1 with the type variable t2 after unification", function () {
			// arrange
			const t1 = new TypeVariable();
			const t2 = new TypeVariable();
			sinon.stub(typeUnificator, "unify").returns(t2);
			sinon.spy(typeEnvironment, "substitute");

			// act
			hindleyMilner.unify(t1, t2, {});

			// assert
			sinon.assert.calledWith(typeEnvironment.substitute, t1, t2);
		});

		it("catches the unification errors and propagates the error as type inference error", function () {
			// arrange
			const t1 = new NumberType();
			const t2 = new NumberType();
			sinon.stub(typeUnificator, "unify").throws(new UnificationError(t1, t2, "Ooops..."));

			// act, assert
			expect(() => hindleyMilner.unify(t1, t2, {})).to.throw("Type inference failure: Unification for type 'number' and 'number' failed because Ooops...");
		});
	});

	describe("mergeWithTypeEnvironments", function () {
		it("unions the definitions of both type environments into a new returned type environment", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Variable);
			const age = new Symbol("age", SymbolFlags.Variable);

			const env1 = new TypeEnvironment().setType(name, new StringType());
			const env2 = new TypeEnvironment().setType(age, new NumberType());

			hindleyMilner.typeEnvironment = env1;

			// act
			const merged = hindleyMilner.mergeWithTypeEnvironments([env2], {});

			// assert
			expect(merged.getType(name)).to.be.instanceOf(StringType);
			expect(merged.getType(age)).to.be.instanceOf(NumberType);
		});

		it("unifies the types of conflicting definitions for the same symbol", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Variable);
			const age = new Symbol("age", SymbolFlags.Variable);

			const env1 = new TypeEnvironment().setType(name, new StringType());
			const env2 = new TypeEnvironment().setType(age, new NumberType())
				.setType(name, new NullType());

			sinon.stub(typeUnificator, "unify").withArgs(sinon.match.instanceOf(NullType), sinon.match.instanceOf(StringType)).returns(new MaybeType(new StringType()));

			hindleyMilner.typeEnvironment = env1;

			// act
			const merged = hindleyMilner.mergeWithTypeEnvironments([env2], {});

			// assert
			expect(merged.getType(name)).to.be.instanceOf(MaybeType);
			expect(merged.getType(age)).to.be.instanceOf(NumberType);
		});
	});
});