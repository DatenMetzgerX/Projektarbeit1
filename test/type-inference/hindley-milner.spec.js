import {expect} from "chai";
import sinon from "sinon";

import {HindleyMilner} from "../../lib/type-inference/hindley-milner";
import {TypeEnvironment} from "../../lib/type-inference/type-environment";
import {TypeUnificator} from "../../lib/type-inference/type-unificator";
import {Program} from "../../lib/semantic-model/program";
import {NumberType, TypeVariable, StringType, NullType, MaybeType} from "../../lib/semantic-model/types";
import {HindleyMilnerContext} from "../../lib/type-inference/hindley-milner-context";
import {UnificationError} from "../../lib/type-inference/type-unificator";
import {SymbolFlags, Symbol} from "../../lib/semantic-model/symbol";
import {TypeInferenceContext} from "../../lib/type-inference/type-inference-context";

describe("HindleyMilner", function () {
	let hindleyMilner, refineRule1, refineRule2, typeUnificator, program;

	beforeEach(function () {
		program = new Program();
		refineRule1 = { canRefine: sinon.stub(), refine: sinon.stub() };
		refineRule2 = { canRefine: sinon.stub(), refine: sinon.stub() };
		typeUnificator = new TypeUnificator();
		hindleyMilner = new HindleyMilner(typeUnificator, [refineRule1, refineRule2]);
	});

	describe("refinementRules", function () {
		it("uses the refinement rules passed in the constructor", function () {
			expect(hindleyMilner.refinementRules.toArray()).to.deep.equal([refineRule1, refineRule2]);
		});

		it("loads the refinment rules from the refinment-rules directory by default", function () {
			// act
			hindleyMilner = new HindleyMilner(typeUnificator);

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
			refineRule2.refine.returns(NumberType.create());

			// act
			const inferred = hindleyMilner.infer(node, new HindleyMilnerContext({}, new TypeInferenceContext(program)));

			// assert
			expect(inferred).to.be.instanceOf(NumberType);
			sinon.assert.calledWith(refineRule2.refine, node, sinon.match.instanceOf(HindleyMilnerContext));
		});

		it("throws an exception if no rule can handle the given node", function () {
			// arrange
			const node = {};
			refineRule1.canRefine.returns(false);
			refineRule2.canRefine.returns(false);

			// act, assert
			expect(() => hindleyMilner.infer(node, new TypeInferenceContext(program))).to.throw("Type inference failure: There exists no refinement rule that can handle a node of type undefined");
		});

		it("throws an exception if more then one rule can handle the given node", function () {
			// arrange
			const node = {};
			refineRule1.canRefine.returns(true);
			refineRule2.canRefine.returns(true);

			// act, assert
			expect(() => hindleyMilner.infer(node, new TypeInferenceContext(program))).to.throw("Type inference failure: The refinement rule to use for a node of type undefined is ambiguous");
		});
	});

	describe("unify", function () {
		it("uses the passed in unificator to unify two types", function () {
			// arrange
			const t1 = NumberType.create();
			const t2 = NumberType.create();
			sinon.stub(typeUnificator, "unify").returns(t1);

			// act
			const result = hindleyMilner.unify(t1, t2, {}, new TypeInferenceContext(program));

			// assert
			sinon.assert.calledWith(typeUnificator.unify, t1, t2);
			expect(result).to.equal(t1);
		});

		it("substitutes the type t1 with the returned type if they are not equal", function () {
			// arrange
			const t1 = new TypeVariable();
			const t2 = NumberType.create();

			const context = new TypeInferenceContext(program);
			sinon.spy(context, "substitute");
			sinon.stub(typeUnificator, "unify").returns(t2);

			// act
			hindleyMilner.unify(t1, t2, {}, context);

			// assert
			sinon.assert.calledWith(context.substitute, t1, t2);
		});

		it("substitutes the type t2 with the returned type after unification if they are not equal", function () {
			// arrange
			const t2 = new TypeVariable();
			const t1 = NumberType.create();
			sinon.stub(typeUnificator, "unify").returns(t1);
			const context = new TypeInferenceContext(program);
			sinon.spy(context, "substitute");

			// act
			hindleyMilner.unify(t1, t2, {}, context);

			// assert
			sinon.assert.calledWith(context.substitute, t2, t1);
		});

		it("substitutes the type variable t1 with the type variable t2 after unification", function () {
			// arrange
			const t1 = new TypeVariable();
			const t2 = new TypeVariable();
			sinon.stub(typeUnificator, "unify").returns(t2);
			const context = new TypeInferenceContext(program);
			sinon.spy(context, "substitute");

			// act
			hindleyMilner.unify(t1, t2, {}, context);

			// assert
			sinon.assert.calledWith(context.substitute, t1, t2);
		});

		it("catches the unification errors and propagates the error as type inference error", function () {
			// arrange
			const t1 = NumberType.create();
			const t2 = NumberType.create();
			sinon.stub(typeUnificator, "unify").throws(new UnificationError(t1, t2, "Ooops..."));

			// act, assert
			expect(() => hindleyMilner.unify(t1, t2, {}, new TypeInferenceContext(program))).to.throw("Type inference failure: Unification for type 'number' and 'number' failed because Ooops...");
		});
	});

	describe("mergeWithTypeEnvironments", function () {
		it("unions the definitions of both type environments into a new returned type environment", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Variable);
			const age = new Symbol("age", SymbolFlags.Variable);

			const env1 = new TypeEnvironment().setType(name, StringType.create());
			const env2 = new TypeEnvironment().setType(age, NumberType.create());

			const context = new TypeInferenceContext(program, env1);

			// act
			hindleyMilner.mergeWithTypeEnvironments([env2], {}, context);

			// assert
			expect(context.getType(name)).to.be.instanceOf(StringType);
			expect(context.getType(age)).to.be.instanceOf(NumberType);
		});

		it("unifies the types of conflicting definitions for the same symbol", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Variable);
			const age = new Symbol("age", SymbolFlags.Variable);

			const env1 = new TypeEnvironment().setType(name, StringType.create());
			const env2 = new TypeEnvironment().setType(age, NumberType.create())
				.setType(name, NullType.create());

			sinon.stub(typeUnificator, "unify").withArgs(sinon.match.instanceOf(NullType), sinon.match.instanceOf(StringType)).returns(MaybeType.of(StringType.create()));

			const context = new TypeInferenceContext(program, env1);

			// act
			hindleyMilner.mergeWithTypeEnvironments([env2], {}, context);

			// assert
			expect(context.getType(name)).to.be.instanceOf(MaybeType);
			expect(context.getType(age)).to.be.instanceOf(NumberType);
		});
	});
});