import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {Program} from "../../lib/semantic-model/program";
import Symbol, {SymbolFlags} from "../../lib/semantic-model/symbol";
import {HindleyMilnerContext} from "../../lib/type-inference/hindley-milner-context";
import {NumberType, StringType, RecordType, NullType, MaybeType, VoidType, AnyType} from "../../lib/semantic-model/types";
import {TypeInferenceContext} from "../../lib/type-inference/type-inference-context";
import {TypeEnvironment} from "../../lib/type-inference/type-environment";

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

		it("sets the type environment of the type inference context", function () {
			// arrange
			const env1 = new TypeEnvironment();

			// act
			typeInferenceContext.typeEnvironment = env1;

			// assert
			expect(typeInferenceContext.typeEnvironment).to.equal(env1);
		});
	});

	describe("infer", function () {
		it("calls the infer function of the type inference analysis", function () {
			// arrange
			const node = {};
			const type = NumberType.create();

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
			const type1 = NumberType.create();
			const type2 = NumberType.create();

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
			const type = NumberType.create();
			typeInferenceContext.setType(symbol, type);

			// act, assert
			expect(context.getType(symbol)).to.equal(type);
		});
	});

	describe("setType", function () {
		it("sets the type in the type inference context", function () {
			// arrange
			const symbol = new Symbol("x", SymbolFlags.Variable);
			const type = NumberType.create();

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
			const type = NumberType.create();
			const newType = StringType.create();

			context.setType(symbol, type);
			sinon.spy(typeInferenceContext, "substitute");

			// act
			context.substitute(type, newType);

			// assert
			expect(typeInferenceContext.getType(symbol)).to.equal(newType);
			sinon.assert.calledWith(typeInferenceContext.substitute, type, newType);
		});
	});

	describe("getObjectType", function () {
		it("returns the infered type for the object node", function () {
			// arrange
			const objectNode = t.identifier("person");
			const nameNode = t.memberExpression(objectNode, t.identifier("name"));

			const person = new Symbol("person", SymbolFlags.Variable);
			const name = new Symbol("name", SymbolFlags.Property);

			program.symbolTable.setSymbol(objectNode, person);
			program.symbolTable.setSymbol(nameNode.property, name);

			const personType = new RecordType();
			context.setType(person, personType);

			typeInferenceAnalysis.infer.withArgs(objectNode).returns(personType);

			// act
			const objectType = context.getObjectType(nameNode);

			// assert
			expect(objectType).to.equal(personType);
		});

		it("fails if the object type cannot be unified with the record type", function () {
			// arrange
			const personNode = t.identifier("person");
			const nameNode = t.memberExpression(personNode, t.identifier("name"));

			const person = new Symbol("person", SymbolFlags.Variable);
			const name = new Symbol("name", SymbolFlags.Property);

			program.symbolTable.setSymbol(personNode, person);
			program.symbolTable.setSymbol(nameNode.property, name);

			const personType = NumberType.create();
			context.setType(person, personType);
			typeInferenceAnalysis.infer.withArgs(personNode).returns(personType);

			// act
			expect(() => context.getObjectType(nameNode)).to.throw("Type inference failure: Type number is not a record type and cannot be converted to a record type, cannot be used as object.");
		});

		it("fails if the object type is null", function () {
			// arrange
			const personNode = t.identifier("person");
			const nameNode = t.memberExpression(personNode, t.identifier("name"));

			const person = new Symbol("person", SymbolFlags.Variable);
			const name = new Symbol("name", SymbolFlags.Property);

			program.symbolTable.setSymbol(personNode, person);
			program.symbolTable.setSymbol(nameNode.property, name);

			const personType = NullType.create();
			context.setType(person, personType);
			typeInferenceAnalysis.infer.withArgs(personNode).returns(personType);

			typeInferenceAnalysis.unify.returns(MaybeType.of(new RecordType()));

			// act
			expect(() => context.getObjectType(nameNode)).to.throw("Type inference failure: Potential null pointer when accessing property name on null or not initialized object of type null.");
		});

		it("fails if the object type is undefined", function () {
			// arrange
			const personNode = t.identifier("person");
			const nameNode = t.memberExpression(personNode, t.identifier("name"));

			const person = new Symbol("person", SymbolFlags.Variable);
			const name = new Symbol("name", SymbolFlags.Property);

			program.symbolTable.setSymbol(personNode, person);
			program.symbolTable.setSymbol(nameNode.property, name);

			const personType = VoidType.create();
			context.setType(person, personType);
			typeInferenceAnalysis.infer.withArgs(personNode).returns(personType);

			typeInferenceAnalysis.unify.returns(new RecordType());

			// act
			expect(() => context.getObjectType(nameNode)).to.throw("Type inference failure: Potential null pointer when accessing property name on null or not initialized object of type undefined.");
		});

		it("returns any type if the type of the parent object is any", function () {
			// arrange
			const objectNode = t.identifier("person");
			const nameNode = t.memberExpression(objectNode, t.identifier("name"));

			const person = new Symbol("person", SymbolFlags.Variable);
			const name = new Symbol("name", SymbolFlags.Property);

			program.symbolTable.setSymbol(objectNode, person);
			program.symbolTable.setSymbol(nameNode.property, name);

			const personType = AnyType.create();
			context.setType(person, personType);
			typeInferenceAnalysis.infer.withArgs(objectNode).returns(personType);

			// act
			const objectType = context.getObjectType(nameNode);

			// assert
			expect(objectType).to.be.instanceOf(AnyType);
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

	describe("replaceTypes", function () {

		it("sets the type environment to the type environment with the replaced types", function () {
			// arrange
			const env1 = new TypeEnvironment();
			const env2 = new TypeEnvironment();
			const result = new TypeEnvironment();

			const name = new Symbol("name", SymbolFlags.Variable);
			sinon.stub(env1, "replaceTypes").returns(result);
			context.typeEnvironment = env1;

			const otherContext = context.fresh();
			otherContext.typeEnvironment = env2;

			// act
			context.replaceTypes(otherContext, [name]);

			// assert
			expect(context.typeEnvironment).to.equal(result);
			sinon.assert.calledWith(env1.replaceTypes, env2, [name]);
		});
	});
});