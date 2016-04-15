import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {Program} from "../../lib/semantic-model/program";
import Symbol, {SymbolFlags} from "../../lib/semantic-model/symbol";
import {HindleyMilnerContext} from "../../lib/type-inference/hindley-milner-context";
import {NumberType, StringType} from "../../lib/semantic-model/types";
import {TypeInferenceContext} from "../../lib/type-inference/type-inference-context";
import {RecordType} from "../../lib/semantic-model/types/record-type";

describe("HindleyMilnerContext", function () {
	let typeInferenceAnalysis,
		program,
		typeInferenceContext,
		context;

	beforeEach(function () {
		program = new Program();
		typeInferenceAnalysis = { infer: sinon.stub(), analyse: sinon.stub(), unify: sinon.stub() };
		typeInferenceContext = new TypeInferenceContext(program);
		context = new HindleyMilnerContext(typeInferenceAnalysis, typeInferenceContext);
	});

	describe("typeEnvironment", function () {
		it("returns the type environment from the type inference context", function () {
			expect(context.typeEnvironment).to.equal(typeInferenceContext.typeEnvironment);
		});
	});

	describe("infer", function () {
		it("calls the infer function of the type inference analysis", function () {
			// arrange
			const node = {};
			const type = new NumberType();

			typeInferenceAnalysis.infer.returns(type);

			// act
			const inferred = context.infer(node);

			// assert
			sinon.assert.calledWith(typeInferenceAnalysis.infer, node, context);
			expect(inferred).to.equal(type);
		});
	});

	describe("unify", function () {
		it("calls the unify function of the type inference analysis", function () {
			// arrange
			const node = {};
			const type1 = new NumberType();
			const type2 = new NumberType();

			typeInferenceAnalysis.unify.returns(type1);

			// act
			const unified = context.unify(type1, type2, node);

			// assert
			sinon.assert.calledWith(typeInferenceAnalysis.unify, type1, type2, node, context);
			expect(unified).to.equal(type1);
		});
	});

	describe("analyse", function () {
		it("calls the analyse function of the type inference analysis", function () {
			// arrange
			const node = {};

			typeInferenceAnalysis.analyse.returns(context.typeEnvironment);

			// act
			context.analyse(node);

			// assert
			sinon.assert.calledWith(typeInferenceAnalysis.analyse, node, context.typeEnvironment);
		});
	});

	describe("getType", function () {
		it("returns the type from the type inference context", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.Variable);
			const type = new NumberType();
			typeInferenceContext.setType(symbol, type);

			// act, assert
			expect(context.getType(symbol)).to.equal(type);
		});
	});

	describe("setType", function () {
		it("sets the type in the type inference context", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.Variable);
			const type = new NumberType();

			// act
			context.setType(symbol, type);

			// assert
			expect(typeInferenceContext.getType(symbol)).to.equal(type);
		});
	});

	describe("substitute", function () {
		it("calls the substitute function on the type inference context", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.Variable);
			const type = new NumberType();
			const newType = new StringType();

			context.setType(symbol, type);
			sinon.spy(typeInferenceContext, "substitute");

			// act
			context.substitute(type, newType);

			// assert
			expect(typeInferenceContext.getType(symbol)).to.equal(newType);
			sinon.assert.calledWith(typeInferenceContext.substitute, type, newType);
		});
	});

	describe("getNodeType", function () {
		it("returns the type of the passed in node from the type inference context", function () {
			// arrange
			const node = t.identifier("x");
			const symbol = new Symbol("x", SymbolFlags.Variable);
			program.symbolTable.setSymbol(node, symbol);
			const type = new NumberType();

			context.setType(symbol, type);

			// act
			const nodeType = context.getNodeType(node);

			// assert
			expect(nodeType).to.equal(type);
		});

		it("returns the type of the record property if the node is a member expression", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Property);
			const person = new Symbol("person", SymbolFlags.Variable);
			person.addMember(name);

			const personType = RecordType.withProperties([[name, new StringType() ]]);
			const node = t.memberExpression(t.identifier("person"), t.identifier("name"));
			program.symbolTable.setSymbol(node.object, person);
			program.symbolTable.setSymbol(node.property, name);

			context.setType(person, personType);

			// act
			const propertyType = context.getNodeType(node);

			// assert
			expect(propertyType).to.be.instanceOf(StringType);
		});
	});

	describe("setNodeType", function () {
		it("sets the type of the node", function () {
			// arrange
			const node = t.identifier("x");
			const symbol = new Symbol("x", SymbolFlags.Variable);
			program.symbolTable.setSymbol(node, symbol);
			const type = new NumberType();

			// act
			context.setNodeType(node, type);

			// assert
			expect(context.getType(symbol)).to.equal(type);
		});

		it("creates a new member property if the node is a member expression", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Property);
			const person = new Symbol("person", SymbolFlags.Variable);
			person.addMember(name);

			const personType = RecordType.withProperties([]);
			const node = t.memberExpression(t.identifier("person"), t.identifier("name"));
			program.symbolTable.setSymbol(node.object, person);
			program.symbolTable.setSymbol(node.property, name);

			context.setType(person, personType);
			typeInferenceAnalysis.unify.withArgs(RecordType.ANY, personType).returns(personType);

			// act
			context.setNodeType(node, new StringType());

			// assert
			expect(context.getNodeType(node)).to.be.instanceOf(StringType);
		});

		it("changes the type of the existing property if the node is a member expression", function () {
			// arrange
			const name = new Symbol("name", SymbolFlags.Property);
			const person = new Symbol("person", SymbolFlags.Variable);
			person.addMember(name);

			const personType = RecordType.withProperties([[name, new NumberType() ]]);
			const node = t.memberExpression(t.identifier("person"), t.identifier("name"));
			program.symbolTable.setSymbol(node.object, person);
			program.symbolTable.setSymbol(node.property, name);

			context.setType(person, personType);
			typeInferenceAnalysis.unify.withArgs(RecordType.ANY, personType).returns(personType);

			// act
			context.setNodeType(node, new StringType());

			// assert
			expect(context.getNodeType(node)).to.be.instanceOf(StringType);
		});
	});

	describe("getSymbol", function () {
		it("resolves the symbol using the inference context", function () {
			// arrange
			const node = {};
			const symbol = new Symbol("x", SymbolFlags.Variable);

			sinon.stub(typeInferenceContext, "getSymbol").returns(symbol);

			// act
			const resolvedSymbol = context.getSymbol(node);

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
			context.getCfg(node);

			// assert
			sinon.assert.calledWith(typeInferenceContext.getCfg, node);
		});
	});

	describe("fresh", function () {
		it("returns a new object for the same type inference analysis but with a new type inference context instance", function () {
			// act
			const fresh = context.fresh();

			// assert
			expect(fresh).not.to.equal(context);
			expect(fresh._typeInferenceAnalysis).to.equal(context._typeInferenceAnalysis);
			expect(fresh._typeInferenceContext).not.to.equal(context._typeInferenceContext);
		});
	});
});