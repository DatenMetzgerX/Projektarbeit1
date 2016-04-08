import * as t from "babel-types";
import {VoidType, FunctionType} from "../../semantic-model/types";
import {TypeInferenceError} from "../type-inference-error";

/**
 * Refinement rule that handles the return statement.
 * A return statement needs to find the enclosing function declaration and unifies the
 * return type of the function with the type resulting of the return expression
 * @implements {RefinementRule}
 */
export class ReturnStatementRefinementRule {
	canRefine(node) {
		return node.type === "ReturnStatement";
	}

	refine(node, context) {
		const functionNode = this._getFunction(node);
		if (!functionNode.id) {
			throw new TypeInferenceError("return statements inside of anonymous functions are not yet supported", node);
		}

		const functionSymbol = context.getSymbol(functionNode.id);
		const oldFunctionType = context.getType(functionSymbol);
		const returnType = this._getReturnType(node, context);
		const unified = context.unify(oldFunctionType.returnType, returnType, node);

		// If the return statement has contained a type variable, then the function type has been substituted with one
		// where the return type is known (no longer a type variable). So it's important to requery the functionType
		context.replaceType(functionSymbol, functionType => new FunctionType(functionType.thisType, functionType.params, unified));

		return new VoidType();
	}

	_getReturnType (node, context){
		if (node.argument) {
			return context.infer(node.argument);
		} else {
			return new VoidType();
		}
	}

	_getFunction(node) {
		let current = node;
		while (current) {
			if (t.isFunction(current)) {
				return current;
			}
			current = current.parent;
		}
	}
}

export default ReturnStatementRefinementRule;