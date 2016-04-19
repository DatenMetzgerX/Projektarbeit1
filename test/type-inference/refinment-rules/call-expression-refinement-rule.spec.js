import * as t from "babel-types";
import {expect} from "chai";
import sinon from "sinon";

import {CallExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/call-expression-refinement-rule";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {Program} from "../../../lib/semantic-model/program";
import {VoidType, FunctionType, NullType, StringType} from "../../../lib/semantic-model/types";
import {SymbolFlags, Symbol} from "../../../lib/semantic-model/symbol";
import {RecordType} from "../../../lib/semantic-model/types/record-type";
import {NumberType} from "../../../lib/semantic-model/types/number-type";

describe("CallExpressionRefinementRule", function () {
	let context, rule, program, typeInferenceAnalysis;

	beforeEach(function () {
		program = new Program();
		typeInferenceAnalysis = { analyse: sinon.stub(), infer: sinon.stub() };
		context = new HindleyMilnerContext(typeInferenceAnalysis, new TypeInferenceContext(program));
		rule = new CallExpressionRefinementRule();
	});

	describe("canRefine", function () {
		it("returns for a call expression", function () {
			// arrange
			const node = t.callExpression(t.identifier("log"), []);

			// act, assert
			expect(rule.canRefine(node)).to.be.true;
		});

		it("returns false otherwise", function () {
			expect(rule.canRefine(t.identifier("x"))).to.be.false;
		});
	});

	describe("refine", function () {
		describe("return type", function () {
			it("is the return type of the called function", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				const logDeclaration = t.functionDeclaration(t.identifier("log"), [t.identifier("m")], t.blockStatement([]));

				const log = new Symbol("log", SymbolFlags.Function);
				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(callExpression.callee, log);
				program.symbolTable.setSymbol(logDeclaration.id, log);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				context.setType(log, new FunctionType(new NullType(), [], new VoidType(), logDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(new StringType());

				const logTypeEnvironment = context.typeEnvironment.setType(Symbol.RETURN, new VoidType());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returns(logTypeEnvironment);

				// assert
				expect(rule.refine(callExpression, context)).to.be.instanceOf(VoidType);
			});

			it("is void type if the function has no explicit return statement", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				const logDeclaration = t.functionDeclaration(t.identifier("log"), [t.identifier("m")], t.blockStatement([]));

				const log = new Symbol("log", SymbolFlags.Function);
				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(callExpression.callee, log);
				program.symbolTable.setSymbol(logDeclaration.id, log);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				context.setType(log, new FunctionType(new NullType(), [], new VoidType(), logDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(new StringType());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returns(context.typeEnvironment);

				// assert
				expect(rule.refine(callExpression, context)).to.be.instanceOf(VoidType);
			});
		});

		describe("this", function () {
			it("is void type if the callee is not a member expression", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				const logDeclaration = t.functionDeclaration(t.identifier("log"), [t.identifier("m")], t.blockStatement([]));

				const log = new Symbol("log", SymbolFlags.Function);
				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(callExpression.callee, log);
				program.symbolTable.setSymbol(logDeclaration.id, log);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				context.setType(log, new FunctionType(new NullType(), [], new VoidType(), logDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(new StringType());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returnsArg(1);

				// act
				rule.refine(callExpression, context);

				// assert
				const analyseCall = typeInferenceAnalysis.analyse.getCall(0);
				const analyseTypeEnv = analyseCall.args[1];

				expect(analyseTypeEnv.getType(Symbol.THIS)).to.be.instanceOf(VoidType);
			});

			it("is the type of the object when the callee is a member expression", function () {
				// arrange
				const personNode = t.identifier("person");
				const logMember = t.memberExpression(personNode, t.identifier("log"));
				const callExpression = t.callExpression(logMember, [t.stringLiteral("Hy")]);
				const logDeclaration = t.functionDeclaration(t.identifier("log"), [t.identifier("m")], t.blockStatement([]));

				const person = new Symbol("person", SymbolFlags.Variable);
				const log = new Symbol("log", SymbolFlags.Function & SymbolFlags.Property);
				person.addMember(log);

				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(personNode, person);
				program.symbolTable.setSymbol(logMember, log);
				program.symbolTable.setSymbol(logDeclaration.id, log);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				const personType = RecordType.withProperties([[log, new FunctionType(new NullType(), [], new VoidType(), logDeclaration)]]);

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(new StringType());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returnsArg(1);

				sinon.stub(context, "getObjectType").withArgs(logMember).returns(personType);

				// act
				rule.refine(callExpression, context);

				// assert
				const analyseCall = typeInferenceAnalysis.analyse.getCall(0);
				const analyseTypeEnv = analyseCall.args[1];

				expect(analyseTypeEnv.getType(Symbol.THIS)).to.be.equal(personType);
			});
		});

		describe("analysed function", function () {
			it("is the function associated with the identifier if the callee is an identifier", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				const logDeclaration = t.functionDeclaration(t.identifier("log"), [t.identifier("m")], t.blockStatement([]));

				const log = new Symbol("log", SymbolFlags.Function);
				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(callExpression.callee, log);
				program.symbolTable.setSymbol(logDeclaration.id, log);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				context.setType(log, new FunctionType(new NullType(), [], new VoidType(), logDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(new StringType());

				const logTypeEnvironment = context.typeEnvironment.setType(Symbol.RETURN, new VoidType());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returns(logTypeEnvironment);

				// act
				rule.refine(callExpression, context);

				// assert
				sinon.assert.calledWith(typeInferenceAnalysis.analyse, logDeclaration.body);
			});

			it("is the method of the object expression", function () {
				// arrange
				const personNode = t.identifier("person");
				const logMember = t.memberExpression(personNode, t.identifier("log"));
				const callExpression = t.callExpression(logMember, [t.stringLiteral("Hy")]);
				const logDeclaration = t.functionDeclaration(t.identifier("log"), [t.identifier("m")], t.blockStatement([]));

				const person = new Symbol("person", SymbolFlags.Variable);
				const log = new Symbol("log", SymbolFlags.Function & SymbolFlags.Property);
				person.addMember(log);
				
				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(personNode, person);
				program.symbolTable.setSymbol(logMember, log);
				program.symbolTable.setSymbol(logDeclaration.id, log);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				const personType = RecordType.withProperties([[log, new FunctionType(new NullType(), [], new VoidType(), logDeclaration)]]);

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(new StringType());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returnsArg(1);

				sinon.stub(context, "getObjectType").withArgs(logMember).returns(personType);

				// act
				rule.refine(callExpression, context);

				// assert
				sinon.assert.calledWith(typeInferenceAnalysis.analyse, logDeclaration.body);
			});

			it("throws if the type is not a function type", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);

				const log = new Symbol("log", SymbolFlags.Property);

				program.symbolTable.setSymbol(callExpression.callee, log);
				context.setType(log, new StringType());

				// act, assert
				expect(() => rule.refine(callExpression, context)).to.throw("Type inference failure: Cannot invoke the non function type string.");
			});
		});

		describe("function parameters", function () {
			it("assigns the types of the arguments to the parameters", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				const logDeclaration = t.functionDeclaration(t.identifier("log"), [t.identifier("m")], t.blockStatement([]));

				const log = new Symbol("log", SymbolFlags.Function);
				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(callExpression.callee, log);
				program.symbolTable.setSymbol(logDeclaration.id, log);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				context.setType(log, new FunctionType(new NullType(), [], new VoidType(), logDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(new StringType());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returnsArg(1);

				// act
				rule.refine(callExpression, context);

				// assert
				const analyseCall = typeInferenceAnalysis.analyse.getCall(0);
				const analyseTypeEnv = analyseCall.args[1];

				expect(analyseTypeEnv.getType(m)).to.be.instanceOf(StringType);
			});

			it("assigns void to missing parameters", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), []);
				const logDeclaration = t.functionDeclaration(t.identifier("log"), [t.identifier("m")], t.blockStatement([]));

				const log = new Symbol("log", SymbolFlags.Function);
				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(callExpression.callee, log);
				program.symbolTable.setSymbol(logDeclaration.id, log);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				context.setType(log, new FunctionType(new NullType(), [], new VoidType(), logDeclaration));

				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returnsArg(1);

				// act
				rule.refine(callExpression, context);

				// assert
				const analyseCall = typeInferenceAnalysis.analyse.getCall(0);
				const analyseTypeEnv = analyseCall.args[1];

				expect(analyseTypeEnv.getType(m)).to.be.instanceOf(VoidType);
			});

			it("ignores unused arguments", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				const logDeclaration = t.functionDeclaration(t.identifier("log"), [], t.blockStatement([]));

				const log = new Symbol("log", SymbolFlags.Function);
				program.symbolTable.setSymbol(callExpression.callee, log);
				program.symbolTable.setSymbol(logDeclaration.id, log);

				context.setType(log, new FunctionType(new NullType(), [], new VoidType(), logDeclaration));

				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returnsArg(1);

				// act
				expect(() => rule.refine(callExpression, context)).not.to.throw;
			});
		});

		describe("arguments", function () {
			it("updates the type of the arguments if the argument type is the same as the parameter type", function () {
				// arrange
				const personNode = t.identifier("person");
				const callExpression = t.callExpression(t.identifier("setName"), [personNode, t.stringLiteral("Name")]);
				const setNameDeclaration = t.functionDeclaration(t.identifier("setName"), [t.identifier("x"), t.identifier("name")], t.blockStatement([]));

				const person = new Symbol("person", SymbolFlags.Variable);
				const setName = new Symbol("setName", SymbolFlags.Function);
				const x = new Symbol("x", SymbolFlags.Variable);
				const name = new Symbol("name", SymbolFlags.Variable);

				program.symbolTable.setSymbol(personNode, person);
				program.symbolTable.setSymbol(callExpression.callee, setName);
				program.symbolTable.setSymbol(personNode, person);
				program.symbolTable.setSymbol(setNameDeclaration.id, setName);
				program.symbolTable.setSymbol(setNameDeclaration.params[0], x);
				program.symbolTable.setSymbol(setNameDeclaration.params[1], name);

				const personType = RecordType.withProperties();
				context.setType(person, personType);
				context.setType(setName, new FunctionType(new NullType(), [], new VoidType(), setNameDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(personType);
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[1]).returns(new StringType());

				typeInferenceAnalysis.analyse = (node, typeEnv) => typeEnv.setType(x, personType.addProperty(name, new StringType()));

				// act
				rule.refine(callExpression, context);

				// assert
				expect(context.getType(person)).to.be.instanceOf(RecordType);
				expect(context.getType(person).getType(name)).to.be.instanceOf(StringType);
			});

			it("does not update the argument type if it has been reassigned in the body of the function", function () {
				// arrange
				const inputNode = t.identifier("input");
				const callExpression = t.callExpression(t.identifier("stringToNumber"), [inputNode]);
				// the body of the function contains a s = toInt(s, 10), but that doesn't mean that the type of the argument should change
				const stringToNumberDeclaration = t.functionDeclaration(t.identifier("stringToNumber"), [t.identifier("s")], t.blockStatement([]));

				const input = new Symbol("input", SymbolFlags.Variable);
				const stringToNumber = new Symbol("setName", SymbolFlags.Function);
				const s = new Symbol("s", SymbolFlags.Variable);

				program.symbolTable.setSymbol(inputNode, input);
				program.symbolTable.setSymbol(callExpression.callee, stringToNumber);
				program.symbolTable.setSymbol(inputNode, input);
				program.symbolTable.setSymbol(stringToNumberDeclaration.id, stringToNumber);
				program.symbolTable.setSymbol(stringToNumberDeclaration.params[0], s);

				const inputType = new StringType();
				context.setType(input, inputType);
				context.setType(stringToNumber, new FunctionType(new NullType(), [], new NumberType(), stringToNumberDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(inputType);

				typeInferenceAnalysis.analyse = (node, typeEnv) => typeEnv.setType(s, new NumberType());

				// act
				rule.refine(callExpression, context);

				// assert
				expect(context.getType(input)).to.be.instanceOf(StringType);
			});
		});
	});
});