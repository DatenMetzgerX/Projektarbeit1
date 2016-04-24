import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {Program} from "../../lib/semantic-model/program";
import Symbol, {SymbolFlags} from "../../lib/semantic-model/symbol";
import {HindleyMilnerContext} from "../../lib/type-inference/hindley-milner-context";
import {NumberType, StringType, RecordType, NullType, MaybeType, VoidType} from "../../lib/semantic-model/types";
import {TypeInferenceContext} from "../../lib/type-inference/type-inference-context";

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

	describe("getObjectType", function () {
		it("returns the type of the identifier if the object is an identifier node", function () {
			// arrange
			const objectNode = t.identifier("person");
			const nameNode = t.memberExpression(objectNode, t.identifier("name"));

			const person = new Symbol("person", SymbolFlags.Variable);
			const name = new Symbol("name", SymbolFlags.Property);

			program.symbolTable.setSymbol(objectNode, person);
			program.symbolTable.setSymbol(nameNode, name);

			const personType = new RecordType();
			context.setType(person, personType);

			// act
			const objectType = context.getObjectType(nameNode);

			// assert
			expect(objectType).to.equal(personType);
		});

		it("returns the type of the parent property if it is a nested member access", function () {
			// arrange
			const personNode = t.identifier("person");
			const addressNode = t.memberExpression(personNode, t.identifier("address"));
			const streetNode = t.memberExpression(addressNode, t.identifier("street"));

			const person = new Symbol("person", SymbolFlags.Variable);
			const address = new Symbol("address", SymbolFlags.Property);
			const street = new Symbol("street", SymbolFlags.Property);
			person.addMember(address);
			address.addMember(street);

			program.symbolTable.setSymbol(personNode, person);
			program.symbolTable.setSymbol(addressNode, address);
			program.symbolTable.setSymbol(streetNode, street);

			const addressType = new RecordType();
			const personType = RecordType.create(RecordType, [[address, addressType]]);

			context.setType(person, personType);

			// act
			const objectType = context.getObjectType(streetNode);

			// assert
			expect(objectType).to.equal(addressType);
		});

		it("infers the type of a literal", function () {
			// arrange
			const objectNode = t.stringLiteral("Zürich");
			const lengthNode = t.memberExpression(objectNode, t.identifier("length"));

			const length = new Symbol("length", SymbolFlags.Property);

			program.symbolTable.setSymbol(lengthNode, length);
			typeInferenceAnalysis.infer.withArgs(objectNode).returns(new StringType());

			// act
			const objectType = context.getObjectType(lengthNode);

			// assert
			expect(objectType).to.be.instanceOf(StringType);
		});

		it("throws if the parent node type is not known", function () {
			// arrange
			const thisNode = t.thisExpression();
			const nameNode = t.memberExpression(thisNode, t.identifier("node"));

			const name = new Symbol("name", SymbolFlags.Property);
			program.symbolTable.setSymbol(thisNode, Symbol.THIS);
			program.symbolTable.setSymbol(nameNode, name);

			const thisType = new RecordType();
			context.setType(Symbol.THIS, thisType);

			// act, assert
			expect(() => context.getObjectType(nameNode)).to.throw("Node type ThisExpression for the object of a member expression not yet supported.");
		});

		it("fails if the object type cannot be unified with the record type", function () {
			// arrange
			const personNode = t.identifier("person");
			const nameNode = t.memberExpression(personNode, t.identifier("name"));

			const person = new Symbol("person", SymbolFlags.Variable);
			const name = new Symbol("name", SymbolFlags.Property);

			program.symbolTable.setSymbol(personNode, person);
			program.symbolTable.setSymbol(nameNode, name);

			const personType = NumberType.create();
			context.setType(person, personType);

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
			program.symbolTable.setSymbol(nameNode, name);

			const personType = NullType.create();
			context.setType(person, personType);

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
			program.symbolTable.setSymbol(nameNode, name);

			const personType = VoidType.create();
			context.setType(person, personType);

			typeInferenceAnalysis.unify.returns(new RecordType());

			// act
			expect(() => context.getObjectType(nameNode)).to.throw("Type inference failure: Potential null pointer when accessing property name on null or not initialized object of type undefined.");
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