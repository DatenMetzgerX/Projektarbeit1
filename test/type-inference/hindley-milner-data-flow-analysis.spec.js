import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {HindleyMilnerDataFlowAnalysis} from "../../lib/type-inference/hindley-milner-data-flow-analysis";
import {TypeEnvironment} from "../../lib/type-inference/type-environment";
import {Program} from "../../lib/semantic-model/program";
import {TypeInferenceContext} from "../../lib/type-inference/type-inference-context";
import {HindleyMilnerContext} from "../../lib/type-inference/hindley-milner-context";
import {SymbolFlags, Symbol} from "../../lib/semantic-model/symbol";
import {Type} from "../../lib/semantic-model/types/type";

describe("HindleyMilnerDataFlowAnalysis", function () {
	let analysis, typeInferenceAnalysis, program;

	beforeEach(function () {
		program = new Program();
		typeInferenceAnalysis = { createHindleyMilnerContext: sinon.stub(), infer: sinon.stub() };
		analysis = new HindleyMilnerDataFlowAnalysis(typeInferenceAnalysis);
	});

	describe("createEmptyLattice", function () {
		it("returns the start type environment from the constructor", function () {
			// arrange
			const typeEnvironment = new TypeEnvironment();
			analysis = new HindleyMilnerDataFlowAnalysis(typeInferenceAnalysis, typeEnvironment);

			// act, assert
			expect(analysis.createEmptyLattice()).to.be.equal(typeEnvironment);
		});
	});

	describe("transfer", function () {
		it("returns the in type environment for the exit node", function () {
			// arrange
			const inTypeEnvironment = new TypeEnvironment();

			// act, assert
			expect(analysis.transfer(null, inTypeEnvironment)).to.equal(inTypeEnvironment);
		});

		it("infers the types for the node by calling the infer function on a newly created hindley milner context", function () {
			// arrange
			const inTypeEnvironment = new TypeEnvironment();
			const node = t.identifier("x");
			const context = new HindleyMilnerContext(typeInferenceAnalysis, new TypeInferenceContext(program, inTypeEnvironment));

			typeInferenceAnalysis.createHindleyMilnerContext.returns(context);
			sinon.stub(context, "infer");

			// act
			analysis.transfer(node, inTypeEnvironment);

			// assert
			sinon.assert.calledWith(context.infer, node);
		});
	});

	describe("areStatesEqual", function() {
		it("is true if the type environment are the same", function () {
			// arrange
			const typeEnv = new TypeEnvironment();

			// act, assert
			expect(analysis.areStatesEqual(typeEnv, typeEnv)).to.be.true;
		});

		it("is true if the type environment are not the same instances but have the same mappings", function () {
			// arrange
			const typeEnv = new TypeEnvironment();
			const typeEnv2 = new TypeEnvironment();

			// act, assert
			expect(analysis.areStatesEqual(typeEnv, typeEnv2)).to.be.true;
		});

		it("is false if the type environment are not the same instances but have the same mappings", function () {
			// arrange
			const typeEnv = new TypeEnvironment();
			const typeEnv2 = new TypeEnvironment().setType(new Symbol("x", SymbolFlags.Variable), new Type("string"));

			// act, assert
			expect(analysis.areStatesEqual(typeEnv, typeEnv2)).to.be.false;
		});
	});
});