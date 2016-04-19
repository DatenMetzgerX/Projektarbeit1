import {VoidType, FunctionType} from "../../semantic-model/types";
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
	canRefine(node) {
		return node.type === "CallExpression";
	}

	/**
	 * Refines the call expression
	 * @param node
	 * @param {HindleyMilnerContext} calleeContext
     */
	refine(node, calleeContext) {
		// use a new context in with the function body is inferred to not change the function signature
		// and avoid pollution of callee's type environment.
		const functionContext = calleeContext.fresh();

		const functionDeclarationNode = this._getFunctionDeclaration(calleeContext, node);
		functionContext.setType(Symbol.THIS, this._thisType(node, calleeContext));
		this._declareParameters(node, functionDeclarationNode, calleeContext, functionContext);

		functionContext.analyse(functionDeclarationNode.body);

		this._updateArgumentTypesInCalleeContext(node, functionDeclarationNode, calleeContext, functionContext);

		return functionContext.getType(Symbol.RETURN) || new VoidType();
	}

	_getFunctionDeclaration(calleeContext, node) {
		const functionType = this._getNodeType(node.callee, calleeContext);

		if (!(functionType instanceof FunctionType)) {
			throw new TypeInferenceError(`Cannot invoke the non function type ${functionType}.`, node);
		}

		return functionType.declaration;
	}

	/**
	 * Resolves the type of the this object for the call
	 * @param node the call expression node
	 * @param context the call context
	 * @private
     */
	_thisType(node, context) {
		if (node.callee.type === "MemberExpression") {
			return context.getObjectType(node.callee);
		}

		return new VoidType();
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

}

export default CallExpressionRefinementRule;