import {expect} from "chai";
import sinon from "sinon";

import {Program} from "../../lib/semantic-model/program";
import Symbol, {SymbolFlags} from "../../lib/semantic-model/symbol";
import {RefinementContext} from "../../lib/type-inference/refinement-context";
import {HindleyMilner} from "../../lib/type-inference/hindley-milner";
import {NumberType, StringType} from "../../lib/semantic-model/types";
import {TypeInferenceContext} from "../../lib/type-inference/type-inference-context";

describe("RefinementContext", function () {
	let hindleyMilner,
		program,
		typeInferenceContext,
		refinementContext;

	beforeEach(function () {
		program = new Program();
		hindleyMilner = new HindleyMilner(null, []);
		typeInferenceContext = new TypeInferenceContext(program);
		refinementContext = new RefinementContext(hindleyMilner, typeInferenceContext);
	});

	describe("getType", function () {
		it("returns the type from the type inference context", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.Variable);
			const type = new NumberType();
			typeInferenceContext.setType(symbol, type);

			// act, assert
			expect(refinementContext.getType(symbol)).to.equal(type);
		});
	});

	describe("setType", function () {
		it("sets the type in the type inference context", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.Variable);
			const type = new NumberType();

			// act
			refinementContext.setType(symbol, type);

			// assert
			expect(typeInferenceContext.getType(symbol)).to.equal(type);
		});
	});

	describe("replaceType", function () {
		it("replaces the type in the type inference context", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.Variable);
			const type = new NumberType();
			typeInferenceContext.setType(symbol, type);

			// act
			refinementContext.replaceType(symbol, () => new StringType());

			// assert
			expect(typeInferenceContext.getType(symbol)).to.be.instanceOf(StringType);
		});
	});

	describe("infer", function () {
		it("calls the infer function of the hindley milner algorithm", function () {
			// arrange
			const node = {};
			const type = new NumberType();

			sinon.stub(hindleyMilner, "infer").returns(type);

			// act
			const inferred = refinementContext.infer(node);

			// assert
			sinon.assert.calledWith(hindleyMilner.infer, node, typeInferenceContext);
			expect(inferred).to.equal(type);
		});
	});

	describe("unify", function () {
		it("calls the unify function of the hindley milner algorithm", function () {
			// arrange
			const node = {};
			const type1 = new NumberType();
			const type2 = new NumberType();

			sinon.stub(hindleyMilner, "unify").returns(type1);

			// act
			const unified = refinementContext.unify(type1, type2, node);

			// assert
			sinon.assert.calledWith(hindleyMilner.unify, type1, type2, node, typeInferenceContext);
			expect(unified).to.equal(type1);
		});
	});

	describe("getSymbol", function () {
		it("resolves the symbol using the inference context", function () {
			// arrange
			const node = {};
			const symbol = new Symbol("x", SymbolFlags.Variable);

			sinon.stub(typeInferenceContext, "getSymbol").returns(symbol);

			// act
			const resolvedSymbol = refinementContext.getSymbol(node);

			// assert
			sinon.assert.calledWith(typeInferenceContext.getSymbol, node);
			expect(resolvedSymbol).to.equal(symbol);
		});
	});

	describe("getCfg", function () {
		it("resolves the cfg by using the inference context", function () {
			const node = {};
			sinon.stub(typeInferenceContext, "getCfg");

			// act
			refinementContext.getCfg(node);

			// assert
			sinon.assert.calledWith(typeInferenceContext.getCfg, node);
		});
	});
});