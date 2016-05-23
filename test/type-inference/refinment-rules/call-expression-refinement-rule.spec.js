import * as t from "babel-types";
import {expect} from "chai";
import sinon from "sinon";

import {CallExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/call-expression-refinement-rule";
import {HindleyMilnerContext} from "../../../lib/type-inference/hindley-milner-context";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";
import {TypeEnvironment} from "../../../lib/type-inference/type-environment";
import {Program} from "../../../lib/semantic-model/program";
import {Scope} from "../../../lib/semantic-model/scope";
import {ObjectType, NumberType, VoidType, FunctionType, MaybeType, StringType, TypeVariable, ArrayType, BooleanType, NullType, AnyType} from "../../../lib/semantic-model/types";
import {SymbolFlags, Symbol} from "../../../lib/semantic-model/symbol";

describe("CallExpressionRefinementRule", function () {
	let context, rule, program, typeInferenceAnalysis;

	beforeEach(function () {
		program = new Program();
		typeInferenceAnalysis = { analyse: sinon.stub(), infer: sinon.stub(), unify: sinon.stub() };
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
		describe("function with declaration", function () {
			it("returns the return type of the called function", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				const logDeclaration = functionDeclaration(t.identifier("log"), t.identifier("m"));

				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(new FunctionType(TypeVariable.create(), [TypeVariable.create()], VoidType.create(), logDeclaration));
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());

				const logTypeEnvironment = context.typeEnvironment.setType(Symbol.RETURN, VoidType.create());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returns(new Map([[null, logTypeEnvironment]]));

				// assert
				expect(rule.refine(callExpression, context)).to.be.instanceOf(VoidType);
			});

			it("returns void if the called function is void", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				const logDeclaration = functionDeclaration(t.identifier("log"), t.identifier("m"));

				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(new FunctionType(TypeVariable.create(), [TypeVariable.create()], VoidType.create(), logDeclaration));
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body)
					.returns(new Map([[null, context.typeEnvironment.setType(Symbol.RETURN, VoidType.create())]]));

				// assert
				expect(rule.refine(callExpression, context)).to.be.instanceOf(VoidType);
			});

			it("returns any if the called function any", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				
				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(AnyType.create());
				
				// assert
				expect(rule.refine(callExpression, context)).to.be.instanceOf(AnyType);
			});

			it("sets this to void if the callee is not a member expression", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				const logDeclaration = functionDeclaration(t.identifier("log"), t.identifier("m"));

				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(new FunctionType(TypeVariable.create(), [TypeVariable.create()], VoidType.create(), logDeclaration));
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returns(new Map([[null, TypeEnvironment.EMPTY]]));

				// act
				rule.refine(callExpression, context);

				// assert
				const analyseCall = typeInferenceAnalysis.analyse.getCall(0);
				const analyseTypeEnv = analyseCall.args[1];
				const thiz = logDeclaration.scope.resolveSymbol("this");

				expect(analyseTypeEnv.getType(thiz)).to.be.instanceOf(VoidType);
			});

			it("sets this to the object of the callee, if the callee is a member expression", function () {
				// arrange
				const personNode = t.identifier("person");
				const logMember = t.memberExpression(personNode, t.identifier("log"));
				const callExpression = t.callExpression(logMember, [t.stringLiteral("Hy")]);
				const logDeclaration = functionDeclaration(t.identifier("log"), t.identifier("m"));

				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				const log = new Symbol("log", SymbolFlags.Function & SymbolFlags.Property);
				const personType = ObjectType.create([[log, new FunctionType(new TypeVariable(), [], VoidType.create(), logDeclaration)]]);

				typeInferenceAnalysis.infer.withArgs(personNode).returns(personType);
				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(new FunctionType(TypeVariable.create(), [TypeVariable.create()], VoidType.create(), logDeclaration));
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returns(new Map([[null, TypeEnvironment.EMPTY]]));

				sinon.stub(context, "getObjectType").withArgs(logMember).returns(personType);

				// act
				rule.refine(callExpression, context);

				// assert
				const analyseCall = typeInferenceAnalysis.analyse.getCall(0);
				const analyseTypeEnv = analyseCall.args[1];
				const thiz = logDeclaration.scope.resolveSymbol("this");

				expect(analyseTypeEnv.getType(thiz)).to.be.equals(personType);
			});

			// a function passed as callback is triggered in a different context then where it has been declared
			// But the function needs to have access to the symbols from the declaration context
			// therefor, the call context needs to be merged with the declaration context
			it("adds type mappings from the function declaration context to the call context", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				const logDeclaration = functionDeclaration(t.identifier("log"), t.identifier("m"));

				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				const x = new Symbol("x", SymbolFlags.Variable); // variable from the declaration scope
				const logType = new FunctionType(TypeVariable.create(), [TypeVariable.create()], VoidType.create(), logDeclaration);
				logType.typeEnvironment = TypeEnvironment.EMPTY.setType(x, StringType.create());

				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(logType);
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returns(new Map([[null, TypeEnvironment.EMPTY]]));

				// act
				rule.refine(callExpression, context);

				// assert
				const analyseCall = typeInferenceAnalysis.analyse.getCall(0);
				const analyseTypeEnv = analyseCall.args[1];

				expect(analyseTypeEnv.getType(x)).to.be.instanceOf(StringType);
			});

			// E.g. if the function changes a variable in the callers context, then the type of the variable is changed after the call
			// e.g. let x = null; function init() { x = 10; }; init(); After the init call, x needs to be number
			it("updates changes types in the caller's context", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				const logDeclaration = functionDeclaration(t.identifier("log"), t.identifier("m"));

				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				const x = new Symbol("x", SymbolFlags.Variable); // variable from the callers scope that is visible in the called function
				const logType = new FunctionType(TypeVariable.create(), [TypeVariable.create()], VoidType.create(), logDeclaration);
				context.setType(x, TypeVariable.create());

				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(logType);
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());
				// The type of x has changed during the function execution. The change needs to be reflected to the callers context
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body)
					.returns(new Map([[null, context.typeEnvironment.setType(x, StringType.create())]]));

				// act
				rule.refine(callExpression, context);

				// assert
				expect(context.getType(x)).to.be.instanceOf(StringType);
			});

			describe("function parameters", function () {
				it("assigns the types of the arguments to the parameters", function () {
					// arrange
					const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
					const logDeclaration = functionDeclaration(t.identifier("log"), t.identifier("m"));

					const m = new Symbol("m", SymbolFlags.Variable);
					const mType = StringType.create();
					program.symbolTable.setSymbol(logDeclaration.params[0], m);

					typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(new FunctionType(TypeVariable.create(), [TypeVariable.create()], VoidType.create(), logDeclaration));
					typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(mType);
					typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returns(new Map([[null, TypeEnvironment.EMPTY]]));

					// act
					rule.refine(callExpression, context);

					// assert
					const analyseCall = typeInferenceAnalysis.analyse.getCall(0);
					const analyseTypeEnv = analyseCall.args[1];

					expect(analyseTypeEnv.getType(m)).to.be.equal(mType);
				});

				it("assigns void to missing parameters", function () {
					// arrange
					const callExpression = t.callExpression(t.identifier("log"), []);
					const logDeclaration = functionDeclaration(t.identifier("log"), t.identifier("m"));

					const m = new Symbol("m", SymbolFlags.Variable);
					program.symbolTable.setSymbol(logDeclaration.params[0], m);

					typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(new FunctionType(TypeVariable.create(), [TypeVariable.create()], VoidType.create(), logDeclaration));
					typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returns(new Map([[null, TypeEnvironment.EMPTY]]));

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
					const logDeclaration = functionDeclaration(t.identifier("log"));

					typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(new FunctionType(new TypeVariable(), [], VoidType.create(), logDeclaration));
					typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returnsArg(1);

					// act
					expect(() => rule.refine(callExpression, context)).not.to.throw;
				});

				// Caller passes an object to the function, the function adds new properties.
				// the new properties should be reflected to the call side
				it("updates the types of objects when they have been passed as arguments", function () {
					// arrange
					const personExpression = t.identifier("person");
					const callExpression = t.callExpression(t.identifier("setName"), [personExpression]);
					const setNameDeclaration = functionDeclaration(t.identifier("setName"), t.identifier("person")); // body is p.name = 'Test'

					const person = new Symbol("person", SymbolFlags.Variable);
					program.symbolTable.setSymbol(personExpression, person);
					const personType = ObjectType.create();
					context.setType(person, personType);

					const personParameter = new Symbol("person", SymbolFlags.Variable);
					program.symbolTable.setSymbol(setNameDeclaration.params[0], personParameter);

					const setNameType = new FunctionType(TypeVariable.create(), [TypeVariable.create()], VoidType.create(), setNameDeclaration);

					typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(setNameType);
					typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(personType);

					// a property name is added in the called function to the person object
					typeInferenceAnalysis.analyse = (node, typeEnvironment) => new Map([[null, typeEnvironment.substitute(personType, personType.addProperty(new Symbol("name"), StringType.create()))]]);

					// act
					rule.refine(callExpression, context);

					// assert
					expect(context.getType(person)).to.be.instanceOf(ObjectType);
					expect(context.getType(person).getType(new Symbol("name"))).to.be.instanceOf(StringType);
				});

				// caller passes an object to the function. The function reassigns a new object to the parameter variable
				// this change should not be reflected to the call site.
				it("does not update an object property type if the variable has been reassigned in the function call", function () {
					// arrange
					const personExpression = t.identifier("person");
					const callExpression = t.callExpression(t.identifier("setName"), [personExpression]);
					const setNameDeclaration = functionDeclaration(t.identifier("setName"), t.identifier("person")); // body is p = { name: 'Test' }

					const person = new Symbol("person", SymbolFlags.Variable);
					program.symbolTable.setSymbol(personExpression, person);
					const personType = ObjectType.create();
					context.setType(person, personType);

					const personParameter = new Symbol("person", SymbolFlags.Variable);
					program.symbolTable.setSymbol(setNameDeclaration.params[0], personParameter);

					const setNameType = new FunctionType(TypeVariable.create(), [TypeVariable.create()], VoidType.create(), setNameDeclaration);

					typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(setNameType);
					typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(personType);

					// a property name is added in the called function to the person object
					typeInferenceAnalysis.analyse = (node, typeEnvironment) => new Map([[null, typeEnvironment.setType(personParameter, ObjectType.create([[ new Symbol("name"), StringType.create() ]]))]]);

					// act
					rule.refine(callExpression, context);

					// assert
					expect(context.getType(person)).to.be.instanceOf(ObjectType);
					expect(context.getType(person).getType(new Symbol("name"))).to.be.undefined;
				});
			});

			describe("recursion", function () {
				it("terminates recursive calls after 20 rounds", function () {
					this.timeout(5000);

					// arrange
					const func = functionDeclaration(t.identifier("f"));

					const c1 = t.callExpression(t.identifier("f"), []);
					const calls = [];
					let args = [];

					// create an array with 1000 call expressions. It simulates a function where the body always adds one more
					// argument and calls itself again.
					for (let i = 0; i < 1000; ++i) {
						args = args.concat(t.numericLiteral(i));
						calls.push(t.callExpression(t.identifier("f"), args));
					}

					const functionType = new FunctionType(new TypeVariable(), [], VoidType.create(), func);
					for (const call of calls.concat(c1)) {
						typeInferenceAnalysis.infer.withArgs(call.callee).returns(functionType);
					}

					let nextCall = 0;
					typeInferenceAnalysis.analyse = (node, typeEnvironment) => {
						if (nextCall > 20) {
							expect.fail("Recursive function is called more then twenty times, should terminate after 20 calls");
						}

						rule.refine(calls[nextCall++], context);

						return new Map([[null, typeEnvironment]]);
					};

					typeInferenceAnalysis.infer.returns(NumberType.create());

					// act
					rule.refine(c1, context);
				});

				it("detects recursive calls with the same arguments and uses the return type of the previously called function", function () {
					// arrange
					const func = functionDeclaration(t.identifier("successor"), t.identifier("x"));
					const x = new Symbol("x", SymbolFlags.Variable);
					program.symbolTable.setSymbol(func.params[0], x);

					const funcT = new FunctionType(new TypeVariable(), [], VoidType.create(), func);

					const call = t.callExpression(t.identifier("successor"), [t.numericLiteral(4)]);
					typeInferenceAnalysis.infer.withArgs(call.callee).returns(funcT);

					let analyseCount = 0;
					typeInferenceAnalysis.analyse = (node, typeEnvironment) => {
						++analyseCount;
						const recursiveCall = t.callExpression(t.identifier("successor"), [t.binaryExpression("-", t.identifier("x"), t.numericLiteral(-1))]);
						typeInferenceAnalysis.infer.withArgs(recursiveCall.callee).returns(funcT);
						program.symbolTable.setSymbol(recursiveCall.arguments[0].left, x);
						rule.refine(recursiveCall, context);

						return new Map([[null, typeEnvironment.setType(Symbol.RETURN, NumberType.create())]]);
					};

					typeInferenceAnalysis.infer.returns(NumberType.create());

					// act
					expect(rule.refine(call, context)).to.be.instanceOf(NumberType);
					expect(analyseCount).to.equals(1);
				});
			});
		});

		describe("external defined function", function () {
			it("infers the return type from the function signature", function () {
				// arrange
				const trimType = new FunctionType(VoidType.create(), [], StringType.create());
				const callExpression = t.callExpression(t.identifier("trim"), []);
				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(trimType);

				// act, assert
				expect(rule.refine(callExpression, context)).to.be.instanceOf(StringType);
			});

			it("throws if the this type of the called function is not a subtype of the this expected by the function", function () {
				// arrange
				const trimType = new FunctionType(StringType.create(), [], StringType.create());
				const callExpression = t.callExpression(t.identifier("trim"), []);
				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(trimType);

				// act, assert
				expect(() => rule.refine(callExpression, context)).to.throw("Type inference failure: The function cannot be called with this of type 'undefined' whereas 'string' is required.");
			});

			it("throws if the call misses required arguments", function () {
				// arrange
				const includesType = new FunctionType(VoidType.create(), [StringType.create()], StringType.create());
				const callExpression = t.callExpression(t.identifier("includes"), []);
				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(includesType);

				// act, assert
				expect(() => rule.refine(callExpression, context)).to.throw("Type inference failure: The argument 1 with type 'undefined' is not a subtype of the required parameter type 'string'.");
			});

			it("throws if a call parameter is not a subtype of the parameter type", function () {
				// arrange
				const substringType = new FunctionType(VoidType.create(), [NumberType.create()], StringType.create());
				const callExpression = t.callExpression(t.identifier("includes"), [t.identifier("x")]);
				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(substringType);
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(MaybeType.of(NumberType.create()));
				typeInferenceAnalysis.unify.withArgs(sinon.match.instanceOf(MaybeType), sinon.match.instanceOf(NumberType)).returns(MaybeType.of(NumberType.create()));

				// act, assert
				expect(() => rule.refine(callExpression, context)).to.throw("Type inference failure: The argument 1 with type 'Maybe<number>' is not a subtype of the required parameter type 'number'.");
			});

			// if an argument is a type variable, then a unification is needed to get it's type
			it("unifies the argument with the expected parameter type", function () {
				// arrange
				const substringType = new FunctionType(VoidType.create(), [NumberType.create()], StringType.create());
				const callExpression = t.callExpression(t.identifier("substring"), [t.identifier("x")]);

				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(substringType);
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(TypeVariable.create());
				typeInferenceAnalysis.unify.returns(NumberType.create());

				// act
				rule.refine(callExpression, context);

				// assert
				sinon.assert.calledWith(typeInferenceAnalysis.unify, sinon.match.instanceOf(TypeVariable), sinon.match.instanceOf(NumberType));
			});

			it("can call a function with missing optional arguments", function () {
				// arrange
				const substringType = new FunctionType(VoidType.create(), [NumberType.create(), MaybeType.of(NumberType.create())], StringType.create());
				const callExpression = t.callExpression(t.identifier("substring"), [t.numericLiteral(5)]);

				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(substringType);
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(NumberType.create());
				typeInferenceAnalysis.unify.withArgs(sinon.match.instanceOf(NumberType), sinon.match.instanceOf(NumberType)).returns(NumberType.create());

				// act, assert
				expect(rule.refine(callExpression, context)).to.be.instanceOf(StringType);
			});

			it("can call a function with matching arguments", function () {
				// arrange
				const substringType = new FunctionType(VoidType.create(), [NumberType.create(), MaybeType.of(NumberType.create())], StringType.create());
				const callExpression = t.callExpression(t.identifier("substring"), [t.numericLiteral(5), t.numericLiteral(8)]);

				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(substringType);
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(NumberType.create());
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[1]).returns(NumberType.create());
				typeInferenceAnalysis.unify.returns(NumberType.create());

				// act, assert
				expect(rule.refine(callExpression, context)).to.be.instanceOf(StringType);
			});

			it("analyses the body of a callback that has been passed as argument", function () {
				// arrange
				const predicateDeclaration = functionDeclaration(t.identifier("isEven"), t.identifier("x")); // body x % 2 === 0;
				const predicate = new FunctionType(VoidType.create(), [TypeVariable.create()], TypeVariable.create(), predicateDeclaration);
				const x = new Symbol("x", SymbolFlags.Variable);
				program.symbolTable.setSymbol(predicateDeclaration.params[0], x);

				const elementType = TypeVariable.create();
				const predicateExpectedSignature = new FunctionType(VoidType.create(), [elementType], BooleanType.create());
				const filter = new FunctionType(VoidType.create(), [ArrayType.of(elementType), predicateExpectedSignature], ArrayType.of(elementType));
				const callExpression = t.callExpression(t.identifier("filter"), [t.arrayExpression([t.numericLiteral(1), t.numericLiteral(2)]), t.identifier("isEven")]);

				const callContext = context.fresh();
				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(filter);
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(ArrayType.of(NumberType.create()));
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[1]).returns(predicate);
				sinon.stub(context, "fresh").returns(callContext);
				sinon.stub(context, "unify").returnsArg(0); // return the actual argument type

				// unifying the parameter with the argument type requires that the type variables in the parameter type are substituted
				callContext.unify = (t1, t2) => {
					if (t1 instanceof ArrayType && t1.of instanceof NumberType && t2 instanceof ArrayType && t2.of instanceof TypeVariable) {
						callContext.substitute(t2.of, t1.of);
						return t2;
					}
				};

				// Fake analysis of the predicate function by setting the return type
				callContext.analyse = () => callContext.typeEnvironment = callContext.typeEnvironment.setType(Symbol.RETURN, BooleanType.create());

				// expect
				expect(rule.refine(callExpression, context)).to.be.instanceOf(ArrayType).and.to.have.property("of").that.is.an.instanceOf(NumberType);
			});

			it("it throws if the return type of the callback is not a subtype of the expected return type for the callback", function () {
				// arrange
				const predicateDeclaration = functionDeclaration(t.identifier("isEven"), t.identifier("x")); // body return null;
				const predicate = new FunctionType(VoidType.create(), [TypeVariable.create()], TypeVariable.create(), predicateDeclaration);
				const x = new Symbol("x", SymbolFlags.Variable);
				program.symbolTable.setSymbol(predicateDeclaration.params[0], x);

				const elementType = TypeVariable.create();
				const predicateExpectedSignature = new FunctionType(VoidType.create(), [elementType], elementType);
				const filter = new FunctionType(VoidType.create(), [ArrayType.of(elementType), predicateExpectedSignature], ArrayType.of(elementType));
				const callExpression = t.callExpression(t.identifier("map"), [t.arrayExpression([t.numericLiteral(1), t.numericLiteral(2)]), t.identifier("isEven")]);

				const callContext = context.fresh();
				sinon.stub(context, "fresh").returns(callContext);

				// unifying the parameter with the argument type requires that the type variables in the parameter type are substituted
				callContext.unify = (t1, t2) => {
					if (t1 instanceof ArrayType && t1.of instanceof NumberType && t2 instanceof ArrayType && t2.of instanceof TypeVariable) {
						callContext.substitute(t2.of, t1.of);
						return t2;
					}

					if (t1 instanceof NumberType && t2 instanceof NullType) {
						return MaybeType.of(t1);
					}
				};

				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(filter);
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(ArrayType.of(NumberType.create()));
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[1]).returns(predicate);
				typeInferenceAnalysis.unify.returnsArg(0); // return the actual argument type

				// Fake analysis of the predicate function by setting the return type
				callContext.analyse = () => callContext.typeEnvironment = callContext.typeEnvironment.setType(Symbol.RETURN, NullType.create());

				// expect
				expect(() => rule.refine(callExpression, context)).to.throw("Type inference failure: The return type 'null' of the callback is not a subtype of the return type 'number' of the expected callback.");
			});
		});

		describe("called function", function () {
			it("is the inferred function of the callee", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				const logDeclaration = functionDeclaration(t.identifier("log"), t.identifier("m"));

				const m = new Symbol("m", SymbolFlags.Variable);
				program.symbolTable.setSymbol(logDeclaration.params[0], m);

				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(new FunctionType(TypeVariable.create(), [TypeVariable.create()], VoidType.create(), logDeclaration));
				typeInferenceAnalysis.infer.withArgs(callExpression.arguments[0]).returns(StringType.create());

				const logTypeEnvironment = context.typeEnvironment.setType(Symbol.RETURN, VoidType.create());
				typeInferenceAnalysis.analyse.withArgs(logDeclaration.body).returns(new Map([[null, logTypeEnvironment]]));

				// act
				rule.refine(callExpression, context);

				// assert
				sinon.assert.calledWith(typeInferenceAnalysis.analyse, logDeclaration.body);
			});

			it("throws if the type is not a function type", function () {
				// arrange
				const callExpression = t.callExpression(t.identifier("log"), [t.stringLiteral("Hy")]);
				typeInferenceAnalysis.infer.withArgs(callExpression.callee).returns(StringType.create());

				// act, assert
				expect(() => rule.refine(callExpression, context)).to.throw("Type inference failure: Cannot invoke the non function type string.");
			});
		});
	});

	function functionDeclaration(identifier, ...params) {
		const declaration = t.functionDeclaration(identifier, params, t.blockStatement([]));
		declaration.scope = new Scope();
		declaration.scope.addSymbol(new Symbol("this", SymbolFlags.Variable));
		return declaration;
	}
});