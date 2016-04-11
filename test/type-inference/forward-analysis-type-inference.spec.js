import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {ForwardAnalysisTypeInference} from "../../lib/type-inference/forward-analysis-type-inference";
import {Program} from "../../lib/semantic-model/program";
import {TypeEnvironment} from "../../lib/type-inference/type-environment";
import {SymbolFlags, Symbol} from "../../lib/semantic-model/symbol";
import {VoidType, NumberType, StringType, NullType, MaybeType} from "../../lib/semantic-model/types";
import {HindleyMilner} from "../../lib/type-inference/hindley-milner";

describe("ForwardAnalysisTypeInference", function () {
	let analysis, program, hindleyMilner, sandbox;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		program = new Program();
		hindleyMilner = new HindleyMilner(program);
		analysis = new ForwardAnalysisTypeInference(hindleyMilner);
	});

	afterEach(function () {
		sandbox.restore();
	});

	describe("transfer", function () {
		it("infers the types for the node by calling the hindley milner algorithm and returns the new out type environment", function () {
			// arrange
			const inSet = new TypeEnvironment();
			const node = t.variableDeclarator(t.identifier("x"));
			const x = new Symbol("x", SymbolFlags.Variable);

			sandbox.stub(hindleyMilner, "infer", () => hindleyMilner.typeEnvironment = hindleyMilner.typeEnvironment.setType(x, new StringType()));

			// act
			const outSet = analysis.transfer(node, inSet);

			// assert
			expect(outSet.getType(x)).to.be.instanceOf(StringType);
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

			sandbox.stub(hindleyMilner, "mergeWithTypeEnvironments", () => hindleyMilner.typeEnvironment = hindleyMilner.typeEnvironment.setType(age, new MaybeType(new NumberType())));

			// act
			const joined = analysis.joinBranches(env1, [env2], {});

			// assert
			expect(joined.getType(name)).to.be.instanceOf(VoidType);
			expect(joined.getType(age)).to.be.instanceOf(MaybeType);
		});
	});
});