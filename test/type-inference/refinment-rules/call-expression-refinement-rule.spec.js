import * as t from "babel-types";
import {expect} from "chai";
import sinon from "sinon";

import {CallExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/call-expression-refinement-rule";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {Program} from "../../../lib/semantic-model/program";
import {ObjectType, NumberType, VoidType, FunctionType, MaybeType, StringType, TypeVariable} from "../../../lib/semantic-model/types";
import {SymbolFlags, Symbol} from "../../../lib/semantic-model/symbol";

xdescribe("CallExpressionRefinementRule", function () {
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

				context.setType(log, new FunctionType(new TypeVariable(), [], VoidType.create(), logDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());

				const logTypeEnvironment = context.typeEnvironment.setType(Symbol.RETURN, VoidType.create());
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

				context.setType(log, new FunctionType(new TypeVariable(), [], VoidType.create(), logDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returns(context.typeEnvironment.setType(Symbol.RETURN, VoidType.create()));

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

				context.setType(log, new FunctionType(new TypeVariable(), [], VoidType.create(), logDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());
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

				const personType = ObjectType.create([[log, new FunctionType(new TypeVariable(), [], VoidType.create(), logDeclaration)]]);

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());
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

				context.setType(log, new FunctionType(new TypeVariable(), [], VoidType.create(), logDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());

				const logTypeEnvironment = context.typeEnvironment.setType(Symbol.RETURN, VoidType.create());
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

				const personType = ObjectType.create([[log, new FunctionType(new TypeVariable(), [], VoidType.create(), logDeclaration)]]);

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());
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
				context.setType(log, StringType.create());

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

				context.setType(log, new FunctionType(new TypeVariable(), [], VoidType.create(), logDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());
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

				context.setType(log, new FunctionType(new TypeVariable(), [], VoidType.create(), logDeclaration));

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

				context.setType(log, new FunctionType(new TypeVariable(), [], VoidType.create(), logDeclaration));

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

				const personType = ObjectType.create();
				context.setType(person, personType);
				context.setType(setName, new FunctionType(new TypeVariable(), [], VoidType.create(), setNameDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(personType);
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[1]).returns(StringType.create());

				typeInferenceAnalysis.analyse = (node, typeEnv) => typeEnv.setType(x, personType.addProperty(name, StringType.create()));

				// act
				rule.refine(callExpression, context);

				// assert
				expect(context.getType(person)).to.be.instanceOf(ObjectType);
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

				const inputType = StringType.create();
				context.setType(input, inputType);
				context.setType(stringToNumber, new FunctionType(new TypeVariable(), [], NumberType.create(), stringToNumberDeclaration));

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(inputType);

				typeInferenceAnalysis.analyse = (node, typeEnv) => typeEnv.setType(s, NumberType.create());

				// act
				rule.refine(callExpression, context);

				// assert
				expect(context.getType(input)).to.be.instanceOf(StringType);
			});
		});

		describe("recursion", function () {
			it("terminates recursive calls after 20 rounds", function () {
				this.timeout(5000);

				// arrange
				const functionDeclaration = t.functionDeclaration(t.identifier("f"), [], t.blockStatement([]));
				const f = new Symbol("f", SymbolFlags.Variable);


				const c1 = t.callExpression(t.identifier("f"), []);
				const calls = [];
				let args = [];

				// create an array with 1000 call expressions. It simulates a function where the body always adds one more
				// argument and calls itself again.
				for (let i = 0; i < 1000; ++i) {
					args = args.concat(t.numericLiteral(i));
					calls.push(t.callExpression(t.identifier("f"), args));
				}

				program.symbolTable.setSymbol(functionDeclaration, f);
				context.setType(f, new FunctionType(new TypeVariable(), [], VoidType.create(), functionDeclaration));
				for (const call of calls.concat(c1)) {
					program.symbolTable.setSymbol(call.callee, f);
				}

				let nextCall = 0;
				typeInferenceAnalysis.analyse = (node, typeEnvironment) => {
					if (nextCall > 20) {
						expect.fail("Recursive function is called more then twenty times, should terminate after 20 calls");
					}

					rule.refine(calls[nextCall++], context);

					return typeEnvironment;
				};

				typeInferenceAnalysis.infer.returns(NumberType.create());

				// act
				rule.refine(c1, context);
			});

			it("detects recursive calls with the same arguments and uses the return type of the previously called function", function () {
				// arrange
				const functionDeclaration = t.functionDeclaration(t.identifier("successor"), [t.identifier("x")], t.blockStatement([]));
				const successor = new Symbol("successor", SymbolFlags.Variable);
				const x = new Symbol("x", SymbolFlags.Variable);

				program.symbolTable.setSymbol(functionDeclaration, successor);
				program.symbolTable.setSymbol(functionDeclaration.id, x);
				context.setType(successor, new FunctionType(new TypeVariable(), [], VoidType.create(), functionDeclaration));

				const call = t.callExpression(t.identifier("successor"), [t.numericLiteral(4)]);
				program.symbolTable.setSymbol(call.callee, successor);
				let analyseCount = 0;

				typeInferenceAnalysis.analyse = (node, typeEnvironment) => {
					++analyseCount;
					const recursiveCall = t.callExpression(t.identifier("successor"), [t.binaryExpression("-", t.identifier("x"), t.numericLiteral(-1))]);
					program.symbolTable.setSymbol(recursiveCall.callee, successor);
					program.symbolTable.setSymbol(recursiveCall.arguments[0].left, x);
					rule.refine(recursiveCall, context);

					return typeEnvironment.setType(Symbol.RETURN, NumberType.create());
				};

				typeInferenceAnalysis.infer.returns(NumberType.create());

				// act
				expect(rule.refine(call, context)).to.be.instanceOf(NumberType);
				expect(analyseCount).to.equal(1);
			});
		});

		describe("function with complete signatures", function () {
			it("infers the return type from the function signature", function () {
				// arrange
				const trim = new Symbol("trim", SymbolFlags.Property & SymbolFlags.Function);
				const trimType = new FunctionType(VoidType.create(), [], StringType.create());
				context.setType(trim, trimType);

				const callExpression = t.callExpression(t.identifier("trim"), []);
				program.symbolTable.setSymbol(callExpression.callee, trim);

				// act, assert
				expect(rule.refine(callExpression, context)).to.be.instanceOf(StringType);
			});

			it("throws if the this type of the called function is not a subtype of the this expected by the function", function () {
				// arrange
				const trim = new Symbol("trim", SymbolFlags.Property & SymbolFlags.Function);
				const trimType = new FunctionType(StringType.create(), [], StringType.create());
				context.setType(trim, trimType);

				const callExpression = t.callExpression(t.identifier("trim"), []);
				program.symbolTable.setSymbol(callExpression.callee, trim);

				// act, assert
				expect(() => rule.refine(callExpression, context)).to.throw("Type inference failure: The function cannot be called with this of type 'undefined' whereas 'string' is required.");
			});

			it("throws if the call misses some required arguments", function () {
				// arrange
				const includes = new Symbol("includes", SymbolFlags.Property & SymbolFlags.Function);
				const includesType = new FunctionType(VoidType.create(), [StringType.create()], StringType.create());
				context.setType(includes, includesType);

				const callExpression = t.callExpression(t.identifier("includes"), []);
				program.symbolTable.setSymbol(callExpression.callee, includes);

				// act, assert
				expect(() => rule.refine(callExpression, context)).to.throw("Type inference failure: The argument 1 with type 'undefined' is not a subtype of the required parameter type 'string'.");
			});

			it("throws if a call parameter is not a subtype of the parameter type", function () {
				// arrange
				const includes = new Symbol("includes", SymbolFlags.Property & SymbolFlags.Function);
				const includesType = new FunctionType(VoidType.create(), [StringType.create()], StringType.create());
				context.setType(includes, includesType);

				const callExpression = t.callExpression(t.identifier("includes"), [t.numericLiteral(4)]);
				program.symbolTable.setSymbol(callExpression.callee, includes);

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(NumberType.create());

				// act, assert
				expect(() => rule.refine(callExpression, context)).to.throw("Type inference failure: The argument 1 with type 'number' is not a subtype of the required parameter type 'string'.");
			});

			it("can call a function with missing optional arguments", function () {
				// arrange
				const substring = new Symbol("substring", SymbolFlags.Property & SymbolFlags.Function);
				const substringType = new FunctionType(VoidType.create(), [NumberType.create(), MaybeType.of(NumberType.create())], StringType.create());
				context.setType(substring, substringType);

				const callExpression = t.callExpression(t.identifier("substring"), [t.numericLiteral(5)]);
				program.symbolTable.setSymbol(callExpression.callee, substring);

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(NumberType.create());

				// act, assert
				expect(rule.refine(callExpression, context)).to.be.instanceOf(StringType);
			});

			it("can call a function with matching arguments", function () {
				// arrange
				const substring = new Symbol("substring", SymbolFlags.Property & SymbolFlags.Function);
				const substringType = new FunctionType(VoidType.create(), [NumberType.create(), MaybeType.of(NumberType.create())], StringType.create());
				context.setType(substring, substringType);

				const callExpression = t.callExpression(t.identifier("substring"), [t.numericLiteral(5), t.numericLiteral(8)]);
				program.symbolTable.setSymbol(callExpression.callee, substring);

				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(NumberType.create());
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[1]).returns(NumberType.create());

				// act, assert
				expect(rule.refine(callExpression, context)).to.be.instanceOf(StringType);
			});
		});
	});
});