import * as _ from "lodash";
import {VoidType, FunctionType, AnyType, TypeVariable, ObjectType} from "../../semantic-model/types";
import {TypeInferenceError} from "../type-inference-error";
import {Symbol} from "../../semantic-model/symbol";

/**
 * Refinement rule that handles a call expression.
 *
 * The implementation traverses the CFG of the called function and sets the argument types as function parameters.
 * It uses a new Type Environment to avoid to mix the Scope of the callee with the scope of the called function.
 * @implements {RefinementRule}
 */
export class CallExpressionRefinementRule {

	constructor() {
		this.callCounts = new Map();
	}

	canRefine(node) {
		return node.type === "CallExpression";
	}

	/**
	 * Refines the call expression
	 * @param {AstNode} node
	 * @param {HindleyMilnerContext} callerContext
     */
	refine(node, callerContext) {
		const functionType = this._getCalleeType(callerContext, node);

		if (functionType instanceof AnyType) {
			return AnyType.create();
		}
		if (functionType.declaration) {
			return this._handleFunctionWithDeclaration(node, callerContext, functionType);
		}
		return this._handleExternalDeclaredFunction(functionType, node, callerContext);
	}

	/**
	 * Handle a function that has been defined externaly, therefor the body of the function is unknown. But the signature
	 * of the function is complete. Therefor a simple check if the function can be invoked with the given arguments is sufficient
     * @private
     */
	_handleExternalDeclaredFunction(functionType, callExpression, callerContext) {
		const thiz = this._getThisType(callExpression, callerContext);

		if (!functionType.thisType.isSubType(thiz)) {
			throw new TypeInferenceError(`The function cannot be called with this of type '${thiz}' whereas '${functionType.thisType}' is required.`, callExpression);
		}

		// A call context is required to have a context where the external defined function can be registered.
		// a registration is needed that we have an environment where we can replace type variables inside of the external function declaration
		const callContext = callerContext.fresh();
		const functionSymbol = new Symbol("External declared function");
		callContext.setType(functionSymbol, functionType);

		for (let i = 0; i < functionType.params.length; ++i) {
			const parameterType = callContext.getType(functionSymbol).params[i];
			const argument = i < callExpression.arguments.length ? callExpression.arguments[i] : undefined;
			let argumentType = argument ? callerContext.infer(argument): VoidType.create();

			// Workaround for callbacks like array.filter(x => x % 2 = 0). The type of the filter function is not resolved at this moment
			// so if a function is expected and a function is passed, then analyse the body of the function and test if the function
			// can be executed with the defined parameter types.
			if (parameterType instanceof FunctionType && argumentType instanceof FunctionType && argumentType.declaration && !parameterType.declaration) {
				const invocation = new Invocation(argumentType.declaration, parameterType.thisType, parameterType.params, callContext);
				let actualReturnType = this._invokeFunction(parameterType, invocation, callerContext);

				const updatedExpectedReturnType = callContext.getType(functionSymbol).params[i].returnType; // a type variable might have been replaced
				// unification needed, e.g. for the map function. The return type is determined by the body of the function
				callContext.unify(updatedExpectedReturnType, actualReturnType, argument);
				if (!updatedExpectedReturnType.isSubType(actualReturnType)) {
					throw new TypeInferenceError(`The return type '${actualReturnType}' of the callback is not a subtype of the return type '${updatedExpectedReturnType}' of the expected callback.`, argument);
				}
			} else {
				if (argument) {
					// This seems odd. The first unification is needed to replace type variables in the argument type.
					// The second unification is needed to replace type variables in the parameter type (and in the return type)
					argumentType = callerContext.unify(argumentType, parameterType, argument);
					callContext.unify(argumentType, parameterType, argument);
				}

				if (!parameterType.isSubType(argumentType)) {
					throw new TypeInferenceError(`The argument ${i + 1} with type '${argumentType}' is not a subtype of the required parameter type '${parameterType}'.`, callExpression.arguments[i] || callExpression);
				}
			}
		}

		return callContext.getType(functionSymbol).returnType;
	}

	/**
	 * Handles a function where the body is known
     * @private
     */
	_handleFunctionWithDeclaration(node, callerContext, functionType) {
		// use a new context in with the function body is inferred to not change the function signature
		// and avoid pollution of callee's type environment.
		const callContext = callerContext.fresh();

		const functionDeclaration = functionType.declaration;
		const invocation = this._createInvocation(node, functionDeclaration, callerContext, callContext);
		const invocations = this._getInvocations(functionDeclaration);

		// there exists an invocation that seems to be equal to this one, so the return type should also be equal
		// (and parameter verification should also fail for that invocation if they do not fulfil the premises of the signature
		const equalInvocation = _.find(invocations, other => other.equals(invocation));

		// If a previous invocation was strictly equal, then return the same return type result.
		if (equalInvocation) {
			return equalInvocation.context.getType(Symbol.RETURN);
		}

		// recursive call, depth > 20;
		if (invocations.length > 20) {
			return this._endRecursion(functionType);
		}

		// non recursive call or recursive call with depth < 20
		try {
			invocations.push(invocation);
			return this._invokeFunction(functionType, invocation, callerContext);
		} finally {
			_.pull(invocations, invocation);
		}
	}

	_getInvocations(functionDeclaration) {
		let invocations = this.callCounts.get(functionDeclaration);
		if (!invocations) {
			invocations = [];
			this.callCounts.set(functionDeclaration, invocations);
		}
		return invocations;
	}

	_invokeFunction(functionType, invocation, callerContext) {
		const callContext = invocation.context;
		const functionDeclaration = invocation.function;
		const thisSymbol = this._getThisSymbol(functionDeclaration);

		if (functionType.typeEnvironment) {
			callContext.typeEnvironment = callContext.typeEnvironment.add(functionType.typeEnvironment);
		}

		callContext.setType(Symbol.RETURN, functionType.returnType.fresh());

		if (thisSymbol) {
			callContext.setType(thisSymbol, invocation.thisType);
		}

		this._declareParameters(invocation);
		this._analyzeFunctionBody(functionDeclaration, callContext);
		this._updateTypes(invocation, callerContext);

		return callContext.getType(Symbol.RETURN);
	}

	_analyzeFunctionBody(functionDeclaration, callContext) {
		// is true for arrow function expressions where the body is a single expression
		if (functionDeclaration.expression) {
			const returnType = callContext.infer(functionDeclaration.body);
			callContext.setType(Symbol.RETURN, returnType);
		} else {
			callContext.analyse(functionDeclaration.body);
		}
	}

	_getCalleeType(calleeContext, node) {
		const functionType = calleeContext.infer(node.callee);

		if (!(functionType instanceof FunctionType || functionType instanceof AnyType)) {
			throw new TypeInferenceError(`Cannot invoke the non function type ${functionType}.`, node);
		}

		return functionType;
	}

	/**
	 * Resolves the type of the this object for the call
	 * @param {AstNode} node the call expression node
	 * @param context the call context
	 * @private
     */
	_getThisType(node, context) {
		if (node.callee.type === "MemberExpression") {
			return context.getObjectType(node.callee);
		}

		return VoidType.create();
	}

	/**
	 * Returns the this symbol or undefined if the called function has no this symbol
	 * @param {AstNode} functionDeclaration the function declaration
	 * @returns {Symbol|undefined} the symbol or undefined
     * @private
     */
	_getThisSymbol(functionDeclaration) {
		return functionDeclaration.scope.getOwnSymbol("this");
	}

	_endRecursion(functionType) {
		if (!(functionType.returnType instanceof TypeVariable)) {
			return functionType.returnType;
		}
		// a little bit more complicated...
		return AnyType.create();
	}

	/**
	 * Infers the types of the function parameters and declares the parameter in the function context by adding an alias to the type environment.
	 * Adding an alias has the benefit, that the argument type is updated too, when the type of the parameter is updated.
	 * @param invocation the invocation
     * @private
     */
	_declareParameters(invocation) {
		const functionDeclaration = invocation.function;
		const n = Math.max(invocation.argumentTypes.length, functionDeclaration.params.length);

		for (let i = 0; i < n; ++i) {
			const argumentType = i < invocation.argumentTypes.length ? invocation.argumentTypes[i] : VoidType.create();
			const parameter = i < functionDeclaration.params.length ? functionDeclaration.params[i] : undefined;

			// callee called method with more arguments than expected.
			if (!parameter) {
				continue;
			}

			const parameterSymbol = invocation.context.getSymbol(parameter);
			invocation.context.setType(parameterSymbol, argumentType);
		}
	}

	_updateTypes(invocation, callerContext) {
		for (let i = 0; i < invocation.argumentTypes.length; ++i) {
			const argumentType = invocation.argumentTypes[i];
			if (!(argumentType instanceof ObjectType)) {
				continue; // only object types might have been updated.
			}

			const parameter = i < invocation.function.params.length ? invocation.function.params[i] : undefined;
			if (!parameter) {
				continue;
			}

			const parameterType = invocation.context.getType(invocation.context.getSymbol(parameter));
			// It is still the same object type, but something has changed, e.g. a new member has been added, update the type
			// in the callers context!
			if (parameterType.same(argumentType) && !parameterType.equals(argumentType)) {
				callerContext.substitute(argumentType, parameterType);
			}
		}

		const thisSymbol = this._getThisSymbol(invocation.function);
		const symbolsToIgnore = [Symbol.RETURN, ...(thisSymbol ? [] : [thisSymbol])];

		// Update the argument types and also all types from the outer context that might have been updated in the call context
		callerContext.replaceTypes(invocation.context, symbolsToIgnore);
	}

	_createInvocation(call, functionDeclaration, callerContext, callContext) {
		const args = call.arguments.map(argument => callerContext.infer(argument));
		const thisType = this._getThisType(call, callerContext);
		return new Invocation(functionDeclaration, thisType, args, callContext);
	}
}

/**
 * Snapshot for a function invocation. Stores the node of the invoked function, the types of the arguments
 * and the context of the invocation (callee).
 */
class Invocation {
	constructor(func, thisType, argumentTypes, callContext) {
		this.function = func;
		this.thisType = thisType;
		this.argumentTypes = argumentTypes;
		this.context = callContext;
	}

	equals(other) {
		if (this === other) {
			return true;
		}

		if (other.function !== this.function) {
			return false;
		}

		if (!this.thisType.equals(other.thisType)) {
			return false;
		}

		if (this.argumentTypes.length !== other.argumentTypes.length) {
			return false;
		}

		return _.zip(this.argumentTypes, other.argumentTypes).every(([x, y]) => x.equals(y));
	}
}

export default CallExpressionRefinementRule;