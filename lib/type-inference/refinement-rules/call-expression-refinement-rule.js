import * as _ from "lodash";
import {VoidType, FunctionType} from "../../semantic-model/types";
import {TypeInferenceError} from "../type-inference-error";
import {Symbol} from "../../semantic-model/symbol";
import {AnyType} from "../../semantic-model/types/any-type";
import {TypeVariable} from "../../semantic-model/types/type-variable";

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
	 * @param node
	 * @param {HindleyMilnerContext} callerContext
     */
	refine(node, callerContext) {
		// use a new context in with the function body is inferred to not change the function signature
		// and avoid pollution of callee's type environment.
		const callContext = callerContext.fresh();
		const functionType = this._getCalleeType(callerContext, node);

		if (functionType.hasCompleteSignature) {
			return this._handleResolvedFunction(functionType, node, callerContext);
		} else {
			return this._handleUnresolvedFunction(node, callerContext, functionType, callContext);
		}
	}

	_handleResolvedFunction(functionType, callExpression, callerContext) {
		const thiz = this._getThisType(callExpression, callerContext);

		if (!functionType.thisType.isSubType(thiz)) {
			throw new TypeInferenceError(`The function cannot be called with this of type '${thiz}' whereas '${functionType.thisType}' is required.`, callExpression);
		}

		for (let i = 0; i < functionType.params.length; ++i) {
			const parameterType = functionType.params[i];
			const argumentType = i < callExpression.arguments.length ? this._getNodeType(callExpression.arguments[i], callerContext): new VoidType();

			if (!parameterType.isSubType(argumentType)) {
				throw new TypeInferenceError(`The argument ${i + 1} with type '${argumentType}' is not a subtype of the required parameter type '${parameterType}'.`, callExpression.arguments[i] || callExpression);
			}
		}

		return functionType.returnType;
	}

	_handleUnresolvedFunction(node, calleeContext, functionType, callContext) {
		const functionDeclaration = functionType.declaration;

		const invocation = this._createInvocation(node, functionDeclaration, calleeContext, callContext);
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
			return this._invokeFunction(functionType, node, calleeContext, callContext);
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

	_invokeFunction(functionType, callExpression, callerContext, callContext) {
		const functionDeclaration = functionType.declaration;
		callContext.setType(Symbol.RETURN, functionType.returnType.fresh());
		callContext.setType(Symbol.THIS, this._getThisType(callExpression, callerContext));
		this._declareParameters(callExpression, functionDeclaration, callerContext, callContext);

		callContext.analyse(functionDeclaration.body);

		this._updateArgumentTypesInCalleeContext(callExpression, functionDeclaration, callerContext, callContext);

		return callContext.getType(Symbol.RETURN);
	}

	_getCalleeType(calleeContext, node) {
		const functionType = this._getNodeType(node.callee, calleeContext);

		if (!(functionType instanceof FunctionType)) {
			throw new TypeInferenceError(`Cannot invoke the non function type ${functionType}.`, node);
		}

		return functionType;
	}

	/**
	 * Resolves the type of the this object for the call
	 * @param node the call expression node
	 * @param context the call context
	 * @private
     */
	_getThisType(node, context) {
		if (node.callee.type === "MemberExpression") {
			return context.getObjectType(node.callee);
		}

		return new VoidType();
	}

	_endRecursion(functionType) {
		if (!(functionType.returnType instanceof TypeVariable)) {
			return functionType.returnType;
		}
		// a little bit more complicated...
		return new AnyType();
	}

	/**
	 * Infers the types of the function parameters and declares the parameter in the function context
	 * @param node the callee's node
	 * @param functionDeclaration the function declaration node (node of called function)
	 * @param context the callee's context
	 * @param functionContext the context of the call
     * @private
     */
	_declareParameters(node, functionDeclaration, context, functionContext) {
		const n = Math.max(node.arguments.length, functionDeclaration.params.length);

		for (let i = 0; i < n; ++i) {
			const argumentType = i < node.arguments.length ? this._getNodeType(node.arguments[i], context) : new VoidType();
			const parameterSymbol = functionDeclaration.params.length > i ? context.getSymbol(functionDeclaration.params[i]) : undefined;

			if (parameterSymbol) {
				functionContext.setType(parameterSymbol, argumentType);
			}
		}
	}

	/**
	 * Maps the types from the parameter of the function declaration back to the argument types.
	 *
     * @private
     */
	_updateArgumentTypesInCalleeContext(callNode, functionDeclaration, calleeContext, functionContext) {
		for (let i = 0; i < callNode.arguments.length; ++i) {
			const argument = callNode.arguments[i];
			const argumentSymbol = calleeContext.getSymbol(argument);

			// E.g. a string literal has no symbol
			if (!argumentSymbol) {
				continue;
			}

			const argumentType = calleeContext.getType(argumentSymbol);

			if (!argumentType) {
				continue; // eg if the argument was a property that has never been declared.
			}

			const parameter = i < functionDeclaration.params.length ? functionDeclaration.params[i] : undefined;
			const parameterSymbol = parameter ? functionContext.getSymbol(parameter) : undefined;
			const parameterType = parameterSymbol ? functionContext.getType(parameterSymbol) : undefined;

			if (parameterType && parameterType.same(argumentType)) {
				calleeContext.substitute(argumentType, parameterType);
			}
		}
	}

	_getNodeType(node, context) {
		let result;
		const nodeSymbol = context.getSymbol(node);

		if (node.type === "Identifier") {
			result = context.getType(nodeSymbol);
			if (!result) {
				throw new TypeInferenceError(`The identifier ${nodeSymbol} is not defined`, node);
			}
		} else if (node.type === "MemberExpression") {
			const objectType = context.getObjectType(node);
			result = objectType.getType(nodeSymbol);
		} else {
			// CallExpression, Literals and so on.
			result = context.infer(node);
		}

		return result || new VoidType();
	}

	_createInvocation(call, functionDeclaration, context, calleeContext) {
		const args = call.arguments.map(argument => this._getNodeType(argument, context));
		return new Invocation(functionDeclaration, args, calleeContext);
	}
}

/**
 * Snapshot for a function invocation. Stores the node of the invoked function, the types of the arguments
 * and the context of the invocation (callee).
 */
class Invocation {
	constructor(func, argumentTypes, calleeContext) {
		this.function = func;
		this.argumentTypes = argumentTypes;
		this.context = calleeContext;
	}

	equals(other) {
		if (this === other) {
			return true;
		}

		if (other.function !== this.function) {
			return false;
		}

		if (this.argumentTypes.length !== other.argumentTypes.length) {
			return false;
		}

		return _.zip(this.argumentTypes, other.argumentTypes).every(([x, y]) => x.equals(y));
	}
}

export default CallExpressionRefinementRule;