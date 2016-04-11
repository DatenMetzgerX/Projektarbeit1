import {expect} from "chai";
import sinon from "sinon";
import {TypeInferenceContext} from "../../lib/type-inference/type-inference-context";
import {Symbol, SymbolFlags } from "../../lib/semantic-model/symbol";
import {StringType, NumberType} from "../../lib/semantic-model/types";
import {TypeEnvironment} from "../../lib/type-inference/type-environment";
import {Program} from "../../lib/semantic-model/program";
import {ControlFlowGraph} from "../../lib/cfg/control-flow-graph";

describe("TypeInferenceContext", function () {
	let program;

	beforeEach(function () {
		program = new Program();
	});

	describe("getType", function () {
		it("returns the type for the given symbol from the underlining type environment", function () {
			// arrange
			const x = new Symbol("x", SymbolFlags.Identifier);
			const xType = new StringType();
			const typeEnvironment = new TypeEnvironment().setType(x, xType);
			const context = new TypeInferenceContext(program, typeEnvironment);

			// assert
			expect(context.getType(x)).to.equal(xType);
		});
	});

	describe("setType", function () {
		it("sets the type in the type environment", function () {
			// arrange
			const x = new Symbol("x", SymbolFlags.Identifier);
			const xType = new StringType();
			const context = new TypeInferenceContext(program);

			// act
			context.setType(x, xType);

			// assert
			expect(context.typeEnvironment.getType(x)).to.equal(xType);
		});
	});

	describe("replaceType", function () {
		it("replaces the type in the type environment", function () {
			// arrange
			const x = new Symbol("x", SymbolFlags.Identifier);
			const typeEnvironment = new TypeEnvironment().setType(x, new StringType());
			const context = new TypeInferenceContext(program, typeEnvironment);

			const newType = new NumberType();
			sinon.spy(typeEnvironment, "replaceType");

			// act
			context.replaceType(x, () => newType);

			// assert
			expect(context.getType(x)).to.equal(newType);
			sinon.assert.calledWith(typeEnvironment.replaceType, x);
		});
	});

	describe("substitute", function () {
		it("calls substitute on the type environment", function () {
			// arrange
			const t1 = new StringType();
			const t2 = new NumberType();
			const typeEnvironment = new TypeEnvironment();
			context = new TypeInferenceContext(program, typeEnvironment);

			sinon.spy(typeEnvironment, "substitute");

			// act
			context.substitute(t1, t2);

			// assert
			sinon.assert.calledWith(typeEnvironment.substitute, t1, t2);
		});
	});

	describe("getSymbol", function () {
		it("returns the symbol from the programs symbol table", function () {
			// arrange
			const node = {};
			const symbol = new Symbol("x", SymbolFlags.Variable);

			program.symbolTable.setSymbol(node, symbol);

			const context = new TypeInferenceContext(program);

			// act, assert
			expect(context.getSymbol(node)).to.equal(symbol);
		});
	});

	describe("getCfg", function () {
		it("returns the cfg determined by program.getCfg", function () {
			// arrange
			const node = {};
			const cfg = new ControlFlowGraph();

			sinon.stub(program, "getCfg").returns(cfg);

			const context = new TypeInferenceContext(program);

			// act, assert
			expect(context.getCfg(node)).to.equal(cfg);
		});
	});
});