import {expect} from "chai";
import sinon from "sinon";

import {HindleyMilner} from "../../lib/type-inference/hindley-milner";
import {TypeEnvironment} from "../../lib/type-inference/type-environment";
import {TypeUnificator} from "../../lib/type-inference/type-unificator";
import {Program} from "../../lib/semantic-model/program";
import {NumberType} from "../../lib/semantic-model/types";
import {RefinementContext} from "../../lib/type-inference/refinment-context";
import {UnificationError} from "../../lib/type-inference/type-unificator";

describe("HindleyMilner", function () {
	let hindleyMilner, refineRule1, refineRule2, typeEnvironment, typeUnificator, program;

	beforeEach(function () {
		refineRule1 = { canRefine: sinon.stub(), refine: sinon.stub() };
		refineRule2 = { canRefine: sinon.stub(), refine: sinon.stub() };
		typeEnvironment = new TypeEnvironment();
		typeUnificator = new TypeUnificator();
		program = new Program();
		hindleyMilner = new HindleyMilner(typeEnvironment, program, typeUnificator, [refineRule1, refineRule2]);
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

		it("catches the unification errors and propagates the error as type inference error", function () {
			// arrange
			const t1 = new NumberType();
			const t2 = new NumberType();
			sinon.stub(typeUnificator, "unify").throws(new UnificationError(t1, t2, "Ooops..."));

			// act, assert
			expect(() => hindleyMilner.unify(t1, t2, {})).to.throw("Type inference failure: Unification for type 'number' and 'number' failed because Ooops...");
		});
	});
});