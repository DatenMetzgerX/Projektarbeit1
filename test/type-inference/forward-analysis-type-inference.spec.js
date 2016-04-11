import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {ForwardAnalysisTypeInference} from "../../lib/type-inference/forward-analysis-type-inference";
import {Program} from "../../lib/semantic-model/program";
import {TypeEnvironment} from "../../lib/type-inference/type-environment";
import {SymbolFlags, Symbol} from "../../lib/semantic-model/symbol";
import {VoidType, NullType} from "../../lib/semantic-model/types";
import {HindleyMilner} from "../../lib/type-inference/hindley-milner";

describe("ForwardAnalysisTypeInference", function () {
	let analysis, program, hindleyMilner, sandbox;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		program = new Program();
		hindleyMilner = new HindleyMilner();
		analysis = new ForwardAnalysisTypeInference(program, hindleyMilner);
	});

	afterEach(function () {
		sandbox.restore();
	});

	describe("transfer", function () {
		it("infers the types for the node by calling the hindley milner algorithm and returns the new out type environment", function () {
			// arrange
			const inSet = new TypeEnvironment();
			const node = t.variableDeclarator(t.identifier("x"));

			sandbox.stub(hindleyMilner, "infer");

			// act
			analysis.transfer(node, inSet);

			// assert
			sinon.assert.calledWith(hindleyMilner.infer, node, sinon.match.has("typeEnvironment", inSet));
		});
	});

	describe("areLaticesEqual", function () {
		it("returns true if the type environments are the same", function () {
			// arrange
			const typeEnvironment = new TypeEnvironment();

			// act, assert
			expect(analysis.areLatticesEqual(typeEnvironment, typeEnvironment)).to.be.true;
		});

		it("returns false if the type environments are not the same", function () {
			// arrange
			const env1 = new TypeEnvironment();
			const env2 = new TypeEnvironment();

			// act, assert
			expect(analysis.areLatticesEqual(env1, env2)).to.be.false;
		});
	});

	describe("joinBranches", function () {
		it("merges the definitions into a new type environment containing the definitions of both environments", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Variable);
			const age = new Symbol("age", SymbolFlags.Variable);

			const env1 = new TypeEnvironment().setType(name, new VoidType());
			const env2 = new TypeEnvironment().setType(age, new NullType());

			sandbox.stub(hindleyMilner, "mergeWithTypeEnvironments");

			const node = {};

			// act
			analysis.joinBranches(env1, [env2], node);

			// assert
			sinon.assert.calledWith(hindleyMilner.mergeWithTypeEnvironments, [env2], node, sinon.match.has("typeEnvironment", env1));
		});
	});
});