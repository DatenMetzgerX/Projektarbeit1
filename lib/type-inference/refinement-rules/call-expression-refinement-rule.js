import {VoidType} from "../../semantic-model/types";
import {TypeInferenceError} from "../type-inference-error";
import {SymbolFlags} from "../../semantic-model/symbol";

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
		const functionDeclarationNode = this._getFunctionDeclaration(calleeContext, node);

		// use a new context in with the function body is inferred to not change the function signature
		// and avoid pollution of callee's type environment.
		const functionContext = calleeContext.fresh();

		const thiz = functionDeclarationNode.scope.resolveSymbol("this");
		functionContext.setType(thiz, this._thisType(node, calleeContext));
		this._declareParameters(node, functionDeclarationNode, calleeContext, functionContext);

		functionContext.analyse(functionDeclarationNode.body);

		this._updateArgumentTypesInCalleeContext(node, functionDeclarationNode, calleeContext, functionContext);

		const returnSymbol = functionDeclarationNode.scope.resolveSymbol("return");
		return functionContext.getType(returnSymbol) || new VoidType();
	}

	_getFunctionDeclaration(calleeContext, node) {
		const callee = calleeContext.getSymbol(node.callee);
		const functionDeclarationNode = callee.declaration;

		if (!functionDeclarationNode) {
			throw new TypeInferenceError("No declaration for callee found, does the function exist?", node);
		}

		if ((callee.flags & SymbolFlags.Function) !== SymbolFlags.Function) {
			throw new TypeInferenceError(`The callee ${callee} is not a function`, node);
		}
		return functionDeclarationNode;
	}

	/**
	 * Resolves the type of the this object for the call
	 * @param node the call expression node
	 * @param context the call context
	 * @private
     */
	_thisType(node, context) {
		if (node.callee.type === "MemberExpression") {
			return context.getNodeType(node.callee.object);
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
			const argumentType = i < node.arguments.length ? context.infer(node.arguments[i]) : new VoidType();
			const parameterSymbol = functionDeclaration.params.length > i ? context.getSymbol(functionDeclaration.params[i]) : undefined;

			if (parameterSymbol) {
				functionContext.setType(parameterSymbol, argumentType);
			}

			const argumentSymbol = i < node.arguments.length ? context.getSymbol(node.arguments[i]) : undefined;
			if (argumentSymbol && parameterSymbol) {
				parameterSymbol.flags |= argumentSymbol.flags;
				parameterSymbol.declaration = argumentSymbol.declaration; // FIXME nanan changing global state is not allowed
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

			const parameter = i < functionDeclaration.params.length ? functionDeclaration.params[i] : undefined;
			const parameterSymbol = parameter ? functionContext.getSymbol(parameter) : undefined;

			if (parameterSymbol) {
				const previousArgumentType = calleeContext.getType(argumentSymbol);
				calleeContext.substitute(previousArgumentType, functionContext.getType(parameterSymbol));
			}
		}
	}
}

export default CallExpressionRefinementRule;