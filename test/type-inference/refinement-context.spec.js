import {expect} from "chai";
import sinon from "sinon";

import {Program} from "../../lib/semantic-model/program";
import Symbol, {SymbolFlags} from "../../lib/semantic-model/symbol";
import {RefinementContext} from "../../lib/type-inference/refinment-context";
import {HindleyMilner} from "../../lib/type-inference/hindley-milner";
import {TypeEnvironment} from "../../lib/type-inference/type-environment";
import {NumberType} from "../../lib/semantic-model/types";

describe("RefinementContext", function () {
	let hindleyMilner,
		typeEnvironment,
		symbolTable,
		program,
		refinementContext;

	beforeEach(function () {
		program = new Program();
		symbolTable = program.symbolTable;
		typeEnvironment = new TypeEnvironment();
		hindleyMilner = new HindleyMilner(program, typeEnvironment, null, []);
		refinementContext = new RefinementContext(hindleyMilner);
	});

	describe("getType", function () {
		it("returns the type from the type environment", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.Variable);
			const type = new NumberType();
			sinon.stub(typeEnvironment, "getType").returns(type);

			// act, assert
			expect(refinementContext.getType(symbol)).to.equal(type);
			sinon.assert.calledWith(typeEnvironment.getType, symbol);
		});
	});

	describe("setType", function () {
		it("sets the type in the type environment", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.Variable);
			const type = new NumberType();
			sinon.stub(typeEnvironment, "setType");

			// act
			refinementContext.setType(symbol, type);

			// assert
			sinon.assert.calledWith(typeEnvironment.setType, symbol, type);
		});

		it("replaces the type environment with the returned environment from set type", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.Variable);
			const type = new NumberType();
			const newTypeEnvironment = {};
			sinon.stub(typeEnvironment, "setType").returns(newTypeEnvironment);

			// act
			refinementContext.setType(symbol, type);

			// assert
			expect(hindleyMilner.typeEnvironment).to.equal(newTypeEnvironment);
		});
	});

	describe("replaceType", function () {
		it("replaces the type in the type environment", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.Variable);
			const type = new NumberType();
			sinon.stub(typeEnvironment, "replaceType");

			// act
			refinementContext.replaceType(symbol, () => type);

			// assert
			sinon.assert.calledWith(typeEnvironment.replaceType, symbol);
		});

		it("replaces the type environment with the returned environment from repalce type", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.Variable);
			const type = new NumberType();
			const newTypeEnvironment = {};
			sinon.stub(typeEnvironment, "replaceType").returns(newTypeEnvironment);

			// act
			refinementContext.replaceType(symbol, () => type);

			// assert
			expect(hindleyMilner.typeEnvironment).to.equal(newTypeEnvironment);
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
			sinon.assert.calledWith(hindleyMilner.infer, node);
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
			sinon.assert.calledWith(hindleyMilner.unify, type1, type2, node);
			expect(unified).to.equal(type1);
		});
	});

	describe("getSymbol", function () {
		it("resolves the symbol from the symbol table of the program", function () {
			// arrange
			const node = {};
			const symbol = new Symbol("x", SymbolFlags.Variable);

			sinon.stub(symbolTable, "getSymbol").returns(symbol);

			// act
			const resolvedSymbol = refinementContext.getSymbol(node);

			// assert
			sinon.assert.calledWith(symbolTable.getSymbol, node);
			expect(resolvedSymbol).to.equal(symbol);
		});
	});

	describe("getCfg", function () {
		it("resolves the cfg by using program.getCfg", function () {
			const node = {};
			sinon.stub(program, "getCfg");

			// act
			refinementContext.getCfg(node);

			// assert
			sinon.assert.calledWith(program.getCfg, node);
		});
	});
});